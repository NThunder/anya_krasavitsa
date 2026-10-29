"""Шаг 5. Говорящий 2D-аватар для первых реплик ролика.

    python -m pipeline.avatar stylize <ссылка на фото>   # фото -> рисованный аватар (один раз)
    python -m pipeline.avatar talk agent-team    # оживить аватар под реплики-хуки

Аватар появляется только в начале ролика: берутся реплики с act == "hook".
"""
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

from .common import ROOT, REELS, download, fal_run, fal_upload_audio
from .config import AVATAR_IMAGE, LIPSYNC_MODEL

# Лицо рисуем только по фото: если дать модели образец стиля, она тянет лицо к нему.
STYLE_PROMPT = (
    "Turn this photo into a flat 2D vector cartoon portrait (clean thick dark outlines, flat colors, soft cel shading, "
    "simple shapes, like a modern editorial illustration). Preserve a strong likeness of the face exactly: face shape, "
    "eyebrows, eye size and spacing (do NOT make the eyes big or cute), nose, lips, skin tone, earrings. "
    "Calm, gentle expression with a barely visible smile, lips slightly parted. "
    "Hair: long voluminous wavy-curly dark brown hair falling over the shoulders, with short curly bangs (fringe). "
    "Outfit: plain black crew-neck knit sweater. Medium shot, head and upper chest, face in upper-middle third, "
    "centered, looking at the camera. Plain solid deep navy background #2d3a53. Vertical 9:16. Not photorealistic."
)


def stylize(photo_url):
    """photo_url — прямая ссылка на фото анфас (например, с postimg.cc)."""
    res = fal_run("fal-ai/nano-banana/edit", {
        "prompt": STYLE_PROMPT, "image_urls": [photo_url],
        "num_images": 3, "output_format": "png", "aspect_ratio": "9:16"})
    for i, im in enumerate(res["images"]):
        p = download(im["url"], ROOT / f"assets/avatar/variant_{i}.png")
        p.with_suffix(".url").write_text(im["url"])
        print("вариант:", p)
    print(f"Выбери лучший и скопируй его .png и .url в {AVATAR_IMAGE} и {AVATAR_IMAGE[:-4]}.url")


def talk(slug):
    """Аватар говорит только реплики-хуки. Ускоренную озвучку хука режем по репликам
    (короткие куски модель анимирует надёжнее), оживляем куски параллельно и склеиваем."""
    build = REELS / slug / "build"
    tl = json.loads((build / "timeline.json").read_text(encoding="utf-8"))["lines"]
    hooks = [l for l in tl if l["act"] == "hook"]
    image_url = (ROOT / AVATAR_IMAGE).with_suffix(".url").read_text().strip()

    # Границы кусков — посередине пауз между репликами.
    cuts = [0.0] + [(a["end"] + b["start"]) / 2 for a, b in zip(hooks, hooks[1:])]
    cuts.append(tl[len(hooks)]["start"] if len(tl) > len(hooks) else hooks[-1]["end"] + 0.3)

    def job(i):
        piece = build / f"avatar_{i}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", build / "voice.wav", "-ss", f"{cuts[i]:.3f}",
                        "-to", f"{cuts[i + 1]:.3f}", "-b:a", "192k", piece], check=True)
        res = fal_run(LIPSYNC_MODEL, {"image_url": image_url, "audio_url": fal_upload_audio(piece),
                                      "resolution": "720p"}, timeout=1800)
        return download(res["video"]["url"], build / f"avatar_{i}.mp4")

    with ThreadPoolExecutor(len(hooks)) as ex:
        clips = list(ex.map(job, range(len(hooks))))

    # Каждый клип подгоняем точно под длину своего куска звука.
    inputs, filters = [], []
    for i, clip in enumerate(clips):
        inputs += ["-i", str(clip)]
        filters.append(f"[{i}:v]fps=30,scale=720:1280,setsar=1,tpad=stop=-1:stop_mode=clone,"
                       f"trim=duration={cuts[i + 1] - cuts[i]:.3f},setpts=PTS-STARTPTS[v{i}]")
    concat = "".join(f"[v{i}]" for i in range(len(clips))) + f"concat=n={len(clips)}:v=1:a=0[out]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex",
                    ";".join(filters) + ";" + concat, "-map", "[out]", "-c:v", "libx264",
                    "-crf", "18", "-pix_fmt", "yuv420p", build / "avatar.mp4"], check=True)
    print(f"Говорящий аватар: {build / 'avatar.mp4'}")


if __name__ == "__main__":
    {"stylize": stylize, "talk": talk}[sys.argv[1]](*sys.argv[2:])
