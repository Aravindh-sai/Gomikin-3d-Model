const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/ARAVINDH/.gemini/antigravity-ide/brain/34958df2-adc3-4852-9428-dec5da174ea9';

(async () => {
  console.log('--- Verifying Refined Gomikin Animation Flow & Catalogue Visibility ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  page.setDefaultTimeout(90000);
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('warning') || text.includes('Warning')) {
      console.log('[Browser Console]:', text);
    }
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 90000 });

  await page.waitForFunction(() => {
    return window.gomikinAnimation && 
           window.gomikinAnimation.controller && 
           window.componentRegistry && 
           window.componentRegistry.getNames().length === 33;
  }, { timeout: 90000 });

  const cdp = await page.context().newCDPSession(page);
  async function snap(name) {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const filepath = path.join(ARTIFACT_DIR, `${name}.png`);
    fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot: ${name}.png`);
  }

  // 1. Initial Assembled State
  console.log('\n[State 1] Assembled Initial State (p = 0.0):');
  await page.evaluate(() => {
    window.gomikinAnimation.reset(true);
    window.scene.updateMatrixWorld(true);
    window.camera.updateMatrixWorld(true);
  });
  await snap('01_refined_assembled_state');

  // 2. Phase 1 Mechanical Disassembly (p = 0.35)
  console.log('\n[State 2] Phase 1 Disassembly (p = 0.35):');
  await page.evaluate(() => {
    window.gomikinAnimation.progress(0.35);
    window.scene.updateMatrixWorld(true);
    window.camera.updateMatrixWorld(true);
  });
  await snap('02_refined_mid_disassembly');

  // 3. Phase 2 Dramatic Hold (p = 0.50)
  console.log('\n[State 3] Phase 2 Dramatic Hold (p = 0.50):');
  await page.evaluate(() => {
    window.gomikinAnimation.progress(0.50);
    window.scene.updateMatrixWorld(true);
    window.camera.updateMatrixWorld(true);
  });
  await snap('03_refined_hold_explosion');

  // 4. Phase 3 Catalogue Grid (p = 1.00)
  console.log('\n[State 4] Phase 3 Final Catalogue Grid (p = 1.00):');
  const catalogueReport = await page.evaluate(() => {
    window.gomikinAnimation.progress(1.0);
    window.scene.updateMatrixWorld(true);
    window.camera.updateMatrixWorld(true);

    const reg = window.componentRegistry;
    const names = reg.getNames();
    const items = [];

    for (const name of names) {
      const mesh = reg.get(name);
      const box = new THREE.Box3().setFromObject(mesh);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const screenPos = center.clone().project(window.camera);
      const screenX = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const screenY = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

      items.push({
        name,
        scale: mesh.scale.x,
        visualSizeWorld: {
          x: size.x.toFixed(3),
          y: size.y.toFixed(3),
          z: size.z.toFixed(3),
          maxDim: Math.max(size.x, size.y, size.z).toFixed(3)
        },
        screen: {
          x: screenX.toFixed(1),
          y: screenY.toFixed(1)
        }
      });
    }

    // Check button position vs bottom row
    const btn = document.getElementById('btn-dissect-gomikin');
    const btnRect = btn ? btn.getBoundingClientRect() : null;

    return {
      items,
      btnRect: btnRect ? { top: btnRect.top, bottom: btnRect.bottom, left: btnRect.left, right: btnRect.right } : null
    };
  });

  console.log(`Catalogue Report (all 33 items):`);
  catalogueReport.items.forEach(i => {
    console.log(` - ${i.name.padEnd(30)}: maxDim=${i.visualSizeWorld.maxDim}m, screen=(${i.screen.x}, ${i.screen.y})`);
  });
  console.log('Button rect:', catalogueReport.btnRect);

  await snap('04_refined_catalogue_grid');

  // 5. Test Component Detail View on a small component (motor_support)
  console.log('\n[State 5] Entering Detail View for "motor_support"...');
  await page.evaluate(() => {
    window.gomikinAnimation.enterDetail('motor_support');
    window.scene.updateMatrixWorld(true);
    window.camera.updateMatrixWorld(true);
  });
  await page.waitForTimeout(600);
  await snap('05_refined_detail_view');

  // 6. Exit Detail View back to catalogue
  console.log('\n[State 6] Exiting Detail View back to Catalogue...');
  await page.evaluate(() => {
    window.gomikinAnimation.exitDetail(true);
    window.scene.updateMatrixWorld(true);
    window.camera.updateMatrixWorld(true);
  });
  await page.waitForTimeout(300);
  await snap('06_refined_catalogue_restored');

  // 7. Reset back to Assembled State and verify precision
  console.log('\n[State 7] Resetting to Assembled State...');
  const verifyResult = await page.evaluate(() => {
    window.gomikinAnimation.reset(true);
    window.scene.updateMatrixWorld(true);
    window.camera.updateMatrixWorld(true);
    return window.gomikinAnimation.verify();
  });
  console.log('Verification Report after Reset:', verifyResult);
  await snap('07_refined_final_assembled');

  console.log('\n--- All Refinement Verifications Completed Successfully ---');
  await browser.close();
})();
