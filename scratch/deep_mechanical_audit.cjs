const fs = require('fs');
const THREE = require('three');

const data = JSON.parse(fs.readFileSync('scratch/cad_mechanical_audit.json', 'utf8'));
const { components, clearances } = data;

console.log('========================================================================');
console.log('GOMIKIN PHASE 2.0: DEEP MECHANICAL KINEMATICS & RELATIONSHIP AUDIT');
console.log('========================================================================\n');

// 1. Moving components detailed analysis
const movingDefs = [
  {
    key: 'rotating_base',
    intendedFunction: '1-side lifting/tilting platform (Embodiment B) directly below funnel to guide classified waste into 180° Organic cutting bay or 90° Inorganic shaft.',
    currentAnim: 'Organic: baseRot.z + 30° [0.22-0.35]. Inorganic: baseRot.x + 25°, baseRot.z - 25° [0.35-0.50].',
  },
  {
    key: 'cutting_blades',
    intendedFunction: 'High-speed rotary shear blades inside organic cutting collar to shred organic solids against sizing mesh.',
    currentAnim: 'Organic: baseRot.z + u * 18*PI [0.35-0.48]. Leftover: static. Inorganic: static.',
  },
  {
    key: 'door_mechanism_left',
    intendedFunction: 'Center-hinged drop door (+Z quadrant of 180° organic storage base) swinging downward to drop drained batch into decomposition vessel.',
    currentAnim: 'Organic: baseRot.y - sin(u*PI)*45° [0.72-0.86].',
  },
  {
    key: 'door_mechanism_right',
    intendedFunction: 'Center-hinged drop door (-Z quadrant of 180° organic storage base) swinging downward in symmetry with left door.',
    currentAnim: 'Organic: baseRot.y + sin(u*PI)*45° [0.72-0.86].',
  },
  {
    key: 'leftover_food_closur',
    intendedFunction: 'Front-loading access door/ramp for cooked leftover food quadrant, bypassing top funnel.',
    currentAnim: 'Leftover Food: baseRot.x - 55° [0.0-0.25], holds open [0.25-0.55], closes [0.55-0.75].',
  },
  {
    key: 'agitator',
    intendedFunction: 'Slow-speed helical/paddle agitator rotating continuously in decomposition chamber to mix, aerate, and convey curing compost.',
    currentAnim: 'Organic: baseRot.z + u * 12*PI [0.86-1.00].',
  }
];

