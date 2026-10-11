"""Synthesises the sound effects track (sfx.wav) in sync with index.html's timeline."""
import os
import wave

import numpy as np

SR = 22050
DUR = 15.0
out = np.zeros(int(SR * DUR))
rng = np.random.default_rng(7)


def add(t0, sig, amp=1.0):
    i = int(t0 * SR)
    sig = sig[: len(out) - i]
    out[i : i + len(sig)] += amp * sig


def env(n, attack=0.005, decay=None):
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1)
    d = np.exp(-t / decay) if decay else np.ones(n)
    return a * d


def tone(freqs, dur, kind="sine"):
    """freqs: scalar or per-sample array."""
    n = int(dur * SR)
    f = np.broadcast_to(np.asarray(freqs, float), (n,))
    ph = 2 * np.pi * np.cumsum(f) / SR
    if kind == "saw":
        return 2 * ((ph / (2 * np.pi)) % 1) - 1
    return np.sin(ph)


def noise(dur, smooth=1):
    n = rng.standard_normal(int(dur * SR))
    if smooth > 1:
        n = np.convolve(n, np.ones(smooth) / smooth, mode="same") * np.sqrt(smooth)
    return n


# footsteps while walking in (two steps per leg cycle of 2*pi/10 s)
for k in range(7):
    add(0.16 + k * np.pi / 10, noise(0.04, 6) * env(int(0.04 * SR), decay=0.01), 0.18)
# whistle of the falling burger, thud, and the "!" ding
n = int(0.5 * SR)
add(2.0, tone(np.linspace(1400, 380, n), 0.5) * np.linspace(0.2, 1, n), 0.18)
add(2.5, tone(np.linspace(110, 50, int(0.3 * SR)), 0.3) * env(int(0.3 * SR), decay=0.08), 0.8)
add(2.5, noise(0.08, 12) * env(int(0.08 * SR), decay=0.02), 0.25)
add(2.55, tone(1320, 0.5) * env(int(0.5 * SR), decay=0.12), 0.22)
add(2.55, tone(1980, 0.5) * env(int(0.5 * SR), decay=0.08), 0.1)
# boings for the excited hops
for t0 in (2.95, 3.775):
    n = int(0.3 * SR)
    f = np.linspace(260, 720, n) * (1 + 0.06 * np.sin(np.arange(n) / SR * 2 * np.pi * 28))
    add(t0, tone(f, 0.3) * env(n, decay=0.12), 0.3)
# chomps + chewing
for b in (5.0, 6.5, 8.0, 9.5):
    add(b, tone(np.linspace(300, 900, int(0.25 * SR)), 0.25) * env(int(0.25 * SR), decay=0.1), 0.08)
    c = b + 0.3
    add(c, noise(0.16, 3) * env(int(0.16 * SR), decay=0.04), 0.55)
    add(c, tone(np.linspace(160, 60, int(0.18 * SR)), 0.18) * env(int(0.18 * SR), decay=0.05), 0.7)
    for j in range(4):
        add(b + 0.75 + j * 0.2, noise(0.05, 4) * env(int(0.05 * SR), decay=0.012), 0.22)
# belly grows
n = int(0.35 * SR)
add(11.0, tone(np.linspace(180, 520, n), 0.35) * env(n, decay=0.15), 0.3)
# burp
n = int(0.5 * SR)
tt = np.arange(n) / SR
burp = tone(92 + 10 * np.sin(2 * np.pi * 3 * tt), 0.5, "saw") * (0.6 + 0.4 * np.sin(2 * np.pi * 27 * tt))
burp = np.convolve(burp, np.ones(10) / 10, mode="same") * np.sin(np.pi * tt / 0.5) ** 0.5
add(11.68, burp, 0.7)
# hearts: soft blips; then a little sparkle arpeggio for "吃饱啦！"
for i in range(8):
    add(12.6 + i * 0.22, tone(880 * 2 ** (i % 4 / 12 * 4), 0.15) * env(int(0.15 * SR), decay=0.04), 0.08)
for i, f in enumerate((1047, 1319, 1568, 2093)):
    add(12.9 + i * 0.1, tone(f, 0.5) * env(int(0.5 * SR), decay=0.15), 0.16)

out *= np.clip((DUR - np.arange(len(out)) / SR) / 0.6, 0, 1)  # fade with the picture
out = np.clip(out / max(1.0, np.abs(out).max() / 0.9), -1, 1)
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sfx.wav")
with wave.open(path, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())
print("wrote", path)
