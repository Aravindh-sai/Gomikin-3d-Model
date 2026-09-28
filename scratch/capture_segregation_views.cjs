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

  // Toggle labels off for clean mechanical visualization
  const btnLabels = await page.$('#btn-toggle-labels');
  if (btnLabels) {
    await btnLabels.click();
    await page.waitForTimeout(200);
  }

  // Hide shell
  const btnHidden = await page.$('#btn-shell-hidden');
  if (btnHidden) {
    await btnHidden.click();
    await page.waitForTimeout(200);
  }

  // 1. Unobstructed Top-Isometric View of Segregation Support Assembly (Funnel & TopClosure hidden)
  await page.evaluate(() => {
    const env = window.gomikinEnvelope;
    const funnel = env?.getObjectByName('Funnel');
    const topClosure = env?.getObjectByName('TopClosure');
    if (funnel) funnel.visible = false;
    if (topClosure) topClosure.visible = false;

    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(0.18, 1.05, 0.22);
      ctrl.target.set(0, 0.925, 0);
      ctrl.update();
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/segregation_assembly_unobstructed_iso.png` });
  console.log('Saved segregation_assembly_unobstructed_iso.png');

  // 2. Focused Underside/Section View of Motor, Coupling, and Divider Clamps (Looking slightly upward from below Y=0.92m)
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(0.11, 0.880, 0.15);
      ctrl.target.set(0, 0.915, 0);
      ctrl.update();
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/segregation_assembly_motor_underside.png` });
  console.log('Saved segregation_assembly_motor_underside.png');

  // 3. Close-up Side Elevation View showing Hub, Bearings, Running Clearance, and Spindle
  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(0.18, 0.930, 0.0);
      ctrl.target.set(0, 0.930, 0);
      ctrl.update();
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/segregation_assembly_side_clearance.png` });
  console.log('Saved segregation_assembly_side_clearance.png');

  // 4. Restore Funnel & TopClosure, show Shell Relationship View (Transparent Shell)
  await page.evaluate(() => {
    const env = window.gomikinEnvelope;
    const funnel = env?.getObjectByName('Funnel');
    const topClosure = env?.getObjectByName('TopClosure');
    if (funnel) funnel.visible = true;
    if (topClosure) topClosure.visible = true;
  });

  const btnTrans = await page.$('#btn-shell-transparent');
  if (btnTrans) {
    await btnTrans.click();
    await page.waitForTimeout(200);
  }

  await page.evaluate(() => {
    const cam = window.demoController?.camera;
    const ctrl = window.demoController?.controls;
    if (cam && ctrl) {
      cam.position.set(0.48, 1.15, 0.52);
      ctrl.target.set(0, 0.90, 0);
      ctrl.update();
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/segregation_assembly_shell_relationship.png` });
  console.log('Saved segregation_assembly_shell_relationship.png');

  await browser.close();
  console.log('All segregation visual inspection views captured successfully!');
})();
