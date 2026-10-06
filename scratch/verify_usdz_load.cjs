const { chromium } = require('playwright');
const path = require('path');

async function testUSDZLoading() {
  console.log('Launching browser to test USDZ loading...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const consoleLogs = [];
  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text });
    if (type === 'error') {
      errors.push(text);
    } else if (type === 'warning') {
      warnings.push(text);
    }
    console.log(`[Browser ${type.toUpperCase()}]: ${text}`);
  });

  page.on('pageerror', err => {
    console.error('[Browser PageError]:', err.message);
    errors.push(err.message);
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

  // Wait for window.usdModel to be set
  console.log('Waiting for window.usdModel to load (may take 5-15s for 268MB)...');
  try {
    await page.waitForFunction(() => !!window.usdModel, { timeout: 30000 });
    console.log('window.usdModel is defined!');
  } catch (e) {
    console.error('Timed out waiting for window.usdModel:', e.message);
  }

  // Inspect the loaded model details from within the page
  const modelInfo = await page.evaluate(() => {
    if (!window.usdModel) return null;
    let meshCount = 0;
    const meshNames = [];
    window.usdModel.traverse(c => {
      if (c.isMesh) {
        meshCount++;
        meshNames.push(c.name);
      }
    });

    const box = new window.THREE.Box3().setFromObject(window.usdModel);
    const size = new window.THREE.Vector3();
    const center = new window.THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    return {
      name: window.usdModel.name,
      childrenCount: window.usdModel.children.length,
      meshCount,
      meshNames: meshNames.slice(0, 15),
      bboxSize: { x: size.x, y: size.y, z: size.z },
      bboxCenter: { x: center.x, y: center.y, z: center.z }
    };
  });

  // Capture canvas dataURL directly after rendering
  const dataUrl = await page.evaluate(() => {
    if (window.renderer && window.scene && window.camera) {
      window.renderer.render(window.scene, window.camera);
    }
    const canvas = document.querySelector('#app-canvas');
    return canvas ? canvas.toDataURL('image/png') : null;
  });

  const fs = require('fs');
  const screenshotPath = path.resolve(__dirname, 'usdz_loaded.png');
  if (dataUrl) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(screenshotPath, base64Data, 'base64');
    console.log('Screenshot saved to:', screenshotPath);
  }

  await browser.close();

  return {
    success: !!modelInfo,
    modelInfo,
    errors,
    warnings: warnings.slice(0, 10),
    totalWarnings: warnings.length
  };
}

testUSDZLoading()
  .then(res => {
    console.log('\n--- USDZ Load Test Summary ---');
    console.log('Success:', res.success);
    console.log('Errors count:', res.errors.length);
    console.log('Warnings count:', res.totalWarnings);
    process.exit(res.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
