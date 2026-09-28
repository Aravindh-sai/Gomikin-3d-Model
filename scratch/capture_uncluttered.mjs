import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1500);

  // Hide labels for crystal-clear geometry view
  const btnLabels = await page.$('#btn-toggle-labels');
  if (btnLabels) await btnLabels.click();

  // Hide shell
  const btnHideShell = await page.$('#btn-shell-hidden');
  if (btnHideShell) await btnHideShell.click();

  // Click Food camera preset
  const btnFoodCam = await page.$('#cam-food-door');
  if (btnFoodCam) await btnFoodCam.click();
  await page.waitForTimeout(1000);

  const artifactDir = 'C:\\Users\\ARAVINDH\\.gemini\\antigravity-ide\\brain\\772ebe41-7f11-48bc-8649-67c1b64aafaa';
  await page.screenshot({ path: path.join(artifactDir, 'leftover_food_uncluttered.png') });
  console.log('Saved leftover_food_uncluttered.png');

  // Also an isometric view without labels
  const btnIso = await page.$('#cam-iso');
  if (btnIso) await btnIso.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'leftover_food_iso_uncluttered.png') });
  console.log('Saved leftover_food_iso_uncluttered.png');

  await browser.close();
})();
