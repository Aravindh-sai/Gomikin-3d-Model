const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyInteractiveDissection() {
  console.log('Launching browser to test Gomikin Interactive Dissection & 3D Catalogue...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Gomikin') || text.includes('Dissection') || text.includes('USDZ')) {
      console.log(`[Browser Console]: ${text}`);
    }
  });

  page.on('pageerror', err => console.error('[Browser Error]:', err.message));

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for window.gomikinAnimation to load...');
  await page.waitForFunction(() => !!window.gomikinAnimation && !!window.componentRegistry, { timeout: 60000 });
  console.log('window.gomikinAnimation is ready!');

  // Helper function to capture canvas image
  async function captureCanvas(filename) {
    const dataUrl = await page.evaluate(() => {
      if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
      }
      const canvas = document.querySelector('#app-canvas');
      return canvas ? canvas.toDataURL('image/png') : null;
    });
    if (dataUrl) {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const filePath = path.resolve('scratch', filename);
      fs.writeFileSync(filePath, base64Data, 'base64');
      console.log(`Saved screenshot: ${filePath}`);
    }
  }

  // --- STEP 1: VERIFY INITIAL ASSEMBLED STATE ---
  console.log('\n--- Step 1: Initial Assembled State ---');
  const initialCheck = await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    const btn = document.getElementById('btn-dissect-gomikin');
    const labels = document.getElementById('gomikin-catalogue-labels');
    return {
      state: anim.state(),
      progress: anim.progress(),
      buttonText: btn ? btn.textContent.trim() : null,
      labelsVisible: labels && labels.style.display !== 'none'
    };
  });
  console.log('Initial Check:', initialCheck);
  await captureCanvas('01_assembled_state.png');

  // --- STEP 2: TRIGGER DISSECTION VIA PRIMARY BUTTON ---
  console.log('\n--- Step 2: Trigger Dissection Click ---');
  const clickCheck = await page.evaluate(() => {
    const btn = document.getElementById('btn-dissect-gomikin');
    btn.click();
    const anim = window.gomikinAnimation;
    return {
      stateAfterClick: anim.state(),
      isPlaying: anim.controller.isPlaying
    };
  });
  console.log('Click Check:', clickCheck);

  // --- STEP 3: CAPTURE MID-DISSECTION (PHASE 1 DISASSEMBLY) ---
  console.log('\n--- Step 3: Mid-Dissection Evaluation ---');
  const midCheck = await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    anim.pause();
    anim.progress(0.40); // 40% into cinematic disassembly
    return {
      state: anim.state(),
      progress: anim.progress()
    };
  });
  console.log('Mid Dissection Check:', midCheck);
  await captureCanvas('02_mid_dissection.png');

  // --- STEP 4: PROGRESS TO FULL CATALOGUE (PHASE 2) ---
  console.log('\n--- Step 4: Full 3D Catalogue Evaluation ---');
  const catalogueCheck = await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    const reg = window.componentRegistry;
    anim.progress(1.0); // 100% full catalogue grid

    const btn = document.getElementById('btn-dissect-gomikin');
    const labelContainer = document.getElementById('gomikin-catalogue-labels');
    const badges = document.querySelectorAll('.gomikin-catalogue-badge');

    // Check positions of all 33 components
    const componentStats = [];
    for (const name of reg.getNames()) {
      const mesh = reg.get(name);
      const entry = reg.getEntry(name);
      componentStats.push({
        name,
        localPos: [mesh.position.x, mesh.position.y, mesh.position.z],
        hasMoved: mesh.position.distanceTo(entry.initialPosition) > 10 // moved more than 10mm
      });
    }

    // Check label badges
    const visibleBadges = [];
    badges.forEach(b => {
      const title = b.querySelector('.badge-title');
      const group = b.querySelector('.badge-group');
      visibleBadges.push({
        id: b.id,
        title: title ? title.textContent : '',
        group: group ? group.textContent : '',
        opacity: parseFloat(b.style.opacity || '0')
      });
    });

    return {
      state: anim.state(),
      progress: anim.progress(),
      buttonText: btn ? btn.textContent.trim() : null,
      labelContainerDisplay: labelContainer ? labelContainer.style.display : null,
      totalBadges: badges.length,
      allComponentsMoved: componentStats.every(c => c.hasMoved),
      totalComponentsAnimated: componentStats.filter(c => c.hasMoved).length,
      badgesSample: visibleBadges.slice(0, 5)
    };
  });
  console.log('Catalogue Check:', catalogueCheck);
  await captureCanvas('03_final_catalogue.png');

  // --- STEP 5: RESET VIA PRIMARY BUTTON ---
  console.log('\n--- Step 5: Reset to Initial Assembly ---');
  const resetCheck = await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    const reg = window.componentRegistry;
    const btn = document.getElementById('btn-dissect-gomikin');

    // Trigger instant reset to check bitwise baseline preservation
    anim.reset(true);

    const labels = document.getElementById('gomikin-catalogue-labels');

    let allTransformsMatch = true;
    const mismatches = [];

    for (const entry of reg.getEntries()) {
      const mesh = entry.mesh;
      const initialPos = entry.initialPosition;
      const initialRot = entry.initialRotation;

      const posDiff = mesh.position.distanceTo(initialPos);
      const rotDiff = Math.abs(mesh.rotation.x - initialRot.x) +
                      Math.abs(mesh.rotation.y - initialRot.y) +
                      Math.abs(mesh.rotation.z - initialRot.z);

      if (posDiff > 1e-5 || rotDiff > 1e-5) {
        allTransformsMatch = false;
        mismatches.push({ name: entry.name, posDiff, rotDiff });
      }
    }

    return {
      stateAfterReset: anim.state(),
      progressAfterReset: anim.progress(),
      buttonText: btn ? btn.textContent.trim() : null,
      labelsHidden: labels && (labels.style.display === 'none' || labels.style.opacity === '0'),
      allTransformsMatch,
      mismatchesCount: mismatches.length,
      totalComponentsVerified: reg.getEntries().length
    };
  });
  console.log('Reset Check:', resetCheck);
  await captureCanvas('04_restored_assembled.png');

  const report = {
    initialCheck,
    clickCheck,
    midCheck,
    catalogueCheck,
    resetCheck
  };

  fs.writeFileSync('scratch/interactive_dissection_report.json', JSON.stringify(report, null, 2));
  console.log('Saved scratch/interactive_dissection_report.json');

  await browser.close();

  const success = (
    initialCheck.state === 'ASSEMBLED' &&
    catalogueCheck.state === 'EXPLODED' &&
    catalogueCheck.allComponentsMoved &&
    catalogueCheck.totalComponentsAnimated === 33 &&
    catalogueCheck.totalBadges === 33 &&
    resetCheck.stateAfterReset === 'ASSEMBLED' &&
    resetCheck.allTransformsMatch &&
    resetCheck.totalComponentsVerified === 33
  );

  return { success, report };
}

verifyInteractiveDissection()
  .then(({ success, report }) => {
    console.log('\n=======================================');
    console.log('INTERACTIVE DISSECTION TEST RESULT:', success ? 'ALL PASSED' : 'FAILED');
    console.log('=======================================');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });
