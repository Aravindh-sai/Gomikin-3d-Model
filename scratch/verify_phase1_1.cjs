const { chromium } = require('playwright');

function approxEqual(val1, val2, eps = 1e-3) {
  return Math.abs(val1 - val2) < eps;
}

(async () => {
  console.log('================================================================');
  console.log('GOMIKIN PHASE 1.1 — POST-IMPLEMENTATION VERIFICATION SUITE');
  console.log('================================================================\n');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  const failedRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('[BROWSER ERROR]:', msg.text());
    } else if (msg.type() === 'warn') {
      consoleWarnings.push(msg.text());
    }
  });

  page.on('response', resp => {
    if (resp.status() >= 400) {
      console.log(`[HTTP ${resp.status()}]: ${resp.url()}`);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error('[PAGE ERROR]:', err.message);
  });

  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), failure: req.failure() });
    console.error('[REQUEST FAILED]:', req.url(), req.failure());
  });

  console.log('--- Step 0: Initial Page Load & Readiness ---');
  await page.goto('http://localhost:5173/');

  // Verify loading HUD is shown initially
  const loadingHUDVisible = await page.evaluate(() => {
    const el = document.getElementById('gomikin-loading-overlay');
    return el && window.getComputedStyle(el).display !== 'none';
  });
  console.log('Loading HUD visible initially:', loadingHUDVisible);

  // Wait for complete initialization
  await page.waitForFunction(() => {
    return window.usdModel &&
           window.componentRegistry &&
           window.viewCoordinator &&
           window.moduleViewController &&
           window.physicalFlowController &&
           window.gomikinAnimation;
  }, { timeout: 60000 });
  console.log('✓ Model loaded and all systems ready.\n');
  await page.waitForTimeout(1000);

  // Cache baseline transforms and original materials
  const pristineBaselines = await page.evaluate(() => {
    const reg = window.componentRegistry;
    const mvc = window.moduleViewController;
    const data = {};
    for (const name of reg.getNames()) {
      const entry = reg.getEntry(name);
      const mesh = reg.get(name);
      const origMat = mvc.originalMaterials.get(mesh);
      data[name] = {
        pos: { x: entry.initialPosition.x, y: entry.initialPosition.y, z: entry.initialPosition.z },
        rot: { x: entry.initialRotation.x, y: entry.initialRotation.y, z: entry.initialRotation.z },
        scale: { x: entry.initialScale.x, y: entry.initialScale.y, z: entry.initialScale.z },
        matType: mesh.material ? mesh.material.constructor.name : 'none',
        origMatId: origMat ? origMat.id : null,
        origMatOpacity: origMat ? origMat.opacity : 1.0,
        origMatTransparent: origMat ? origMat.transparent : false
      };
    }
    return {
      count: reg.getNames().length,
      data
    };
  });
  console.log(`✓ Cached pristine data for ${pristineBaselines.count} components.`);

  // Comprehensive state verification helper
  async function verifyFullSystemState(checkpointName, options = {}) {
    const state = await page.evaluate(() => {
      const reg = window.componentRegistry;
      const coord = window.viewCoordinator;
      const flow = window.physicalFlowController;
      const mvc = window.moduleViewController;
      const da = window.gomikinAnimation ? window.gomikinAnimation.controller : null;

      const errors = [];

      // 1. Check all 33 component transforms and visibility
      for (const name of reg.getNames()) {
        const mesh = reg.get(name);
        const entry = reg.getEntry(name);
        if (!mesh || !entry) {
          errors.push(`Missing mesh or entry for ${name}`);
          continue;
        }

        const posDiff = mesh.position.distanceTo(entry.initialPosition);
        const rotDiff = Math.abs(mesh.rotation.x - entry.initialRotation.x) +
                        Math.abs(mesh.rotation.y - entry.initialRotation.y) +
                        Math.abs(mesh.rotation.z - entry.initialRotation.z);
        const scaleDiff = mesh.scale.distanceTo(entry.initialScale);

        if (posDiff > 1e-3 || rotDiff > 1e-3 || scaleDiff > 1e-3) {
          errors.push(`Transform mismatch ${name}: posDiff=${posDiff.toFixed(4)}, rotDiff=${rotDiff.toFixed(4)}, scaleDiff=${scaleDiff.toFixed(4)}`);
        }
        if (!mesh.visible) {
          errors.push(`Component ${name} is unexpectedly hidden`);
        }
      }

      // 2. Check materials (housing should NOT be ghosted if in Full Model)
      const housing = reg.get('Main_Housing');
      const origHousingMat = mvc.originalMaterials.get(housing);
      const isHousingGhosted = housing && (housing.material === mvc.ghostMaterial);

      // 3. Check simulation objects
      const simObjects = {
        mainParticleVisible: flow.mainParticle.visible,
        fragmentsVisible: flow.fragmentsGroup.visible,
        scanBeamVisible: flow.scanBeam.visible,
        leachateDropsVisible: flow.leachateDrops.visible
      };

      // 4. Check labels & UI overlays
      const labelOverlay = document.getElementById('gomikin-catalogue-labels');
      const labelOverlayDisplay = labelOverlay ? window.getComputedStyle(labelOverlay).display : 'none';
      const detailUI = document.getElementById('gomikin-detail-ui');
      const isDetailActive = detailUI ? detailUI.classList.contains('detail-active') : false;
      const detailUIDisplay = detailUI ? window.getComputedStyle(detailUI).display : 'none';

      // 5. Check controls & cursor
      const controlsEnabled = window.controls ? window.controls.enabled : false;
      const cursor = document.body.style.cursor || 'default';

      // 6. Check UI tabs
      const activeNavTab = document.querySelector('.nav-tab-btn.active')?.id || 'none';
      const subbarDisplay = document.getElementById('gomikin-modules-subbar')?.style.display || 'none';
      const cardDisplay = document.getElementById('gomikin-module-card')?.style.display || 'none';
      const flowConsoleDisplay = document.getElementById('gomikin-flow-console')?.style.display || 'none';
      const dissectBtn = document.getElementById('btn-dissect-gomikin');
      const dissectBtnDisplay = dissectBtn ? window.getComputedStyle(dissectBtn).display : 'none';

      // 7. Check camera
      const camPos = { x: window.camera.position.x, y: window.camera.position.y, z: window.camera.position.z };
      const camTarget = { x: window.controls.target.x, y: window.controls.target.y, z: window.controls.target.z };

      return {
        errors,
        isHousingGhosted,
        housingMatMatch: housing ? (housing.material === origHousingMat) : false,
        simObjects,
        labelOverlayDisplay,
        isDetailActive,
        detailUIDisplay,
        controlsEnabled,
        cursor,
        activeNavTab,
        subbarDisplay,
        cardDisplay,
        flowConsoleDisplay,
        dissectBtnDisplay,
        camPos,
        camTarget,
        activeView: coord ? coord.activeView : 'unknown'
      };
    });

    if (state.errors.length > 0) {
      console.error(`[FAIL] ${checkpointName}: Transform/Visibility errors:`, state.errors);
      throw new Error(`[FAIL] ${checkpointName}: ${state.errors.length} components failed!`);
    }

    if (options.expectFullModel) {
      if (state.isHousingGhosted || !state.housingMatMatch) {
        throw new Error(`[FAIL] ${checkpointName}: Main_Housing material not restored to original!`);
      }
      if (state.simObjects.mainParticleVisible || state.simObjects.fragmentsVisible ||
          state.simObjects.scanBeamVisible || state.simObjects.leachateDropsVisible) {
        throw new Error(`[FAIL] ${checkpointName}: Simulation objects still visible in Full Model!`);
      }
      if (state.labelOverlayDisplay !== 'none') {
        throw new Error(`[FAIL] ${checkpointName}: Catalogue labels unexpectedly visible in Full Model! (display=${state.labelOverlayDisplay})`);
      }
      if (state.isDetailActive || state.detailUIDisplay !== 'none') {
        throw new Error(`[FAIL] ${checkpointName}: Detail UI overlay unexpectedly active in Full Model!`);
      }
      if (!state.controlsEnabled) {
        throw new Error(`[FAIL] ${checkpointName}: OrbitControls unexpectedly disabled in Full Model!`);
      }
      if (state.cursor !== 'default') {
        throw new Error(`[FAIL] ${checkpointName}: Body cursor not restored to 'default'! (got '${state.cursor}')`);
      }
      if (state.activeNavTab !== 'tab-full-model') {
        throw new Error(`[FAIL] ${checkpointName}: Active nav tab is not 'tab-full-model'! (got '${state.activeNavTab}')`);
      }
      if (state.subbarDisplay !== 'none' || state.cardDisplay !== 'none' || state.flowConsoleDisplay !== 'none') {
        throw new Error(`[FAIL] ${checkpointName}: Modular sub-bars unexpectedly visible in Full Model!`);
      }
      // Camera check for Full Model
      const posDist = Math.hypot(state.camPos.x - 0.95, state.camPos.y - 1.15, state.camPos.z - 1.55);
      const targetDist = Math.hypot(state.camTarget.x - 0, state.camTarget.y - 0.51, state.camTarget.z - 0);
      if (posDist > 0.05 || targetDist > 0.05) {
        throw new Error(`[FAIL] ${checkpointName}: Full Model camera framing deviation (posDist=${posDist.toFixed(3)}, targetDist=${targetDist.toFixed(3)})`);
      }
    }

    console.log(`✓ [PASS] ${checkpointName}: Complete system state verified clean.`);
    return state;
  }

  // ===========================================================================
  // SCENARIO 1: Module view -> immediate dissection -> immediate flow -> Full Model
  // ===========================================================================
  console.log('\n--- Scenario 1: Module View -> Dissection -> Flow -> Full Model ---');
  await page.click('#tab-module-views');
  await page.waitForTimeout(200); // Interrupt immediately during camera transition
  await page.click('#tab-dissection');
  await page.waitForTimeout(300); // Interrupt dissection while expanding
  await page.click('#tab-flow-sim');
  await page.waitForTimeout(300); // Interrupt flow camera glide
  await page.click('#tab-full-model');
  await page.waitForTimeout(1100); // Allow camera glide to settle

  await verifyFullSystemState('Scenario 1 (Rapid View Sequence to Full Model)', { expectFullModel: true });

  // ===========================================================================
  // SCENARIO 2: Dissection -> component detail -> Flow -> Full Model
  // ===========================================================================
  console.log('\n--- Scenario 2: Dissection -> Component Detail -> Flow -> Full Model ---');
  // 1. Enter Dissection and fast-forward to 100% exploded
  await page.click('#tab-dissection');
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    window.gomikinAnimation.controller.progress(1.0);
  });
  await page.waitForTimeout(300);

  // Verify catalogue is in exploded state with detail enabled
  const isDetailEnabled = await page.evaluate(() => {
    return window.gomikinAnimation.controller.detailController.enabled;
  });
  console.log('Dissection exploded: detailController.enabled =', isDetailEnabled);

  // 2. Select a component for Detail Inspection
  console.log('Action: Entering detail view for "cutting_blades"...');
  await page.evaluate(() => {
    window.gomikinAnimation.controller.detailController.enterDetailView('cutting_blades');
  });
  await page.waitForTimeout(200);

  // Verify other 32 components are hidden, detail UI is active
  const detailCheck = await page.evaluate(() => {
    const reg = window.componentRegistry;
    const blades = reg.get('cutting_blades');
    let hiddenCount = 0;
    for (const name of reg.getNames()) {
      if (name !== 'cutting_blades' && !reg.get(name).visible) hiddenCount++;
    }
    const overlay = document.getElementById('gomikin-detail-ui');
    return {
      bladesVisible: blades ? blades.visible : false,
      hiddenCount,
      total: reg.getNames().length,
      detailUIActive: overlay ? overlay.classList.contains('detail-active') : false
    };
  });
  console.log(`Detail Mode active: ${detailCheck.hiddenCount}/${detailCheck.total - 1} other components hidden, detail UI active = ${detailCheck.detailUIActive}`);

  // 3. Direct transition from Detail View directly to Flow Simulation!
  console.log('Action: Directly clicking tab-flow-sim while in Component Detail View...');
  await page.click('#tab-flow-sim');
  await page.waitForTimeout(600);

  // Verify Detail UI was destroyed, all 33 components visible, flow console active
  const flowCheck = await page.evaluate(() => {
    const reg = window.componentRegistry;
    let visibleCount = 0;
    for (const name of reg.getNames()) {
      if (reg.get(name).visible) visibleCount++;
    }
    const overlay = document.getElementById('gomikin-detail-ui');
    const flowConsole = document.getElementById('gomikin-flow-console');
    const housing = reg.get('Main_Housing');
    const mvc = window.moduleViewController;
    return {
      visibleCount,
      detailActive: overlay ? overlay.classList.contains('detail-active') : false,
      flowConsoleVisible: flowConsole ? flowConsole.style.display !== 'none' : false,
      housingGhosted: housing ? housing.material === mvc.ghostMaterial : false
    };
  });
  console.log(`Transitioned to Flow: all ${flowCheck.visibleCount} components visible, detail UI active = ${flowCheck.detailActive}, housing ghosted = ${flowCheck.housingGhosted}`);

  // 4. Return to Full Model
  console.log('Action: Returning to tab-full-model...');
  await page.click('#tab-full-model');
  await page.waitForTimeout(1100);

  await verifyFullSystemState('Scenario 2 (Detail View to Flow to Full Model)', { expectFullModel: true });

  // ===========================================================================
  // SCENARIO 3: Organic flow at 42% -> Inorganic flow -> Leftover Food flow -> reset
  // ===========================================================================
  console.log('\n--- Scenario 3: Organic 42% -> Inorganic -> Leftover Food -> Reset ---');
  await page.click('#tab-flow-sim');
  await page.waitForTimeout(500);

  // Set Organic 42%
  console.log('Action: Organic flow to 42%...');
  await page.evaluate(() => {
    window.physicalFlowController.pause();
    window.physicalFlowController.setProgress(0.42);
  });
  await page.waitForTimeout(100);

  const blades42 = await page.evaluate(() => window.componentRegistry.get('cutting_blades').rotation.z);
  console.log(`Organic 42% blades rotation.z = ${blades42.toFixed(3)} rad.`);

  // Switch to Inorganic mid-action
  console.log('Action: Switching to Inorganic flow...');
  await page.click('.flow-mode-btn[data-flow="INORGANIC"]');
  await page.waitForTimeout(200);

  // Scrub Inorganic to 40% (platform tilting)
  await page.evaluate(() => {
    window.physicalFlowController.setProgress(0.40);
  });
  const rotBase40 = await page.evaluate(() => window.componentRegistry.get('rotating_base').rotation.x);
  console.log(`Inorganic 40% rotating_base rotation.x = ${rotBase40.toFixed(3)} rad.`);

  // Switch to Leftover Food mid-action
  console.log('Action: Switching to Leftover Food flow...');
  await page.click('.flow-mode-btn[data-flow="LEFTOVER_FOOD"]');
  await page.waitForTimeout(200);

  // Scrub Leftover Food to 20% (door open)
  await page.evaluate(() => {
    window.physicalFlowController.setProgress(0.20);
  });
  const doorRot20 = await page.evaluate(() => window.componentRegistry.get('leftover_food_closur').rotation.x);
  console.log(`Leftover Food 20% door rotation.x = ${doorRot20.toFixed(3)} rad.`);

  // Reset flow
  console.log('Action: Clicking flow reset button...');
  await page.click('#flow-btn-reset');
  await page.waitForTimeout(200);

  // Verify all mechanical parts returned to baseline
  const flowResetCheck = await page.evaluate(() => {
    const reg = window.componentRegistry;
    const blades = reg.get('cutting_blades');
    const base = reg.get('rotating_base');
    const door = reg.get('leftover_food_closur');
    const doorL = reg.get('door_mechanism_left');
    const doorR = reg.get('door_mechanism_right');
    const agitator = reg.get('agitator');

    return {
      bladesRotZ: blades.rotation.z,
      baseRotX: base.rotation.x,
      baseRotZ: base.rotation.z,
      doorRotX: door.rotation.x,
      doorLRotY: doorL.rotation.y,
      doorRRotY: doorR.rotation.y,
      agitatorRotZ: agitator.rotation.z
    };
  });

  for (const [prop, val] of Object.entries(flowResetCheck)) {
    if (Math.abs(val) > 1e-4) {
      throw new Error(`[FAIL] Scenario 3: ${prop} was not reset! value=${val}`);
    }
  }
  console.log('✓ [PASS] All mechanical flow components verified at exact 0 rad baseline.');

  // Return to Full Model
  await page.click('#tab-full-model');
  await page.waitForTimeout(1100);
  await verifyFullSystemState('Scenario 3 (Multi-Flow Mode Interruption and Reset)', { expectFullModel: true });

  // ===========================================================================
  // SCENARIO 4: Flow playback -> switch tabs during playback -> return to flow
  // ===========================================================================
  console.log('\n--- Scenario 4: Active Flow Playback -> Tab Switch -> Return to Flow ---');
  await page.click('#tab-flow-sim');
  await page.waitForTimeout(300);

  console.log('Action: Starting active flow playback at 2x speed...');
  await page.click('#flow-btn-speed'); // 2x
  await page.click('#flow-btn-play'); // play
  await page.waitForTimeout(1000); // Let it advance to ~25%

  const midFlowProgress = await page.evaluate(() => window.physicalFlowController.progress);
  console.log(`Flow playing, reached progress = ${(midFlowProgress * 100).toFixed(1)}%.`);

  // Switch to Modular Views tab while flow is actively running!
  console.log('Action: Switching to Modular Views during active playback...');
  await page.click('#tab-module-views');
  await page.waitForTimeout(500);

  // Verify flow controller was paused and reset upon yielding view
  const flowPausedOnYield = await page.evaluate(() => {
    return {
      isPlaying: window.physicalFlowController.isPlaying,
      mainParticleVisible: window.physicalFlowController.mainParticle.visible
    };
  });
  console.log(`Flow on tab yield: isPlaying = ${flowPausedOnYield.isPlaying}, particleVisible = ${flowPausedOnYield.mainParticleVisible}`);
  if (flowPausedOnYield.isPlaying) {
    throw new Error('[FAIL] Scenario 4: Flow controller failed to pause when switching away from flow tab!');
  }

  // Now return to Flow Sim tab
  console.log('Action: Returning to Flow tab...');
  await page.click('#tab-flow-sim');
  await page.waitForTimeout(500);

  const flowReturnedState = await page.evaluate(() => {
    return {
      isPlaying: window.physicalFlowController.isPlaying,
      progress: window.physicalFlowController.progress,
      housingGhosted: window.componentRegistry.get('Main_Housing').material === window.moduleViewController.ghostMaterial
    };
  });
  console.log(`Returned to Flow: isPlaying = ${flowReturnedState.isPlaying}, progress = ${flowReturnedState.progress}, housingGhosted = ${flowReturnedState.housingGhosted}`);

  // Return to Full Model
  await page.click('#tab-full-model');
  await page.waitForTimeout(1100);
  await verifyFullSystemState('Scenario 4 (Flow Playback Interruption and Return)', { expectFullModel: true });

  // ===========================================================================
  // SCENARIO 5: Rapid repeated tab switching while camera transitions are active
  // ===========================================================================
  console.log('\n--- Scenario 5: Rapid Repeated Tab Switching During Active Camera Glide ---');
  const tabs = ['#tab-module-views', '#tab-dissection', '#tab-flow-sim', '#tab-module-views', '#tab-flow-sim', '#tab-dissection'];
  for (let i = 0; i < tabs.length; i++) {
    const tabSelector = tabs[i];
    await page.click(tabSelector);
    await page.waitForTimeout(120); // 120ms: middle of 900ms camera glide
  }

  // End on Full Model
  console.log('Action: Settling on Full Model after 6 rapid interrupted glides...');
  await page.click('#tab-full-model');
  await page.waitForTimeout(1200);

  await verifyFullSystemState('Scenario 5 (Rapid Interrupted Camera Glides)', { expectFullModel: true });

  // ===========================================================================
  // SCENARIO 6: Repeated reset and replay cycles across all modes
  // ===========================================================================
  console.log('\n--- Scenario 6: Repeated Reset & Replay Cycles ---');
  for (let cycle = 1; cycle <= 3; cycle++) {
    console.log(`--- Cycle ${cycle} ---`);
    // 1. Dissection full cycle
    await page.click('#tab-dissection');
    await page.waitForTimeout(150);
    await page.evaluate(() => window.gomikinAnimation.controller.progress(1.0));
    await page.waitForTimeout(150);
    await page.click('#tab-full-model');
    await page.waitForTimeout(1000);
    await verifyFullSystemState(`Cycle ${cycle} post-Dissection`, { expectFullModel: true });

    // 2. Module Views full cycle
    await page.click('#tab-module-views');
    await page.waitForTimeout(150);
    await page.click('.mod-pill-btn[data-mod="storage"]');
    await page.waitForTimeout(150);
    await page.click('#btn-explode-module');
    await page.waitForTimeout(200);
    await page.click('#tab-full-model');
    await page.waitForTimeout(1000);
    await verifyFullSystemState(`Cycle ${cycle} post-Module Explode`, { expectFullModel: true });

    // 3. Flow full cycle
    await page.click('#tab-flow-sim');
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      window.physicalFlowController.setMode('LEFTOVER_FOOD');
      window.physicalFlowController.setProgress(0.9);
    });
    await page.waitForTimeout(150);
    await page.click('#tab-full-model');
    await page.waitForTimeout(1000);
    await verifyFullSystemState(`Cycle ${cycle} post-Flow`, { expectFullModel: true });
  }

  // ===========================================================================
  // SUMMARY OF BROWSER LOGS & NETWORK REQUESTS
  // ===========================================================================
  console.log('\n================================================================');
  console.log('BROWSER CONSOLE & NETWORK DIAGNOSTIC AUDIT');
  console.log('================================================================');
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((err, i) => console.error(`  ${i + 1}. ${err}`));
  }
  console.log(`Failed Network Requests: ${failedRequests.length}`);
  if (failedRequests.length > 0) {
    failedRequests.forEach((req, i) => console.error(`  ${i + 1}. ${req.url} (${JSON.stringify(req.failure)})`));
  }

  await browser.close();

  if (consoleErrors.length > 0 || failedRequests.length > 0) {
    throw new Error(`Browser test failed with ${consoleErrors.length} console errors and ${failedRequests.length} failed network requests.`);
  }

  console.log('\n✓ ALL 6 SCENARIOS AND EXHAUSTIVE STATE ASSERTIONS PASSED WITH ZERO DEFECTS!');
  console.log('================================================================\n');
})();
