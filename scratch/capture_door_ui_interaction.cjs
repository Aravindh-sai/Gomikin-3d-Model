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

  // Toggle labels off for clear mechanical visualization
  const btnLabels = await page.$('#btn-toggle-labels');
  if (btnLabels) {
    await btnLabels.click();
    await page.waitForTimeout(200);
  }

  // Position camera framing the Leftover Food Access Door with both the door and the UI panel visible
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(0.48, 0.88, 0.48);
      ctrl.target.set(0.12, 0.74, 0.12);
      ctrl.update();
    }
  });
  await page.waitForTimeout(600);

  // 1. Capture 0° Closed Position
  console.log('Testing 0° Closed position...');
  const btn0 = await page.$('.env-preset-btn[data-angle="0"]');
  if (btn0) await btn0.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${artifactDir}/phase3b_door_ui_0deg_closed.png` });
  console.log('Saved phase3b_door_ui_0deg_closed.png');

  // 2. Capture 55° Representative Operating Ramp Position
  console.log('Testing 55° Operating Ramp position...');
  const btn55 = await page.$('.env-preset-btn[data-angle="55"]');
  if (btn55) await btn55.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${artifactDir}/phase3b_door_ui_55deg_ramp.png` });
  console.log('Saved phase3b_door_ui_55deg_ramp.png');

  // 3. Capture 90° Maximum Permitted Test Position
  console.log('Testing 90° Maximum Test position...');
  const btn90 = await page.$('.env-preset-btn[data-angle="90"]');
  if (btn90) await btn90.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${artifactDir}/phase3b_door_ui_90deg_max.png` });
  console.log('Saved phase3b_door_ui_90deg_max.png');

  // 4. Test dragging the slider interactively to 35°
  console.log('Testing slider drag interaction to 35°...');
  const slider = await page.$('#slider-food-door-angle');
  if (slider) {
    await page.evaluate(() => {
      const s = document.getElementById('slider-food-door-angle');
      s.value = 35;
      s.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${artifactDir}/phase3b_door_ui_35deg_slider.png` });
    console.log('Saved phase3b_door_ui_35deg_slider.png');
  }

  // Restore 0°
  if (btn0) await btn0.click();
  await page.waitForTimeout(300);

  await browser.close();
  console.log('All Phase 3B UI screenshots captured successfully!');
})();
