const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Generating detailed multi-angle screenshots of Organic Cutting Mechanism...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  const url = 'http://localhost:5174';
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  // 1. Hide labels and hide shell for crystal-clear mechanical viewing
  await page.evaluate(() => {
    // Hide engineering labels
    const chkLabels = document.getElementById('chk-engineering-labels');
    if (chkLabels && chkLabels.checked) {
      chkLabels.checked = false;
      chkLabels.dispatchEvent(new Event('change'));
    }

    // Hide outer shell
    const btnHideShell = document.getElementById('btn-shell-hidden');
    if (btnHideShell) {
      btnHideShell.click();
    }
  });
  await page.waitForTimeout(500);

  // Shot A: High-detail isometric close-up of cutting mechanism
  await page.evaluate(() => {
    const controls = window.controls;
    const camera = window.camera;
    if (camera && controls) {
      camera.position.set(-0.30, 0.82, 0.18);
      controls.target.set(-0.124, 0.69, 0);
      controls.update();
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotDir, '05_cutting_mechanism_isometric_closeup.png') });
  console.log('Saved 05_cutting_mechanism_isometric_closeup.png');

  // Shot B: Top-down view into cutting collar showing 4-blade rotor & sizing screen
  await page.evaluate(() => {
    const controls = window.controls;
    const camera = window.camera;
    if (camera && controls) {
      camera.position.set(-0.124, 0.96, 0.001);
      controls.target.set(-0.124, 0.685, 0);
      controls.update();
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotDir, '06_cutting_mechanism_topdown_collar.png') });
  console.log('Saved 06_cutting_mechanism_topdown_collar.png');

  // Shot C: Side profile showing vertical stack: Input Section -> Unresolved Gap -> Cutting Motor -> Blades -> Screen -> Storage Chamber
  await page.evaluate(() => {
    const controls = window.controls;
    const camera = window.camera;
    if (camera && controls) {
      camera.position.set(-0.45, 0.72, 0.0);
      controls.target.set(-0.05, 0.68, 0);
      controls.update();
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotDir, '07_cutting_mechanism_vertical_stack.png') });
  console.log('Saved 07_cutting_mechanism_vertical_stack.png');

  // Shot D: Overall model context with translucent shell and labels re-enabled
  await page.evaluate(() => {
    const chkLabels = document.getElementById('chk-engineering-labels');
    if (chkLabels) {
      chkLabels.checked = true;
      chkLabels.dispatchEvent(new Event('change'));
    }
    const btnTranslucent = document.getElementById('btn-shell-translucent');
    if (btnTranslucent) {
      btnTranslucent.click();
    }
    const controls = window.controls;
    const camera = window.camera;
    if (camera && controls) {
      camera.position.set(-0.55, 0.85, 0.45);
      controls.target.set(0, 0.55, 0);
      controls.update();
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotDir, '08_overall_model_context.png') });
  console.log('Saved 08_overall_model_context.png');

  await browser.close();
  console.log('All detailed screenshots completed successfully.');
})();
