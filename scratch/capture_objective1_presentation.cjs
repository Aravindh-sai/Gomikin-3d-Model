const { chromium } = require('c:/Dev/Gomikin-3d/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('Connecting to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(2000);

  const artifactDir = 'c:/Users/ARAVINDH/.gemini/antigravity-ide/brain/772ebe41-7f11-48bc-8649-67c1b64aafaa';

  // Toggle engineering text labels off for clean presentation views
  await page.evaluate(() => {
    window.gomikinEnvelope?.setLabelsVisible(false);
  });
  await page.waitForTimeout(200);

  // Set camera to an optimal 3/4 isometric perspective
  await page.evaluate(() => {
    const cam = window.camera;
    const ctrl = window.controls;
    if (cam && ctrl) {
      cam.position.set(1.10, 1.15, 1.45);
      ctrl.target.set(0, 0.52, 0);
      ctrl.update();
    }
  });
  await page.waitForTimeout(400);

  // ==========================================
  // TASK 2: DISSECTION VISUAL CAPTURES
  // ==========================================
  console.log('\n--- Capturing Dissection Presentation Views ---');

  // 1. Fully Assembled (p = 0.0)
  await page.evaluate(() => {
    window.workflowController?.reset();
    window.dissectionController?.setProgress(0.0);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/dissection_1_assembled.png` });
  console.log('Saved dissection_1_assembled.png');

  // 2. Intermediate Dissection (p = 0.35: Shell lifted, input & power exposed)
  await page.evaluate(() => {
    window.dissectionController?.setProgress(0.35);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/dissection_2_intermediate.png` });
  console.log('Saved dissection_2_intermediate.png');

  // 3. Major Modules Separated (p = 0.70: Cutting & Storage doors exposed)
  await page.evaluate(() => {
    window.dissectionController?.setProgress(0.70);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/dissection_3_modules_separated.png` });
  console.log('Saved dissection_3_modules_separated.png');

  // 4. Fully Exploded State (p = 1.00: All modules, drawers, and ramp door opened)
  await page.evaluate(() => {
    window.dissectionController?.setProgress(1.00);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/dissection_4_fully_exploded.png` });
  console.log('Saved dissection_4_fully_exploded.png');

  // 5. Reset to Assembled State
  await page.evaluate(() => {
    window.dissectionController?.reset();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/dissection_5_reset_assembled.png` });
  console.log('Saved dissection_5_reset_assembled.png');

  // ==========================================
  // TASK 3: WASTE WORKFLOW VISUAL CAPTURES
  // ==========================================
  console.log('\n--- Capturing Waste Workflow Views ---');

  // 3A. Organic Workflow View (Step 7: Drop doors open & drop to decomp vessel)
  await page.evaluate(() => {
    window.presentationUI?.setView('workflows');
    window.workflowController?.setMode('organic');
    window.workflowController?.setProgress(0.75); // Drop doors open, waste dropping
    window.camera.position.set(-0.75, 0.95, 1.15);
    window.controls.target.set(-0.10, 0.50, 0);
    window.controls.update();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/workflow_organic_pathway.png` });
  console.log('Saved workflow_organic_pathway.png');

  // 3B. Inorganic Workflow View (Step 4: Platform routed toward 90° sector & drop)
  await page.evaluate(() => {
    window.workflowController?.setMode('inorganic');
    window.workflowController?.setProgress(0.55); // Waste falling down 90° inorganic shaft
    window.camera.position.set(0.95, 0.85, -0.65);
    window.controls.target.set(0.12, 0.50, -0.12);
    window.controls.update();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/workflow_inorganic_pathway.png` });
  console.log('Saved workflow_inorganic_pathway.png');

  // 3C. Leftover Food Workflow View (Step 2: Food on 55° ramp door)
  await page.evaluate(() => {
    window.workflowController?.setMode('leftover_food');
    window.workflowController?.setProgress(0.28); // Food sliding down 55° door ramp into chamber
    window.camera.position.set(0.65, 0.90, 0.95);
    window.controls.target.set(0.12, 0.55, 0.12);
    window.controls.update();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/workflow_leftover_pathway.png` });
  console.log('Saved workflow_leftover_pathway.png');

  // Reset workflow and return to assembled state
  await page.evaluate(() => {
    window.workflowController?.reset();
    window.presentationUI?.setView('dissection');
    window.dissectionController?.setProgress(0.0);
    window.camera.position.set(1.10, 1.15, 1.45);
    window.controls.target.set(0, 0.52, 0);
    window.controls.update();
  });
  await page.waitForTimeout(400);

  // 4. Capture Integrated View with All Previous Options Active
  await page.screenshot({ path: `${artifactDir}/ui_all_previous_options_integrated.png` });
  console.log('Saved ui_all_previous_options_integrated.png');

  await browser.close();
  console.log('All Objective 1 visual presentation captures completed successfully!');
})();
