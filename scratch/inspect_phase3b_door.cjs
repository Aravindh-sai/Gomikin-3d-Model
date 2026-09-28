const THREE = require('three');
const { GOMIKIN_BASELINE_PARAMS, getDerivedGeometry } = require('../src/utils/parameters.js');

async function inspectDoor() {
  console.log('=== LEFTOVER FOOD ACCESS DOOR KINEMATICS & CLEARANCE INSPECTION ===');
  const derived = getDerivedGeometry(GOMIKIN_BASELINE_PARAMS);
  const { createGomikinEnvelope } = await import('../src/components/envelope.js');
  const envelope = createGomikinEnvelope();
  envelope.updateMatrixWorld(true);

  const doorHinge = envelope.getObjectByName('LeftoverFoodAccessDoor_Hinge');
  const doorMesh = envelope.getObjectByName('LeftoverFoodAccessDoor');
  const hCentral = envelope.getObjectByName('LeftoverFoodDoorHinge_Central');
  const hRadial = envelope.getObjectByName('LeftoverFoodDoorHinge_Radial');
  const hRod = envelope.getObjectByName('LeftoverFoodDoorHinge_ChordRod');

  const cDiv = envelope.getObjectByName('CentralDivider');
  const rDiv = envelope.getObjectByName('RadialDivider');
  const topClosure = envelope.getObjectByName('LeftoverFoodTopClosure');

  console.log('1. Objects found:');
  console.log('  doorHinge:', !!doorHinge);
  console.log('  doorMesh:', !!doorMesh);
  console.log('  hCentral:', !!hCentral);
  console.log('  hRadial:', !!hRadial);
  console.log('  hRod:', !!hRod);

  // Measure Hinge positions in world
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pMid = new THREE.Vector3();
  hCentral.getWorldPosition(pA);
  hRadial.getWorldPosition(pB);
  doorHinge.getWorldPosition(pMid);

  console.log('\n2. Hinge Coordinates (World mm):');
  console.log('  Corner A (Central):', (pA.x*1000).toFixed(3), (pA.y*1000).toFixed(3), (pA.z*1000).toFixed(3));
  console.log('  Corner B (Radial):', (pB.x*1000).toFixed(3), (pB.y*1000).toFixed(3), (pB.z*1000).toFixed(3));
  console.log('  Chord Midpoint:', (pMid.x*1000).toFixed(3), (pMid.y*1000).toFixed(3), (pMid.z*1000).toFixed(3));
  console.log('  Axis Delta Y:', ((pB.y - pA.y)*1000).toFixed(6), 'mm (MUST BE EXACTLY 0)');
  console.log('  Chord length:', (pA.distanceTo(pB)*1000).toFixed(3), 'mm');

  // Check distances to divider faces:
  // CentralDivider face at X = +2 mm
  console.log('\n3. Divider Distances:');
  console.log('  Distance from Corner A to CentralDivider face (X = 2 mm):', ((pA.x - 0.002)*1000).toFixed(3), 'mm');
  // RadialDivider face at Z = +2 mm
  console.log('  Distance from Corner B to RadialDivider face (Z = 2 mm):', ((pB.z - 0.002)*1000).toFixed(3), 'mm');

  // Kinematic sweep test:
  console.log('\n4. Kinematic Sweep Test (Outward rotation around local X):');
  const testAngles = [0, 15, 30, 45, 60, 70, 90];

  for (const deg of testAngles) {
    doorHinge.rotation.x = THREE.MathUtils.degToRad(deg);
    doorHinge.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(doorMesh);
    
    // Check max radius from apparatus center (0,0) in XZ
    // Extract vertices or test samples from doorMesh geometry
    const geom = doorMesh.geometry;
    const posAttr = geom.attributes.position;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let maxR = 0, minR = Infinity;
    let minXDistToCentralFace = Infinity; // X - 2mm
    let minZDistToRadialFace = Infinity;  // Z - 2mm

    const tempV = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      tempV.fromBufferAttribute(posAttr, i);
      doorMesh.localToWorld(tempV);
      minX = Math.min(minX, tempV.x);
      maxX = Math.max(maxX, tempV.x);
      minY = Math.min(minY, tempV.y);
      maxY = Math.max(maxY, tempV.y);
      minZ = Math.min(minZ, tempV.z);
      maxZ = Math.max(maxZ, tempV.z);

      const r = Math.sqrt(tempV.x * tempV.x + tempV.z * tempV.z);
      maxR = Math.max(maxR, r);
      minR = Math.min(minR, r);

      minXDistToCentralFace = Math.min(minXDistToCentralFace, tempV.x - 0.002);
      minZDistToRadialFace = Math.min(minZDistToRadialFace, tempV.z - 0.002);
    }

    console.log(`  Angle = ${deg.toString().padStart(2, ' ')}°:`);
    console.log(`    Y range: ${(minY*1000).toFixed(1)} to ${(maxY*1000).toFixed(1)} mm`);
    console.log(`    X range: ${(minX*1000).toFixed(1)} to ${(maxX*1000).toFixed(1)} mm`);
    console.log(`    Z range: ${(minZ*1000).toFixed(1)} to ${(maxZ*1000).toFixed(1)} mm`);
    console.log(`    Radius R range: ${(minR*1000).toFixed(1)} to ${(maxR*1000).toFixed(1)} mm (Shell Inner R = 246 mm, Outer R = 250 mm)`);
    console.log(`    Min distance to Central Divider (+X face): ${(minXDistToCentralFace*1000).toFixed(2)} mm`);
    console.log(`    Min distance to Radial Divider (+Z face): ${(minZDistToRadialFace*1000).toFixed(2)} mm`);
  }

  // Reset
  doorHinge.rotation.x = 0;
  doorHinge.updateMatrixWorld(true);
}

inspectDoor().catch(console.error);