function analyzeMovingMesh(def) {
  const c = components[def.key];
  if (!c) return;

  console.log(`========================================================================`);
  console.log(`MECHANISM: ${c.name} (${def.key})`);
  console.log(`========================================================================`);
  console.log(`Intended Function: ${def.intendedFunction}`);
  console.log(`Current Animation in physicalFlowController: ${def.currentAnim}`);
  console.log(`Parent Node: ${c.parentName} | USDZ Hierarchy: ${c.hierarchy.map(h => h.name).reverse().join(' -> ')}`);
  console.log(`Initial CAD Transforms:`);
  console.log(`  Position: (${c.initialPos.x}, ${c.initialPos.y}, ${c.initialPos.z})`);
  console.log(`  Rotation (Euler XYZ rad): (${c.initialRot.x}, ${c.initialRot.y}, ${c.initialRot.z})`);
  console.log(`  Scale: (${c.initialScale.x}, ${c.initialScale.y}, ${c.initialScale.z})`);
  console.log(`World Bounding Box (Assembled):`);
  console.log(`  Min: [${c.worldBox.min.x.toFixed(4)}, ${c.worldBox.min.y.toFixed(4)}, ${c.worldBox.min.z.toFixed(4)}] m`);
  console.log(`  Max: [${c.worldBox.max.x.toFixed(4)}, ${c.worldBox.max.y.toFixed(4)}, ${c.worldBox.max.z.toFixed(4)}] m`);
  console.log(`  Size [W, H, D]: [${(c.worldBox.size.x * 1000).toFixed(1)}, ${(c.worldBox.size.y * 1000).toFixed(1)}, ${(c.worldBox.size.z * 1000).toFixed(1)}] mm`);
  console.log(`  World Center: (${c.worldBox.center.x.toFixed(4)}, ${c.worldBox.center.y.toFixed(4)}, ${c.worldBox.center.z.toFixed(4)}) m`);

  // Reconstruct Three.js node hierarchy to test rotation effects
  const root = new THREE.Group();
  root.rotation.x = -Math.PI / 2;
  root.scale.set(0.001, 0.001, 0.001);

  const parent = new THREE.Object3D();
  root.add(parent);

  const mesh = new THREE.Mesh();
  mesh.scale.set(10, 10, 10);
  parent.add(mesh);

  // Local geo bounds
  const lCenter = new THREE.Vector3(c.localBox.center.x, c.localBox.center.y, c.localBox.center.z);

  console.log(`Local Geometry (USDZ units):`);
  console.log(`  Center: (${lCenter.x.toFixed(2)}, ${lCenter.y.toFixed(2)}, ${lCenter.z.toFixed(2)})`);
  console.log(`  Size: (${c.localBox.size.x.toFixed(2)}, ${c.localBox.size.y.toFixed(2)}, ${c.localBox.size.z.toFixed(2)})`);

  // Analyze Kinematic Pivot Discrepancy
  // In the Three.js USDZ setup, mesh.position is at local (0,0,0)
  const meshOriginInWorld = new THREE.Vector3(0, 0, 0);
  mesh.localToWorld(meshOriginInWorld);

  console.log(`Kinematic Axis & Pivot Analysis:`);
  console.log(`  Mesh Local Origin in World Space: (${meshOriginInWorld.x.toFixed(4)}, ${meshOriginInWorld.y.toFixed(4)}, ${meshOriginInWorld.z.toFixed(4)}) m`);
  const geomWorldCenter = new THREE.Vector3(c.worldBox.center.x, c.worldBox.center.y, c.worldBox.center.z);
  const pivotArmDist = meshOriginInWorld.distanceTo(geomWorldCenter);
  console.log(`  Distance between Mesh Origin (0,0,0) and Physical Geometry Center: ${(pivotArmDist * 1000).toFixed(1)} mm`);

  if (pivotArmDist > 0.005) {
    console.log(`  ⚠ CRITICAL PIVOT DEFECT: Mesh local origin does NOT coincide with component geometric center!`);
    console.log(`    Rotating mesh.rotation directly swings the geometry along an eccentric orbit of radius ${(pivotArmDist * 1000).toFixed(1)} mm!`);
  } else {
    console.log(`  ✓ Mesh origin aligns with geometric center within ${(pivotArmDist * 1000).toFixed(1)} mm.`);
  }

  // Axis mapping check
  const vX = new THREE.Vector3(1, 0, 0).applyEuler(root.rotation);
  const vY = new THREE.Vector3(0, 1, 0).applyEuler(root.rotation);
  const vZ = new THREE.Vector3(0, 0, 1).applyEuler(root.rotation);
  console.log(`\nAxis Mapping Check (USDZ -> Three.js World):`);
  console.log(`  Local X-axis -> World vector: (${vX.x.toFixed(2)}, ${vX.y.toFixed(2)}, ${vX.z.toFixed(2)})`);
  console.log(`  Local Y-axis -> World vector: (${vY.x.toFixed(2)}, ${vY.y.toFixed(2)}, ${vY.z.toFixed(2)})`);
  console.log(`  Local Z-axis -> World vector: (${vZ.x.toFixed(2)}, ${vZ.y.toFixed(2)}, ${vZ.z.toFixed(2)})`);

  console.log(`\nInterpenetration / Clearances with Mating Parts:`);
  const clr = clearances[def.key] || {};
  for (const [otherName, info] of Object.entries(clr)) {
    if (info.intersects) {
      console.log(`  - INTERSECTS with ${otherName}: Overlap dx=${(info.overlapSize.x*1000).toFixed(1)}mm, dy=${(info.overlapSize.y*1000).toFixed(1)}mm, dz=${(info.overlapSize.z*1000).toFixed(1)}mm`);
    } else if (info.gapDistance < 0.08) {
      console.log(`  - CLOSE PROXIMITY with ${otherName}: Gap = ${(info.gapDistance*1000).toFixed(1)} mm`);
    }
  }
  console.log('\n');
}

movingDefs.forEach(analyzeMovingMesh);

console.log('========================================================================');
console.log('SUMMARY TABLE OF ALL 33 COMPONENT ELEVATIONS (VERTICAL STACK Y)');
console.log('========================================================================\n');

const sortedByY = Object.values(components).sort((a, b) => b.worldBox.max.y - a.worldBox.max.y);
console.log('Name'.padEnd(34) + 'Y-Min (m)'.padEnd(12) + 'Y-Max (m)'.padEnd(12) + 'Height (mm)'.padEnd(14) + 'Center Y (m)'.padEnd(14) + 'Center X, Z (m)');
console.log('-'.repeat(95));
for (const c of sortedByY) {
  const hMm = ((c.worldBox.max.y - c.worldBox.min.y) * 1000).toFixed(1);
  console.log(
    c.name.padEnd(34) +
    c.worldBox.min.y.toFixed(3).padEnd(12) +
    c.worldBox.max.y.toFixed(3).padEnd(12) +
    hMm.padEnd(14) +
    c.worldBox.center.y.toFixed(3).padEnd(14) +
    `(${c.worldBox.center.x.toFixed(3)}, ${c.worldBox.center.z.toFixed(3)})`
  );
}
