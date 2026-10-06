const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyAnimationSystem() {
  console.log('Launching browser to test Gomikin Animation System...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Gomikin') || text.includes('USDZ') || text.includes('Dissection') || text.includes('Status:')) {
      console.log(`[Browser Console]: ${text}`);
    }
  });

  page.on('pageerror', err => console.error('[Browser PageError]:', err.message));

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for window.gomikinAnimation to initialize...');
  await page.waitForFunction(() => !!window.gomikinAnimation && !!window.componentRegistry, { timeout: 60000 });
  console.log('window.gomikinAnimation is ready!');

  // 1. Verify Developer API existence and signatures
  const apiCheck = await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    return {
      hasPlay: typeof anim.play === 'function',
      hasPause: typeof anim.pause === 'function',
      hasReset: typeof anim.reset === 'function',
      hasProgress: typeof anim.progress === 'function',
      hasState: typeof anim.state === 'function',
      initialState: anim.state(),
      initialProgress: anim.progress()
    };
  });
  console.log('API Check:', apiCheck);

  // 2. Verify "TEST DISSECTION" button in DOM and click it
  console.log('Verifying TEST DISSECTION button...');
  const buttonCheck = await page.evaluate(async () => {
    const btn = document.getElementById('btn-test-dissection');
    if (!btn) return { found: false };

    const initialText = btn.textContent;
    btn.click();
    await new Promise(r => setTimeout(r, 200));
    const clickedText = btn.textContent;

    return {
      found: true,
      initialText,
      clickedText,
      id: btn.id
    };
  });
  console.log('Button Check:', buttonCheck);

  // 3. Verify State Machine & Reversible Assembly Preservation
  console.log('Testing animation state transitions and transform preservation...');
  const stateAndTransformCheck = await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    const ctrl = anim.controller;
    const reg = window.componentRegistry;

    // Check 1: Initial state must be ASSEMBLED
    const state0 = anim.state();
    const prog0 = anim.progress();

    // Check 2: Calling progress(0.5) transitions state to DISSECTION
    anim.progress(0.5);
    const stateHalf = anim.state();
    const progHalf = anim.progress();

    // Check 3: Calling progress(1.0) transitions state to EXPLODED
    anim.progress(1.0);
    const stateFull = anim.state();
    const progFull = anim.progress();

    // Check 4: Calling reset(false) transitions state to RESETTING
    anim.reset(false);
    const stateResetting = anim.state();

    // Check 5: Calling reset(true) returns to ASSEMBLED and progress 0.0
    anim.reset(true);
    const stateAfterReset = anim.state();
    const progAfterReset = anim.progress();

    // Verify all 33 components have 0.0 offset from their original initial transforms
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

      if (posDiff > 1e-6 || rotDiff > 1e-6) {
        allTransformsMatch = false;
        mismatches.push({ name: entry.name, posDiff, rotDiff });
      }
    }

    return {
      state0,
      prog0,
      stateHalf,
      progHalf,
      stateFull,
      progFull,
      stateResetting,
      stateAfterReset,
      progAfterReset,
      allTransformsMatch,
      mismatchesCount: mismatches.length,
      totalComponentsVerified: reg.getEntries().length
    };
  });
  console.log('State & Transform Check:', stateAndTransformCheck);

  // 4. Capture screenshot of rendered model to confirm assembled visual appearance
  const screenshotPath = path.resolve('scratch', 'animation_system_assembled_render.png');
  const dataUrl = await page.evaluate(() => {
    if (window.renderer && window.scene && window.camera) {
      window.renderer.render(window.scene, window.camera);
    }
    const canvas = document.querySelector('#app-canvas');
    return canvas ? canvas.toDataURL('image/png') : null;
  });

  if (dataUrl) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(screenshotPath, base64Data, 'base64');
    console.log('Render screenshot saved to:', screenshotPath);
  }

  const results = {
    apiCheck,
    buttonCheck,
    stateAndTransformCheck
  };

  fs.writeFileSync('scratch/animation_system_results.json', JSON.stringify(results, null, 2));
  console.log('Saved scratch/animation_system_results.json');

  await browser.close();

  const success = (
    apiCheck.hasPlay &&
    apiCheck.hasPause &&
    apiCheck.hasReset &&
    apiCheck.hasProgress &&
    apiCheck.hasState &&
    buttonCheck.found &&
    stateAndTransformCheck.state0 === 'ASSEMBLED' &&
    stateAndTransformCheck.stateHalf === 'DISSECTION' &&
    stateAndTransformCheck.stateFull === 'EXPLODED' &&
    stateAndTransformCheck.stateResetting === 'RESETTING' &&
    stateAndTransformCheck.stateAfterReset === 'ASSEMBLED' &&
    stateAndTransformCheck.allTransformsMatch &&
    stateAndTransformCheck.totalComponentsVerified === 33
  );

  return { success, results };
}

verifyAnimationSystem()
  .then(({ success, results }) => {
    console.log('\n=======================================');
    console.log('ANIMATION SYSTEM VERIFICATION:', success ? 'ALL PASSED' : 'FAILED');
    console.log('=======================================');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });
