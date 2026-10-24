import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { cabinetButtons, joystickDirection } from '../apps/arcade/src/cabinet-input.js';

test('red Z/X caps, smaller Reset, and slightly left-shifted joystick match the cabinet', () => {
  assert.equal(cabinetButtons.find(button => button.action === 'menu').label, 'Reset: Q Menu');
  const bytes = readFileSync(new URL('../apps/arcade/public/model9.glb', import.meta.url));
  const model = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
  const buttons = ['Cylinder.006', 'Cylinder.007', 'CabinetQuit'].map(name => model.nodes.find(node => node.name === name));
  for (const [index, label] of ['Z', 'X', 'RESET'].entries()) {
    const cap = model.nodes[buttons[index].children[0]];
    assert.equal(cap.extras?.label, label);
    const material = model.materials[model.meshes[cap.mesh].primitives[0].material];
    const color = material.pbrMetallicRoughness.baseColorFactor;
    assert.ok(color[0] > color[1] * 4 && color[0] > color[2] * 4);
    assert.ok(color[0] > 0.35 && color[1] < 0.01 && color[2] < 0.01, 'Caps use saturated red');
    assert.equal(material.extensions?.KHR_materials_unlit, undefined, 'Raised caps respond to scene lighting');
    assert.ok(material.pbrMetallicRoughness.roughnessFactor < 0.3, 'Caps have a glossy finish');
    const lip = model.materials[model.meshes[buttons[index].mesh].primitives[0].material].pbrMetallicRoughness.baseColorFactor;
    assert.ok(lip[0] > lip[1] * 4 && lip[0] > lip[2] * 4, 'Base lip is red rather than a black border');
    assert.deepEqual(color, lip, 'Button face matches the red base lip');
    assert.equal(cap.extras.fontWeight, 'regular');
    const lettering = model.materials[model.meshes[cap.mesh].primitives[1].material].pbrMetallicRoughness.baseColorFactor;
    assert.deepEqual(lettering, [0, 0, 0, 1], 'Lettering is fully black');
  }
  const radii = buttons.map(node => model.accessors[model.meshes[model.nodes[node.children[0]].mesh].primitives[0].attributes.POSITION].max[0] * node.scale[0]);
  assert.ok(radii[2] < radii[0] * 0.75);
  assert.ok(radii[0] > 0.08 && radii[1] > 0.08, 'Z and X have larger physical caps');
  assert.equal(model.nodes.find(node => node.name === 'Cylinder.005').translation[0], 0.5214116621017456);
  assert.equal(model.nodes.find(node => node.name === 'Cylinder.008').translation[0], 0.5194262313842773,
    'The fixed joystick base shifts with the shaft and ball');
  const stick = model.nodes.find(node => node.name === 'Cylinder.005');
  const ball = model.accessors[model.meshes[stick.mesh].primitives[1].attributes.POSITION];
  assert.ok(ball.max[0] * stick.scale[0] > 0.075, 'Joystick ball scales with the larger buttons');
  const glow = model.materials.find(material => material.name === 'Soft red control glow');
  assert.equal(glow?.alphaMode, 'BLEND');
  assert.ok(model.materials.find(material => material.name === 'Glossy saturated red button caps').emissiveFactor[0] > 0);
});

test('joystick dead zone and dominant axis produce four-direction movement', () => {
  for (const [dx, dy, expected] of [
    [0, 0, null], [4, 4, null], [7.9, 0, null], [8, 0, 'right'],
    [30, 5, 'right'], [-30, 5, 'left'], [5, -30, 'up'], [5, 30, 'down'],
    [20, 20, 'down'], [-20, -20, 'up'],
  ]) assert.equal(joystickDirection(dx, dy), expected, `${dx}, ${dy}`);
});

test('cabinet model has only Z, X and Q in a row visible from the original camera', () => {
  const bytes = readFileSync(new URL('../apps/arcade/public/model9.glb', import.meta.url));
  const model = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  const active = model.scenes[model.scene || 0].nodes.map(index => model.nodes[index]);
  const buttons = active.filter(node => node.name !== 'Cylinder.005' && node.name !== 'Cylinder.008' && node.name !== 'Cube');
  assert.deepEqual(buttons.map(node => node.name), ['Cylinder.006', 'Cylinder.007', 'CabinetQuit']);
  const camera = new PerspectiveCamera(50, 1280 / 720, 0.1, 2000);
  camera.position.set(0, 3, 3);
  camera.lookAt(0, 1, 1);
  camera.updateMatrixWorld();
  for (let i = 0; i < buttons.length; i++) {
    const [x, y, z] = buttons[i].translation;
    assert.equal(y, buttons[0].translation[1]);
    assert.equal(z, buttons[0].translation[2]);
    if (i) assert.ok(x > buttons[i - 1].translation[0]);
    const cap = model.nodes[buttons[i].children[0]];
    assert.equal(cap.name, buttons[i].name.replaceAll('.', '') + 'Cap');
    assert.notEqual(cap.mesh, buttons[i].mesh, 'Cap presses independently of its collar');
    const point = new Vector3(x, y - 2, z)
      .add(new Vector3(0, 0.025, 0).applyQuaternion(new Quaternion(...buttons[i].rotation))).project(camera);
    assert.ok(Math.abs(point.x) < 1 - 44 / 1280);
    assert.ok(Math.abs(point.y) < 1 - 44 / 720);
  }
  const stick = model.nodes.find(node => node.name === 'Cylinder.005');
  const knob = new Vector3(...stick.translation);
  knob.y -= 2;
  knob.add(new Vector3(0, 0.225, 0).applyQuaternion(new Quaternion(...stick.rotation)));
  knob.project(camera);
  const row = new Vector3(...buttons[0].translation);
  row.y -= 2;
  row.add(new Vector3(0, 0.046 * 1.25, 0).applyQuaternion(new Quaternion(...buttons[0].rotation)));
  row.project(camera);
  assert.ok(Math.abs(row.y - knob.y) < 0.001, 'Joystick ball aligns vertically with the button faces');
});
