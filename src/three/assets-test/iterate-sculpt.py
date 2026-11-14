"""Iterate sculpt.blend toward a classical marble self-portrait bust. v3

Run:  blender --background sculpt.blend --python build.py -- <out.blend>

Front of the face is -Y, up is +Z. Coordinates are world-space (probe-derived).
Hair is carved INTO the head mesh (raised scalp + lock grooves) so it reads as
cut from one block; only the bun is separate geometry.
"""
import bpy, math, random, sys
import numpy as np
from mathutils import Vector

OUT = sys.argv[sys.argv.index("--") + 1]
random.seed(7)

# ---------------------------------------------------------------- helpers ----

def activate(ob):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob

def apply_all(ob):
    activate(ob)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

def remesh(ob, size):
    activate(ob)
    ob.data.remesh_voxel_size = size
    bpy.ops.object.voxel_remesh()

def smooth(ob, factor=0.5, iterations=2, vgroup=None):
    activate(ob)
    m = ob.modifiers.new("Sm", "SMOOTH")
    m.factor = factor
    m.iterations = iterations
    if vgroup:
        m.vertex_group = vgroup
    bpy.ops.object.modifier_apply(modifier=m.name)

def shade_smooth(ob):
    activate(ob)
    bpy.ops.object.shade_smooth()

def get_np(me):
    n = len(me.vertices)
    co = np.empty(n * 3); no = np.empty(n * 3)
    me.vertices.foreach_get("co", co)
    me.vertices.foreach_get("normal", no)
    return co.reshape(n, 3), no.reshape(n, 3)

def set_np(me, co):
    me.vertices.foreach_set("co", co.reshape(-1))
    me.update()

