"""Soundtrack for the 9:16 short (32 s) → out/audio_short.wav. mgaudio pop recipe at 120 BPM: the 15 cuts land every
3 beats from the drop (5.0 s), one swish + hit per cut; the end card at 27.5 s gets the final chord.
usage: python3 audio_short.py /path/to/mg-styles-15/lib/audio"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'mg-styles-15', 'lib', 'audio'))
from mgaudio import recipes, sfx

TOUR, SLOT, END, DUR = 5.0, 1.5, 27.5, 32.0
m = recipes.pop(duration=DUR, bpm=120, key='D', build=3.0, drop=TOUR, outro=END)
m.sfx(sfx.impact('cinematic'), at=0.0, gain=-2)
m.sfx(sfx.text_hit('slam'), at=0.27, gain=-4)
m.sfx(sfx.text_hit('slam'), at=2.02, gain=-5)
m.sfx(sfx.pop('cork', pitch=1.1), at=2.55, gain=-5)
m.sfx(sfx.riser(1.8, 'hybrid', seed=2), at=TOUR, gain=-8)
for i in range(15):
    t = TOUR + i * SLOT
    m.sfx(sfx.swish(0.22, seed=i), at=t + 0.04, gain=-8, pan=(-0.3, 0.3)[i % 2])
    m.sfx(sfx.pop('bubble', pitch=0.9 + 0.03 * i), at=t + 0.1, gain=-12)
m.sfx(sfx.transition(0.6, 'swish_pop', seed=9), at=END, gain=-5)
m.sfx(sfx.pop('cork', pitch=1.0), at=END + 0.1, gain=-4)
m.sfx(sfx.text_hit('pop'), at=END + 0.4, gain=-6)
m.sfx(sfx.ding(m.form.chord_at(END + 1.4, 12)[-1]), at=END + 1.4, gain=-8)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
m.export(os.path.join(HERE, 'out', 'audio_short.wav'), lufs=-14, tp=-1.5)
