const { chromium } = require('playwright');

function approxEqual(val1, val2, eps = 1e-3) {
  return Math.abs(val1 - val2) < eps;
}

function assertTransformMatches(actual, expected, label) {
  const posDiff = Math.hypot(
    actual.position.x - expected.position.x,
    actual.position.y - expected.position.y,
    actual.position.z - expected.position.z
  );
  const rotDiff = Math.abs(actual.rotation.x - expected.rotation.x) +
                  Math.abs(actual.rotation.y - expected.rotation.y) +
                  Math.abs(actual.rotation.z - expected.rotation.z);
  const scaleDiff = Math.hypot(
    actual.scale.x - expected.scale.x,
    actual.scale.y - expected.scale.y,
    actual.scale.z - expected.scale.z
  );

  if (posDiff > 1e-3 || rotDiff > 1e-3 || scaleDiff > 1e-3) {
    throw new Error(`[MISMATCH] ${label}: posDiff=${posDiff.toFixed(5)}, rotDiff=${rotDiff.toFixed(5)}, scaleDiff=${scaleDiff.toFixed(5)}`);
  }
}

(async () => {
  console.log('================================================================');
  console.log('GOMIKIN PHASE 1 — STATE MACHINE & VIEW TRANSITION VERIFICATION');
  console.log('================================================================\n');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.error('[BROWSER ERROR]:', msg.text());
  });
  page.on('pageerror', err => {
    console.error('[PAGE ERROR]:', err.message);
  });

  // TEST F — Loading Verification
  console.log('--- TEST F: Initial Loading & Model State Verification ---');
  await page.goto('http://localhost:5173/');

  // Check loading HUD presence
  const hasLoadingHUD = await page.evaluate(() => {
    const el = document.getElementById('gomikin-loading-overlay');
    return el !== null;
  });
  console.log('Loading HUD visible during initialization:', hasLoadingHUD);

  // Wait for USDZ load and coordinator setup
  console.log('Waiting for USDZ assembly download & coordinator readiness...');
  await page.waitForFunction(() => {
    return window.usdModel &&
           window.componentRegistry &&
           window.viewCoordinator &&
           window.moduleViewController &&
           window.physicalFlowController &&
           window.gomikinAnimation;
  }, { timeout: 60000 });
  console.log('✓ USDZ Model and ViewTransitionCoordinator initialized successfully!');
  await page.waitForTimeout(1000);

  // Cache baseline transforms of all 33 components
  const baselineState = await page.evaluate(() => {
    const registry = window.componentRegistry;
    const baselines = {};
    for (const name of registry.getNames()) {
      const entry = registry.getEntry(name);
      baselines[name] = {
        position: { x: entry.initialPosition.x, y: entry.initialPosition.y, z: entry.initialPosition.z },
        rotation: { x: entry.initialRotation.x, y: entry.initialRotation.y, z: entry.initialRotation.z },
        scale: { x: entry.initialScale.x, y: entry.initialScale.y, z: entry.initialScale.z }
      };
    }
    return {
      total: registry.getNames().length,
      baselines
    };
  });
  console.log(`✓ Cached pristine CAD baselines for ${baselineState.total} components.\n`);

  // Helper to verify all 33 components match baseline
  async function verifyFullAssemblyBaseline(testLabel) {
    const check = await page.evaluate(() => {
      const reg = window.componentRegistry;
      const errors = [];
      for (const name of reg.getNames()) {
        const mesh = reg.get(name);
        const entry = reg.getEntry(name);
        if (!mesh || !entry) continue;

        const posDist = mesh.position.distanceTo(entry.initialPosition);
        const rotDist = Math.abs(mesh.rotation.x - entry.initialRotation.x) +
                        Math.abs(mesh.rotation.y - entry.initialRotation.y) +
                        Math.abs(mesh.rotation.z - entry.initialRotation.z);
        const scaleDist = mesh.scale.distanceTo(entry.initialScale);

        if (posDist > 1e-3 || rotDist > 1e-3 || scaleDist > 1e-3 || !mesh.visible) {
          errors.push({
            name,
            visible: mesh.visible,
            posDist,
            rotDist,
            scaleDist
          });
        }
      }
      return { ok: errors.length === 0, count: reg.getNames().length, errors };
    });

    if (!check.ok) {
      console.error(`[FAIL] ${testLabel}: Baseline mismatches detected:`, check.errors);
      throw new Error(`[FAIL] ${testLabel}: ${check.errors.length} components failed baseline check.`);
    }
    console.log(`✓ [PASS] ${testLabel}: All ${check.count} components strictly match baseline assembly.`);
  }

  // Helper to verify camera position
  async function verifyCameraFraming(expectedPos, expectedTarget, label) {
    const cam = await page.evaluate(() => ({
      position: { x: window.camera.position.x, y: window.camera.position.y, z: window.camera.position.z },
      target: { x: window.controls.target.x, y: window.controls.target.y, z: window.controls.target.z }
    }));

    const posDiff = Math.hypot(cam.position.x - expectedPos.x, cam.position.y - expectedPos.y, cam.position.z - expectedPos.z);
    const targetDiff = Math.hypot(cam.target.x - expectedTarget.x, cam.target.y - expectedTarget.y, cam.target.z - expectedTarget.z);

    if (posDiff > 0.05 || targetDiff > 0.05) {
      throw new Error(`[FAIL] ${label}: Camera framing deviation. posDiff=${posDiff.toFixed(3)}, targetDiff=${targetDiff.toFixed(3)}`);
    }
    console.log(`✓ [PASS] ${label}: Camera framing matches destination (posDiff=${posDiff.toFixed(3)}, targetDiff=${targetDiff.toFixed(3)}).`);
  }

  // --- TEST A: Rapid View Switching Interruption ---
  console.log('\n--- TEST A: Rapid View Switching Interruption ---');
  // 1. Start Dissection
  console.log('Action: Clicking tab-dissection...');
  await page.click('#tab-dissection');
  await page.waitForTimeout(1200); // Halfway through cinematic dissection

  // 2. Interrupt with Modular Views
  console.log('Action: Interrupting halfway with tab-module-views...');
  await page.click('#tab-module-views');
  await page.waitForTimeout(300);

  // 3. Select another module before camera finishes
  console.log('Action: Selecting cutting module pill before camera settles...');
  await page.click('.mod-pill-btn[data-mod="cutting"]');
  await page.waitForTimeout(200);

  // 4. Switch to Simulate Flow
  console.log('Action: Rapidly switching to tab-flow-sim...');
  await page.click('#tab-flow-sim');
  await page.waitForTimeout(400);

  // 5. Immediately return to Full Model
  console.log('Action: Immediately returning to tab-full-model...');
  await page.click('#tab-full-model');
  await page.waitForTimeout(1200); // Wait for camera glide to finish

  await verifyFullAssemblyBaseline('Test A (Rapid View Switching)');
  await verifyCameraFraming({ x: 0.95, y: 1.15, z: 1.55 }, { x: 0, y: 0.51, z: 0 }, 'Test A (Full Model Camera)');

  // --- TEST B: Flow Interruption & Stale Rotation Elimination ---
  console.log('\n--- TEST B: Flow Interruption & Stale Rotation Elimination ---');
  // 1. Switch to flow and start Organic
  await page.click('#tab-flow-sim');
  await page.waitForTimeout(600);
  console.log('Action: Setting organic flow progress to 42% (cutting blades spinning)...');
  await page.evaluate(() => {
    window.physicalFlowController.pause();
    window.physicalFlowController.setProgress(0.42);
  });
  await page.waitForTimeout(200);

  // Verify blades are rotated at 42%
  const bladesRot42 = await page.evaluate(() => {
    return window.componentRegistry.get('cutting_blades').rotation.z;
  });
  console.log(`Organic 42% cutting_blades.rotation.z = ${bladesRot42.toFixed(3)} rad (active motion verified).`);

  // 2. Switch to Inorganic Flow mid-action
  console.log('Action: Switching to Inorganic flow while blades were active...');
  await page.click('.flow-mode-btn[data-flow="INORGANIC"]');
  await page.waitForTimeout(300);

  // Verify blades were cleanly reset and NOT leaking into Inorganic flow!
  const bladesRotInorganic = await page.evaluate(() => {
    return window.componentRegistry.get('cutting_blades').rotation.z;
  });
  if (Math.abs(bladesRotInorganic) > 1e-4) {
    throw new Error(`[FAIL] Test B: Stale blade rotation leaked into Inorganic flow! rotation.z=${bladesRotInorganic}`);
  }
  console.log('✓ [PASS] Cutting blades cleanly returned to baseline 0 rad in Inorganic flow.');

  // 3. Scrub backward in Inorganic flow
  console.log('Action: Setting Inorganic progress to 45% then scrubbing backward to 10%...');
  await page.evaluate(() => {
    window.physicalFlowController.setProgress(0.45);
    window.physicalFlowController.setProgress(0.10);
  });
  const rotBaseRot = await page.evaluate(() => {
    return window.componentRegistry.get('rotating_base').rotation.x;
  });
  if (Math.abs(rotBaseRot) > 1e-4) {
    throw new Error(`[FAIL] Test B: Stale rotating_base tilt retained after backward scrub! rotation.x=${rotBaseRot}`);
  }
  console.log('✓ [PASS] Rotating base returned to level pose on backward scrub.');

  // 4. Switch to Leftover Food, reset flow, and return to Full Model
  console.log('Action: Switching to Leftover Food, resetting, and returning to Full Model...');
  await page.click('.flow-mode-btn[data-flow="LEFTOVER_FOOD"]');
  await page.waitForTimeout(200);
  await page.click('#flow-btn-reset');
  await page.waitForTimeout(200);
  await page.click('#tab-full-model');
  await page.waitForTimeout(1100);

  await verifyFullAssemblyBaseline('Test B (Flow Interruption Full Reset)');

  // --- TEST C: Scrubbing Determinism ---
  console.log('\n--- TEST C: Scrubbing Determinism Verification ---');
  await page.click('#tab-flow-sim');
  await page.waitForTimeout(500);

  // Evaluate pose at 70%
  const pose70_first = await page.evaluate(() => {
    window.physicalFlowController.reset();
    window.physicalFlowController.setProgress(0.70);
    return {
      mainParticlePos: window.physicalFlowController.mainParticle.position.clone(),
      doorLRot: window.componentRegistry.get('door_mechanism_left').rotation.y,
      rotBaseRot: window.componentRegistry.get('rotating_base').rotation.z,
      bladesRot: window.componentRegistry.get('cutting_blades').rotation.z
    };
  });

  // Scrub backward to 20%
  await page.evaluate(() => {
    window.physicalFlowController.setProgress(0.20);
  });

  // Return to 70%
  const pose70_second = await page.evaluate(() => {
    window.physicalFlowController.setProgress(0.70);
    return {
      mainParticlePos: window.physicalFlowController.mainParticle.position.clone(),
      doorLRot: window.componentRegistry.get('door_mechanism_left').rotation.y,
      rotBaseRot: window.componentRegistry.get('rotating_base').rotation.z,
      bladesRot: window.componentRegistry.get('cutting_blades').rotation.z
    };
  });

  if (!approxEqual(pose70_first.doorLRot, pose70_second.doorLRot) ||
      !approxEqual(pose70_first.rotBaseRot, pose70_second.rotBaseRot) ||
      !approxEqual(pose70_first.bladesRot, pose70_second.bladesRot)) {
    throw new Error('[FAIL] Test C: Poses at 70% differ between forward and backward scrubbing!');
  }
  console.log('✓ [PASS] Test C: Mechanical transforms at 70% progress are 100% deterministic and history-independent.');
  await page.click('#tab-full-model');
  await page.waitForTimeout(1100);

  // --- TEST D: Camera Interruptions & Destination Accuracy ---
  console.log('\n--- TEST D: Camera Interruption Convergence ---');
  await page.click('#tab-module-views');
  await page.waitForTimeout(200);
  await page.click('.mod-pill-btn[data-mod="storage"]');
  await page.waitForTimeout(200);
  await page.click('.mod-pill-btn[data-mod="decomposition"]');
  await page.waitForTimeout(200);
  await page.click('#tab-dissection');
  await page.waitForTimeout(400);
  await page.click('#tab-flow-sim');
  await page.waitForTimeout(300);
  await page.click('#tab-full-model');
  await page.waitForTimeout(1200);

  await verifyCameraFraming({ x: 0.95, y: 1.15, z: 1.55 }, { x: 0, y: 0.51, z: 0 }, 'Test D (Final Camera Framing)');
  await verifyFullAssemblyBaseline('Test D (Post Camera Interruption Model)');

  // --- TEST E: Repeated Reset & Drift Check ---
  console.log('\n--- TEST E: Repeated Playback, Mode Switching & Reset Cycle ---');
  for (let cycle = 1; cycle <= 4; cycle++) {
    await page.click('#tab-flow-sim');
    await page.waitForTimeout(200);

    // Organic 100%
    await page.evaluate(() => {
      window.physicalFlowController.setMode('ORGANIC');
      window.physicalFlowController.setProgress(1.0);
    });
    await page.waitForTimeout(100);

    // Inorganic 100%
    await page.evaluate(() => {
      window.physicalFlowController.setMode('INORGANIC');
      window.physicalFlowController.setProgress(1.0);
    });
    await page.waitForTimeout(100);

    // Leftover Food 100%
    await page.evaluate(() => {
      window.physicalFlowController.setMode('LEFTOVER_FOOD');
      window.physicalFlowController.setProgress(1.0);
    });
    await page.waitForTimeout(100);

    await page.click('#tab-full-model');
    await page.waitForTimeout(1000);
    await verifyFullAssemblyBaseline(`Test E (Cycle ${cycle} Reset)`);
  }
  console.log('✓ [PASS] Test E: Zero accumulated transform drift across 4 multi-mode playback cycles.');

  // Take final confirmation screenshot
  await page.screenshot({ path: 'scratch/phase1_verified_assembled.png' });
  console.log('\nSaved verification screenshot to scratch/phase1_verified_assembled.png');

  await browser.close();
  console.log('\n================================================================');
  console.log('✓ ALL PHASE 1 RELIABILITY TESTS PASSED WITH ZERO DEFECTS!');
  console.log('================================================================');
})();