def dist_to_polyline(co, pts):
    d = None
    pts = np.asarray(pts, dtype=np.float64)
    for chunk in np.array_split(pts, max(1, len(pts) // 24)):
        dd = np.linalg.norm(co[:, None, :] - chunk[None, :, :], axis=2).min(axis=1)
        d = dd if d is None else np.minimum(d, dd)
    return d

def ridge(co, disp, pts, amp, r):
    d = dist_to_polyline(co, pts)
    disp += amp * np.exp(-((d / r) ** 2))

def dot_(co, disp, p, amp, r):
    d = np.linalg.norm(co - np.asarray(p, dtype=np.float64), axis=1)
    disp += amp * np.exp(-((d / r) ** 2))

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

def front_surface(me, bin_size=0.09):
    co, _ = get_np(me)
    grid = {}
    for x, y, z in co:
        k = (round(x / bin_size), round(z / bin_size))
        if k not in grid or y < grid[k]:
            grid[k] = y
    def lookup(x, z, fallback=-0.4):
        k0 = (round(x / bin_size), round(z / bin_size))
        best = None
        for dx in (-1, 0, 1):
            for dz in (-1, 0, 1):
                v = grid.get((k0[0] + dx, k0[1] + dz))
                if v is not None and (best is None or v < best):
                    best = v
        return best if best is not None else fallback
    return lookup

def back_surface(me, bin_size=0.09):
    co, _ = get_np(me)
    grid = {}
    for x, y, z in co:
        k = (round(x / bin_size), round(z / bin_size))
        if k not in grid or y > grid[k]:
            grid[k] = y
    def lookup(x, z, fallback=0.6):
        k0 = (round(x / bin_size), round(z / bin_size))
        best = None
        for dx in (-1, 0, 1):
            for dz in (-1, 0, 1):
                v = grid.get((k0[0] + dx, k0[1] + dz))
                if v is not None and (best is None or v > best):
                    best = v
        return best if best is not None else fallback
    return lookup

def new_curve_obj(name, points, radii, bevel=0.05, resolution=24):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = bevel
    cu.bevel_resolution = 6
    cu.resolution_u = resolution
    cu.use_fill_caps = True
    sp = cu.splines.new("NURBS")
    sp.points.add(len(points) - 1)
    for i, (p, r) in enumerate(zip(points, radii)):
        sp.points[i].co = (p[0], p[1], p[2], 1.0)
        sp.points[i].radius = r
    sp.use_endpoint_u = True
    sp.order_u = min(4, len(points))
    ob = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(ob)
    return ob

def curve_to_mesh(ob):
    activate(ob)
    bpy.ops.object.convert(target="MESH")
    return bpy.context.view_layer.objects.active

def join(objs, name):
    activate(objs[0])
    for o in objs:
        o.select_set(True)
    bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = name
    return ob

# ------------------------------------------------------------- scene prep ----

scene = bpy.context.scene
if bpy.context.mode != "OBJECT":
    bpy.ops.object.mode_set(mode="OBJECT")
for _ob in scene.objects:
    _ob.hide_set(False)

body = bpy.data.objects["body"]
head = bpy.data.objects["head"]
neck = bpy.data.objects["neck"]
old_arm = bpy.data.objects["Icosphere"]
for ob in (body, head, neck, old_arm):
    apply_all(ob)
activate(old_arm)
bpy.ops.object.delete()

# ------------------------------------------------------------------ head -----

remesh(head, 0.017)
smooth(head, 0.5, 3)

activate(head)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.symmetrize(direction="POSITIVE_X")
bpy.ops.mesh.remove_doubles(threshold=0.001)
bpy.ops.object.mode_set(mode="OBJECT")

# heal the sculpt gashes around the mouth and nose base with a strong,
# locally-masked relax before carving fresh features
me = head.data
co, _ = get_np(me)
vg = head.vertex_groups.new(name="mouthfix")
def g_at(c, r):
    return np.exp(-((np.linalg.norm(co - np.array(c), axis=1)) / r) ** 2)
w = (g_at([0, -0.58, -0.55], 0.26)
     + 0.8 * g_at([-0.05, -0.62, -0.47], 0.13)
     + g_at([-0.06, -0.66, -0.45], 0.10)
     + g_at([0.06, -0.66, -0.45], 0.10))
w = np.clip(w, 0, 1)
w *= 1 - 0.9 * g_at([0, -0.70, -0.30], 0.14)   # protect the nose tip and bridge
for i, wi in enumerate(w):
    if wi > 0.02:
        vg.add([i], float(wi), "REPLACE")
smooth(head, 1.0, 30, vgroup="mouthfix")
vg = head.vertex_groups.get("mouthfix")
if vg is not None:
    head.vertex_groups.remove(vg)

# --- hair carved into the head mesh: raised scalp + lock grooves + hairline --
HC = np.array([0.0, 0.02, -0.05])
me = head.data
co, no = get_np(me)

# directional radius table so ridge arcs follow the real surface
rel = co - HC
rad = np.linalg.norm(rel, axis=1)
theta = np.arctan2(rel[:, 1], rel[:, 0])
phi = np.arcsin(np.clip(rel[:, 2] / np.maximum(rad, 1e-6), -1, 1))
NB_T, NB_P = 28, 14
rtab = {}
for t, p, r in zip(((theta + math.pi) / (2 * math.pi) * NB_T).astype(int) % NB_T,
                   ((phi + math.pi / 2) / math.pi * NB_P).astype(int).clip(0, NB_P - 1),
                   rad):
    k = (t, p)
    if k not in rtab or r > rtab[k]:
        rtab[k] = r

def surf_r(d):
    t = int((math.atan2(d[1], d[0]) + math.pi) / (2 * math.pi) * NB_T) % NB_T
    p = min(NB_P - 1, max(0, int((math.asin(max(-1, min(1, d[2]))) + math.pi / 2) / math.pi * NB_P)))
    for dt in (0, -1, 1, -2, 2):
        v = rtab.get(((t + dt) % NB_T, p))
        if v is not None:
            return v
    return 0.75

def on_surface(d, off=0.0):
    d = np.asarray(d, dtype=np.float64); d = d / np.linalg.norm(d)
    return HC + d * (surf_r(d) + off)

# hairline: high on the forehead, sweeping lower toward the nape,
# with slightly receded temples like the reference
hairline_z = 0.36 - 0.80 * smoothstep(-0.60, 0.75, co[:, 1])
hairline_z += (0.08 * np.exp(-(((np.abs(co[:, 0]) - 0.45) / 0.16) ** 2))
               * smoothstep(0.15, 0.45, -co[:, 1]))
mask = smoothstep(0.0, 0.09, co[:, 2] - hairline_z)
# locks may spill slightly over the hairline so it doesn't read as a hat brim
mask_g = smoothstep(-0.10, 0.02, co[:, 2] - hairline_z)
# keep the ears clear
for s in (-1, 1):
    ear = np.array([s * 0.60, 0.10, -0.18])
    keep = 1 - 0.9 * np.exp(-((np.linalg.norm(co - ear, axis=1)) / 0.28) ** 2)
    mask *= keep
    mask_g *= keep
# keep the face clear no matter what (front cone)
facecl = 1 - smoothstep(-0.35, -0.60, co[:, 1]) * (1 - smoothstep(0.30, 0.45, co[:, 2]))
mask *= facecl
mask_g *= facecl

BUN_DIR = np.array([0.0, 0.40, 0.90]); BUN_DIR /= np.linalg.norm(BUN_DIR)

def slerp(a, b, t):
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b)
    o = math.acos(max(-1, min(1, float(np.dot(a, b)))))
    if o < 1e-4:
        return a
    return (math.sin((1 - t) * o) * a + math.sin(t * o) * b) / math.sin(o)

# uneven scalp raise: broad waves so it reads as a hair mass, not a beanie
raise_arr = 0.068 * (1 + 0.16 * np.sin(theta * 4 + 1.2) * np.cos(phi * 3))

grooves = np.zeros(len(me.vertices))
n_grooves = 44
for gi in range(n_grooves):
    ang = (gi / (n_grooves - 1) - 0.5) * 2 * math.pi * 0.98
    # start BELOW the hairline: the strict mask clips whatever crosses onto the
    # face, and the channels then cover the whole hair band evenly
    zdir = 0.26 - 1.10 * (1 - math.cos(ang)) / 2      # front high, nape low
    sd = np.array([math.sin(ang), -math.cos(ang) * 0.9, zdir])
    wob = random.uniform(0, 6.28)
    pts = []
    for k in range(61):     # dense sampling: sparse points punch dimples, not channels
        t = k / 60
        d = slerp(sd, BUN_DIR, t ** 0.9)
        perp = np.cross(d, BUN_DIR)
        nl = np.linalg.norm(perp)
        if nl > 1e-3:
            perp /= nl
        # the polyline must lie ON the pre-displacement surface: the gaussian is
        # evaluated against original vertex positions, not the raised scalp
        pts.append(on_surface(d, 0.0) + perp * 0.05 * math.sin(t * 6 + wob))
    ridge(co, grooves, pts, -1.0, 0.035)
grooves = np.clip(grooves, -1.0, 0)   # overlapping grooves don't dig deeper
disp = (raise_arr + 0.034 * grooves) * mask
co = co + no * disp[:, None]
set_np(me, co)

# ------- facial features (recompute surface after the scalp changed) ---------
me = head.data
front = front_surface(me, 0.07)
co, no = get_np(me)
disp = np.zeros(len(me.vertices))

def face_pt(x, z, inset=0.0):
    return np.array([x, front(x, z) + inset, z])

EYE_X, EYE_Z = 0.215, -0.06
for s in (-1, 1):
    E = face_pt(s * EYE_X, EYE_Z)
    u = np.array([1.0, 0.42 * s, 0.0]); u /= np.linalg.norm(u)
    v = np.array([0.0, -0.12, 1.0]);   v /= np.linalg.norm(v)
    dot_(co, disp, E, +0.020, 0.058)                 # eyeball
    dot_(co, disp, E + 0.135 * u, -0.008, 0.032)     # outer corner
    dot_(co, disp, E - 0.135 * u, -0.008, 0.032)     # inner corner
    ts = np.linspace(0.12 * math.pi, 0.88 * math.pi, 26)
    ridge(co, disp, [E + 0.010 * v + 0.128 * math.cos(t) * u + 0.080 * math.sin(t) * v for t in ts],
          +0.026, 0.028)                             # upper lid roll
    ts = np.linspace(0.30 * math.pi, 0.70 * math.pi, 14)
    ridge(co, disp, [E + 0.012 * v + 0.112 * math.cos(t) * u + 0.062 * math.sin(t) * v for t in ts],
          -0.010, 0.011)                             # shadow under the lid overhang (top arc only)
    ts = np.linspace(1.10 * math.pi, 1.90 * math.pi, 26)
    ridge(co, disp, [E - 0.012 * v + 0.115 * math.cos(t) * u + 0.055 * math.sin(t) * v for t in ts],
          +0.015, 0.026)                             # lower lid
    ts = np.linspace(0, 2 * math.pi, 22)
    ridge(co, disp, [E + 0.040 * math.cos(t) * u + 0.040 * math.sin(t) * v for t in ts],
          -0.016, 0.016)                             # incised iris
    dot_(co, disp, E, -0.018, 0.024)                 # pupil
    B = E + 0.125 * v
    ts = np.linspace(0.10 * math.pi, 0.95 * math.pi, 26)
    ridge(co, disp, [B + 0.170 * math.cos(t) * u + 0.070 * math.sin(t) * v for t in ts],
          +0.034, 0.048)                             # brow

# nose: straighten the bridge, firm the tip, define the wings
bridge = [face_pt(0.0, z, 0.0) for z in np.linspace(0.02, -0.30, 10)]
ridge(co, disp, bridge, +0.010, 0.050)
dot_(co, disp, face_pt(0.0, -0.335), +0.012, 0.052)             # tip
for s in (-1, 1):
    dot_(co, disp, face_pt(s * 0.095, -0.385), +0.009, 0.035)   # nostril wing
    dot_(co, disp, face_pt(s * 0.048, -0.425), -0.006, 0.016)   # nostril incision

# lips
M = face_pt(0.0, -0.52)
lu = np.array([1.0, 0.0, 0.0])
lv = np.array([0.0, -0.10, 1.0]); lv /= np.linalg.norm(lv)
xs = np.linspace(-0.14, 0.14, 24)
ridge(co, disp, [M + x * lu + (0.030 - 1.5 * x * x) * lv for x in xs], +0.016, 0.036)
ridge(co, disp, [M + x * lu + (-0.048 + 1.2 * x * x) * lv for x in xs * 0.82], +0.018, 0.042)
ridge(co, disp, [M + x * lu + (-0.009 - 0.8 * x * x) * lv for x in xs * 0.92], -0.012, 0.016)
ridge(co, disp, [M + (0.034 + 0.05 * t) * lv for t in np.linspace(0, 1, 8)], -0.005, 0.022)

# goatee mass + cheekbones
dot_(co, disp, face_pt(0.0, -0.73), +0.018, 0.11)
for s in (-1, 1):
    dot_(co, disp, face_pt(s * 0.40, -0.14, 0.02), +0.008, 0.15)

set_np(me, co + no * disp[:, None])

# lock in perfect symmetry after all the carving
activate(head)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.symmetrize(direction="POSITIVE_X")
bpy.ops.object.mode_set(mode="OBJECT")
shade_smooth(head)

# ------------------------------------------------------------------- bun -----

BUN = on_surface(BUN_DIR, 0.09)
ax = BUN_DIR
a1 = np.cross(ax, np.array([1.0, 0, 0])); a1 /= np.linalg.norm(a1)
a2 = np.cross(ax, a1)
bun_parts = []
coils = [(0.27, 0.00), (0.235, 0.075), (0.185, 0.145), (0.115, 0.205)]
for ci, (rr, lift) in enumerate(coils):
    pts, radii = [], []
    for k in range(20):
        t = k / 19
        a = t * 2 * math.pi + ci * 1.3
        p = (BUN + ax * (lift + 0.015 * math.sin(a * 3 + ci))
             + rr * math.cos(a) * a1 + rr * math.sin(a) * a2)
        pts.append(p)
        radii.append(1.0 + 0.18 * math.sin(a * 5 + ci * 2))
    ob = new_curve_obj(f"coil_{ci}", pts, radii, bevel=0.075, resolution=16)
    cu = ob.data.splines[0]
    cu.use_cyclic_u = True
    bun_parts.append(curve_to_mesh(ob))
bun = join(bun_parts, "bun")     # left un-remeshed: the coils should read as wraps
shade_smooth(bun)

# ------------------------------------------------------------------ neck -----

remesh(neck, 0.03)
smooth(neck, 0.5, 2)
# fatten and pull forward: the original neck is too skinny and too far back
# to bridge the jaw and the collar
me = neck.data
co, no = get_np(me)
set_np(me, co + no * 0.05 + np.array([0.0, -0.12, 0.04]))
shade_smooth(neck)

# ------------------------------------------------------------ body drapery ---

remesh(body, 0.045)
smooth(body, 0.4, 1)
me = body.data
bfront = front_surface(me, 0.10)
bback = back_surface(me, 0.10)
co, no = get_np(me)
disp = np.zeros(len(me.vertices))

for zk, sag, amp, xw in ((-1.75, 0.20, 0.028, 1.05), (-2.10, 0.30, 0.034, 1.15),
                         (-2.50, 0.40, 0.036, 1.10), (-2.95, 0.34, 0.030, 1.00)):
    xs = np.linspace(-xw, xw, 40)
    pts = [(x, bfront(x, zk - sag * (1 - (x / xw) ** 2)) - 0.01,
            zk - sag * (1 - (x / xw) ** 2)) for x in xs]
    ridge(co, disp, pts, amp, 0.055)

for k, amp in ((0.0, 0.030), (0.28, 0.024), (0.55, 0.020)):
    ts = np.linspace(0, 1, 30)
    pts = [((0.95 - 1.9 * t), bfront(0.95 - 1.9 * t, -1.35 - 1.3 * t - k) - 0.01,
            -1.35 - 1.3 * t - k) for t in ts]
    ridge(co, disp, pts, amp, 0.05)

for xk, amp in ((-1.25, 0.034), (-0.70, 0.030), (-0.12, 0.036), (0.50, 0.030), (1.05, 0.032)):
    zs = np.linspace(-2.75, -3.95, 26)
    pts = [(xk + 0.08 * math.sin(z * 3.1), bfront(xk, z) - 0.01, z) for z in zs]
    ridge(co, disp, pts, amp, 0.065)

# hood: rim around the nape + two soft cascade folds
ts = np.linspace(-1.35, 1.35, 36)
pts = [(math.sin(t) * 0.95, bback(math.sin(t) * 0.95, -1.05 - 0.35 * abs(t)) + 0.01,
        -1.05 - 0.35 * abs(t)) for t in ts]
ridge(co, disp, pts, 0.055, 0.085)
for zk, sag, amp in ((-1.60, 0.28, 0.026), (-2.10, 0.36, 0.024)):
    xs = np.linspace(-0.85, 0.85, 30)
    pts = [(x, bback(x, zk - sag * (1 - (x / 0.85) ** 2)) + 0.01,
            zk - sag * (1 - (x / 0.85) ** 2)) for x in xs]
    ridge(co, disp, pts, amp, 0.06)

# kangaroo pocket
xs = np.linspace(-0.85, 0.85, 26)
pts = [(x, bfront(x, -3.15) - 0.01, -3.15 - 0.05 * (x / 0.85) ** 2) for x in xs]
ridge(co, disp, pts, -0.022, 0.035)
for s in (-1, 1):
    ts = np.linspace(0, 1, 12)
    pts = [(s * (0.85 + 0.12 * t), bfront(s * 0.9, -3.2 - 0.5 * t) - 0.01, -3.15 - 0.55 * t) for t in ts]
    ridge(co, disp, pts, -0.018, 0.04)

set_np(me, co + no * disp[:, None])
smooth(body, 0.3, 2)

# relax the leftover sculpt crease on the left shoulder
co2, _ = get_np(body.data)
vg = body.vertex_groups.new(name="shoulderfix")
wv = np.exp(-((np.linalg.norm(co2 - np.array([-0.75, 0.15, -1.00]), axis=1)) / 0.40) ** 2)
for i, wi in enumerate(wv):
    if wi > 0.05:
        vg.add([i], float(wi), "REPLACE")
smooth(body, 0.8, 12, vgroup="shoulderfix")
vg = body.vertex_groups.get("shoulderfix")
if vg is not None:
    body.vertex_groups.remove(vg)
shade_smooth(body)

activate(body)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.bisect(plane_co=(0, 0, -3.88), plane_no=(0, 0, 1),
                    clear_inner=True, use_fill=True)
bpy.ops.object.mode_set(mode="OBJECT")

# refresh the front lookup AFTER displacement so attachments sit on the surface
bfront = front_surface(body.data, 0.10)

# ------------------------------------------------- hoodie neckline / collar --

pts, radii = [], []
NECK_C = np.array([0.0, 0.18])
for k in range(41):
    a = (k / 40 - 0.5) * 2 * math.pi          # 0 = front
    r = 0.52 + 0.05 * abs(math.sin(a))
    x = r * math.sin(a) * 1.10
    y = NECK_C[1] - 0.06 - r * math.cos(a)
    z = -1.34 + 0.36 * ((1 - math.cos(a)) / 2) ** 1.1 - 0.10 * math.exp(-((a / 0.45) ** 2))
    pts.append((x, y, z))
    radii.append(1.0 + 0.25 * (1 - math.cos(a)) / 2)   # thicker toward the hood
collar = new_curve_obj("collar", pts, radii, bevel=0.14, resolution=20)
collar.data.splines[0].use_cyclic_u = True
collar = curve_to_mesh(collar)
collar.name = "collar"
shade_smooth(collar)

# --------------------------------------------------------------- drawstrings -

string_objs = []
for s in (-1, 1):
    pts, radii = [], []
    for k in range(12):
        t = k / 11
        z = -1.70 - 0.80 * t
        x = s * (0.13 + 0.05 * math.sin(t * 5 + s))
        # barely proud of the surface so the cords read as carved-attached
        pts.append((x, bfront(x, z) - 0.005, z))
        radii.append(1.0)
    ob = new_curve_obj(f"string_{s}", pts, radii, bevel=0.026, resolution=16)
    m = curve_to_mesh(ob)
    string_objs.append(m)
    end = np.array(pts[-1]); prev = np.array(pts[-2])
    d = end - prev; d /= np.linalg.norm(d)
    rot = Vector(d).to_track_quat("Z", "Y").to_euler()
    bpy.ops.mesh.primitive_cylinder_add(radius=0.030, depth=0.15,
                                        location=tuple(end + d * 0.07), rotation=tuple(rot))
    string_objs.append(bpy.context.view_layer.objects.active)
strings = join(string_objs, "strings")
shade_smooth(strings)

# ------------------------------------------------------------------- arm -----

S = np.array([0.92, 0.10, -1.20])
E = np.array([1.52, -0.02, -2.52])
W = np.array([1.30, -0.58, -1.55])

def bend_path(a, b, c, n1=7, n2=7):
    pts = [a + (b - a) * (k / n1) for k in range(n1)]
    pts += [b + (c - b) * (k / n2) for k in range(n2 + 1)]
    return pts

pts = bend_path(S, E, W)
L = len(pts)
radii = []
for i, p in enumerate(pts):
    t = i / (L - 1)
    base = 0.30 - 0.13 * t
    fold = 1.0 + 0.10 * math.sin(t * 22)
    bunch = 1.0 + 0.16 * math.exp(-((t - 0.5) / 0.10) ** 2)
    radii.append(base * fold * bunch / 0.30)
arm = new_curve_obj("armsleeve", pts, radii, bevel=0.30, resolution=32)
arm = curve_to_mesh(arm)
remesh(arm, 0.035)
smooth(arm, 0.4, 1)
arm.name = "arm"
shade_smooth(arm)

wd = (W - E); wd = wd / np.linalg.norm(wd)
rot = Vector(wd).to_track_quat("Z", "Y").to_euler()
bpy.ops.mesh.primitive_torus_add(location=tuple(W), major_radius=0.155,
                                 minor_radius=0.05, rotation=tuple(rot),
                                 major_segments=32, minor_segments=12)
cuff = bpy.context.view_layer.objects.active
cuff.name = "cuff"
shade_smooth(cuff)

F = W + wd * 0.20
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.19, location=tuple(F), segments=24, ring_count=16)
fist = bpy.context.view_layer.objects.active
fist.scale = (0.95, 1.0, 1.18)
apply_all(fist)
hand = fist
hand.name = "hand"
remesh(hand, 0.03)
smooth(hand, 0.4, 1)
shade_smooth(hand)

