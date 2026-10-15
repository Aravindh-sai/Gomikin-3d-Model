const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  console.log('Testing USDLoader.parse with ArrayBuffer in browser...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('[BROWSER]', msg.text()));

  await page.goto('http://localhost:5173/');

  const result = await page.evaluate(async () => {
    // Fetch first 1000 bytes just to test range fetch
    const resp = await fetch('/Gomikin/gomikin_disection.usdz', {
      headers: { Range: 'bytes=0-999' }
    });
    return {
      status: resp.status,
      byteLength: (await resp.arrayBuffer()).byteLength
    };
  });

  console.log('Range fetch result:', result);
  await browser.close();
})();
