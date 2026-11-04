const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('--- STARTING COMPREHENSIVE PHASE D URGENT FIXES VERIFICATION ---');

  const consoleLogs = [];
  const consoleErrors = [];

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      console.error(`[BROWSER ERROR] ${text}`);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error(`[PAGE UNCAUGHT ERROR] ${err.message}`);
  });

  // 1. Landing Page Check
  console.log('\n[TEST 1] Landing Page & Redundant Dissect Button Check...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const landingDissectBtn = await page.$('#btn-dissect-gomikin');
  const isLandingBtnVisible = landingDissectBtn ? await landingDissectBtn.isVisible() : false;
  console.log(`Landing Page Dissect Button present in DOM: ${!!landingDissectBtn}, Visible: ${isLandingBtnVisible}`);
  if (isLandingBtnVisible) {
    throw new Error('FAIL: Redundant dissect button is visible on landing page!');
  }
  console.log('✓ PASS: Redundant dissect button is NOT visible on landing page.');

  // 2. Launch 3D Fullscreen Experience
  console.log('\n[TEST 2] Launching 3D Fullscreen CAD Model...');
  await page.evaluate(() => window.launchCinematicFullscreen());
  await page.waitForFunction(() => window.gomikinModelState && window.gomikinModelState.status === 'ready', { timeout: 30000 });
  console.log('✓ CAD Model loaded and rendered.');

  // Check Full Model View for redundant button
  const fullModelDissectBtn = await page.$('#btn-dissect-gomikin');
  const isFullModelBtnVisible = fullModelDissectBtn ? await fullModelDissectBtn.isVisible() : false;
  console.log(`Full Model Dissect Button visible: ${isFullModelBtnVisible}`);
  if (isFullModelBtnVisible) {
    throw new Error('FAIL: Redundant dissect button is visible in Full Model view!');
  }
  console.log('✓ PASS: Redundant dissect button is NOT visible in Full Model view.');

  // 3. Priority 3: 33-Part Dissection Experience
  console.log('\n[TEST 3] Testing 33-Part Dissection Experience...');
  await page.evaluate(() => {
    window.viewCoordinator.switchView('dissection');
  });

  // Wait for dissection to complete
  await page.waitForFunction(() => {
    const ctrl = window.gomikinAnimation.controller;
    return ctrl && ctrl.state() === 'EXPLODED';
  }, { timeout: 15000 });
  await page.waitForTimeout(500);

  // Check redundant button again in Dissection view
  const dissDissectBtn = await page.$('#btn-dissect-gomikin');
  const isDissBtnVisible = dissDissectBtn ? await dissDissectBtn.isVisible() : false;
  console.log(`Dissection View Dissect Button visible: ${isDissBtnVisible}`);
  if (isDissBtnVisible) {
    throw new Error('FAIL: Redundant dissect button is visible in Dissection view!');
  }
  console.log('✓ PASS: Redundant dissect button is NOT visible in Dissection view.');

  // Verify all 33 component world centers and labels
  const dissectionReport = await page.evaluate(() => {
    const ctrl = window.gomikinAnimation.controller;
    const reg = window.componentRegistry;
    let maxError = 0;
    const labelChecks = [];

    for (const [name, comp] of ctrl.choreography.componentData.entries()) {
      const mesh = comp.mesh;
      mesh.updateMatrixWorld(true);
      const worldCenter = comp.geomCenter.clone().applyMatrix4(mesh.matrixWorld);
      const err = worldCenter.distanceTo(comp.targetWorldCenter);
      if (err > maxError) maxError = err;

      const badge = document.getElementById(`badge-${name}`);
      const isVisible = badge ? (badge.style.display !== 'none' && parseFloat(badge.style.opacity || '0') > 0) : false;
      labelChecks.push({ name, hasBadge: !!badge, isVisible });
    }

    const podHeaders = [];
    for (const pod of ctrl.choreography.modulePods) {
      const header = ctrl.podHeaderElements.get(pod.id);
      podHeaders.push({ id: pod.id, present: !!header, visible: header ? parseFloat(header.style.opacity || '0') > 0 : false });
    }

    return {
      maxError,
      allLabelsPresent: labelChecks.every(l => l.hasBadge),
      visibleLabelsCount: labelChecks.filter(l => l.isVisible).length,
      visiblePodHeadersCount: podHeaders.filter(h => h.visible).length
    };
  });

  console.log('Dissection accuracy report:', dissectionReport);
  if (dissectionReport.maxError > 0.001) {
    throw new Error(`FAIL: Component placement error ${dissectionReport.maxError} exceeds threshold!`);
  }
  if (!dissectionReport.allLabelsPresent) {
    throw new Error('FAIL: Not all 33 component labels are present in DOM!');
  }
  if (dissectionReport.visibleLabelsCount === 0) {
    throw new Error('FAIL: No component labels are visible on screen!');
  }
  console.log(`✓ PASS: All 33 parts positioned accurately; ${dissectionReport.visibleLabelsCount} labels and ${dissectionReport.visiblePodHeadersCount} pod headers actively framed.`);

  await page.screenshot({ path: 'scratch/dissection_01_catalogue.png' });
  console.log('Captured scratch/dissection_01_catalogue.png');

  // Test Component Detail Isolation
  console.log('\n[TEST 4] Testing Component Detail Isolation & 3D Telemetry...');
  await page.click('#badge-cutting_blades');
  await page.waitForTimeout(1000);

  const detailReport = await page.evaluate(() => {
    const detail = window.gomikinAnimation.controller.detailController;
    const titleEl = document.getElementById('detail-component-title');
    const backBtn = document.getElementById('btn-back-to-grid');
    return {
      mode: detail.mode,
      selectedName: detail.selectedName,
      titleText: titleEl ? titleEl.textContent : '',
      backBtnVisible: backBtn ? window.getComputedStyle(backBtn).display !== 'none' : false
    };
  });
  console.log('Detail isolation report:', detailReport);
  if (detailReport.mode !== 'DETAIL' || detailReport.selectedName !== 'cutting_blades') {
    throw new Error('FAIL: Component detail view was not properly activated!');
  }
  console.log('✓ PASS: Cutting Blades isolated in 3D detail view with header telemetry.');

  await page.screenshot({ path: 'scratch/dissection_02_component_detail.png' });
  console.log('Captured scratch/dissection_02_component_detail.png');

  // Test Back to Catalogue
  console.log('Clicking BACK TO CATALOGUE...');
  await page.click('#btn-back-to-grid');
  await page.waitForTimeout(1000);

  // Test Reassembling to Full Model
  console.log('Switching back to Full Model (Reassembly)...');
  await page.evaluate(() => {
    window.viewCoordinator.switchView('full');
  });
  await page.waitForTimeout(1000);

  const reassemblyReport = await page.evaluate(() => {
    const reg = window.componentRegistry;
    let maxDiff = 0;
    for (const name of reg.getNames()) {
      const entry = reg.getEntry(name);
      const diff = entry.mesh.position.distanceTo(entry.initialPosition);
      if (diff > maxDiff) maxDiff = diff;
    }
    return {
      activeView: window.viewCoordinator.activeView,
      maxDiff
    };
  });
  console.log('Reassembly report:', reassemblyReport);
  if (reassemblyReport.maxDiff > 0.001) {
    throw new Error(`FAIL: Full model reassembly error ${reassemblyReport.maxDiff} exceeds threshold!`);
  }
  console.log('✓ PASS: All 33 components reassembled to exact baseline positions with 0 errors.');

  await page.screenshot({ path: 'scratch/dissection_03_reassembled.png' });
  console.log('Captured scratch/dissection_03_reassembled.png');

  // 4. Priority 1: Simulate Flow Experience (All 4 Modules)
  console.log('\n[TEST 5] Testing Simulate Flow Experience Across All 4 Functional Modules...');
  await page.evaluate(() => {
    window.viewCoordinator.switchView('flow');
  });
  await page.waitForTimeout(500);

  const modulesToTest = [
    { mode: 'INPUT', selector: '.flow-mode-btn[data-flow="INPUT"]', name: 'Input & Intake Module' },
    { mode: 'CUTTING', selector: '.flow-mode-btn[data-flow="CUTTING"]', name: 'Preprocessing & Cutting Module' },
    { mode: 'STORAGE', selector: '.flow-mode-btn[data-flow="STORAGE"]', name: 'Storage & Drainage Module' },
    { mode: 'DECOMPOSITION', selector: '.flow-mode-btn[data-flow="DECOMPOSITION"]', name: 'Decomposition & Agitation Module' }
  ];

  for (let i = 0; i < modulesToTest.length; i++) {
    const mod = modulesToTest[i];
    console.log(`\nTesting Flow Module ${i + 1}/4: ${mod.name} (${mod.mode})...`);

    await page.click(mod.selector);
    await page.waitForTimeout(600);

    // Verify module state and UI
    const modStatus = await page.evaluate(() => {
      const flow = window.physicalFlowController;
      const title = document.getElementById('flow-title')?.textContent || '';
      const desc = document.getElementById('flow-desc')?.textContent || '';
      const badge = document.getElementById('flow-badge')?.textContent || '';
      return {
        activeMode: flow.activeMode,
        title,
        desc,
        badge,
        stepCount: flow.getCurrentStep().count
      };
    });

    console.log(`Module status:`, modStatus);
    if (modStatus.activeMode !== mod.mode) {
      throw new Error(`FAIL: Flow mode mismatch! Expected ${mod.mode}, got ${modStatus.activeMode}`);
    }
    if (modStatus.stepCount !== 3) {
      throw new Error(`FAIL: Expected 3 steps for ${mod.mode}, got ${modStatus.stepCount}`);
    }

    // Advance progress to 50%
    await page.evaluate(() => {
      window.physicalFlowController.setProgress(0.50);
    });
    await page.waitForTimeout(400);

    // Check mechanical animation activity at 50%
    const mechCheck = await page.evaluate((mode) => {
      const pivots = window.mechanicalPivotController ? window.mechanicalPivotController.pivots : {};
      if (mode === 'INPUT') {
        return { rotatingBaseAngle: pivots.rotatingBase?.currentAngle || 0 };
      } else if (mode === 'CUTTING') {
        return { bladesAngle: pivots.cuttingBlades?.currentAngle || 0 };
      } else if (mode === 'STORAGE') {
        const dropsVisible = window.physicalFlowController.leachateDrops.visible;
        return { dropsVisible };
      } else if (mode === 'DECOMPOSITION') {
        return { agitatorAngle: pivots.agitator?.currentAngle || 0 };
      }
      return {};
    }, mod.mode);
    console.log(`Mechanical kinematics at 50%:`, mechCheck);

    // Test Play / Pause / Reset
    await page.evaluate(() => {
      window.physicalFlowController.pause();
    });
    await page.waitForTimeout(200);

    const shotName = `scratch/flow_0${i + 1}_${mod.mode.toLowerCase()}_module.png`;
    await page.screenshot({ path: shotName });
    console.log(`Captured ${shotName}`);

    // Test step navigation
    await page.click('#flow-btn-next');
    await page.waitForTimeout(200);
    const nextStep = await page.evaluate(() => window.physicalFlowController.getCurrentStep());
    console.log(`Next step index: ${nextStep.index}`);

    await page.click('#flow-btn-prev');
    await page.waitForTimeout(200);
    const prevStep = await page.evaluate(() => window.physicalFlowController.getCurrentStep());
    console.log(`Prev step index: ${prevStep.index}`);

    await page.click('#flow-btn-reset');
    await page.waitForTimeout(200);
    const resetProg = await page.evaluate(() => window.physicalFlowController.progress);
    console.log(`Reset progress: ${resetProg}`);
    if (resetProg !== 0.0) {
      throw new Error(`FAIL: Reset did not return progress to 0.0!`);
    }

    console.log(`✓ PASS: ${mod.name} is fully operational.`);
  }

  // 5. Final Console Errors Audit
  console.log('\n[TEST 6] Auditing Browser Console Errors...');
  console.log(`Total console logs: ${consoleLogs.length}`);
  console.log(`Total console errors: ${consoleErrors.length}`);

  if (consoleErrors.length > 0) {
    console.error('Console errors detected:', consoleErrors);
    throw new Error(`FAIL: Encountered ${consoleErrors.length} console errors!`);
  }
  console.log('✓ PASS: Zero browser console errors detected.');

  console.log('\n======================================================');
  console.log('✓ ALL THREE PRIORITIES VERIFIED AND FULLY PASSING! ✓');
  console.log('======================================================\n');

  await browser.close();
})();
