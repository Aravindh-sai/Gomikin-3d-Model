import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  const artifactDir = 'C:\\Users\\ARAVINDH\\.gemini\\antigravity-ide\\brain\\772ebe41-7f11-48bc-8649-67c1b64aafaa';

  // Default view right after loading
  await page.screenshot({ path: path.join(artifactDir, 'fixed_default_view.png') });
  console.log('Saved fixed_default_view.png');

  // Click Food camera preset
  const btnFood = await page.$('#cam-food-door');
  if (btnFood) {
    await btnFood.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'fixed_food_preset.png') });
    console.log('Saved fixed_food_preset.png');
  }

  // Hide labels to see raw geometry
  const btnLabels = await page.$('#btn-toggle-labels');
  if (btnLabels) {
    await btnLabels.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactDir, 'fixed_food_no_labels.png') });
    console.log('Saved fixed_food_no_labels.png');
  }

  await browser.close();
})();
