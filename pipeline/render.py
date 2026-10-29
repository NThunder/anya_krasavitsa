"""Шаг 6. Сборка ролика в Remotion: озвучка + аватар + слайды + субтитры.

    python -m pipeline.render agent-team            # полный рендер -> reels/<slug>/<slug>.mp4
    python -m pipeline.render agent-team --stills   # только контрольные кадры (быстро)
"""
import argparse
import json
import os
import shutil
import subprocess

from .common import REELS, ROOT
from .config import AVATAR_IMAGE
from .collage import comic_avatar
from .mouth import envelope

VIDEO = ROOT / "video"
CHROME = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"


def prepare(slug):
    reel = REELS / slug
    build = reel / "build"
    pub = VIDEO / "public" / "reel"
    shutil.rmtree(pub, ignore_errors=True)
    pub.mkdir(parents=True)

    script = json.loads((reel / "script.json").read_text(encoding="utf-8"))
    tl = json.loads((build / "timeline.json").read_text(encoding="utf-8"))
    visuals = {l["id"]: l["visual"] for l in script["lines"]}

    shutil.copy(build / "voice.wav", pub / "voice.wav")
    # Аватар стоит внизу кадра весь ролик: наклейка в стиле коллажа + рот по громкости голоса (локально).
    face = json.loads((ROOT / AVATAR_IMAGE).with_name("face.json").read_text(encoding="utf-8"))
    avatar = {
        "image": "reel/avatar.png",
        "face": comic_avatar(ROOT / AVATAR_IMAGE, pub / "avatar.png", face),
        "mouth": envelope(build / "voice.wav", [w for l in tl["lines"] for w in l["words"]], 0, tl["duration"] + 0.6),
    }
    demo = reel / "demo.json"
    props = {
        "duration": tl["duration"],
        "voice": "reel/voice.wav",
        "avatar": avatar,
        "demo": json.loads(demo.read_text(encoding="utf-8")) if demo.exists() else None,
        "lines": [{**l, "visual": visuals[l["id"]]} for l in tl["lines"]],
    }
    path = pub / "props.json"
    path.write_text(json.dumps(props, ensure_ascii=False), encoding="utf-8")
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--stills", action="store_true", help="отрендерить по кадру на каждую реплику")
    ap.add_argument("--frame", type=int, help="с --stills: один конкретный кадр")
    args = ap.parse_args()

    props = prepare(args.slug)
    env = {**os.environ}
    if os.path.exists(CHROME):
        env["REMOTION_CHROME"] = CHROME
    reel = REELS / args.slug

    if args.stills:
        lines = json.loads(props.read_text(encoding="utf-8"))["lines"]
        out = reel / "build" / "stills"
        out.mkdir(parents=True, exist_ok=True)
        for l in (lines if args.frame is None else lines[:1]):
            frame = int(((l["start"] + l["end"]) / 2) * 30) if args.frame is None else args.frame
            subprocess.run(["npx", "remotion", "still", "src/index.ts", "Reel", str(out / f"{l['id']}.jpg"),
                            f"--props={props}", f"--frame={frame}", "--log=error"], cwd=VIDEO, env=env, check=True)
        print(f"Кадры: {out}")
        return

    out = reel / f"{args.slug}.mp4"
    subprocess.run(["npx", "remotion", "render", "src/index.ts", "Reel", str(out), f"--props={props}",
                    "--codec=h264", "--crf=18", "--audio-codec=aac", "--log=error"],
                   cwd=VIDEO, env=env, check=True)
    print(f"Готово: {out}")


if __name__ == "__main__":
    main()
