const { chromium } = require('c:/Dev/Gomikin-3d/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const artifactDir = 'c:/Users/ARAVINDH/.gemini/antigravity-ide/brain/772ebe41-7f11-48bc-8649-67c1b64aafaa';

  // 1. Hide shell
  await page.click('#btn-shell-hidden');
  await page.waitForTimeout(400);

  // 2. Position camera to view from +X looking directly at the divider between Inorganic and Leftover Food
  await page.evaluate(() => {
    // We can access camera & controls through window.demoController or manipulate camera
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(1.5, 0.5, 0.01);
      ctrl.target.set(0, 0.35, 0);
      ctrl.update();
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/phase2c_side_split_view.png` });

  // 3. Position camera looking directly at Inorganic Sector (+X, -Z)
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(1.1, 0.6, -1.1);
      ctrl.target.set(0, 0.35, 0);
      ctrl.update();
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/phase2c_inorganic_focus.png` });

  await browser.close();
  console.log('Extra views captured!');
})();
