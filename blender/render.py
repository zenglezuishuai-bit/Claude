"""Render build/flinders.glb with Cycles.

Run with the `bpy` module (pip install bpy) or inside Blender:
    python blender/render.py --view hero --res 1920x1080 --samples 256 --out renders/hero.png
    blender -b -P blender/render.py -- --view hero ...

The glTF importer converts three.js Y-up to Blender Z-up: three (x, y, z)
becomes Blender (x, -z, y). Camera presets below are in three.js coordinates
so they match the web viewer.
"""

import argparse
import math
import os
import sys

import bpy
from mathutils import Vector

VIEWS = {
    # name: (camera position, look-at target, focal length mm)
    # Several match a reference photo in reference/ so the two can be compared.
    "hero": ((30, 30, -36), (-30, 13, 16), 26),
    "dome": ((22, 1.7, -25), (-14, 15, 12), 24),            # like reference/02.jpg
    "facade": ((-62, 9, -21), (-140, 9, 2), 28),
    "clocktower": ((-193, 1.7, -46), (-190, 36, 0), 20),   # like reference/06.jpg
    "aerial": ((120, 210, -260), (-90, 0, 40), 40),
    "rialto": ((-290, 240, -190), (-110, 0, 45), 48),      # like reference/09.jpg
}

# The model's +X axis (Flinders St) bears this many degrees from true north.
GRID_BEARING = 71

# Sun presets: (azimuth degrees clockwise from true north, elevation degrees, strength)
SUNS = {
    "morning": (62, 24, 3.2),
    "golden": (300, 9, 2.6),
    "noon": (10, 58, 4.0),
}


def args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    p = argparse.ArgumentParser()
    p.add_argument("--glb", default="build/flinders.glb")
    p.add_argument("--out", default="renders/hero.png")
    p.add_argument("--view", default="hero", choices=VIEWS)
    p.add_argument("--sun", default="morning", choices=SUNS)
    p.add_argument("--res", default="1920x1080")
    p.add_argument("--samples", type=int, default=256)
    p.add_argument("--blend", default="", help="also save the scene as a .blend file")
    p.add_argument("--no-render", action="store_true", help="only build (and save) the scene")
    return p.parse_args(argv)


def b(v):
    """three.js coordinates -> Blender coordinates."""
    x, y, z = v
    return Vector((x, -z, y))


# ---------------------------------------------------------------------------
# Material helpers

def new_mat(name):
    m = bpy.data.materials.get(name)
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return nt, bsdf


def planar_coords(nt, scale=1.0):
    """2D wall coordinates: (x or y depending on wall normal, z). Works for
    axis-aligned walls, which is nearly everything in this model."""
    n = nt.nodes
    tc = n.new("ShaderNodeTexCoord")
    geo = n.new("ShaderNodeNewGeometry")
    sep_p = n.new("ShaderNodeSeparateXYZ")
    sep_n = n.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep_p.inputs[0])
    nt.links.new(geo.outputs["Normal"], sep_n.inputs[0])
    absn = n.new("ShaderNodeMath"); absn.operation = "ABSOLUTE"
    nt.links.new(sep_n.outputs["X"], absn.inputs[0])
    mix = n.new("ShaderNodeMix"); mix.data_type = "FLOAT"
    nt.links.new(absn.outputs[0], mix.inputs["Factor"])
    nt.links.new(sep_p.outputs["X"], mix.inputs["A"])
    nt.links.new(sep_p.outputs["Y"], mix.inputs["B"])
    comb = n.new("ShaderNodeCombineXYZ")
    nt.links.new(mix.outputs["Result"], comb.inputs["X"])
    nt.links.new(sep_p.outputs["Z"], comb.inputs["Y"])
    sc = n.new("ShaderNodeVectorMath"); sc.operation = "SCALE"
    sc.inputs["Scale"].default_value = scale
    nt.links.new(comb.outputs[0], sc.inputs[0])
    return sc.outputs[0], tc


