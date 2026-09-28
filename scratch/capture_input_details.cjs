const { chromium } = require('c:/Dev/Gomikin-3d/node_modules/playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Turn off labels
  await page.click('#btn-toggle-labels');
  await page.waitForTimeout(300);

  // Switch to Input Bay preset
  await page.click('#cam-input');
  await page.waitForTimeout(800);

  const ss4Path = path.resolve('scratch/04_input_bay_clean_nolabels.png');
  await page.screenshot({ path: ss4Path });
  console.log('Saved:', ss4Path);

  // Switch to Top view
  await page.click('#cam-top');
  await page.waitForTimeout(800);
  const ss5Path = path.resolve('scratch/05_top_ortho_clean_nolabels.png');
  await page.screenshot({ path: ss5Path });
  console.log('Saved:', ss5Path);

  await browser.close();
})();
