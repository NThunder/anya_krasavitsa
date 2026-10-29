"""Шаг 1. Поиск популярных англоязычных рилсов по хештегам и каналам-донорам.

    python -m pipeline.scout                      # хештеги и каналы из config
    python -m pipeline.scout --hashtags n8n aiagents --limit 40

Результат: data/scout/<дата>.json и таблица лучших роликов в консоли.
"""
import argparse
import datetime as dt
import json
import re

from .common import DATA, apify_run
from .config import HASHTAGS, DONOR_ACCOUNTS, TOPIC_KEYWORDS

LATIN = re.compile(r"[A-Za-z]")
NON_EN = re.compile(r"[Ѐ-ӿऀ-ॿ؀-ۿ]|\b(el|los|las|que|und|der|die|é|ção|kya|hai)\b", re.I)


def is_english(text):
    text = text or ""
    letters = sum(c.isalpha() for c in text) or 1
    return len(LATIN.findall(text)) / letters > 0.8 and not NON_EN.search(text)


def score(item):
    """Просмотры + вовлечённость, со штрафом за возраст ролика."""
    views = item.get("videoPlayCount") or item.get("videoViewCount") or 0
    likes = max(item.get("likesCount") or 0, 0)
    comments = item.get("commentsCount") or 0
    age_days = 30
    if item.get("timestamp"):
        ts = dt.datetime.fromisoformat(item["timestamp"].replace("Z", "+00:00"))
        age_days = max((dt.datetime.now(dt.timezone.utc) - ts).days, 1)
    engagement = (likes + 3 * comments) / max(views, 1)
    return views * (1 + 10 * engagement) / (age_days ** 0.3)


def on_topic(item):
    text = (item.get("caption") or "").lower()
    return any(k in text for k in TOPIC_KEYWORDS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hashtags", nargs="*", default=HASHTAGS)
    ap.add_argument("--accounts", nargs="*", default=DONOR_ACCOUNTS)
    ap.add_argument("--limit", type=int, default=30, help="роликов на хештег/канал")
    ap.add_argument("--max-duration", type=float, default=120)
    args = ap.parse_args()

    items = []
    if args.hashtags:
        items += apify_run("apify~instagram-hashtag-scraper", {
            "hashtags": args.hashtags, "resultsType": "reels", "resultsLimit": args.limit})
    if args.accounts:
        items += apify_run("apify~instagram-reel-scraper", {
            "username": args.accounts, "resultsLimit": args.limit})

    seen, picked = set(), []
    for it in items:
        if not it.get("shortCode") or it["shortCode"] in seen:
            continue
        seen.add(it["shortCode"])
        if not is_english(it.get("caption")) or not on_topic(it):
            continue
        if (it.get("videoDuration") or 0) > args.max_duration:
            continue
        it["_score"] = score(it)
        picked.append(it)
    picked.sort(key=lambda x: x["_score"], reverse=True)

    out = DATA / "scout" / f"{dt.date.today()}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(picked, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"{len(items)} найдено, {len(picked)} подходят. Сохранено: {out}\n")
    for it in picked[:25]:
        views = it.get("videoPlayCount") or it.get("videoViewCount") or 0
        cap = (it.get("caption") or "").replace("\n", " ")[:90]
        print(f"{views:>10,}  @{it['ownerUsername']:<22} {it['url']}\n            {cap}")


if __name__ == "__main__":
    main()