def noise(nt, vec, scale, detail=4.0, rough=0.6):
    t = nt.nodes.new("ShaderNodeTexNoise")
    t.inputs["Scale"].default_value = scale
    t.inputs["Detail"].default_value = detail
    t.inputs["Roughness"].default_value = rough
    if vec is not None:
        nt.links.new(vec, t.inputs["Vector"])
    return t


def ramp(nt, fac, c0, c1, p0=0.3, p1=0.7):
    r = nt.nodes.new("ShaderNodeValToRGB")
    r.color_ramp.elements[0].position = p0
    r.color_ramp.elements[0].color = (*c0, 1)
    r.color_ramp.elements[1].position = p1
    r.color_ramp.elements[1].color = (*c1, 1)
    nt.links.new(fac, r.inputs["Fac"])
    return r.outputs["Color"]


def bump(nt, height, strength, dist=0.02):
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = strength
    bp.inputs["Distance"].default_value = dist
    nt.links.new(height, bp.inputs["Height"])
    return bp.outputs["Normal"]


def srgb(h):
    """Hex colour to linear RGB tuple."""
    c = [((h >> s) & 255) / 255 for s in (16, 8, 0)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def mat_brick():
    nt, bsdf = new_mat("brick")
    vec, _ = planar_coords(nt)
    bt = nt.nodes.new("ShaderNodeTexBrick")
    bt.inputs["Scale"].default_value = 1.0
    bt.inputs["Brick Width"].default_value = 0.23
    bt.inputs["Row Height"].default_value = 0.076
    bt.inputs["Mortar Size"].default_value = 0.01
    bt.inputs["Color1"].default_value = (*srgb(0x9a3c26), 1)
    bt.inputs["Color2"].default_value = (*srgb(0x86331f), 1)
    bt.inputs["Mortar"].default_value = (*srgb(0xcfc3ad), 1)
    bt.offset = 0.5
    nt.links.new(vec, bt.inputs["Vector"])
    n = noise(nt, vec, 3.0)
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 0.35
    nt.links.new(bt.outputs["Color"], mix.inputs["A"])
    nt.links.new(n.outputs["Color"], mix.inputs["B"])
    nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.88
    inv = nt.nodes.new("ShaderNodeMath"); inv.operation = "SUBTRACT"
    inv.inputs[0].default_value = 1.0
    nt.links.new(bt.outputs["Fac"], inv.inputs[1])
    nt.links.new(bump(nt, inv.outputs[0], 0.5, 0.01), bsdf.inputs["Normal"])


def mat_painted(name, hexcol, rough=0.75, grime=0.18, scale=0.6):
    nt, bsdf = new_mat(name)
    vec, _ = planar_coords(nt)
    n = noise(nt, vec, scale, 6, 0.65)
    base = srgb(hexcol)
    dark = tuple(c * (1 - grime) for c in base)
    nt.links.new(ramp(nt, n.outputs["Fac"], dark, base, 0.35, 0.65), bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    fine = noise(nt, vec, 40, 3, 0.5)
    nt.links.new(bump(nt, fine.outputs["Fac"], 0.08, 0.01), bsdf.inputs["Normal"])


def mat_copper():
    nt, bsdf = new_mat("copper")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = noise(nt, tc.outputs["Object"], 1.6, 8, 0.7)
    col = ramp(nt, n.outputs["Fac"], srgb(0x34503f), srgb(0x7fae95), 0.3, 0.75)
    streak = noise(nt, tc.outputs["Object"], 9, 4, 0.5)
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 0.25
    nt.links.new(col, mix.inputs["A"])
    nt.links.new(streak.outputs["Color"], mix.inputs["B"])
    nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.5
    bsdf.inputs["Metallic"].default_value = 0.25
    nt.links.new(bump(nt, streak.outputs["Fac"], 0.15), bsdf.inputs["Normal"])


def mat_glass(name, hexcol, metallic=0.0, rough=0.04):
    nt, bsdf = new_mat(name)
    bsdf.inputs["Base Color"].default_value = (*srgb(hexcol), 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Specular IOR Level"].default_value = 0.8
    bsdf.inputs["Coat Weight"].default_value = 0.6
    bsdf.inputs["Coat Roughness"].default_value = 0.02


def mat_ground(name, hexcol, rough=0.92, var=0.25, scale=0.15):
    nt, bsdf = new_mat(name)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = noise(nt, tc.outputs["Object"], scale, 6, 0.6)
    base = srgb(hexcol)
    nt.links.new(ramp(nt, n.outputs["Fac"], tuple(c * (1 - var) for c in base), base), bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    fine = noise(nt, tc.outputs["Object"], 25, 2, 0.5)
    nt.links.new(bump(nt, fine.outputs["Fac"], 0.1), bsdf.inputs["Normal"])


def mat_water():
    nt, bsdf = new_mat("water")
    bsdf.inputs["Base Color"].default_value = (*srgb(0x2c4648), 1)
    bsdf.inputs["Roughness"].default_value = 0.03
    tc = nt.nodes.new("ShaderNodeTexCoord")
    w = nt.nodes.new("ShaderNodeTexWave")
    w.inputs["Scale"].default_value = 0.4
    w.inputs["Distortion"].default_value = 6
    nt.links.new(tc.outputs["Object"], w.inputs["Vector"])
    nt.links.new(bump(nt, w.outputs["Fac"], 0.12, 0.05), bsdf.inputs["Normal"])


def mat_tweak(name, rough=None, metallic=None):
    m = bpy.data.materials.get(name)
    if not m:
        return
    bsdf = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        return
    if rough is not None:
        bsdf.inputs["Roughness"].default_value = rough
    if metallic is not None:
        bsdf.inputs["Metallic"].default_value = metallic


def setup_materials():
    have = {m.name for m in bpy.data.materials}
    if "brick" in have: mat_brick()
    for name, col, rough in [("render", 0xd3b882, 0.78), ("trim", 0xe6d5ad, 0.72), ("groove", 0x9c8762, 0.9), ("stone", 0x9a958d, 0.85),
                             ("sandstone", 0xa4967b, 0.88), ("fedsq", 0xb99e78, 0.85),
                             ("bldg1", 0xd7d0c1, 0.8), ("bldg2", 0xc2b399, 0.85), ("bldg3", 0x9b9993, 0.8),
                             ("bldg4", 0xb47d5b, 0.88), ("bldg5", 0xe4e1da, 0.78)]:
        if name in have: mat_painted(name, col, rough)
    if "copper" in have: mat_copper()
    if "glass" in have: mat_glass("glass", 0x10181e, 0.0, 0.03)
    if "curtain" in have: mat_glass("curtain", 0x56707f, 0.55, 0.06)
    for name, col, rough, var, sc in [("asphalt", 0x36383b, 0.9, 0.3, 0.12), ("pavement", 0xa9a398, 0.9, 0.25, 0.2),
                                      ("concrete", 0xb0aca3, 0.88, 0.2, 0.3), ("ballast", 0x5a534c, 1.0, 0.4, 2.0),
                                      ("grass", 0x55733a, 1.0, 0.35, 0.5), ("roof", 0x4f5356, 0.6, 0.25, 0.3),
                                      ("slate", 0x464b52, 0.55, 0.2, 0.4)]:
        if name in have: mat_ground(name, col, rough, var, sc)
    if "water" in have: mat_water()
    mat_tweak("rail", 0.3, 0.9)
    mat_tweak("canopy", 0.45, 0.5)
    mat_tweak("zinc", 0.4, 0.7)
    mat_tweak("gold", 0.2, 1.0)
    mat_tweak("foliage", 0.9, 0.0)
    for name in ("paint1", "paint2", "paint3"):
        if name in have:
            mat_glass(name, {"paint1": 0x22324a, "paint2": 0xaeb3b8, "paint3": 0x7e2420}[name], 0.6, 0.2)
    mat_tweak("tram", 0.3, 0.0)
    mat_tweak("mullion", 0.45, 0.3)
    mat_tweak("columns", 0.35, 0.2)
    mat_tweak("board", 0.4, 0.0)


# ---------------------------------------------------------------------------

def setup_world(sun_key):
    az, el, strength = SUNS[sun_key]
    # Convert the compass azimuth to the model's grid (model north = -Z three.js = +Y here).
    az = az + (90 - GRID_BEARING)
    scene = bpy.context.scene
    world = bpy.data.worlds.new("Sky")
    scene.world = world
    nt = world.node_tree
    nt.nodes.clear()
    sky = nt.nodes.new("ShaderNodeTexSky")
    sky.sky_type = "MULTIPLE_SCATTERING"
    sky.sun_disc = False
    sky.sun_elevation = math.radians(el)
    # Blender's sky rotation is measured from -Y... align it with the sun lamp
    # by pointing the lamp from the same compass direction (north = +Y here).
    sky.sun_rotation = math.radians(az)
    sky.air_density = 1.0
    sky.aerosol_density = 1.6
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = 0.22
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])

    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = strength
    sun.angle = math.radians(0.6)
    warm = min(1.0, el / 35)
    sun.color = (1.0, 0.72 + 0.26 * warm, 0.5 + 0.42 * warm)
    obj = bpy.data.objects.new("Sun", sun)
    scene.collection.objects.link(obj)
    # Direction toward the sun in Blender coords (north = +Y, east = +X).
    d = Vector((math.sin(math.radians(az)) * math.cos(math.radians(el)),
                math.cos(math.radians(az)) * math.cos(math.radians(el)),
                math.sin(math.radians(el))))
    obj.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()


def setup_cameras(active):
    """One camera per preset (Cam_hero, Cam_dome, ...); `active` renders."""
    for name, (pos, target, lens) in VIEWS.items():
        cam = bpy.data.cameras.new(f"Cam_{name}")
        cam.lens = lens
        cam.clip_start = 0.3
        cam.clip_end = 5000
        obj = bpy.data.objects.new(f"Cam_{name}", cam)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = b(pos)
        obj.rotation_euler = (b(target) - b(pos)).to_track_quat("-Z", "Y").to_euler()
        if name == active:
            bpy.context.scene.camera = obj


def prepare_for_desktop(scene):
    """Settings for opening the saved .blend in desktop Blender: GPU if the
    user has one enabled, light viewport sampling, and 3D views that look
    through the active camera in Material Preview."""
    # The glTF importer leaves everything selected (orange outlines in the UI).
    for obj in scene.objects:
        obj.select_set(False)
    bpy.context.view_layer.objects.active = None
    scene.cycles.device = "GPU"
    scene.cycles.preview_samples = 32
    scene.cycles.use_preview_denoising = True
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type != "VIEW_3D":
                continue
            for space in area.spaces:
                if space.type == "VIEW_3D":
                    space.shading.type = "MATERIAL"
                    space.clip_end = 5000
                    space.region_3d.view_perspective = "CAMERA"


def main():
    a = args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=a.glb)
    setup_materials()
    setup_world(a.sun)
    setup_cameras(a.view)

    scene = bpy.context.scene
    w, h = (int(v) for v in a.res.split("x"))
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.render.resolution_percentage = 100
    scene.render.engine = "CYCLES"
    cy = scene.cycles
    cy.device = "CPU"
    cy.samples = a.samples
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.02
    cy.use_denoising = True
    cy.max_bounces = 6
    cy.diffuse_bounces = 3
    cy.glossy_bounces = 3
    cy.transmission_bounces = 2
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.0
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = a.out
    if a.blend:
        cpu_device = scene.cycles.device
        prepare_for_desktop(scene)
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(a.blend), compress=True)
        scene.cycles.device = cpu_device
        print("saved", a.blend)
    if a.no_render:
        return
    bpy.ops.render.render(write_still=True)
    print("wrote", a.out)


main()
