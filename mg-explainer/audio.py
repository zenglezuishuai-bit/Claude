"""Soundtrack for 「Clawd 的 15 种画法」 (140 s) → out/audio.wav

Built with mgaudio from mg-styles-15 (lib/audio, MIT) — the same toolkit the 15 films use:
  0–35.6 s  part A: explainer bed (marimba + soft groove, 108 BPM, D major) with UI / typing / shutter SFX on the picture's cues
  35–110 s  tour: each style plays 5 s of its ORIGINAL soundtrack (out/clips/<slug>.wav), loudness-matched, with a swish per cut
  110–140 s part B: the explainer bed again for the review, the how-to and the end card
usage: python3 audio.py /path/to/mg-styles-15/lib/audio
"""
import os, sys, json
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'mg-styles-15', 'lib', 'audio'))
import mgaudio as mg
from mgaudio import recipes, sfx
import soundfile as sf
import pyloudnorm as pyln

SR = 48000
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
SLUGS = ['05-cel-boil', '03-isometric', '01-flat-vector', '02-line-art', '04-3d-render', '08-morph', '19-paperclip', '22-hud',
         '06-collage', '12-aurora-glass', '09-bauhaus', '10-synthwave', '20-pixel', '07-liquid', '18-hanazi']
TOUR, SLOT, REVIEW, OUTRO, END, DUR = 35.0, 5.0, 110.0, 122.0, 131.0, 140.0
meter = pyln.Meter(SR)


def render(m, name):
    p = os.path.join(OUT, name)
    m.export(p, lufs=-14, tp=-1.5)
    y, sr = sf.read(p, always_2d=True); assert sr == SR
    return y.astype(np.float64)


# ---------------------------------------------------------------- part A: hook + pipeline
A = recipes.explainer(duration=35.6, bpm=108, build=8.2, drop=10.0, outro=34.4)
CUT = 60 / 108 / 2; SLAM = 8 * CUT                    # opening montage: 8 hero shots on 8th notes, then the wall slams in
from mgaudio import drums
mt = A.track('montage', level=-16, group='music')
for k in range(8):
    mt.add(drums.kick('punchy', 1.0 if k % 2 == 0 else 0.8), k * CUT)
    A.sfx(sfx.impact('punch', size=0.6), at=k * CUT, gain=-13 + k * 0.6, pan=(-0.3, 0.3)[k % 2])
    A.sfx(sfx.swish(0.18, seed=k), at=k * CUT + 0.05, gain=-15)
A.sfx(sfx.riser(SLAM - 0.2, 'noise', seed=4), at=SLAM, gain=-12)
A.sfx(sfx.impact('cinematic'), at=SLAM, gain=1)
A.sfx(sfx.text_hit('slam'), at=SLAM + 0.05, gain=-3)
A.sfx(sfx.boom(1.2), at=SLAM, gain=-6)
A.sfx(sfx.text_hit('pop'), at=4.62, gain=-7)
A.sfx(sfx.pop('cork', pitch=1.1), at=5.02, gain=-5)
A.sfx(sfx.pen('marker', 0.5), at=5.42, gain=-12)
A.sfx(sfx.whoosh(0.6, 'air', direction=1, peak=0.6), at=7.45, gain=-8)
A.sfx(sfx.pop('cork', pitch=1.0), at=7.75, gain=-4)
A.sfx(sfx.impact('cinematic'), at=8.17, gain=-2)
A.sfx(sfx.shimmer_hit(A.form.chord_at(8.6, 12)[-1]), at=8.6, gain=-8, verb=-10)
for k in range(5):                                   # each pipeline step
    t = 10.0 + 5 * k
    A.sfx(sfx.transition(0.5, 'swish_pop', seed=k), at=t + 0.12, gain=-9)
A.sfx(sfx.typing(18, rate=12, kind='keyboard', seed=3), at=15.45, gain=-11)
for j in range(24):                                  # step 3: the camera shutter, one per thumbnail
    A.sfx(sfx.tick('hi'), at=20.4 + j / 6.2, gain=-15 - (j % 2) * 3, pan=0.2)
A.sfx(sfx.shutter('dslr'), at=24.3, gain=-8)
for k in range(6):                                   # step 4: cue markers
    A.sfx(sfx.blip(74 + [0, 4, 7, 9, 12, 16][k], kind='sine'), at=25.5 + k * 0.15, gain=-12)
A.sfx(sfx.whoosh(1.0, 'sci', direction=1, peak=0.8), at=31.4, gain=-9)
A.sfx(sfx.pop('soft', pitch=1.1), at=31.65, gain=-4)
A.sfx(sfx.ding(A.form.chord_at(33.4, 12)[-1]), at=33.45, gain=-9)
a = render(A, 'part_a.wav')

