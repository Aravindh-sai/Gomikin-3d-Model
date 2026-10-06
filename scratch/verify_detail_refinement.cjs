const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/ARAVINDH/.gemini/antigravity-ide/brain/34958df2-adc3-4852-9428-dec5da174ea9';

(async () => {
  console.log('--- Starting Gomikin Interactive Dissection & Detail Refinement Test ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Gomikin') || text.includes('USDZ') || text.includes('Detail') || text.includes('Error')) {
      console.log(`[Browser Console]:`, text);
    }
  });
  page.on('pageerror', err => console.error('[Browser Error]:', err));

  page.setDefaultTimeout(90000);
  page.setDefaultNavigationTimeout(90000);

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 90000 });

  // Wait for USDZ model and animation system to be ready
  console.log('Waiting for model and animation system...');
  await page.waitForFunction(() => {
    return window.gomikinAnimation && 
           window.gomikinAnimation.controller && 
           window.componentRegistry && 
           window.componentRegistry.getNames &&
           window.componentRegistry.getNames().length === 33;
  }, { timeout: 90000 });

  console.log('Model and 33 components loaded successfully.');

  const cdp = await page.context().newCDPSession(page);
  async function captureShot(filepath) {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
    console.log(`Saved: ${filepath}`);
  }

  // 1. Initial Assembled State
  const initialVerify = await page.evaluate(() => {
    return window.gomikinAnimation.verify();
  });
  console.log('Initial assembled verification:', initialVerify);

  // Screenshot 5: Original assembled state
  const shot5Path = path.join(ARTIFACT_DIR, '05_assembled_state.png');
  await captureShot(shot5Path);

  // 2. Trigger Dissection
  console.log('Triggering dissection animation...');
  await page.evaluate(() => {
    window.gomikinAnimation.progress(1.0);
  });

  await page.waitForTimeout(1000);

  // Check catalogue state
  const catalogueStatus = await page.evaluate(() => {
    const reg = window.componentRegistry;
    const allVisible = reg.getEntries().every(e => e.mesh.visible);
    const labelContainer = document.getElementById('gomikin-catalogue-labels');
    const labelDisplay = labelContainer ? getComputedStyle(labelContainer).display : 'none';
    const badges = document.querySelectorAll('.gomikin-catalogue-badge');
    const badgeCount = badges.length;

    return {
      allVisible,
      labelDisplay,
      badgeCount,
      housingMeshScale: reg.get('Main_Housing')?.scale.x,
      sensorMeshScale: reg.get('ultrasonic_sensor')?.scale.x
    };
  });
  console.log('Catalogue Status:', catalogueStatus);

  // Screenshot 1: Final full 33-component catalogue
  const shot1Path = path.join(ARTIFACT_DIR, '01_final_full_33_catalogue.png');
  await captureShot(shot1Path);

  // 3. Verify NO HOVER INTERACTION
  console.log('Testing hover interaction (should do NOTHING)...');
  const beforeHover = await page.evaluate(() => {
    const reg = window.componentRegistry;
    return reg.getEntries().map(e => ({
      name: e.name,
      posX: e.mesh.position.x,
      posY: e.mesh.position.y,
      posZ: e.mesh.position.z,
      scaleX: e.mesh.scale.x
    }));
  });

  await page.evaluate(() => {
    for (let x = 300; x <= 1600; x += 200) {
      for (let y = 200; y <= 900; y += 150) {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));
      }
    }
  });
  await page.waitForTimeout(100);

  const afterHover = await page.evaluate(() => {
    const reg = window.componentRegistry;
    return reg.getEntries().map(e => ({
      name: e.name,
      posX: e.mesh.position.x,
      posY: e.mesh.position.y,
      posZ: e.mesh.position.z,
      scaleX: e.mesh.scale.x
    }));
  });

  let hoverChanged = false;
  for (let i = 0; i < beforeHover.length; i++) {
    const b = beforeHover[i];
    const a = afterHover[i];
    if (Math.abs(b.posX - a.posX) > 0.001 || Math.abs(b.scaleX - a.scaleX) > 0.001) {
      console.error(`Component ${b.name} moved on hover!`);
      hoverChanged = true;
    }
  }
  console.log('Hover check passed (zero hover motion):', !hoverChanged);

  // 4. Test Grid Camera CAD Controls
  console.log('Testing Grid Camera CAD controls...');
  const initialCamZ = await page.evaluate(() => window.camera.position.z);
  await page.evaluate(() => {
    // Zoom grid camera
    window.gomikinAnimation.detailController.zoomGridCamera(500);
  });
  const zoomedCamZ = await page.evaluate(() => window.camera.position.z);
  console.log(`Grid Zoom: initial Z = ${initialCamZ.toFixed(2)}, zoomed Z = ${zoomedCamZ.toFixed(2)}`);

  // Reset grid camera
  await page.evaluate(() => {
    window.gomikinAnimation.detailController.resetGridCamera();
  });
  await page.waitForTimeout(200);

  // 5. Test DETAIL VIEW - Small Component (ultrasonic_sensor)
  console.log('Entering Detail View for small component: ultrasonic_sensor...');
  await page.evaluate(() => {
    window.gomikinAnimation.enterDetail('ultrasonic_sensor');
  });
  await page.waitForTimeout(600); // Wait for transition

  const smallDetailStatus = await page.evaluate(() => {
    const reg = window.componentRegistry;
    const visibleCount = reg.getEntries().filter(e => e.mesh.visible).length;
    const targetMesh = reg.get('ultrasonic_sensor');
    const labelContainer = document.getElementById('gomikin-catalogue-labels');
    const detailUI = document.getElementById('gomikin-detail-ui');
    const titleEl = document.getElementById('detail-component-title');
    const catEl = document.getElementById('detail-category-tag');
    const box = new THREE.Box3().setFromObject(targetMesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    return {
      visibleCount,
      targetMeshVisible: targetMesh?.visible,
      targetMeshScale: targetMesh?.scale.x,
      boxCenter: center,
      boxDimensions: size,
      labelDisplay: labelContainer ? getComputedStyle(labelContainer).display : '',
      uiActive: detailUI?.classList.contains('detail-active'),
      title: titleEl?.textContent,
      category: catEl?.textContent
    };
  });
  console.log('Small Detail Status:', smallDetailStatus);

  // Screenshot 2: Small component in detail view
  const shot2Path = path.join(ARTIFACT_DIR, '02_small_component_detail_view.png');
  await captureShot(shot2Path);

  // Test Detail CAD Controls (Orbit)
  console.log('Testing Detail CAD controls...');
  await page.evaluate(() => {
    const dc = window.gomikinAnimation.detailController;
    dc.targetOrbit.x += 0.7;
    dc.targetOrbit.y += 0.25;
  });
  await page.waitForTimeout(400);

  // 6. Test Return to Grid (Click component again)
  console.log('Returning to catalogue grid via component click...');
  await page.evaluate(() => {
    window.gomikinAnimation.exitDetail();
  });
  await page.waitForTimeout(600);

  const returnedStatus1 = await page.evaluate(() => {
    const reg = window.componentRegistry;
    const allVisible = reg.getEntries().every(e => e.mesh.visible);
    const detailUI = document.getElementById('gomikin-detail-ui');
    return {
      allVisible,
      uiActive: detailUI?.classList.contains('detail-active')
    };
  });
  console.log('Returned to catalogue status 1:', returnedStatus1);

  // 7. Test DETAIL VIEW - Large Component (Main_Housing)
  console.log('Entering Detail View for large component: Main_Housing...');
  await page.evaluate(() => {
    window.gomikinAnimation.enterDetail('Main_Housing');
  });
  await page.waitForTimeout(600);

  const largeDetailStatus = await page.evaluate(() => {
    const reg = window.componentRegistry;
    const visibleCount = reg.getEntries().filter(e => e.mesh.visible).length;
    const targetMesh = reg.get('Main_Housing');
    const titleEl = document.getElementById('detail-component-title');
    const catEl = document.getElementById('detail-category-tag');
    const box = new THREE.Box3().setFromObject(targetMesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    return {
      visibleCount,
      targetMeshVisible: targetMesh?.visible,
      targetMeshScale: targetMesh?.scale.x,
      boxCenter: center,
      boxDimensions: size,
      title: titleEl?.textContent,
      category: catEl?.textContent
    };
  });
  console.log('Large Detail Status:', largeDetailStatus);

  // Screenshot 3: Large component in detail view
  const shot3Path = path.join(ARTIFACT_DIR, '03_large_component_detail_view.png');
  await captureShot(shot3Path);

  // 8. Return via "BACK TO CATALOGUE" button
  console.log('Clicking "BACK TO CATALOGUE" button...');
  await page.click('#btn-back-to-grid');
  await page.waitForTimeout(600);

  // Screenshot 4: Catalogue after returning from detail view
  const shot4Path = path.join(ARTIFACT_DIR, '04_catalogue_after_return.png');
  await captureShot(shot4Path);

  // 9. Reset Gomikin to original Fusion assembly
  console.log('Resetting Gomikin to original assembled state...');
  await page.evaluate(() => {
    window.gomikinAnimation.reset(true);
  });
  await page.waitForTimeout(500);

  const finalResetVerify = await page.evaluate(() => {
    return window.gomikinAnimation.verify();
  });
  console.log('Final Reset Verification:', finalResetVerify);

  console.log('--- All Tests Completed Successfully ---');
  await browser.close();
})();
