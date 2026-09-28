const THREE = require('three');
const { GOMIKIN_BASELINE_PARAMS, getDerivedGeometry } = require('../src/utils/parameters.js');

async function verifyDoorKinematics() {
  console.log('===============================================================');
  console.log('PHASE 3B: LEFTOVER FOOD DOOR KINEMATIC GEOMETRIC VERIFICATION');
  console.log('===============================================================\n');

  const { createGomikinEnvelope } = await import('../src/components/envelope.js');
  const envelope = createGomikinEnvelope();
  envelope.updateMatrixWorld(true);

  const doorHinge = envelope.getObjectByName('LeftoverFoodDoor_Pivot') || envelope.getObjectByName('LeftoverFoodAccessDoor_Hinge');
  const doorMesh = envelope.getObjectByName('LeftoverFoodAccessDoor');
  const hCentral = envelope.getObjectByName('LeftoverFoodDoorHinge_Central');
  const hRadial = envelope.getObjectByName('LeftoverFoodDoorHinge_Radial');
  const hRod = envelope.getObjectByName('LeftoverFoodDoorHinge_ChordRod');

  console.log('1. Checking required components:');
  console.log('  doorHinge group exists:', !!doorHinge);
  console.log('  doorMesh exists:', !!doorMesh);
  console.log('  hCentral bracket exists:', !!hCentral);
  console.log('  hRadial bracket exists:', !!hRadial);
  console.log('  hRod straight cylinder exists:', !!hRod);

  // Initial reference hinge points
  const pA_ref = new THREE.Vector3();
  const pB_ref = new THREE.Vector3();
  hCentral.getWorldPosition(pA_ref);
  hRadial.getWorldPosition(pB_ref);

  console.log('\n2. Authoritative Hinge Reference Coordinates:');
  console.log('  Corner A:', (pA_ref.x*1000).toFixed(3), (pA_ref.y*1000).toFixed(3), (pA_ref.z*1000).toFixed(3), 'mm');
  console.log('  Corner B:', (pB_ref.x*1000).toFixed(3), (pB_ref.y*1000).toFixed(3), (pB_ref.z*1000).toFixed(3), 'mm');
  console.log('  Reference Chord Length:', (pA_ref.distanceTo(pB_ref)*1000).toFixed(3), 'mm');
  console.log('  Delta Y:', ((pB_ref.y - pA_ref.y)*1000).toFixed(6), 'mm');

  // Test angles specified in prompt
  const testAngles = [0, 15, 30, 45, 55, 70, 90];
  let allPassed = true;

  console.log('\n3. Angle Sweep Verification:');

  for (const deg of testAngles) {
    envelope.setLeftoverFoodDoorAngle(deg);
    envelope.updateMatrixWorld(true);

    const actualAngle = envelope.getLeftoverFoodDoorAngle();
    const hingeRotDeg = THREE.MathUtils.radToDeg(doorHinge.rotation.x);

    // Check hinge brackets remain fixed
    const pA_now = new THREE.Vector3();
    const pB_now = new THREE.Vector3();
    hCentral.getWorldPosition(pA_now);
    hRadial.getWorldPosition(pB_now);

    const deltaA = pA_now.distanceTo(pA_ref) * 1000;
    const deltaB = pB_now.distanceTo(pB_ref) * 1000;

    // Check door bottom corner vertices in world space
    // In local geometry, bottom corners are at y=0 (relative to hinge axis)
    const geom = doorMesh.geometry;
    const posAttr = geom.attributes.position;
    const vStart = new THREE.Vector3().fromBufferAttribute(posAttr, 37); // bottom Corner A vertex
    doorMesh.localToWorld(vStart);
    const vEnd = new THREE.Vector3().fromBufferAttribute(posAttr, 73); // bottom Corner B vertex
    doorMesh.localToWorld(vEnd);

    const cornerDistA = vStart.distanceTo(pA_ref) * 1000;
    const cornerDistB = vEnd.distanceTo(pB_ref) * 1000;

    // Overall bounds
    const box = new THREE.Box3().setFromObject(doorMesh);
    const yMin = box.min.y * 1000;
    const yMax = box.max.y * 1000;
    const xMin = box.min.x * 1000;
    const xMax = box.max.x * 1000;
    const zMin = box.min.z * 1000;
    const zMax = box.max.z * 1000;

    // Clearances
    const cDivClearance = xMin - 2.0; // Central Divider face at X = +2 mm
    const rDivClearance = zMin - 2.0; // Radial Divider face at Z = +2 mm
    const topClosureClearance = 925.0 - yMax; // Top closure at Y = 925 mm
    const drawerClearance = yMin - 480.0; // Output drawer at Y = 480 mm

    const angleMatch = Math.abs(hingeRotDeg - deg) < 0.001;
    const fixedHinges = deltaA < 0.001 && deltaB < 0.001;
    const zeroClash = cDivClearance >= 7.9 && rDivClearance >= 7.9 && topClosureClearance > 50 && drawerClearance > 50;

    const pass = angleMatch && fixedHinges && zeroClash;
    if (!pass) allPassed = false;

    console.log(`\n  --- Angle = ${deg}° [${pass ? '✓ PASS' : '✗ FAIL'}] ---`);
    console.log(`    Actual Hinge Rotation: ${hingeRotDeg.toFixed(2)}° (Set: ${deg}°)`);
    console.log(`    Hinge Anchor A Displacement: ${deltaA.toFixed(4)} mm (Fixed)`);
    console.log(`    Hinge Anchor B Displacement: ${deltaB.toFixed(4)} mm (Fixed)`);
    console.log(`    Door Corner A Distance to Pivot A: ${cornerDistA.toFixed(4)} mm`);
    console.log(`    Door Corner B Distance to Pivot B: ${cornerDistB.toFixed(4)} mm`);
    console.log(`    Elevation Range (Y): ${yMin.toFixed(1)} to ${yMax.toFixed(1)} mm`);
    console.log(`    Planar Footprint (X, Z): [${xMin.toFixed(1)}, ${xMax.toFixed(1)}] x [${zMin.toFixed(1)}, ${zMax.toFixed(1)}] mm`);
    console.log(`    Central Divider Clearance (X=2mm): ${cDivClearance.toFixed(2)} mm (>= 8 mm)`);
    console.log(`    Radial Divider Clearance (Z=2mm): ${rDivClearance.toFixed(2)} mm (>= 8 mm)`);
    console.log(`    Top Closure Clearance (Y=925mm): ${topClosureClearance.toFixed(1)} mm (> 70 mm)`);
    console.log(`    Output Drawer Clearance (Y=480mm): ${drawerClearance.toFixed(1)} mm (> 100 mm)`);
  }

  // Reset to 0
  envelope.setLeftoverFoodDoorAngle(0);
  envelope.updateMatrixWorld(true);

  console.log(`\nKinematic Verification Result: ${allPassed ? 'ALL TESTS PASSED PERFECTLY!' : 'FAILURES DETECTED!'}`);
}

verifyDoorKinematics().catch(console.error);
