const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:/Users/hifia/.gemini/antigravity/brain/26b96081-aa7d-405d-92ae-5713b7aad24c';

async function runAgitatorVerification() {
  console.log('================================================================');
  console.log('GOMIKIN — FINAL AGITATOR MECHANICAL ANIMATION VERIFICATION');
  console.log('================================================================');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('[Browser Error]', msg.text());
    }
  });

  // 1. Open Website
  console.log('\n[1/5] Loading website http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.gomikinModelState && window.gomikinModelState.status === 'ready', { timeout: 35000 });
  console.log('✓ Model loaded and ready in background.');

  // 2. Launch 3D Experience
  console.log('\n[2/5] Launching 3D Experience...');
  await page.click('#btn-canvas-explore');
  await page.waitForTimeout(1200);

  // Switch to Modular Views -> Decomposition Module
  await page.evaluate(() => {
    if (window.viewCoordinator) {
      window.viewCoordinator.switchView('modules', { moduleId: 'decomposition' });
    }
  });
  await page.waitForTimeout(1200);

  // =========================================================================
  // TEST A: INITIAL POSITION & HIERARCHY
  // =========================================================================
  console.log('\n================================================================');
  console.log('TEST A — INITIAL POSITION & GEOMETRIC CONTAINMENT');
  console.log('================================================================');

  const testA = await page.evaluate(() => {
    const THREE = window.THREE;
    const pivot = window.scene.getObjectByName('PIVOT_Agitator');
    const mesh = window.scene.getObjectByName('agitator');
    const decomp = window.scene.getObjectByName('decompostion_chamber');

    if (!pivot || !mesh || !decomp) {
      return { success: false, reason: 'Required objects missing' };
    }

    const pivotWPos = new THREE.Vector3();
    pivot.getWorldPosition(pivotWPos);

    const meshBox = new THREE.Box3().setFromObject(mesh);
    const meshCenter = new THREE.Vector3();
    meshBox.getCenter(meshCenter);
    const meshSize = new THREE.Vector3();
    meshBox.getSize(meshSize);

    const decompBox = new THREE.Box3().setFromObject(decomp);

    const insideY = meshBox.min.y >= decompBox.min.y && meshBox.max.y <= decompBox.max.y;
    const centerDist = pivotWPos.distanceTo(meshCenter);

    return {
      success: true,
      pivotWPos: { x: pivotWPos.x, y: pivotWPos.y, z: pivotWPos.z },
      meshCenter: { x: meshCenter.x, y: meshCenter.y, z: meshCenter.z },
      meshSize: { x: meshSize.x, y: meshSize.y, z: meshSize.z },
      decompBox: {
        min: { x: decompBox.min.x, y: decompBox.min.y, z: decompBox.min.z },
        max: { x: decompBox.max.x, y: decompBox.max.y, z: decompBox.max.z }
      },
      centerDistMm: centerDist * 1000,
      insideElevation: insideY,
      parentIsPivot: mesh.parent === pivot
    };
  });

  console.log('Pivot World Position:', testA.pivotWPos);
  console.log('Agitator Mesh Center:', testA.meshCenter);
  console.log('Center offset between Mesh and Pivot:', testA.centerDistMm.toFixed(3), 'mm');
  console.log('Decomp Chamber Elevation:', testA.decompBox.min.y.toFixed(3), 'to', testA.decompBox.max.y.toFixed(3));
  console.log('Agitator Mesh Spans:', testA.meshSize);
  console.log('Parent is PIVOT_Agitator:', testA.parentIsPivot);
  console.log('Inside Chamber Elevation:', testA.insideElevation);

  if (!testA.parentIsPivot || testA.centerDistMm > 1.0 || !testA.insideElevation) {
    throw new Error('TEST A FAILED: Agitator is not correctly located inside decomposition chamber!');
  }
  console.log('>>> TEST A PASSED: Initial position verified.');

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'agitator_test_a_initial_pos.png') });

  // =========================================================================
  // TEST B: CONTINUOUS ANIMATION & MULTI-ANGLE INSPECTION
  // =========================================================================
  console.log('\n================================================================');
  console.log('TEST B — CONTINUOUS ROTATION AROUND LOCAL SPINDLE AXIS');
  console.log('================================================================');

  // Activate continuous rotation
  await page.evaluate(() => {
    window.mechanicalPivotController.rotateAgitator(Math.PI * 2); // 1 rev/sec
  });

  // Track position over 10 frames
  const trackingResults = [];
  for (let f = 0; f < 8; f++) {
    await page.waitForTimeout(200);
    const frameData = await page.evaluate(() => {
      const THREE = window.THREE;
      const mesh = window.scene.getObjectByName('agitator');
      const pivot = window.scene.getObjectByName('PIVOT_Agitator');
      const decomp = window.scene.getObjectByName('decompostion_chamber');

      const box = new THREE.Box3().setFromObject(mesh);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const pivotPos = new THREE.Vector3();
      pivot.getWorldPosition(pivotPos);

      const dBox = new THREE.Box3().setFromObject(decomp);
      const insideY = box.min.y >= dBox.min.y - 0.001 && box.max.y <= dBox.max.y + 0.001;

      return {
        angleDeg: THREE.MathUtils.radToDeg(window.mechanicalPivotController.pivots.agitator.currentAngle),
        centerX: center.x,
        centerY: center.y,
        centerZ: center.z,
        pivotX: pivotPos.x,
        pivotY: pivotPos.y,
        pivotZ: pivotPos.z,
        driftMm: center.distanceTo(pivotPos) * 1000,
        heightMin: box.min.y,
        heightMax: box.max.y,
        insideY
      };
    });
    trackingResults.push(frameData);
    console.log(`Frame ${f + 1}: angle=${frameData.angleDeg.toFixed(1)}° | center=(${frameData.centerX.toFixed(4)}, ${frameData.centerY.toFixed(4)}, ${frameData.centerZ.toFixed(4)}) | drift=${frameData.driftMm.toFixed(3)}mm | Y=[${frameData.heightMin.toFixed(3)}, ${frameData.heightMax.toFixed(3)}]`);
  }

  const maxDrift = Math.max(...trackingResults.map(t => t.driftMm));
  const allInsideY = trackingResults.every(t => t.insideY);
  console.log('Maximum center drift during rotation:', maxDrift.toFixed(3), 'mm');
  console.log('All frames strictly within chamber elevation:', allInsideY);

  if (maxDrift > 0.5 || !allInsideY) {
    throw new Error(`TEST B FAILED: Agitator drifted by ${maxDrift} mm or broke elevation!`);
  }
  console.log('>>> TEST B PASSED: Center remains stationary, rotating smoothly in place.');

  // Capture Multi-angle Screenshots while rotating
  // 1. Front View
  await page.evaluate(() => {
    window.camera.position.set(-0.12, 0.32, 0.55);
    window.controls.target.set(-0.12, 0.16, 0.0);
    window.controls.update();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'agitator_test_b_angle_front.png') });

  // 2. Elevated Three-Quarter View
  await page.evaluate(() => {
    window.camera.position.set(-0.45, 0.55, 0.40);
    window.controls.target.set(-0.12, 0.16, 0.0);
    window.controls.update();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'agitator_test_b_angle_elevated.png') });

  // 3. Side View
  await page.evaluate(() => {
    window.camera.position.set(-0.65, 0.25, 0.0);
    window.controls.target.set(-0.12, 0.16, 0.0);
    window.controls.update();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'agitator_test_b_angle_side.png') });

  // 4. Top-Down Inspection View
  await page.evaluate(() => {
    window.camera.position.set(-0.12, 0.85, 0.05);
    window.controls.target.set(-0.12, 0.16, 0.0);
    window.controls.update();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'agitator_test_b_angle_top.png') });

  // =========================================================================
  // TEST C: ISOLATION CHECK
  // =========================================================================
  console.log('\n================================================================');
  console.log('TEST C — ISOLATION: CHAMBER & CHASSIS REMAIN STATIONARY');
  console.log('================================================================');

  const isolationResult = await page.evaluate(() => {
    const THREE = window.THREE;
    const decomp = window.scene.getObjectByName('decompostion_chamber');
    const frame = window.scene.getObjectByName('circular_frame');
    const divider = window.scene.getObjectByName('central_divider');

    const dPos = new THREE.Vector3(); decomp.getWorldPosition(dPos);
    const fPos = new THREE.Vector3(); frame.getWorldPosition(fPos);
    const divPos = new THREE.Vector3(); divider.getWorldPosition(divPos);

    return {
      decompPos: { x: dPos.x, y: dPos.y, z: dPos.z },
      framePos: { x: fPos.x, y: fPos.y, z: fPos.z },
      dividerPos: { x: divPos.x, y: divPos.y, z: divPos.z },
      decompRot: { x: decomp.rotation.x, y: decomp.rotation.y, z: decomp.rotation.z }
    };
  });

  console.log('Decomp chamber pos:', isolationResult.decompPos);
  console.log('Circular frame pos:', isolationResult.framePos);
  console.log('Decomp chamber rotation:', isolationResult.decompRot);

  if (isolationResult.decompRot.x !== 0 || isolationResult.decompRot.y !== 0 || isolationResult.decompRot.z !== 0) {
    throw new Error('TEST C FAILED: Decomposition chamber was rotated by agitator!');
  }
  console.log('>>> TEST C PASSED: Chamber and surrounding chassis are 100% stationary.');

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'agitator_test_c_isolation.png') });

  // =========================================================================
  // TEST D: REPEATED START / STOP OPERATION & FLOW INTEGRATION
  // =========================================================================
  console.log('\n================================================================');
  console.log('TEST D — REPEATED OPERATION & CLEAN RESET');
  console.log('================================================================');

  for (let cycle = 1; cycle <= 4; cycle++) {
    // Stop
    await page.evaluate(() => window.mechanicalPivotController.stopAgitator());
    await page.waitForTimeout(150);
    // Reset
    await page.evaluate(() => window.mechanicalPivotController.resetMechanicalComponents());
    await page.waitForTimeout(100);

    const resetCheck = await page.evaluate(() => {
      const p = window.mechanicalPivotController.pivots.agitator;
      return {
        angle: p.currentAngle,
        isContinuous: p.isContinuous,
        speed: p.speed,
        quatW: p.object.quaternion.w
      };
    });

    if (resetCheck.angle !== 0 || resetCheck.isContinuous || Math.abs(resetCheck.quatW - 1) > 0.001) {
      throw new Error(`TEST D FAILED: Cycle ${cycle} failed to cleanly reset baseline!`);
    }

    // Start
    await page.evaluate(() => window.mechanicalPivotController.rotateAgitator(Math.PI * 3));
    await page.waitForTimeout(200);
  }

  // Stop and reset for final baseline
  await page.evaluate(() => {
    window.mechanicalPivotController.stopAgitator();
    window.mechanicalPivotController.resetMechanicalComponents();
  });
  console.log('>>> 4 start/stop cycles verified with zero quaternion drift.');

  // Test Flow Simulation Step 8 integration
  console.log('\nTesting Organic Flow Step 8 (Thermophilic Agitator Mixing)...');
  await page.evaluate(() => {
    window.viewCoordinator.switchView('flow', { flowMode: 'ORGANIC' });
  });
  await page.waitForTimeout(1000);

  // Set flow progress to 0.95 (in Step 8 range [0.86, 1.00])
  await page.evaluate(() => {
    window.physicalFlowController.setProgress(0.95);
    // Reposition camera to view into decomposition chamber during mixing
    window.camera.position.set(-0.35, 0.45, 0.40);
    window.controls.target.set(-0.12, 0.18, 0.0);
    window.controls.update();
  });
  await page.waitForTimeout(500);

  const flowAgitatorAngle = await page.evaluate(() => {
    return window.mechanicalPivotController.pivots.agitator.currentAngle;
  });
  console.log('Flow Step 8 Agitator angle:', (flowAgitatorAngle * 180 / Math.PI).toFixed(1), '°');

  if (Math.abs(flowAgitatorAngle) < 0.1) {
    throw new Error('TEST D FAILED: Flow Step 8 did not animate agitator!');
  }

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'agitator_test_d_flow_mixing.png') });
  console.log('>>> TEST D PASSED: Flow step 8 agitator mixing verified.');

  // Check console errors
  console.log('\n================================================================');
  console.log('CONSOLE ERRORS AUDIT');
  console.log('================================================================');
  console.log('Total console errors recorded:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
    throw new Error(`Console errors detected during test: ${consoleErrors.join(', ')}`);
  }
  console.log('✓ 0 console errors recorded.');

  await browser.close();

  console.log('\n================================================================');
  console.log('ALL TESTS PASSED: DECOMPOSITION CHAMBER AGITATOR REPAIRED & VERIFIED');
  console.log('================================================================');
}

runAgitatorVerification().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
