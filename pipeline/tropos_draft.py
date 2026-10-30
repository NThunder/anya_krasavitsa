"""Черновик процесса Tropos AI для сборки ролика программой html-video.

    python -m pipeline.tropos_draft agent-team

Берёт пакет из reels/<slug>/html/ (сначала python -m pipeline.html_package <slug>): page.html и assets.zip
уходят файлами черновика (draft:page.html, draft:assets.zip), озвучка — постоянной ссылкой GitHub
на текущий коммит. Процесс проверяется (tropos_check) и сохраняется (tropos_save_draft) прямым вызовом
MCP-сервера Tropos: файлы кодируются в base64 здесь, а не в разговоре.
"""
import base64
import json
import subprocess
import sys
import urllib.request

from .common import REELS, ROOT

MCP = "https://api.tropos-ai.tech/v1/mcp"
REPO_RAW = "https://raw.githubusercontent.com/NThunder/anya_krasavitsa"
LIMIT = int(2.8 * 1024 * 1024)


def call(method, params, rid=1):
    req = urllib.request.Request(MCP, data=json.dumps({"jsonrpc": "2.0", "id": rid, "method": method, "params": params}).encode(),
                                 headers={"Content-Type": "application/json", "Accept": "application/json, text/event-stream",
                                          "User-Agent": "reels-pipeline/1.0"})
    with urllib.request.urlopen(req, timeout=300) as r:
        res = json.loads(r.read())
    if "error" in res:
        raise RuntimeError(res["error"])
    return res["result"]


def tool(name, args):
    res = call("tools/call", {"name": name, "arguments": args})
    text = "".join(c.get("text", "") for c in res.get("content", []))
    if res.get("isError"):
        raise RuntimeError(f"{name}: {text}")
    return json.loads(text) if text.startswith("{") else text


def process_yaml(slug, title, duration, voice_url):
    return f"""process: reel_{slug.replace('-', '_')}_render
name: Сборка рилса «{title}»
entry: автор
description: |
  Собирает готовый рилс 1080x1920 из страницы-коллажа (сценарий и тайминги слов встроены в неё), озвучки и архива
  шрифтов и картинок программой html-video в Chromium. Ничего не публикует: ролик приходит в отчёте.
form:
  - id: duration
    label: Длина ролика, секунд
    type: number
    default: {duration:.1f}
    hint: длина озвучки плюс 0,6 секунды
steps:
  - id: render
    label: Сборка ролика
    description: Снимает страницу-коллаж покадрово в Chromium; рядом с ней шрифты и картинки из архива, голос подмешивается в ролик.
    command: [html-video, "{{in:page}}", "{{out:reel.mp4}}", --size, 1080x1920, --fps, "30", --duration, "{{{{ form.duration }}}}", --audio, "{{in:voice}}", --assets, "{{in:assets}}"]
    files:
      page: "draft:page.html"
      assets: "draft:assets.zip"
      voice: "{voice_url}"
    timeout: 900
report:
  title: Рилс собран
  from: render
"""


def main(slug):
    pkg = REELS / slug / "html"
    script = json.loads((REELS / slug / "script.json").read_text(encoding="utf-8"))
    data = json.loads((pkg / "reel.json").read_text(encoding="utf-8"))
    files = {name: (pkg / name).read_bytes() for name in ("page.html", "assets.zip")}
    size = sum(len(b) for b in files.values())
    if size > LIMIT:
        sys.exit(f"Файлы черновика {size / 1e6:.2f} МБ — больше предела 2,8 МБ")

    # Озвучка — по ссылке на зафиксированный коммит (её нужно запушить заранее).
    sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    voice_url = f"{REPO_RAW}/{sha}/reels/{slug}/html/voice.mp3"
    with urllib.request.urlopen(urllib.request.Request(voice_url, method="HEAD"), timeout=60) as r:
        if r.status != 200:
            sys.exit(f"Озвучка недоступна по ссылке {voice_url}: запушьте коммит")

    title = script.get("title", slug).split(",")[0]
    process = process_yaml(slug, title, data["duration"] + 0.6, voice_url)
    call("initialize", {"protocolVersion": "2025-06-18", "capabilities": {},
                        "clientInfo": {"name": "reels-pipeline", "version": "1.0"}})
    print("Проверка:", tool("tropos_check", {"process": process, "files": list(files)}))
    note = (f"Собирает рилс «{title}» ({data['duration']:.0f} с, 1080x1920) программой html-video, без Remotion. "
            "Страница с данными ролика и архив шрифтов и картинок — файлы черновика; озвучка — по ссылке GitHub. "
            "Ключи и подключённые API не нужны: после регистрации запустите процесс, ролик придёт в отчёте. "
            "Публикации в Instagram здесь нет.")
    res = tool("tropos_save_draft", {"process": process, "note": note,
                                     "files": {n: base64.b64encode(b).decode() for n, b in files.items()}})
    # Ответ — JSON со ссылкой или текст со ссылкой внутри.
    print("Черновик:", f"{res['url']} (до {res.get('until')})" if isinstance(res, dict) else res)


if __name__ == "__main__":
    main(sys.argv[1])
