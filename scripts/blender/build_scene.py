"""Run in Blender with the original cabinet open to rebuild the arcade surround."""

import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
assert not bpy.data.collections.get('After Hours'), 'Open the original cabinet before rebuilding'
collection = bpy.data.collections.new('After Hours')
bpy.context.scene.collection.children.link(collection)


def material(name, color, emission=0, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = 0.65
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Emission Color'].default_value = (*color, 1)
    shader.inputs['Emission Strength'].default_value = emission
    return mat


ink = material('AH / midnight', (0.018, 0.026, 0.05))
panel = material('AH / blue graphite', (0.043, 0.066, 0.095), metallic=0.25)
cyan = material('AH / ice neon', (0.08, 0.85, 1), emission=2.2)
pink = material('AH / hot coral', (1, 0.055, 0.24), emission=2.2)
white = material('AH / lettering', (0.6, 0.83, 0.88), emission=0.5)
rubber = material('AH / rubber', (0.009, 0.012, 0.02))


def own(obj, mat):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def box(name, location, size, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    own(obj, mat)
    if bevel:
        modifier = obj.modifiers.new('Small edge highlights', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 1
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def text(name, body, location, size, mat):
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.align_x = 'CENTER'
    curve.size = size
    curve.space_character = 1.15
    curve.extrude = 0
    curve.resolution_u = 2
    obj = bpy.data.objects.new(name, curve)
    collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (math.pi / 2, 0, 0)
    obj.data.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    return obj


# All geometry uses Blender Z-up, at the cabinet's original floor height.
box('Floating plinth', (0, -1.2, -0.27), (13, 10, 0.4), ink, 0.08)
for x in range(-6, 7):
    box('Floor seam', (x, -1.2, -0.062), (0.014, 9.8, 0.008), panel)
for y in range(-6, 4):
    box('Floor seam', (0, y, -0.06), (12.8, 0.014, 0.008), panel)
box('Front cyan edge', (-3.2, -6.18, -0.17), (6.25, 0.025, 0.035), cyan)
box('Front coral edge', (3.2, -6.18, -0.17), (6.25, 0.025, 0.035), pink)
box('Rear wall', (0, 2.8, 3.25), (13, 0.25, 6.6), ink, 0.04)
box('Left return', (-6.4, 0.9, 2.1), (0.22, 3.7, 4.3), panel, 0.04)
box('Right return', (6.4, 0.9, 2.1), (0.22, 3.7, 4.3), panel, 0.04)
for x in [-5.9, -5.35, -4.8, -4.25, 4.25, 4.8, 5.35, 5.9]:
    box('Wall rib', (x, 2.61, 3.1), (0.075, 0.12, 5.9), panel)
box('Portal recess', (0, 2.6, 2.7), (5.3, 0.12, 5.4), panel, 0.05)
for x, mat in [(-2.68, cyan), (2.68, pink)]:
    box('Portal upright', (x, 2.48, 2.7), (0.05, 0.06, 5.45), mat)
    box('Portal foot', (x, 0.2, -0.037), (0.05, 4.6, 0.022), mat)
box('Portal crown', (0, 2.48, 5.42), (5.4, 0.06, 0.05), cyan)
text('Main sign', 'AFTER HOURS', (0, 2.37, 5.78), 0.48, white)
text('Sign subtitle', 'A R C A D E   /   0 1', (0, 2.37, 5.52), 0.12, cyan)
text('Left wayfinding', '01', (-4.6, 2.4, 4.45), 0.68, cyan)
text('Left caption', 'PLAYER ONE', (-4.6, 2.4, 4.13), 0.16, white)
text('Right wayfinding', '24/7', (4.6, 2.4, 4.45), 0.55, pink)
text('Right caption', 'STAY CURIOUS', (4.6, 2.4, 4.13), 0.14, white)

# Two low-poly speaker stacks with neon rings, no texture downloads.
for x, mat in [(-4.35, cyan), (4.35, pink)]:
    box('Speaker enclosure', (x, 1.45, 1.18), (1.05, 0.7, 2.45), panel, 0.07)
    box('Speaker face', (x, 1.075, 1.18), (0.91, 0.04, 2.2), rubber, 0.025)
    for z, radius in [(0.7, 0.34), (1.65, 0.25)]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=radius, depth=0.035,
                                           location=(x, 1.035, z), rotation=(math.pi / 2, 0, 0))
        own(bpy.context.object, ink)
        bpy.ops.mesh.primitive_torus_add(major_segments=24, minor_segments=4,
                                       major_radius=radius, minor_radius=0.012,
                                       location=(x, 1.005, z), rotation=(math.pi / 2, 0, 0))
        own(bpy.context.object, mat)
    for offset in [-0.22, 0, 0.22]:
        box('Speaker status', (x + offset, 1.025, 2.13), (0.1, 0.025, 0.025), mat)

# Pool of graphic stripes around the cabinet keeps the foreground open.
for x, mat in [(-3.4, cyan), (3.4, pink)]:
    for y in [-3.7, -3.35, -3]:
        stripe = box('Floor direction mark', (x, y, -0.035), (0.45, 0.075, 0.012), mat)
        stripe.rotation_euler.z = -0.35 if x < 0 else 0.35

# Merge by material: six draw calls instead of one for every decorative piece.
for mat in [ink, panel, cyan, pink, white, rubber]:
    objects = [obj for obj in collection.objects if obj.type == 'MESH' and obj.data.materials[0] == mat]
    if not objects:
        continue
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    objects[0].name = mat.name

bpy.ops.object.select_all(action='DESELECT')
for obj in collection.objects:
    obj.select_set(True)
triangles = sum(len(p.vertices) - 2 for obj in collection.objects for p in obj.data.polygons)
assert triangles < 15000, f'Environment triangle budget exceeded: {triangles}'
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'apps/arcade/public/arcade-room.glb'),
                          export_format='GLB', use_selection=True, export_cameras=False,
                          export_lights=False, export_animations=False)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.render.resolution_x = 1500
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
scene.world.color = (0.08, 0.08, 0.08)
camera = scene.camera
camera.location = (8.8, -13.5, 9)
camera.rotation_euler = (Vector((0, 0, 2.1)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'PERSP'
camera.data.lens = 40
for name, position, color, energy, size in [
    ('Softbox', (1, -4, 8), (0.7, 0.85, 1), 1800, 7),
    ('Cyan wash', (-5, -0.5, 4), (0.05, 0.7, 1), 900, 4),
    ('Coral wash', (5, 0, 4), (1, 0.04, 0.18), 1100, 4),
]:
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.color, data.shape, data.size = energy, color, 'DISK', size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector((0, 0, 1.5)) - obj.location).to_track_quat('-Z', 'Y').to_euler()

scene.render.filepath = str(ROOT / '.local-backups/arcade-room-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'assets/blender/after-hours.blend'))
print(f'After Hours: {triangles} environment triangles')
