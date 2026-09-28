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

  // Toggle labels off for clean visualization
  const btnLabels = await page.$('#btn-toggle-labels');
  if (btnLabels) {
    await btnLabels.click();
    await page.waitForTimeout(200);
  }

  // 1. View Door in Closed Position (Looking from +X, +Z front corner toward Leftover Food door)
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(0.42, 0.85, 0.42);
      ctrl.target.set(0.13, 0.75, 0.13);
      ctrl.update();
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/door_inspection_closed.png` });
  console.log('Saved door_inspection_closed.png');

  // 2. View Door in Open Ramp Position (Open 55 degrees)
  await page.evaluate(() => {
    const env = window.gomikinEnvelope;
    const doorHinge = env?.getObjectByName('LeftoverFoodAccessDoor_Hinge');
    if (doorHinge) {
      doorHinge.rotation.x = 55 * Math.PI / 180;
      doorHinge.updateMatrixWorld(true);
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/door_inspection_open_55deg.png` });
  console.log('Saved door_inspection_open_55deg.png');

  // 3. Close door again
  await page.evaluate(() => {
    const env = window.gomikinEnvelope;
    const doorHinge = env?.getObjectByName('LeftoverFoodAccessDoor_Hinge');
    if (doorHinge) {
      doorHinge.rotation.x = 0;
      doorHinge.updateMatrixWorld(true);
    }
  });

  await browser.close();
  console.log('Door inspection screenshots captured successfully!');
})();