# ------------------------------------------------------------------- mug -----

bpy.ops.wm.obj_import(filepath="/home/zyguythearchguy/code/web-v2/src/three/data/mug.obj")
mug = bpy.context.view_layer.objects.active
mug.name = "mug"
apply_all(mug)
me = mug.data
co, _ = get_np(me)
ctr = (co.min(axis=0) + co.max(axis=0)) / 2
co -= ctr
h = co[:, 2].max() - co[:, 2].min()
co *= 0.52 / max(h, 1e-6)
set_np(me, co)
mug.location = (float(F[0]) - 0.02, float(F[1]) - 0.06, float(F[2]) + 0.34)
mug.rotation_euler = (0, 0, math.radians(35))
apply_all(mug)
shade_smooth(mug)

# ------------------------------------------------------------------ socle ----

bpy.ops.mesh.primitive_cylinder_add(radius=0.62, depth=0.30, location=(-0.25, 0.28, -4.03), vertices=48)
stem = bpy.context.view_layer.objects.active
bpy.ops.mesh.primitive_cylinder_add(radius=1.05, depth=0.16, location=(-0.25, 0.28, -4.26), vertices=64)
plate = bpy.context.view_layer.objects.active
socle = join([stem, plate], "socle")
shade_smooth(socle)

# --------------------------------------------------------------- material ----

mat = bpy.data.materials.new("M_Marble")
mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.78, 0.74, 0.66, 1.0)
bsdf.inputs["Roughness"].default_value = 0.42
noise = nt.nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 9.0
noise.inputs["Detail"].default_value = 4.0
bump = nt.nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.06
nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

parts = [body, head, neck, bun, collar, strings, arm, cuff, hand, mug, socle]
for ob in parts:
    ob.data.materials.clear()
    ob.data.materials.append(mat)

stat_col = bpy.data.collections.new("Statue")
scene.collection.children.link(stat_col)
for ob in parts:
    for c in list(ob.users_collection):
        c.objects.unlink(ob)
    stat_col.objects.link(ob)

bpy.ops.wm.save_as_mainfile(filepath=OUT)
print("SAVED", OUT)
