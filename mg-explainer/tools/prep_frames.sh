#!/usr/bin/env bash
# Extract the frames the film needs from the 15 original films (https://github.com/Vincentwei1021/mg-styles-15, MIT).
# usage: tools/prep_frames.sh <path to mg-styles-15/videos>   → out/frames/<slug>/NNN.jpg, out/frames/grid/NNN.jpg, out/clips/<slug>.wav
set -euo pipefail
V=${1:?path to mg-styles-15/videos}
HERE=$(cd "$(dirname "$0")/.." && pwd)
O=$HERE/out
mkdir -p "$O/frames" "$O/clips"
# slug  start(s) — the 5-second window shown in the tour (keep in sync with STYLES in film.js)
while read -r slug ss; do
  d=$O/frames/$slug; mkdir -p "$d"
  if [ "$slug" = 18-hanazi ]; then vf="scale=354:630:flags=lanczos"; else vf="scale=1120:630:flags=lanczos"; fi
  ffmpeg -nostdin -v error -y -ss "$ss" -t 5 -i "$V/$slug.mp4" -vf "fps=30,$vf" -q:v 3 -start_number 0 "$d/%03d.jpg"
  ffmpeg -nostdin -v error -y -ss "$ss" -t 5 -i "$V/$slug.mp4" -vn -ac 2 -ar 48000 -c:a pcm_s16le "$O/clips/$slug.wav"
done <<'L'
05-cel-boil 2.0
03-isometric 3.0
01-flat-vector 0.0
02-line-art 4.5
04-3d-render 5.0
08-morph 2.0
19-paperclip 2.0
22-hud 4.0
06-collage 3.5
12-aurora-glass 3.0
09-bauhaus 3.0
10-synthwave 1.0
20-pixel 5.0
07-liquid 2.5
18-hanazi 4.0
L
# 5×3 wall of all 15 films playing from their start (each tile 384×216); 18-hanazi is centre-cropped to 16:9
in=(); i=0; fc=""
for slug in 05-cel-boil 03-isometric 01-flat-vector 02-line-art 04-3d-render 08-morph 19-paperclip 22-hud 06-collage 12-aurora-glass 09-bauhaus 10-synthwave 20-pixel 07-liquid 18-hanazi; do
  in+=(-i "$V/$slug.mp4")
  if [ "$slug" = 18-hanazi ]; then crop="crop=1080:608:0:520,"; else crop=""; fi
  fc+="[$i:v]${crop}fps=30,scale=384:216:flags=lanczos,setsar=1[v$i];"; i=$((i+1))
done
lay=""; for r in 0 1 2; do for c in 0 1 2 3 4; do lay+="$((c*384))_$((r*216))|"; done; done
fc+="$(for k in $(seq 0 14); do printf '[v%d]' $k; done)xstack=inputs=15:layout=${lay%|}[g]"
mkdir -p "$O/frames/grid"
ffmpeg -nostdin -v error -y "${in[@]}" -filter_complex "$fc" -map "[g]" -t 10 -q:v 3 -start_number 0 "$O/frames/grid/%03d.jpg"
echo done
