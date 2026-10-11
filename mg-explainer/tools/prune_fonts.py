"""Keep only the font chunks the film uses: every character in js/*.js decides which unicode-range @font-face blocks stay
in fonts/fonts.css; unreferenced files in fonts/files are deleted. Run after editing any on-screen text (with the full
Fontsource files restored first if a new character needs a chunk that was dropped)."""
import os, re, glob

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
chars = set()
for f in glob.glob(os.path.join(HERE, 'js', '*.js')):
    chars |= set(open(f, encoding='utf-8').read())
chars |= set(chr(c) for c in range(0x20, 0x7f))
cps = {ord(c) for c in chars}

css = open(os.path.join(HERE, 'fonts', 'fonts.css'), encoding='utf-8').read()
blocks = re.findall(r'(/\*[^*]*\*/\s*@font-face\s*\{[^}]*\})', css)
keep = []
for b in blocks:
    m = re.search(r'unicode-range:\s*([^;]+);', b)
    if not m:
        keep.append(b); continue
    used = False
    for r in m.group(1).split(','):
        r = r.strip()[2:]
        a, _, z = r.partition('-')
        lo, hi = int(a, 16), int(z or a, 16)
        if any(lo <= c <= hi for c in cps):
            used = True; break
    if used: keep.append(b)
open(os.path.join(HERE, 'fonts', 'fonts.css'), 'w', encoding='utf-8').write('\n'.join(keep) + '\n')
ref = set(re.findall(r'url\(files/([^)]+)\)', '\n'.join(keep)))
gone = 0
for f in glob.glob(os.path.join(HERE, 'fonts', 'files', '*')):
    if os.path.basename(f) not in ref: os.remove(f); gone += 1
print(f'kept {len(keep)}/{len(blocks)} @font-face blocks, removed {gone} files')
