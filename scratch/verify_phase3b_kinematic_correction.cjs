const THREE = require('three');

async function runKinematicVerification() {
  console.log('======================================================================');
  console.log('GOMIKIN PHASE 3B — LEFTOVER FOOD DOOR KINEMATIC GEOMETRIC VERIFICATION');
  console.log('======================================================================\n');

  const { createGomikinEnvelope } = await import('../src/components/envelope.js');
  const envelope = createGomikinEnvelope();
  envelope.updateMatrixWorld(true);

  // 1. Identify hierarchy elements
  const hLeft = envelope.getObjectByName('LeftoverFoodDoorHinge_Central');
  const hRight = envelope.getObjectByName('LeftoverFoodDoorHinge_Radial');
  const hRod = envelope.getObjectByName('LeftoverFoodDoorHinge_ChordRod');
  const doorPivot = envelope.getObjectByName('LeftoverFoodDoor_Pivot');
  const doorMesh = envelope.getObjectByName('LeftoverFoodAccessDoor');

  if (!hLeft || !hRight || !hRod || !doorPivot || !doorMesh) {
    throw new Error(`Hierarchy objects missing! hLeft:${!!hLeft}, hRight:${!!hRight}, hRod:${!!hRod}, doorPivot:${!!doorPivot}, doorMesh:${!!doorMesh}`);
  }

  // Authoritative physical hinge reference coordinates
  const pLeft_ref = new THREE.Vector3();
  const pRight_ref = new THREE.Vector3();
  hLeft.getWorldPosition(pLeft_ref);
  hRight.getWorldPosition(pRight_ref);

  const initialHingeDistance = pLeft_ref.distanceTo(pRight_ref);
  const hingeAxisUnit = new THREE.Vector3().subVectors(pRight_ref, pLeft_ref).normalize();

  console.log('--- AUTHORITATIVE PHYSICAL HINGE POSITIONS ---');
  console.log(`Left Hinge (Central Divider):  X = ${(pLeft_ref.x*1000).toFixed(3)} mm, Y = ${(pLeft_ref.y*1000).toFixed(3)} mm, Z = ${(pLeft_ref.z*1000).toFixed(3)} mm`);
  console.log(`Right Hinge (Radial Divider): X = ${(pRight_ref.x*1000).toFixed(3)} mm, Y = ${(pRight_ref.y*1000).toFixed(3)} mm, Z = ${(pRight_ref.z*1000).toFixed(3)} mm`);
  console.log(`Straight Hinge Axis Length:   ${(initialHingeDistance*1000).toFixed(3)} mm`);
  console.log(`Hinge Axis Vector:            [${hingeAxisUnit.x.toFixed(4)}, ${hingeAxisUnit.y.toFixed(4)}, ${hingeAxisUnit.z.toFixed(4)}]`);
  console.log(`Hinge Axis Elevation ΔY:      ${((pRight_ref.y - pLeft_ref.y)*1000).toFixed(6)} mm (pure horizontal)\n`);

  // Door geometry analysis
  const doorGeo = doorMesh.geometry;
  const posAttr = doorGeo.attributes.position;
  const count = posAttr.count;

  // Measure initial baseline distances across vertices to check for rigid body preservation
  // Corner A (bottom-left) is vertex 37, Corner B (bottom-right) is vertex 73
  // Top Corner A is vertex 0, Top Corner B is vertex 36
  const base_vA = new THREE.Vector3().fromBufferAttribute(posAttr, 37);
  const base_vB = new THREE.Vector3().fromBufferAttribute(posAttr, 73);
  const base_topA = new THREE.Vector3().fromBufferAttribute(posAttr, 0);
  const base_topB = new THREE.Vector3().fromBufferAttribute(posAttr, 36);

  const base_diag1 = base_vA.distanceTo(base_topB);
  const base_diag2 = base_vB.distanceTo(base_topA);
  const base_width = base_vA.distanceTo(base_vB);
  const base_height = base_vA.distanceTo(base_topA);

  const testAngles = [0, 30, 55, 90];
  let allTestsPassed = true;

  console.log('--- 8-POINT CRITICAL KINEMATIC VALIDATION SWEEP ---');

  for (const deg of testAngles) {
    envelope.setLeftoverFoodDoorAngle(deg);
    envelope.updateMatrixWorld(true);

    const actualAngle = envelope.getLeftoverFoodDoorAngle();
    console.log(`\n=================== TESTING ANGLE = ${deg}° (actual = ${actualAngle}°) ===================`);

    // Criterion 1: Left hinge world position is unchanged
    const pLeft_cur = new THREE.Vector3();
    hLeft.getWorldPosition(pLeft_cur);
    const deltaLeft = pLeft_cur.distanceTo(pLeft_ref) * 1000;
    const pass1 = deltaLeft < 0.0001;
    console.log(`  1. Left Hinge Position:  ${pLeft_cur.x.toFixed(4)}, ${pLeft_cur.y.toFixed(4)}, ${pLeft_cur.z.toFixed(4)} m | Δ = ${deltaLeft.toFixed(6)} mm -> [${pass1 ? 'PASS ✓' : 'FAIL ✗'}]`);

    // Criterion 2: Right hinge world position is unchanged
    const pRight_cur = new THREE.Vector3();
    hRight.getWorldPosition(pRight_cur);
    const deltaRight = pRight_cur.distanceTo(pRight_ref) * 1000;
    const pass2 = deltaRight < 0.0001;
    console.log(`  2. Right Hinge Position: ${pRight_cur.x.toFixed(4)}, ${pRight_cur.y.toFixed(4)}, ${pRight_cur.z.toFixed(4)} m | Δ = ${deltaRight.toFixed(6)} mm -> [${pass2 ? 'PASS ✓' : 'FAIL ✗'}]`);

    // Criterion 3: Hinge-to-hinge distance is unchanged
    const curHingeDist = pLeft_cur.distanceTo(pRight_cur);
    const deltaHingeDist = Math.abs(curHingeDist - initialHingeDistance) * 1000;
    const pass3 = deltaHingeDist < 0.0001;
    console.log(`  3. Hinge-to-Hinge Distance: ${(curHingeDist*1000).toFixed(3)} mm | Δ = ${deltaHingeDist.toFixed(6)} mm -> [${pass3 ? 'PASS ✓' : 'FAIL ✗'}]`);

    // Criterion 4: Door pivot axis passes through both hinge centers
    // In pivot's frame, origin is at midpoint of hinges. Let's find world origin and world axis of the pivot:
    const pivotOrigin = new THREE.Vector3();
    doorPivot.getWorldPosition(pivotOrigin);
    // Vector from pivotOrigin to pLeft and pRight
    const toLeft = new THREE.Vector3().subVectors(pLeft_cur, pivotOrigin);
    const toRight = new THREE.Vector3().subVectors(pRight_cur, pivotOrigin);
    // World direction of local X-axis:
    const localXInWorld = new THREE.Vector3(1, 0, 0).transformDirection(doorPivot.matrixWorld).normalize();
    // Cross product of localXInWorld with toLeft and toRight should be 0
    const crossLeft = new THREE.Vector3().crossVectors(localXInWorld, toLeft).length() * 1000;
    const crossRight = new THREE.Vector3().crossVectors(localXInWorld, toRight).length() * 1000;
    const pass4 = crossLeft < 0.001 && crossRight < 0.001;
    console.log(`  4. Pivot Axis Collinearity: distance to Left Hinge = ${crossLeft.toFixed(6)} mm, distance to Right Hinge = ${crossRight.toFixed(6)} mm -> [${pass4 ? 'PASS ✓' : 'FAIL ✗'}]`);

    // Criterion 5: Door is rigidly transformed (no deformation)
    const cur_vA = base_vA.clone().applyMatrix4(doorMesh.matrixWorld);
    const cur_vB = base_vB.clone().applyMatrix4(doorMesh.matrixWorld);
    const cur_topA = base_topA.clone().applyMatrix4(doorMesh.matrixWorld);
    const cur_topB = base_topB.clone().applyMatrix4(doorMesh.matrixWorld);

    const d_width = Math.abs(cur_vA.distanceTo(cur_vB) - base_width) * 1000;
    const d_height = Math.abs(cur_vA.distanceTo(cur_topA) - base_height) * 1000;
    const d_diag1 = Math.abs(cur_vA.distanceTo(cur_topB) - base_diag1) * 1000;
    const d_diag2 = Math.abs(cur_vB.distanceTo(cur_topA) - base_diag2) * 1000;
    const maxDeform = Math.max(d_width, d_height, d_diag1, d_diag2);
    const pass5 = maxDeform < 0.0001;
    console.log(`  5. Rigid Body Invariance: max dimensional deformation Δ = ${maxDeform.toFixed(6)} mm -> [${pass5 ? 'PASS ✓' : 'FAIL ✗'}]`);

    // Criterion 6: No unexpected translation of the hinge axis occurs
    // Distance from door bottom corners to actual fixed hinge points:
    const distDoorCornerAToHingeA = cur_vA.distanceTo(pLeft_ref) * 1000;
    const distDoorCornerBToHingeB = cur_vB.distanceTo(pRight_ref) * 1000;
    const pass6 = distDoorCornerAToHingeA < 0.001 && distDoorCornerBToHingeB < 0.001;
    console.log(`  6. Hinge Axis Translation: Corner A offset = ${distDoorCornerAToHingeA.toFixed(6)} mm, Corner B offset = ${distDoorCornerBToHingeB.toFixed(6)} mm -> [${pass6 ? 'PASS ✓' : 'FAIL ✗'}]`);

    // Criterion 7: Door does not intersect hinge bodies at closed position (and maintains clearance)
    // Central Divider bracket flange is at X = 0 to 9 mm. Door starts at X = 10 mm.
    // Radial Divider bracket flange is at Z = 0 to 9 mm. Door ends at Z = 10 mm.
    const clearanceLeft = cur_vA.x * 1000 - 2.0; // Divider at X = 2 mm
    const clearanceRight = cur_vB.z * 1000 - 2.0; // Divider at Z = 2 mm
    const pass7 = clearanceLeft >= 7.9 && clearanceRight >= 7.9;
    console.log(`  7. Hinge Body / Divider Clearance: Left = ${clearanceLeft.toFixed(2)} mm, Right = ${clearanceRight.toFixed(2)} mm (>= 7.9 mm) -> [${pass7 ? 'PASS ✓' : 'FAIL ✗'}]`);

    // Criterion 8: Door remains within intended Leftover Food sector (+X, +Z quadrant, X >= 0, Z >= 0)
    let minX = Infinity, minZ = Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(posAttr, i).applyMatrix4(doorMesh.matrixWorld);
      if (v.x < minX) minX = v.x;
      if (v.z < minZ) minZ = v.z;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    }
    const pass8 = minX >= 0.0099 && minZ >= 0.0099; // maintains padding >= 9.9 mm
    console.log(`  8. Sector Boundary Confinement: min X = ${(minX*1000).toFixed(2)} mm, min Z = ${(minZ*1000).toFixed(2)} mm, Y span = [${(minY*1000).toFixed(1)}, ${(maxY*1000).toFixed(1)}] mm -> [${pass8 ? 'PASS ✓' : 'FAIL ✗'}]`);

    const anglePass = pass1 && pass2 && pass3 && pass4 && pass5 && pass6 && pass7 && pass8;
    if (!anglePass) allTestsPassed = false;
    console.log(`  => RESULT FOR ${deg}°: [${anglePass ? 'ALL 8 CRITERIA PASSED ✓' : 'FAILED ✗'}]`);
  }

  // Restore 0°
  envelope.setLeftoverFoodDoorAngle(0);
  envelope.updateMatrixWorld(true);

  console.log('\n======================================================================');
  console.log(`FINAL VERIFICATION STATUS: ${allTestsPassed ? 'PASSED ALL CHECKS 100%' : 'FAILURES DETECTED'}`);
  console.log('======================================================================\n');

  if (!allTestsPassed) {
    process.exit(1);
  }
}

runKinematicVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