# ---------------------------------------------------------------- part B: review + how-to + end card
B = recipes.explainer(duration=30.0, bpm=108, build=0.6, drop=2.8, outro=27.0)
o = lambda t: t - REVIEW
B.sfx(sfx.transition(0.6, 'whoosh_hit', seed=5), at=o(110.1), gain=-8)
for j in range(7):
    B.sfx(sfx.tick('wood'), at=o(110.9 + j * 0.3), gain=-12)
B.sfx(sfx.ui('confirm'), at=o(113.65), gain=-7)
B.sfx(sfx.swish(0.3), at=o(116.0), gain=-9)
B.sfx(sfx.riser(1.3, 'tonal'), at=o(118.5), gain=-12)
B.sfx(sfx.impact('soft'), at=o(118.5), gain=-6)
B.sfx(sfx.shimmer_hit(B.form.chord_at(o(118.5), 12)[-1]), at=o(118.55), gain=-8, verb=-10)
B.sfx(sfx.whoosh(0.5, 'swoosh', direction=1), at=o(122.05), gain=-9)
for j in range(3):
    B.sfx(sfx.pop('mouth', pitch=0.95 + 0.1 * j), at=o(122.6 + j * 0.6), gain=-6)
B.sfx(sfx.ui('notify'), at=o(125.5), gain=-10)
B.sfx(sfx.transition(0.8, 'reverse_hit', seed=7), at=o(131.05), gain=-6)
B.sfx(sfx.pop('cork', pitch=1.05), at=o(131.4), gain=-5)
B.sfx(sfx.click('soft'), at=o(132.5), gain=-8)
B.sfx(sfx.sparkle(0.8, key='D'), at=o(134.3), gain=-12, verb=-12)
b = render(B, 'part_b.wav')

# ---------------------------------------------------------------- tour SFX (one swish per cut), rendered alone then scaled
TS = mg.Mix(duration=76.0, bpm=108)
for i in range(15):
    TS.sfx(sfx.whoosh(0.45, 'swish', direction=1 if i % 2 else -1, peak=0.35, seed=i), at=i * SLOT + 0.12, gain=0)
ts = render(TS, 'tour_sfx.wav') * 10 ** (-9 / 20)

# ---------------------------------------------------------------- assemble
N = int(DUR * SR)
y = np.zeros((N, 2))
def place(x, t0, fade_in=0.0, fade_out=0.0):
    i0 = int(round(t0 * SR)); x = x.copy(); n = len(x)
    if fade_in: k = int(fade_in * SR); x[:k] *= np.linspace(0, 1, k)[:, None]
    if fade_out: k = int(fade_out * SR); x[n - k:] *= np.linspace(1, 0, k)[:, None]
    i1 = min(N, i0 + n); y[i0:i1] += x[: i1 - i0]

place(a, 0.0, fade_out=0.6)                                    # rings 0.6 s into the first clip
for i, s in enumerate(SLUGS):
    c, sr = sf.read(os.path.join(OUT, 'clips', s + '.wav'), always_2d=True); assert sr == SR
    c = c[: int(SLOT * SR)].astype(np.float64)
    L = meter.integrated_loudness(c)
    c *= 10 ** ((-16.0 - L) / 20) if np.isfinite(L) else 1.0
    place(c, TOUR + i * SLOT, fade_in=0.04, fade_out=0.12)
place(ts, TOUR)
place(b, REVIEW, fade_in=0.05)

# master: loudness to −14 LUFS with a look-around peak limiter (ceiling −1.5 dBFS), repeated so both settle
from scipy.signal import resample_poly
from scipy.ndimage import maximum_filter1d, uniform_filter1d
def limit(x, ceil_db=-1.5, win=0.004):
    w = int(win * SR); ceil = 10 ** (ceil_db / 20)
    env = maximum_filter1d(np.max(np.abs(x), axis=1), size=4 * w + 1)
    g = uniform_filter1d(np.minimum(1.0, ceil / np.maximum(env, 1e-9)), size=2 * w + 1)
    return x * g[:, None]
for _ in range(4):
    L = meter.integrated_loudness(y); y *= 10 ** ((-14.0 - L) / 20); y = limit(y)
tp = 20 * np.log10(np.max(np.abs(resample_poly(y, 4, 1, axis=0))))
if tp > -1.0: y *= 10 ** ((-1.0 - tp) / 20)
fo = int(0.6 * SR); y[-fo:] *= np.linspace(1, 0, fo)[:, None]
sf.write(os.path.join(OUT, 'audio.wav'), y.astype(np.float32), SR, subtype='PCM_24')
print('audio.wav', y.shape[0] / SR, 's  LUFS', round(meter.integrated_loudness(y), 2),
      ' peak4x dBFS', round(20 * np.log10(np.max(np.abs(resample_poly(y, 4, 1, axis=0)))), 2))
