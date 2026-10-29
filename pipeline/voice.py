"""Шаг 4. Озвучка сценария (ElevenLabs v3 через fal) с таймингом каждого слова.

    python -m pipeline.voice agent-team

Текст читается двумя цельными дублями — хук (под него оживает аватар) и всё остальное,
так интонация звучит по-человечески, а не набором отдельных фраз. Тайминги слов берём
из распознавания речи (ElevenLabs Scribe) и сопоставляем со словами сценария.

Пишет reels/<slug>/build/voice.wav и timeline.json.
"""
import difflib
import json
import re
import subprocess
import sys

from .common import REELS, download, fal_run
from .config import VOICE, VOICE_TEMPO

GAP = 0.2  # пауза между хуком и основной частью, сек


def norm(w):
    return re.sub(r"[^\w]", "", w.lower().replace("ё", "е"))


def tokenize(text):
    """Слова сценария; одиночные знаки («—») приклеиваются к предыдущему слову."""
    out = []
    for tok in text.split():
        if not norm(tok) and out:
            out[-1] += " " + tok
        else:
            out.append(tok)
    return out


def align(script_words, stt_words):
    """Переносит тайминги распознанных слов на слова сценария (с пунктуацией)."""
    a = [norm(w) for w in script_words]
    b = [norm(w["text"]) for w in stt_words]
    times = [None] * len(a)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            w = stt_words[blk.b + k]
            times[blk.a + k] = (w["start"], w["end"])
    # Несовпавшие слова (числа, редкие формы) — делим промежуток между соседями.
    i = 0
    while i < len(times):
        if times[i] is None:
            j = i
            while j < len(times) and times[j] is None:
                j += 1
            lo = times[i - 1][1] if i else (stt_words[0]["start"] if stt_words else 0)
            hi = times[j][0] if j < len(times) else (stt_words[-1]["end"] if stt_words else lo + 0.4 * (j - i))
            step = max(hi - lo, 0.2 * (j - i)) / (j - i)
            for k in range(i, j):
                times[k] = (lo + (k - i) * step, lo + (k - i + 1) * step)
            i = j
        i += 1
    return [{"w": w, "start": round(s, 3), "end": round(e, 3)} for w, (s, e) in zip(script_words, times)]


def speak(text, out):
    """Озвучивает текст, ускоряет запись в VOICE_TEMPO раз и возвращает тайминги уже ускоренных слов."""
    payload = {k: v for k, v in VOICE.items() if k != "model"}
    res = fal_run(VOICE["model"], {**payload, "text": text})
    url = res["audio"]["url"]
    raw = download(url, out.with_name(out.stem + "_raw.mp3"))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-filter:a", f"atempo={VOICE_TEMPO}",
                    "-b:a", "192k", out], check=True)
    stt = fal_run("fal-ai/elevenlabs/speech-to-text", {"audio_url": url, "language_code": "rus"})
    words = [{**w, "start": w["start"] / VOICE_TEMPO, "end": w["end"] / VOICE_TEMPO}
             for w in stt["words"] if w.get("type") == "word"]
    return url, words


def duration(path):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))


def main(slug):
    reel = REELS / slug
    build = reel / "build"
    build.mkdir(parents=True, exist_ok=True)
    lines = json.loads((reel / "script.json").read_text(encoding="utf-8"))["lines"]
    segments = [s for s in ([l for l in lines if l["act"] == "hook"],
                            [l for l in lines if l["act"] != "hook"]) if s]

    timeline, parts, offset = [], [], 0.0
    for n, seg in enumerate(segments):
        mp3 = build / f"segment_{n}.mp3"
        url, stt_words = speak(" ".join(l["text"] for l in seg), mp3)
        tokens = [tokenize(l["text"]) for l in seg]
        words = align([w for t in tokens for w in t], stt_words)
        k = 0
        for line, toks in zip(seg, tokens):
            lw = words[k:k + len(toks)]
            k += len(toks)
            timeline.append({
                "id": line["id"], "act": line["act"], "text": line["text"],
                "segment": n, "segment_url": url, "tempo": VOICE_TEMPO,
                "start": round(offset + lw[0]["start"], 3), "end": round(offset + lw[-1]["end"], 3),
                "words": [{**w, "start": round(offset + w["start"], 3), "end": round(offset + w["end"], 3)}
                          for w in lw],
            })
        parts.append(mp3)
        offset += duration(mp3) + GAP

    inputs, filters = [], []
    for i, p in enumerate(parts):
        inputs += ["-i", str(p)]
        filters.append(f"[{i}:a]aresample=44100,apad=pad_dur={GAP}[a{i}]")
    concat = "".join(f"[a{i}]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=0:a=1[out]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex",
                    ";".join(filters) + ";" + concat, "-map", "[out]", build / "voice.wav"], check=True)

    total = duration(build / "voice.wav")
    (build / "timeline.json").write_text(json.dumps(
        {"duration": round(total, 3), "lines": timeline}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Озвучка готова: {total:.1f} с, {len(lines)} реплик -> {build}")


if __name__ == "__main__":
    main(sys.argv[1])
