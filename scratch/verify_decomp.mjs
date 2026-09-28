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

  // 1. Initial full scene screenshot
  const screenshot1 = path.join(artifactDir, 'decomp_chamber_view1.png');
  await page.screenshot({ path: screenshot1, fullPage: false });
  console.log('Saved:', screenshot1);

  // 2. Read UI elements
  const agitatorReadout = await page.$eval('#lbl-org-agitator', el => el.textContent).catch(() => 'NOT FOUND');
  const decompReadout = await page.$eval('#lbl-org-decomp', el => el.textContent).catch(() => 'NOT FOUND');
  console.log('Decomp Readout:', decompReadout);
  console.log('Agitator Readout:', agitatorReadout);

  // 3. Click Isometric camera preset for best view
  const isoBtn = await page.$('#cam-iso');
  if (isoBtn) {
    await isoBtn.click();
    await page.waitForTimeout(600);
  }

  const screenshot2 = path.join(artifactDir, 'decomp_chamber_iso.png');
  await page.screenshot({ path: screenshot2 });
  console.log('Saved:', screenshot2);

  // 3b. Click Decomp (180°) preset for close-up inspection
  const decompBtn = await page.$('#cam-decomp');
  if (decompBtn) {
    await decompBtn.click();
    await page.waitForTimeout(600);
    const screenshotDecompClose = path.join(artifactDir, 'decomp_closeup.png');
    await page.screenshot({ path: screenshotDecompClose });
    console.log('Saved close-up:', screenshotDecompClose);
  }

  // 4. Test toggling Decomposition Agitator off and on
  const agitatorChk = await page.$('#chk-decomp-agitator');
  if (agitatorChk) {
    console.log('Toggling Agitator checkbox OFF...');
    await agitatorChk.click();
    await page.waitForTimeout(500);
    const screenshot3 = path.join(artifactDir, 'decomp_agitator_hidden.png');
    await page.screenshot({ path: screenshot3 });
    console.log('Saved:', screenshot3);

    console.log('Toggling Agitator checkbox back ON...');
    await agitatorChk.click();
    await page.waitForTimeout(500);
  }

  // 5. Test Label toggle
  const labelBtn = await page.$('#btn-toggle-labels');
  if (labelBtn) {
    console.log('Toggling labels...');
    await labelBtn.click();
    await page.waitForTimeout(500);
    const screenshot4 = path.join(artifactDir, 'decomp_labels_hidden.png');
    await page.screenshot({ path: screenshot4 });
    console.log('Saved:', screenshot4);
    await labelBtn.click(); // toggle back
    await page.waitForTimeout(300);
  }

  console.log('\n--- Console Logs ---');
  consoleLogs.forEach(l => console.log(l));
  console.log('\n--- Errors ---');
  console.log(errors.length === 0 ? 'Zero errors detected.' : errors.join('\n'));

  await browser.close();
  console.log('\nVerification complete!');
})();
