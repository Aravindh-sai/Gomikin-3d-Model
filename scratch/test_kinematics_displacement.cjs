const fs = require('fs');
const THREE = require('three');

const data = JSON.parse(fs.readFileSync('scratch/cad_mechanical_audit.json', 'utf8'));
const { components } = data;

console.log('========================================================================');
console.log('KINEMATIC ORBIT DISPLACEMENT TEST (CURRENT ANIMATION VS TRUE PIVOT)');
console.log('========================================================================\n');

// Test what happens when rotating the mesh as currently implemented in physicalFlowController.js
function testCurrentRotation(name, rotEuler) {
  const c = components[name];
  if (!c) return;

  const root = new THREE.Group();
  root.rotation.x = -Math.PI / 2;
  root.scale.set(0.001, 0.001, 0.001);

  const parent = new THREE.Object3D();
  root.add(parent);

  const mesh = new THREE.Mesh();
  mesh.scale.set(10, 10, 10);
  parent.add(mesh);

  const localCenter = new THREE.Vector3(c.localBox.center.x, c.localBox.center.y, c.localBox.center.z);

  // Initial world position of geometry center
  root.updateMatrixWorld(true);
  const initialWorldCenter = localCenter.clone().applyMatrix4(mesh.matrixWorld);

  // Apply rotation
  mesh.rotation.copy(rotEuler);
  mesh.updateMatrixWorld(true);
  const rotatedWorldCenter = localCenter.clone().applyMatrix4(mesh.matrixWorld);

  const displacement = initialWorldCenter.distanceTo(rotatedWorldCenter);

  console.log(`COMPONENT: ${name}`);
  console.log(`  Applied Rotation: (${THREE.MathUtils.radToDeg(rotEuler.x).toFixed(1)}°, ${THREE.MathUtils.radToDeg(rotEuler.y).toFixed(1)}°, ${THREE.MathUtils.radToDeg(rotEuler.z).toFixed(1)}°)`);
  console.log(`  Initial World Center: (${initialWorldCenter.x.toFixed(4)}, ${initialWorldCenter.y.toFixed(4)}, ${initialWorldCenter.z.toFixed(4)}) m`);
  console.log(`  Rotated World Center: (${rotatedWorldCenter.x.toFixed(4)}, ${rotatedWorldCenter.y.toFixed(4)}, ${rotatedWorldCenter.z.toFixed(4)}) m`);
  console.log(`  Displacement of Center: ${(displacement * 1000).toFixed(1)} mm`);
  if (displacement > 0.005) {
    console.log(`  ⚠ SEVERE KINEMATIC DEFECT: Geometry center translates by ${(displacement * 1000).toFixed(1)} mm instead of rotating in place!`);
  } else {
    console.log(`  ✓ Rotates around its geometric center in place.`);
  }
  console.log('');
}

// 1. rotating_base in Organic (tilt 30 deg on Z)
testCurrentRotation('rotating_base', new THREE.Euler(0, 0, THREE.MathUtils.degToRad(30)));

// 2. rotating_base in Inorganic (rot.x +25, rot.z -25)
testCurrentRotation('rotating_base', new THREE.Euler(THREE.MathUtils.degToRad(25), 0, THREE.MathUtils.degToRad(-25)));

// 3. cutting_blades (spin 90 deg on Z)
testCurrentRotation('cutting_blades', new THREE.Euler(0, 0, Math.PI / 2));

// 4. door_mechanism_left (rot.y - 45 deg)
testCurrentRotation('door_mechanism_left', new THREE.Euler(0, THREE.MathUtils.degToRad(-45), 0));

// 5. door_mechanism_right (rot.y + 45 deg)
testCurrentRotation('door_mechanism_right', new THREE.Euler(0, THREE.MathUtils.degToRad(45), 0));

// 6. leftover_food_closur (rot.x - 55 deg)
testCurrentRotation('leftover_food_closur', new THREE.Euler(THREE.MathUtils.degToRad(-55), 0, 0));

// 7. agitator (spin 90 deg on Z)
testCurrentRotation('agitator', new THREE.Euler(0, 0, Math.PI / 2));
