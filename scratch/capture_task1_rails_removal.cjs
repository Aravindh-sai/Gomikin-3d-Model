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

  // Toggle labels off for clear visualization
  const btnLabels = await page.$('#btn-toggle-labels');
  if (btnLabels) {
    await btnLabels.click();
    await page.waitForTimeout(200);
  }

  // 1. Capture Inorganic Chamber / Drawer area
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(0.55, 0.45, -0.35);
      ctrl.target.set(0.12, 0.28, -0.12);
      ctrl.update();
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${artifactDir}/task1_inorganic_rails_removed.png` });
  console.log('Saved task1_inorganic_rails_removed.png');

  // 2. Capture Leftover Food Chamber / Drawer area
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(0.35, 0.45, 0.55);
      ctrl.target.set(0.12, 0.28, 0.12);
      ctrl.update();
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${artifactDir}/task1_leftover_rails_removed.png` });
  console.log('Saved task1_leftover_rails_removed.png');

  // 3. Capture Decomposition Drawer area
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(-0.55, 0.45, 0.0);
      ctrl.target.set(-0.12, 0.24, 0.0);
      ctrl.update();
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${artifactDir}/task1_decomp_runners_removed.png` });
  console.log('Saved task1_decomp_runners_removed.png');

  await browser.close();
  console.log('Task 1 visual verification screenshots captured successfully!');
})();
