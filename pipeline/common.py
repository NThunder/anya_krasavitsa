"""Общие помощники пайплайна: ключи, HTTP-клиенты Apify и fal, пути."""
import base64
import json
import mimetypes
import os
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REELS = ROOT / "reels"
DATA = ROOT / "data"
ASSETS = ROOT / "assets"


def load_env():
    """Подхватывает переменные из .env в корне репозитория (если файл есть)."""
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


load_env()


def _request(url, data=None, headers=None, method=None, timeout=600):
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, method=method or ("POST" if body else "GET"))
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "reels-pipeline/1.0")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
    return json.loads(raw) if raw else None


def download(url, path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "reels-pipeline/1.0"})
    with urllib.request.urlopen(req, timeout=600) as r:
        path.write_bytes(r.read())
    return path


# ---------- Apify ----------

def apify_run(actor, payload, timeout=290):
    """Запускает актор Apify синхронно и возвращает элементы датасета."""
    token = os.environ["APIFY_TOKEN"]
    url = (f"https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items"
           f"?token={token}&timeout={timeout}")
    return _request(url, payload, timeout=timeout + 30)


# ---------- fal ----------

def _fal_headers():
    # В облачной среде ключ подставляет прокси; локально нужен FAL_KEY.
    return {"Authorization": f"Key {os.environ.get('FAL_KEY', 'proxy')}"}


def fal_run(model, payload, timeout=900, retries=3):
    """Синхронный вызов модели fal. Сбои шлюза (502/503/504) повторяем.
    Очередь queue.fal.run не используем: в облачной среде прокси подставляет ключ только для fal.run."""
    for attempt in range(retries):
        try:
            return _request(f"https://fal.run/{model}", payload, _fal_headers(), timeout=timeout)
        except urllib.error.HTTPError as e:
            body = e.read().decode()[:500]
            if e.code not in (502, 503, 504) or attempt == retries - 1:
                raise RuntimeError(f"{model}: {e.code} {body}") from e
            print(f"  {model}: {e.code}, повтор {attempt + 2}/{retries}")
            time.sleep(10 * (attempt + 1))


def data_uri(path):
    """Файл -> data URI: fal принимает такие ссылки вместо загрузки в хранилище."""
    mime = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(Path(path).read_bytes()).decode()


def fal_upload_audio(path):
    """Залить локальный звук на хостинг fal и получить короткую ссылку.
    Модели вроде veed/fabric не принимают длинные data URI, а загрузка в хранилище fal
    из облачной среды недоступна, поэтому пропускаем файл через ffmpeg-api."""
    silence = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
    res = fal_run("fal-ai/ffmpeg-api/merge-audios", {"audio_urls": [data_uri(path), silence]})
    return res["audio"]["url"]


def llm(prompt, system=None, model="anthropic/claude-sonnet-4.5"):
    payload = {"model": model, "prompt": prompt}
    if system:
        payload["system_prompt"] = system
    return fal_run("openrouter/router", payload)["output"]


def llm_json(prompt, system=None, **kw):
    """LLM-ответ, распарсенный как JSON (срезает ```-обёртку, если она есть)."""
    out = llm(prompt, system, **kw).strip()
    if out.startswith("```"):
        out = out.split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(out)
