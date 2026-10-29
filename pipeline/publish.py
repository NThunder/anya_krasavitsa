"""Шаг 7. Публикация рилса в Instagram через Instagram Graph API (загрузка файла напрямую).

    python -m pipeline.publish agent-team            # проверка: покажет, что будет опубликовано
    python -m pipeline.publish agent-team --yes      # опубликовать

Нужен профессиональный аккаунт Instagram (Business/Creator), привязанный к странице Facebook,
и токен с правами instagram_basic + instagram_content_publish. В .env:
    IG_USER_ID=1784...
    IG_ACCESS_TOKEN=EAAG...
"""
import argparse
import json
import os
import time
import urllib.parse
import urllib.request

from .common import REELS

API = "https://graph.facebook.com/v21.0"


def call(method, url, params=None, data=None, headers=None):
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--yes", action="store_true", help="действительно опубликовать")
    args = ap.parse_args()

    reel = REELS / args.slug
    video = reel / f"{args.slug}.mp4"
    caption = json.loads((reel / "script.json").read_text(encoding="utf-8"))["caption"]
    print(f"Видео: {video} ({video.stat().st_size / 1e6:.1f} МБ)\n\nПодпись:\n{caption}\n")
    if not args.yes:
        print("Это проверка. Для публикации добавь --yes.")
        return

    user, token = os.environ["IG_USER_ID"], os.environ["IG_ACCESS_TOKEN"]

    # 1. Контейнер для загрузки файла (resumable upload).
    box = call("POST", f"{API}/{user}/media", {
        "media_type": "REELS", "upload_type": "resumable", "caption": caption,
        "share_to_feed": "true", "access_token": token})
    # 2. Загружаем сам файл.
    data = video.read_bytes()
    call("POST", box["uri"], data=data, headers={
        "Authorization": f"OAuth {token}", "offset": "0", "file_size": str(len(data))})
    # 3. Ждём, пока Instagram обработает видео.
    for _ in range(60):
        st = call("GET", f"{API}/{box['id']}", {"fields": "status_code,status", "access_token": token})
        if st["status_code"] == "FINISHED":
            break
        if st["status_code"] == "ERROR":
            raise RuntimeError(st)
        time.sleep(10)
    # 4. Публикуем.
    res = call("POST", f"{API}/{user}/media_publish", {"creation_id": box["id"], "access_token": token})
    link = call("GET", f"{API}/{res['id']}", {"fields": "permalink", "access_token": token})
    print("Опубликовано:", link.get("permalink"))


if __name__ == "__main__":
    main()
