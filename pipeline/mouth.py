"""Огибающая речи для рисованного аватара: насколько открыт рот в каждом кадре (0..1).

Считается локально по озвучке, без внешних сервисов: громкость голоса по кадрам,
сглаживание (быстрое открытие, чуть более медленное закрытие) и закрытый рот в паузах между словами.
"""
import subprocess

import numpy as np

SR = 16000


def envelope(wav, words, start, end, fps=30):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(wav), "-ss", f"{start:.3f}", "-to", f"{end:.3f}",
                          "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
    hop = SR // fps
    n = int((end - start) * fps)
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) if i * hop < len(x) else 0 for i in range(n)])
    ref = np.percentile(rms[rms > 0], 90) if (rms > 0).any() else 1
    o = np.clip((rms / ref - 0.12) * 1.25, 0, 1)

    # Во время паузы между словами рот закрыт.
    t = start + np.arange(n) / fps
    speaking = np.zeros(n, bool)
    for w in words:
        speaking |= (t >= w["start"] - 0.02) & (t <= w["end"] + 0.02)
    o *= speaking

    out, cur = [], 0.0
    for v in o:
        cur += (v - cur) * (0.75 if v > cur else 0.5)
        out.append(round(float(cur), 3))
    return out
