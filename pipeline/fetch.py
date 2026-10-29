"""Шаг 2. Скачать ролик-донор: видео, расшифровку, кадры (1 в секунду) и контактный лист.

    python -m pipeline.fetch https://www.instagram.com/p/DdzEa9SRfrD/ --slug agent-team
"""
import argparse
import json
import subprocess

from .common import REELS, apify_run, download


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--slug", required=True, help="папка ролика в reels/")
    args = ap.parse_args()

    src = REELS / args.slug / "source"
    (src / "frames").mkdir(parents=True, exist_ok=True)

    [item] = apify_run("apify~instagram-reel-scraper", {
        "username": [args.url], "resultsLimit": 1,
        "includeDownloadedVideo": True, "includeTranscript": True,
    })
    meta = {k: item.get(k) for k in (
        "url", "ownerUsername", "caption", "transcript", "videoDuration",
        "videoPlayCount", "likesCount", "commentsCount", "timestamp")}
    (src / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")

    video = download(item.get("downloadedVideo") or item["videoUrl"], src / "video.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", "fps=1,scale=360:-1",
                    src / "frames" / "f_%03d.jpg"], check=True)
    # Контактный лист: 24 кадра на лист, удобно просматривать глазами или LLM.
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf",
                    "fps=1,scale=270:-1,tile=6x4", src / "sheet_%d.jpg"], check=True)

    print(f"@{meta['ownerUsername']} · {meta['videoPlayCount']} просмотров\n")
    print(meta["transcript"])
    print(f"\nСохранено в {src}")


if __name__ == "__main__":
    main()
