const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyRefinement() {
  console.log('Launching browser to test Gomikin Catalogue Refinement & Focus Inspection...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Gomikin') || text.includes('Focus') || text.includes('USDZ')) {
      console.log(`[Browser Console]: ${text}`);
    }
  });

  page.on('pageerror', err => console.error('[Browser Error]:', err.message));

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for Gomikin animation system...');
  await page.waitForFunction(() => !!window.gomikinAnimation && !!window.componentRegistry, { timeout: 60000 });
  console.log('Gomikin animation is ready!');

  const cdp = await page.context().newCDPSession(page);

  async function snap(filename) {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const dest = path.resolve('scratch', filename);
    fs.writeFileSync(dest, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot: ${dest}`);
  }

  // --- STEP 1: INITIAL STATE & HIDDEN PANEL CHECK ---
  console.log('\n--- Step 1: Initial State & Hidden Dashboard Check ---');
  const initialCheck = await page.evaluate(() => {
    const rightPanel = document.getElementById('gomikin-right-panel');
    const isRightPanelHidden = !rightPanel || rightPanel.style.display === 'none';
    const anim = window.gomikinAnimation;
    const btn = document.getElementById('btn-dissect-gomikin');

    return {
      state: anim.state(),
      progress: anim.progress(),
      isRightPanelHidden,
      buttonText: btn ? btn.textContent.trim() : null
    };
  });
  console.log('Initial Check:', initialCheck);

  // --- STEP 2: DISSECT TO SPACIOUS CATALOGUE GRID ---
  console.log('\n--- Step 2: Progress to Spacious 3D Catalogue ---');
  const catalogueCheck = await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    anim.progress(1.0); // jump to catalogue
    anim.controller.update(0.016);
    if (window.renderer && window.scene && window.camera) {
      window.renderer.render(window.scene, window.camera);
    }

    // Inspect label badges bounding rects
    const badges = Array.from(document.querySelectorAll('.gomikin-catalogue-badge'));
    const rects = badges.map(b => {
      const r = b.getBoundingClientRect();
      const title = b.querySelector('.badge-title');
      return {
        id: b.id,
        title: title ? title.textContent : '',
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
        opacity: parseFloat(b.style.opacity || '1')
      };
    });

    // Check for any overlaps between badges
    const overlaps = [];
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const isOverlapping = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
        if (isOverlapping) {
          overlaps.push({ a: a.title, b: b.title });
        }
      }
    }

    return {
      state: anim.state(),
      totalBadges: badges.length,
      overlapsCount: overlaps.length,
      overlaps,
      badgesSample: rects.slice(0, 5)
    };
  });

  console.log('Catalogue Check:', catalogueCheck);
  await page.waitForTimeout(500);
  await snap('refinement_01_clean_catalogue.png');

  // --- STEP 3: FOCUS & ZOOM A SENSOR COMPONENT ---
  console.log('\n--- Step 3: Focus Component (Ultrasonic Sensor) ---');
  const focusCheck = await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    anim.focus('ultrasonic_sensor');

    // Run animation frames to let focus transition complete
    for (let f = 0; f < 30; f++) {
      anim.controller.update(0.033);
    }
    if (window.renderer && window.scene && window.camera) {
      window.renderer.render(window.scene, window.camera);
    }

    const reg = window.componentRegistry;
    const mesh = reg.get('ultrasonic_sensor');
    const hud = document.getElementById('gomikin-inspection-hud');
    const focusedBadge = document.getElementById('badge-ultrasonic_sensor');

    return {
      focusedName: anim.focusController.focusedName,
      focusProgress: anim.focusController.focusProgress,
      meshScale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
      meshPos: [mesh.position.x, mesh.position.y, mesh.position.z],
      isHudVisible: hud && hud.classList.contains('hud-visible'),
      focusedBadgeHasClass: focusedBadge && focusedBadge.classList.contains('badge-focused')
    };
  });

  console.log('Focus Check:', focusCheck);
  await page.waitForTimeout(500);
  await snap('refinement_02_focused_component.png');

  // --- STEP 4: CAD INSPECTION CONTROLS (ROTATION & ZOOM) ---
  console.log('\n--- Step 4: CAD Inspection Controls (Orbit & Zoom) ---');
  const cadCheck = await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    const fc = anim.focusController;

    // Apply Orbit rotation (Yaw: 45 deg, Pitch: 25 deg)
    fc.targetOrbit.x = 0.85;
    fc.targetOrbit.y = 0.45;
    // Apply Zoom
    fc.targetZoom = 1.6;

    // Run animation frames
    for (let f = 0; f < 30; f++) {
      fc.update(0.033);
      anim.controller.update(0.033);
    }
    if (window.renderer && window.scene && window.camera) {
      window.renderer.render(window.scene, window.camera);
    }

    const mesh = window.componentRegistry.get('ultrasonic_sensor');
    return {
      orbit: [fc.focusOrbit.x, fc.focusOrbit.y],
      zoom: fc.focusZoom,
      currentScale: mesh.scale.x,
      meshRotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z]
    };
  });

  console.log('CAD Controls Check:', cadCheck);
  await page.waitForTimeout(500);
  await snap('refinement_03_rotated_inspection.png');

  // --- STEP 5: RETURN TO CATALOGUE ---
  console.log('\n--- Step 5: Unfocus and Return to Catalogue ---');
  const returnCheck = await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    anim.unfocus();

    // Run animation frames to complete return
    for (let f = 0; f < 45; f++) {
      anim.controller.update(0.033);
    }
    if (window.renderer && window.scene && window.camera) {
      window.renderer.render(window.scene, window.camera);
    }

    const mesh = window.componentRegistry.get('ultrasonic_sensor');
    const hud = document.getElementById('gomikin-inspection-hud');

    return {
      focusedName: anim.focusController.focusedName,
      focusProgress: anim.focusController.focusProgress,
      meshScale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
      isHudVisible: hud && hud.classList.contains('hud-visible')
    };
  });
  console.log('Return Check:', returnCheck);

  // --- STEP 6: RESET GOMIKIN TO ORIGINAL FUSION TRANSFORMS ---
  console.log('\n--- Step 6: Full Reset to Original Fusion Transforms ---');
  const resetCheck = await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    anim.reset(true); // instant reset
    anim.controller.update(0.016);
    if (window.renderer && window.scene && window.camera) {
      window.renderer.render(window.scene, window.camera);
    }

    const verification = anim.verify();
    const btn = document.getElementById('btn-dissect-gomikin');
    const labels = document.getElementById('gomikin-catalogue-labels');

    return {
      verification,
      state: anim.state(),
      progress: anim.progress(),
      buttonText: btn ? btn.textContent.trim() : null,
      labelsHidden: labels ? labels.style.display === 'none' : true
    };
  });
  console.log('Reset Check:', resetCheck);
  await page.waitForTimeout(500);
  await snap('refinement_04_restored_assembled.png');

  // Save report
  fs.writeFileSync(
    path.resolve('scratch', 'refinement_verification_report.json'),
    JSON.stringify({ initialCheck, catalogueCheck, focusCheck, cadCheck, returnCheck, resetCheck }, null, 2)
  );

  await browser.close();
  console.log('\nAll refinement tests and screenshots completed successfully!');
}

verifyRefinement().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
