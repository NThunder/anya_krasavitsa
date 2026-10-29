"""Пакет ролика для программы html-video (Chromium, без Remotion) — для процесса Tropos.

    python -m pipeline.html_package agent-team            # собрать пакет в reels/<slug>/html/
    python -m pipeline.html_package agent-team --render   # и отрендерить локально (tools/html-video.mjs)

В пакете входы шага command (page, voice, assets) и данные отдельным файлом:
    page.html   — страница ролика (html/reel.html) со встроенными данными ролика (те же, что в reel.json);
                  ждёт window.READY, кадр рисует window.seek(t)
    reel.json   — реплики с таймингами слов и сценами, геометрия лица аватара, демо (для отладки)
    voice.mp3   — озвучка (страница сама считает по ней, как открывать рот)
    assets.zip  — board.png, star.png, avatar.png, fonts/*.woff2 (распаковывается рядом со страницей)
"""
import argparse
import json
import shutil
import subprocess
import zipfile

from .collage import comic_avatar
from .common import REELS, ROOT
from .config import AVATAR_IMAGE

FONTS = ROOT / "video" / "public" / "fonts"


def build(slug):
    reel = REELS / slug
    build_dir = reel / "build"
    out = reel / "html"
    site = build_dir / "html_site"  # распакованный вид: так файлы лягут в песочнице
    for d in (out, site):
        shutil.rmtree(d, ignore_errors=True)
        d.mkdir(parents=True)

    script = json.loads((reel / "script.json").read_text(encoding="utf-8"))
    tl = json.loads((build_dir / "timeline.json").read_text(encoding="utf-8"))
    visuals = {l["id"]: l["visual"] for l in script["lines"]}

    # Картинки и шрифты одним архивом.
    face = json.loads((ROOT / AVATAR_IMAGE).with_name("face.json").read_text(encoding="utf-8"))
    face = comic_avatar(ROOT / AVATAR_IMAGE, site / "avatar.png", face)
    shutil.copy(ROOT / "assets/template/board.png", site / "board.png")
    shutil.copy(ROOT / "assets/template/star.png", site / "star.png")
    (site / "fonts").mkdir()
    for f in [*FONTS.glob("*.woff2"), *(FONTS / "ransom").glob("*.woff2")]:
        shutil.copy(f, site / "fonts" / f.name)
    with zipfile.ZipFile(out / "assets.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(site.rglob("*")):
            if p.is_file():
                z.write(p, p.relative_to(site).as_posix())

    demo = reel / "demo.json"
    data = {
        "duration": tl["duration"],
        "voice": "voice.mp3",
        "avatar": {"face": face},
        "demo": json.loads(demo.read_text(encoding="utf-8")) if demo.exists() else None,
        "lines": [{**l, "visual": visuals[l["id"]]} for l in tl["lines"]],
    }
    (out / "reel.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", build_dir / "voice.wav", "-b:a", "192k", out / "voice.mp3"], check=True)
    # Данные встраиваем в страницу: тогда шагу command хватает входов page, voice и assets.
    page = (ROOT / "html" / "reel.html").read_text(encoding="utf-8")
    embedded = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    page = page.replace("<script>\n'use strict';", f'<script id="reel-data" type="application/json">{embedded}</script>\n<script>\n\'use strict\';', 1)
    (out / "page.html").write_text(page, encoding="utf-8")

    for name in ("page.html", "reel.json", "voice.mp3"):
        shutil.copy(out / name, site / name)
    print(f"Пакет: {out} (page.html, reel.json, voice.mp3, assets.zip)")
    return site, data["duration"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--render", action="store_true", help="отрендерить локально копией html-video")
    args = ap.parse_args()
    site, duration = build(args.slug)
    if args.render:
        out = REELS / args.slug / f"{args.slug}-html.mp4"
        subprocess.run(["node", ROOT / "tools" / "html-video.mjs", site / "page.html", out,
                        "--size", "1080x1920", "--fps", "30", "--duration", f"{duration + 0.6:.2f}",
                        "--audio", site / "voice.mp3"], check=True)
        print(f"Готово: {out}")


if __name__ == "__main__":
    main()
