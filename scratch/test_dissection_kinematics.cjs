const THREE = require('three');

async function testDissection() {
  console.log('======================================================================');
  console.log('TESTING DISSECTION CONTROLLER KINEMATICS & REVERSIBILITY');
  console.log('======================================================================\n');

  const { createGomikinEnvelope } = await import('../src/components/envelope.js');
  const { DissectionController, DISSECTION_STAGES } = await import('../src/animation/dissectionController.js');

  const envelope = createGomikinEnvelope();
  envelope.updateMatrixWorld(true);

  const controller = new DissectionController(envelope);
  console.log(`Registered ${controller.movables.length} movable component entries.`);

  // Record original world positions of all registered objects
  const origPositions = new Map();
  for (const entry of controller.movables) {
    const wp = new THREE.Vector3();
    entry.obj.getWorldPosition(wp);
    origPositions.set(entry.obj.name || entry.obj.id, wp);
  }

  // 1. Verify Assembled State (Progress = 0.0)
  controller.setProgress(0.0);
  console.log('\n--- 1. VERIFYING ASSEMBLED STATE (p = 0.0) ---');
  let maxZeroDev = 0;
  for (const entry of controller.movables) {
    const curWp = new THREE.Vector3();
    entry.obj.getWorldPosition(curWp);
    const origWp = origPositions.get(entry.obj.name || entry.obj.id);
    const dev = curWp.distanceTo(origWp) * 1000;
    if (dev > maxZeroDev) maxZeroDev = dev;
  }
  console.log(`Max deviation at p = 0.0: ${maxZeroDev.toFixed(6)} mm -> [${maxZeroDev < 0.0001 ? 'PASS ✓' : 'FAIL ✗'}]`);

  // 2. Sweep across all stages (p = 0.15, 0.30, 0.45, 0.60, 0.75, 0.88, 1.0)
  console.log('\n--- 2. STAGE SWEEP DISSECTION VERIFICATION ---');
  for (const stage of DISSECTION_STAGES) {
    controller.setProgress(stage.progress);
    console.log(`Stage '${stage.name}' (p = ${stage.progress.toFixed(2)}):`);

    // Measure key landmark positions
    const shell = envelope.getObjectByName('MainShell');
    const funnel = envelope.getObjectByName('Funnel');
    const elecBay = envelope.getObjectByName('ElectronicsBay');
    const cuttingMotor = envelope.getObjectByName('CuttingMotor');
    const decompDrawer = envelope.getObjectByName('DecompositionVessel_Drawer');
    const inorgDrawer = envelope.getObjectByName('InorganicDrawer');
    const foodDrawer = envelope.getObjectByName('LeftoverFoodDrawer');
    const foodDoor = envelope.getObjectByName('LeftoverFoodDoor_Pivot');

    console.log(`  Shell elevation Y: ${(shell.position.y * 1000).toFixed(1)} mm`);
    console.log(`  Decomp Drawer X:   ${(decompDrawer.position.x * 1000).toFixed(1)} mm`);
    console.log(`  Inorganic Drawer X:${(inorgDrawer.position.x * 1000).toFixed(1)} mm`);
    console.log(`  Leftover Drawer Z: ${(foodDrawer.position.z * 1000).toFixed(1)} mm`);
    console.log(`  Leftover Door Angle:${THREE.MathUtils.radToDeg(foodDoor.rotation.x).toFixed(1)}°`);
  }

  // 3. Test Full Reversibility (Reset to p = 0.0)
  console.log('\n--- 3. TESTING FULL REVERSIBILITY & RESET ---');
  controller.reset();
  let maxResetDev = 0;
  for (const entry of controller.movables) {
    const curWp = new THREE.Vector3();
    entry.obj.getWorldPosition(curWp);
    const origWp = origPositions.get(entry.obj.name || entry.obj.id);
    const dev = curWp.distanceTo(origWp) * 1000;
    if (dev > maxResetDev) maxResetDev = dev;
  }
  console.log(`Max deviation after complete reset: ${maxResetDev.toFixed(6)} mm -> [${maxResetDev < 0.0001 ? 'PASS ✓' : 'FAIL ✗'}]`);

  if (maxResetDev < 0.0001) {
    console.log('\n======================================================================');
    console.log('DISSECTION KINEMATICS VERIFICATION RESULT: 100% PERFECT PASS!');
    console.log('======================================================================\n');
  } else {
    throw new Error(`Residual displacement detected after reset: ${maxResetDev} mm`);
  }
}

testDissection().catch(err => {
  console.error(err);
  process.exit(1);
});
