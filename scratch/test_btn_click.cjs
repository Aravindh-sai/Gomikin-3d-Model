const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.componentRegistry && window.componentRegistry.getNames().length === 33);

  console.log('Clicking button via evaluate...');
  await page.evaluate(() => {
    document.getElementById('btn-dissect-gomikin').click();
  });

  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => {
      const anim = window.gomikinAnimation.controller;
      return {
        progress: anim._progress,
        isPlaying: anim.isPlaying,
        state: anim._state,
        btnText: document.getElementById('btn-dissect-gomikin').innerText.replace(/\n/g, ' ')
      };
    });
    console.log(`[${(i * 0.5 + 0.5).toFixed(1)}s]`, info);
  }

  await browser.close();
})();
