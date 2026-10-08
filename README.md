# Flinders Street Station 3D

A procedural model of Melbourne's Flinders Street Station and its corner of the CBD. It is built with three.js, rendered offline in Blender Cycles, and can be explored in the browser.

This is the pilot for a larger Melbourne CBD model. Plan dimensions are measured from a scaled satellite image and heights are estimated from photographs, so they are approximate rather than survey data. The surrounding city blocks are generic massing, not real buildings.

## References

`reference/` holds the 12 images the model was refined against: Wikimedia Commons photographs (CC BY / CC BY-SA / public domain, authors and licences in `reference/README.md` and `reference/sources.json`) and an Esri World Imagery tile mosaic (north up, ~0.47 m/px) used for the plan layout. Some Blender camera presets (`dome`, `clocktower`, `rialto`) match reference photos 02, 06 and 09 so the two can be compared side by side.

The model is aligned to the Hoddle grid: +X runs along Flinders St, which really bears about 71° from true north (`GRID_BEARING`). The viewer and the Blender script rotate the sun by this angle so shadows fall the right way.

## Pipeline

```
src/station.js          three.js generator (one source of truth for the model)
   ├─► index.html       interactive viewer: click buildings, fly-to, walk mode, time of day
   └─► scripts/export-glb.mjs ─► build/flinders.glb ─► blender/render.py ─► renders/*.png
```

- **Model** (`src/station.js`): the chamfered entrance block with its great arch, clocks, pediment and ribbed copper dome; the arcaded Flinders St facade (red brick panels between rusticated buff pilasters) with its pavilions; the striped clock tower on the Elizabeth St axis; the domed west-end pavilion; the Swanston St arcade, concourse, platform canopies and yards, plus context buildings: St Paul's Cathedral, Federation Square, Young & Jackson, Eureka Tower, generic CBD blocks, trams, cars and overhead wires. Every mesh is tagged with a part key (`dome`, `clocktower`, `facade`, …) so the viewer can pick it. Coordinates are metres, Y up, +X along Flinders St (grid east), −Z grid north.
- **Viewer** (`index.html`): generates the model live in the browser. Context buildings that come between the camera and the point being looked at fade to faint ghosts, so the station is never hidden while orbiting. Click a building (or a chip in the bottom rail) to fly to it and read about it. **街景漫游** switches to street-level walking: drag to look, WASD or the arrow keys to move, Shift to run, and on phones use the on-screen arrows. The time slider moves the sun. **渲染图** shows the Blender renders.
- **Blender** (`blender/render.py`): imports the GLB and replaces the flat materials with procedural ones (brick bond, weathered render, verdigris copper, glass, asphalt, water). It then lights the scene with a physical sky plus a sun lamp and renders with Cycles and denoising. Camera presets use three.js coordinates so they match the viewer.

## Open it in Blender

`blender/flinders.blend` is the ready-made scene (Blender 5.2; it opens in 4.2+ with minor differences). It has the imported model, procedural materials, physical sky and sun, and one camera per preset (`Cam_hero`, `Cam_dome`, `Cam_facade`, `Cam_clocktower`, `Cam_rialto`, `Cam_aerial`).

1. Open the file. The 3D view looks through `Cam_hero` in Material Preview.
2. For the full Cycles look while you move around, switch the viewport to **Rendered** (press `Z` in the 3D view and pick Rendered, or use the rightmost shading button). Leave camera view with `Numpad 0` or by orbiting with the middle mouse button.
3. If you have a graphics card, enable it under Edit → Preferences → System → Cycles Render Devices (CUDA / OptiX / HIP / Metal). The scene is already set to use the GPU when one is enabled. On CPU only, Rendered mode is slow; use Material Preview to move and Rendered to check.
4. To switch preset cameras, select one in the Outliner and press `Ctrl+Numpad 0`. Press `F12` to render a still.

Regenerate the file after changing the model: `npm run export`, then `python blender/render.py --blend blender/flinders.blend --no-render`.

## Usage

```bash
npm install
npm run export                         # build/flinders.glb

pip install bpy                        # Blender as a Python module (or use a Blender install)
python blender/render.py --view hero --sun morning --res 1920x1080 --samples 128 --out renders/hero.png
#   views: hero, dome, facade, clocktower, rialto, aerial      suns: morning, golden, noon
#   --blend scene.blend also saves the scene for further work in the Blender UI

npx serve .                            # then open index.html (needs internet for the three.js CDN)
node scripts/shoot.mjs out.png dome    # headless screenshot of the viewer (needs playwright)
```

On a 4-core CPU, a 1920×1080 render at 128 samples takes a few minutes per view.
