const { chromium } = require('c:/Dev/Gomikin-3d/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('Connecting to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const artifactDir = 'c:/Users/ARAVINDH/.gemini/antigravity-ide/brain/772ebe41-7f11-48bc-8649-67c1b64aafaa';

  // Toggle shell to hidden
  const btnHidden = await page.$('#btn-shell-hidden');
  if (btnHidden) {
    await btnHidden.click();
    await page.waitForTimeout(300);
  }

  // Toggle labels off for clean mechanical visualization
  const btnLabels = await page.$('#btn-toggle-labels');
  if (btnLabels) {
    await btnLabels.click();
    await page.waitForTimeout(300);
  }

  // 1. Default View (Isometric Overview)
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(1.4, 1.2, 1.4);
      ctrl.target.set(0, 0.5, 0);
      ctrl.update();
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/phase3_corrected_default_iso.png` });
  console.log('Saved phase3_corrected_default_iso.png');

  // 2. Decomposition Drawer Extraction View (-X perspective)
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(-1.1, 0.35, 0.2);
      ctrl.target.set(-0.12, 0.18, 0);
      ctrl.update();
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/phase3_corrected_decomp_extraction.png` });
  console.log('Saved phase3_corrected_decomp_extraction.png');

  // 3. Inorganic Drawer Extraction View (+X perspective)
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(1.1, 0.35, -0.6);
      ctrl.target.set(0.12, 0.18, -0.12);
      ctrl.update();
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/phase3_corrected_inorganic_extraction.png` });
  console.log('Saved phase3_corrected_inorganic_extraction.png');

  // 4. Leftover Food Drawer Extraction View (+Z perspective)
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(0.6, 0.35, 1.1);
      ctrl.target.set(0.12, 0.18, 0.12);
      ctrl.update();
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/phase3_corrected_leftover_extraction.png` });
  console.log('Saved phase3_corrected_leftover_extraction.png');

  // 5. Side/Section View checking rim perimeter for zero rail overhang
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(-0.01, 0.12, 1.3);
      ctrl.target.set(0, 0.12, 0);
      ctrl.update();
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/phase3_corrected_side_overhang_check.png` });
  console.log('Saved phase3_corrected_side_overhang_check.png');

  await browser.close();
  console.log('All corrected slide rail views captured!');
})();
