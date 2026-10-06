const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/ARAVINDH/.gemini/antigravity-ide/brain/34958df2-adc3-4852-9428-dec5da174ea9';

(async () => {
  console.log('--- Inspecting Gomikin Animation Flow & Asset Visibility ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  page.setDefaultTimeout(90000);
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('warning') || text.includes('Warning')) {
      console.log('[Browser Console]:', text);
    }
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 90000 });

  await page.waitForFunction(() => {
    return window.gomikinAnimation && 
           window.gomikinAnimation.controller && 
           window.componentRegistry && 
           window.componentRegistry.getNames().length === 33;
  }, { timeout: 90000 });

  console.log('Page loaded and USDZ ready.');

  const cdp = await page.context().newCDPSession(page);
  async function snap(name) {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const filepath = path.join(ARTIFACT_DIR, `${name}.png`);
    fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot: ${name}.png`);
  }

  // 1. Check initial assembled state
  const initialMetrics = await page.evaluate(() => {
    const reg = window.componentRegistry;
    const names = reg.getNames();
    const data = {};
    for (const name of names) {
      const mesh = reg.get(name);
      const box = new THREE.Box3().setFromObject(mesh);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      data[name] = {
        pos: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
        worldCenter: { x: center.x, y: center.y, z: center.z },
        worldSize: { x: size.x, y: size.y, z: size.z }
      };
    }
    return data;
  });
  console.log('Initial sample: Main_Housing world center =', initialMetrics.Main_Housing.worldCenter, 'size =', initialMetrics.Main_Housing.worldSize);
  console.log('Initial sample: ultrasonic_sensor world center =', initialMetrics.ultrasonic_sensor.worldCenter, 'size =', initialMetrics.ultrasonic_sensor.worldSize);
  await snap('test_flow_00_initial');

  // 2. Test progress stepping explicitly: p = 0.05, 0.25, 0.5, 0.75, 1.0
  const testSteps = [0.05, 0.25, 0.50, 0.75, 1.0];
  for (const p of testSteps) {
    const stepInfo = await page.evaluate((prog) => {
      window.gomikinAnimation.progress(prog);
      const reg = window.componentRegistry;
      const names = reg.getNames();
      
      // Let renderer and matrix updates run
      window.scene.updateMatrixWorld(true);
      window.camera.updateMatrixWorld(true);

      const items = [];
      for (const name of names) {
        const mesh = reg.get(name);
        const box = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        // Project center to screen
        const screenPos = center.clone().project(window.camera);
        items.push({
          name,
          meshScale: mesh.scale.x,
          worldCenter: { x: center.x, y: center.y, z: center.z },
          worldSize: { x: size.x, y: size.y, z: size.z },
          screen: {
            x: ((screenPos.x * 0.5 + 0.5) * window.innerWidth).toFixed(1),
            y: ((-screenPos.y * 0.5 + 0.5) * window.innerHeight).toFixed(1),
            z: screenPos.z.toFixed(3) // if z > 1 or z < -1, clipped!
          }
        });
      }
      return {
        prog,
        camPos: { x: window.camera.position.x, y: window.camera.position.y, z: window.camera.position.z },
        items
      };
    }, p);

    console.log(`\n--- Step p = ${p} ---`);
    console.log(`Camera pos:`, stepInfo.camPos);
    // Print first 3 and last 3 items
    console.log(`Sample item 0 (${stepInfo.items[0].name}): screen =`, stepInfo.items[0].screen, 'worldSize =', stepInfo.items[0].worldSize);
    console.log(`Sample item housing: screen =`, stepInfo.items.find(i => i.name === 'Main_Housing')?.screen, 'worldSize =', stepInfo.items.find(i => i.name === 'Main_Housing')?.worldSize);
    console.log(`Sample item sensor: screen =`, stepInfo.items.find(i => i.name === 'ultrasonic_sensor')?.screen, 'worldSize =', stepInfo.items.find(i => i.name === 'ultrasonic_sensor')?.worldSize);
    
    // Check if any item has screen.z > 1 or < -1 (clipped) or outside screen bounds
    const outOfBounds = stepInfo.items.filter(i => {
      const x = parseFloat(i.screen.x);
      const y = parseFloat(i.screen.y);
      const z = parseFloat(i.screen.z);
      return z < -1 || z > 1 || x < -200 || x > 2120 || y < -200 || y > 1280;
    });
    if (outOfBounds.length > 0) {
      console.warn(`WARNING: ${outOfBounds.length} items out of bounds at p = ${p}:`, outOfBounds.map(i => i.name));
    } else {
      console.log(`All 33 items within camera view at p = ${p}.`);
    }

    await snap(`test_flow_prog_${(p * 100).toFixed(0).padStart(3, '0')}`);
  }

  // 3. Test animated PLAY button click and monitor each frame
  console.log('\n--- Resetting to Assembled State ---');
  await page.evaluate(() => {
    window.gomikinAnimation.reset(true);
  });
  await page.waitForTimeout(500);

  console.log('Clicking #btn-dissect-gomikin to test real animation playback...');
  await page.click('#btn-dissect-gomikin');

  // Monitor over 10 seconds at 0.5s intervals
  for (let t = 0.5; t <= 10.0; t += 0.5) {
    await page.waitForTimeout(500);
    const animState = await page.evaluate(() => {
      const anim = window.gomikinAnimation.controller;
      return {
        progress: anim._progress,
        isPlaying: anim.isPlaying,
        state: anim._state,
        buttonText: document.getElementById('btn-dissect-gomikin')?.innerText?.replace(/\n/g, ' ')
      };
    });
    console.log(`[t = ${t.toFixed(1)}s] Progress: ${(animState.progress * 100).toFixed(1)}% | Playing: ${animState.isPlaying} | State: ${animState.state} | Button: ${animState.buttonText}`);
    if (t === 2.5 || t === 5.0 || t === 7.5 || t === 10.0) {
      await snap(`test_playback_t_${t.toFixed(1)}s`);
    }
    if (!animState.isPlaying && animState.progress >= 1.0) {
      console.log(`Playback completed at t = ${t.toFixed(1)}s!`);
      break;
    }
  }

  console.log('--- Inspection Finished ---');
  await browser.close();
})();
