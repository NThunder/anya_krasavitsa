"""Сокращение ролика без переозвучки: из записанной озвучки остаются только реплики,
которые есть в script.json, склеенные по границам фраз.

    python -m pipeline.cut agent-team

Удали лишние реплики из reels/<slug>/script.json и запусти. Полная запись хранится в
build/voice_full.wav и build/timeline_full.json, так что реплики можно вернуть.
"""
import json
import shutil
import subprocess
import sys

from .common import REELS

PRE, POST, GAP = 0.05, 0.1, 0.06  # запас до/после фразы и пауза между фразами, сек
FADE = 0.015


def main(slug):
    build = REELS / slug / "build"
    full_wav, full_tl = build / "voice_full.wav", build / "timeline_full.json"
    if not full_wav.exists():
        shutil.copy(build / "voice.wav", full_wav)
        shutil.copy(build / "timeline.json", full_tl)

    keep = [l["id"] for l in json.loads((REELS / slug / "script.json").read_text(encoding="utf-8"))["lines"]]
    lines = [l for l in json.loads(full_tl.read_text(encoding="utf-8"))["lines"] if l["id"] in keep]

    filters, timeline, t = [], [], 0.0
    for i, l in enumerate(lines):
        a, b = max(0.0, l["start"] - PRE), l["end"] + POST
        d = b - a
        filters.append(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d={FADE},"
                       f"afade=t=out:st={d - FADE:.3f}:d={FADE},apad=pad_dur={GAP}[a{i}]")
        shift = t - a
        timeline.append({**l, "start": round(l["start"] + shift, 3), "end": round(l["end"] + shift, 3),
                         "words": [{**w, "start": round(w["start"] + shift, 3), "end": round(w["end"] + shift, 3)}
                                   for w in l["words"]]})
        t += d + GAP
    concat = "".join(f"[a{i}]" for i in range(len(lines))) + f"concat=n={len(lines)}:v=0:a=1[out]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", full_wav, "-filter_complex",
                    ";".join(filters) + ";" + concat, "-map", "[out]", build / "voice.wav"], check=True)
    (build / "timeline.json").write_text(json.dumps({"duration": round(t, 3), "lines": timeline},
                                                    ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Осталось {len(lines)} реплик, {t:.1f} с")


if __name__ == "__main__":
    main(sys.argv[1])
