const { chromium } = require('playwright');

(async () => {
  console.log('Testing ResilientModelLoader + USDLoader.parse in browser...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('[BROWSER]', msg.text()));

  await page.goto('http://localhost:5173/');

  const testResult = await page.evaluate(async () => {
    // Dynamically import resilientModelLoader
    const { ResilientModelLoader } = await import('/src/utils/resilientModelLoader.js');
    const { USDLoader } = await import('/node_modules/.vite/deps/three_addons_loaders_USDLoader__js.js');

    const loader = new ResilientModelLoader({
      // Test with 32MB chunk for speed in test
      chunkSize: 32 * 1024 * 1024
    });

    console.log('[TEST] Starting loadModelBuffer...');
    const buffer = await loader.loadModelBuffer({
      onProgress: (p) => {
        console.log(`[TEST PROGRESS] ${p.percent.toFixed(1)}% (${(p.loaded / (1024*1024)).toFixed(1)} MB / ${(p.total / (1024*1024)).toFixed(1)} MB)`);
      },
      onStatus: (s) => {
        console.log(`[TEST STATUS] ${s}`);
      }
    });

    console.log(`[TEST] Buffer received: ${buffer.byteLength} bytes. Parsing with USDLoader...`);
    const usdLoader = new USDLoader();
    
    return new Promise((resolve, reject) => {
      usdLoader.parse(
        buffer,
        '',
        (model) => {
          console.log('[TEST] Parse succeeded! Model type:', model.type);
          let meshCount = 0;
          const meshNames = [];
          model.traverse(node => {
            if (node.isMesh) {
              meshCount++;
              meshNames.push(node.name);
            }
          });
          resolve({
            ok: true,
            meshCount,
            sampleMeshes: meshNames.slice(0, 10),
            byteLength: buffer.byteLength
          });
        },
        (err) => {
          console.error('[TEST] Parse error:', err);
          reject(err);
        }
      );
    });
  });

  console.log('\n--- Test Result ---');
  console.log(JSON.stringify(testResult, null, 2));
  await browser.close();
})();
