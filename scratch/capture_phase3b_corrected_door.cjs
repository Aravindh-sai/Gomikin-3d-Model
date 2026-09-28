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

  // Toggle labels off for clean visual inspection of geometry & hinges
  const btnLabels = await page.$('#btn-toggle-labels');
  if (btnLabels) {
    await btnLabels.click();
    await page.waitForTimeout(200);
  }

  // Position camera directly facing the Leftover Food Access Door (+X, +Z quadrant)
  // Corner A is at (10mm, 700mm, 246mm), Corner B is at (246mm, 700mm, 10mm)
  // Chord midpoint is at (128mm, 700mm, 128mm)
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(0.44, 0.86, 0.44);
      ctrl.target.set(0.128, 0.74, 0.128);
      ctrl.update();
    }
  });
  await page.waitForTimeout(400);

  const angles = [0, 30, 55, 90];

  for (const deg of angles) {
    await page.evaluate((angle) => {
      const env = window.gomikinEnvelope;
      if (env && env.setLeftoverFoodDoorAngle) {
        env.setLeftoverFoodDoorAngle(angle);
      } else {
        const doorPivot = env?.getObjectByName('LeftoverFoodDoor_Pivot') || env?.getObjectByName('LeftoverFoodAccessDoor_Hinge');
        if (doorPivot) {
          doorPivot.rotation.x = angle * Math.PI / 180;
          doorPivot.updateMatrixWorld(true);
        }
      }
    }, deg);

    await page.waitForTimeout(400);

    let filename = `door_kinematic_${deg}deg.png`;
    if (deg === 55) {
      filename = `door_kinematic_55deg_ramp.png`;
    }
    const fullPath = `${artifactDir}/${filename}`;
    await page.screenshot({ path: fullPath });
    console.log(`Saved screenshot at ${deg}°: ${filename}`);
  }

  // Also capture a closer hinge detail screenshot at 55° (focusing on Corner A and Corner B)
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(0.28, 0.78, 0.32);
      ctrl.target.set(0.128, 0.705, 0.128);
      ctrl.update();
    }
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/door_kinematic_55deg_hinge_detail.png` });
  console.log('Saved door_kinematic_55deg_hinge_detail.png');

  // Reset to 0°
  await page.evaluate(() => {
    const env = window.gomikinEnvelope;
    if (env && env.setLeftoverFoodDoorAngle) {
      env.setLeftoverFoodDoorAngle(0);
    }
  });

  await browser.close();
  console.log('All visual screenshots captured successfully!');
})();
