import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const artifactDir = 'C:\\Users\\ARAVINDH\\.gemini\\antigravity-ide\\brain\\772ebe41-7f11-48bc-8649-67c1b64aafaa';
  console.log('Launching browser with Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleLogs = [];
  const errors = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => errors.push(err.toString()));

  console.log('Navigating to http://localhost:5173/...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Camera looking UP under the doors to confirm drain port is gone and vibrator is hidden
  console.log('Positioning camera under door mechanism (Y ~ 500 mm)...');
  await page.evaluate(() => {
    window.camera.up.set(0, 1, 0);
    window.camera.position.set(-0.35, 0.40, 0.25);
    window.controls.target.set(-0.124, 0.50, 0);
    window.controls.update();
  });
  await page.waitForTimeout(600);

  const doorsUnderShot = path.join(artifactDir, 'doors_underside_cleaned.png');
  await page.screenshot({ path: doorsUnderShot });
  console.log('Saved:', doorsUnderShot);

  // 2. Camera looking at decomposition chamber base (Y = 100 mm) with sensors hidden (default)
  console.log('Positioning camera at decomposition base (sensors hidden default)...');
  await page.evaluate(() => {
    window.camera.up.set(0, 1, 0);
    window.camera.position.set(-0.55, 0.35, 0.40);
    window.controls.target.set(-0.124, 0.15, 0);
    window.controls.update();
  });
  await page.waitForTimeout(600);

  const decompBaseDefaultShot = path.join(artifactDir, 'decomp_base_sensors_hidden.png');
  await page.screenshot({ path: decompBaseDefaultShot });
  console.log('Saved:', decompBaseDefaultShot);

  // 3. Toggle Decomposition Sensors ON to verify they are modeled and present
  console.log('Toggling Decomposition Sensors checkbox ON...');
  const sensorChk = await page.$('#chk-decomp-sensors');
  if (sensorChk) {
    await sensorChk.click();
    await page.waitForTimeout(600);
    const decompBaseSensorsVisibleShot = path.join(artifactDir, 'decomp_base_sensors_visible.png');
    await page.screenshot({ path: decompBaseSensorsVisibleShot });
    console.log('Saved:', decompBaseSensorsVisibleShot);

    // Toggle back OFF
    console.log('Toggling Decomposition Sensors checkbox back OFF...');
    await sensorChk.click();
    await page.waitForTimeout(400);
  }

  // 4. Verify presence in scene graph via evaluate
  const sensorStatus = await page.evaluate(() => {
    const root = window.gomikinEnvelope;
    const org = root.getObjectByName('OrganicChambers');
    const decomp = root.getObjectByName('OrganicDecompositionChamber');
    const sensorArray = root.getObjectByName('DecompositionSensorArray');
    const loadCell = root.getObjectByName('DecompositionLoadCell');
    const tempSensor = root.getObjectByName('DecompositionTemperatureSensor');
    const moistureSensor = root.getObjectByName('DecompositionMoistureSensor');
    const vibrator = root.getObjectByName('VibrationActuator');
    const drainPort = root.getObjectByName('LeachateDrainPort');

    return {
      sensorArrayFound: !!sensorArray,
      sensorArrayDefaultVisible: sensorArray ? sensorArray.visible : false,
      loadCellFound: !!loadCell,
      tempSensorFound: !!tempSensor,
      moistureSensorFound: !!moistureSensor,
      vibratorFound: !!vibrator,
      vibratorVisible: vibrator ? vibrator.visible : null,
      drainPortFound: !!drainPort,
    };
  });

  console.log('Scene Inspection Results:');
  console.log(JSON.stringify(sensorStatus, null, 2));

  console.log('\n--- Console Logs ---');
  consoleLogs.forEach(l => console.log(l));
  console.log('\n--- Errors ---');
  console.log(errors.length === 0 ? 'Zero errors detected.' : errors.join('\n'));

  await browser.close();
  console.log('\nVerification script completed successfully.');
})();
