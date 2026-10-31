"""Полный процесс Tropos AI: каждый запуск делает новый рилс по залетевшему англоязычному ролику.

    python -m pipeline.tropos_process            # только проверка (tropos_check)
    python -m pipeline.tropos_process --save     # проверка и черновик со ссылкой (tropos_save_draft)

Описание процесса — tropos/reels_auto.yaml, агент-сценарист — tropos/writer.yaml.
Файлы черновика: page.html (html/reel.html, данные ролика приходят входом reel.json от шага процесса)
и assets.zip (лист, звезда, аватар-наклейка, шрифты). Геометрия лица аватара подставляется в шаг timeline.
"""
import argparse
import base64
import io
import json
import shutil
import tempfile
import zipfile
from pathlib import Path

import yaml

from .common import ROOT
from .config import AVATAR_IMAGE
from .tropos_draft import LIMIT, call, tool

FONTS = ROOT / "video" / "public" / "fonts"


def assets():
    """assets.zip как у html_package: board.png, star.png, avatar.png, fonts/*.woff2; и лицо аватара."""
    from .collage import comic_avatar
    face = json.loads((ROOT / AVATAR_IMAGE).with_name("face.json").read_text(encoding="utf-8"))
    with tempfile.TemporaryDirectory() as tmp:
        face = comic_avatar(ROOT / AVATAR_IMAGE, Path(tmp) / "avatar.png", face)
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
            z.write(Path(tmp) / "avatar.png", "avatar.png")
            z.write(ROOT / "assets/template/board.png", "board.png")
            z.write(ROOT / "assets/template/star.png", "star.png")
            for f in sorted([*FONTS.glob("*.woff2"), *(FONTS / "ransom").glob("*.woff2")]):
                z.write(f, f"fonts/{f.name}")
    face = {k: v for k, v in face.items() if not k.startswith("_")}
    return buf.getvalue(), face


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--save", action="store_true", help="сохранить черновик и вывести ссылку")
    args = ap.parse_args()

    zip_bytes, face = assets()
    process = (ROOT / "tropos" / "reels_auto.yaml").read_text(encoding="utf-8").replace("@FACE@", json.dumps(face))
    agents = [yaml.safe_load((ROOT / "tropos" / "writer.yaml").read_text(encoding="utf-8"))]
    files = {"page.html": (ROOT / "html" / "reel.html").read_bytes(), "assets.zip": zip_bytes}
    size = sum(len(b) for b in files.values())
    if size > LIMIT:
        raise SystemExit(f"Файлы черновика {size / 1e6:.2f} МБ — больше предела 2,8 МБ")

    call("initialize", {"protocolVersion": "2025-06-18", "capabilities": {},
                        "clientInfo": {"name": "reels-pipeline", "version": "1.0"}})
    print("Проверка:", tool("tropos_check", {"process": process, "agents": agents, "files": list(files)}))
    if not args.save:
        return
    note = ("Каждый запуск делает новый рилс: Apify находит свежий популярный англоязычный ролик про ИИ-агентов, "
            "сценарист пересказывает его по-русски, ElevenLabs через fal озвучивает, html-video собирает коллаж "
            "с аватаром и субтитрами; ролик приходит на одобрение и только после «да» публикуется в Instagram. "
            "После забора: создайте агента reels-writer, подключите в «Настройках → Готовые API» Apify, fal.ai, "
            "fal.ai — загрузка файлов и Instagram и впишите их ключи в «Секреты сервера».")
    res = tool("tropos_save_draft", {"process": process, "agents": agents, "note": note,
                                     "files": {n: base64.b64encode(b).decode() for n, b in files.items()}})
    print("Черновик:", f"{res['url']} (до {res.get('until')})" if isinstance(res, dict) else res)


if __name__ == "__main__":
    main()
