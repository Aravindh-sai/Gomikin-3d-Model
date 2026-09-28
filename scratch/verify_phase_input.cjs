const { chromium } = require('c:/Dev/Gomikin-3d/node_modules/playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  console.log('Navigating to http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // In-depth inspection of Three.js objects, hierarchy, and userData
  const sceneData = await page.evaluate(() => {
    const env = window.gomikinEnvelope;
    if (!env) return { error: 'window.gomikinEnvelope not found' };

    function summarizeObject(obj) {
      if (!obj) return null;
      obj.geometry?.computeBoundingBox?.();
      const bb = obj.geometry?.boundingBox;
      return {
        name: obj.name,
        type: obj.type,
        visible: obj.visible,
        position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
        userData: obj.userData,
        childrenCount: obj.children?.length || 0,
        childrenNames: obj.children?.map(c => c.name) || [],
        boundingBox: bb ? {
          min: { x: bb.min.x, y: bb.min.y, z: bb.min.z },
          max: { x: bb.max.x, y: bb.max.y, z: bb.max.z },
        } : null,
      };
    }

    const inputAssembly = env.getObjectByName('InputSegregationAssembly');
    const topClosure = env.getObjectByName('TopClosure');
    const display = env.getObjectByName('Display') || env.getObjectByName('UserInteractionDisplay');
    const funnel = env.getObjectByName('Funnel');
    const rotAssembly = env.getObjectByName('RotatingBaseAssembly');
    const axis1 = env.getObjectByName('AxisPivot_1');
    const axis2 = env.getObjectByName('AxisPivot_2');
    const rotBase = env.getObjectByName('RotatingBase');
    const camera = env.getObjectByName('Camera') || env.getObjectByName('InputCamera');
    const sensor = env.getObjectByName('UltrasonicSensor') || env.getObjectByName('InputUltrasonicSensor');

    // Count labels
    let labelCount = 0;
    let labelVisibleCount = 0;
    env.traverse(child => {
      if (child.userData && child.userData.isEngineeringLabel) {
        labelCount++;
        if (child.visible) labelVisibleCount++;
      }
    });

    return {
      inputAssembly: summarizeObject(inputAssembly),
      topClosure: summarizeObject(topClosure),
      display: summarizeObject(display),
      funnel: summarizeObject(funnel),
      rotAssembly: summarizeObject(rotAssembly),
      axis1: summarizeObject(axis1),
      axis2: summarizeObject(axis2),
      rotBase: summarizeObject(rotBase),
      camera: summarizeObject(camera),
      sensor: summarizeObject(sensor),
      labels: {
        total: labelCount,
        currentlyVisible: labelVisibleCount,
      },
    };
  });

  console.log('=== SCENE HIERARCHY & DATA ===');
  console.log(JSON.stringify(sceneData, null, 2));

  // Check UI readouts
  const uiReadouts = await page.evaluate(() => {
    return {
      planeTop: document.getElementById('lbl-plane-top')?.textContent,
      planeInput: document.getElementById('lbl-plane-input')?.textContent,
      planeDatum: document.getElementById('lbl-plane-datum')?.textContent,
      planeLeachate: document.getElementById('lbl-plane-leachate')?.textContent,
      planeBase: document.getElementById('lbl-plane-base')?.textContent,
      inpRegion: document.getElementById('lbl-inp-region')?.textContent,
      inpTopClosure: document.getElementById('lbl-inp-top-closure')?.textContent,
      inpDisplay: document.getElementById('lbl-inp-display')?.textContent,
      inpFunnel: document.getElementById('lbl-inp-funnel')?.textContent,
      inpRotBase: document.getElementById('lbl-inp-rot-base')?.textContent,
      inpCamera: document.getElementById('lbl-inp-camera')?.textContent,
      inpSensor: document.getElementById('lbl-inp-sensor')?.textContent,
      labelBtn: document.getElementById('btn-toggle-labels')?.textContent,
      valBox: document.getElementById('env-val-box')?.textContent?.replace(/\s+/g, ' ')?.trim(),
    };
  });
  console.log('=== UI READOUTS ===');
  console.log(JSON.stringify(uiReadouts, null, 2));

  // Save screenshot 1: default ISO with labels
  const ss1Path = path.resolve('scratch/01_input_assembly_iso_labels_on.png');
  await page.screenshot({ path: ss1Path, fullPage: false });
  console.log('Saved:', ss1Path);

  // Focus on input camera preset
  await page.click('#cam-input');
  await page.waitForTimeout(600);
  const ss2Path = path.resolve('scratch/02_input_assembly_top_detail.png');
  await page.screenshot({ path: ss2Path, fullPage: false });
  console.log('Saved:', ss2Path);

  // Test hiding labels via button
  console.log('Clicking HIDE LABELS button...');
  await page.click('#btn-toggle-labels');
  await page.waitForTimeout(500);

  const labelsAfterHide = await page.evaluate(() => {
    const env = window.gomikinEnvelope;
    let labelCount = 0;
    let labelVisibleCount = 0;
    let nonLabelHiddenCount = 0;
    env.traverse(child => {
      if (child.userData && child.userData.isEngineeringLabel) {
        labelCount++;
        if (child.visible) labelVisibleCount++;
      } else if (child.visible === false && child !== env.getObjectByName('EnvelopeShell')) {
        nonLabelHiddenCount++;
      }
    });
    return {
      total: labelCount,
      currentlyVisible: labelVisibleCount,
      nonLabelHiddenCount,
      btnText: document.getElementById('btn-toggle-labels')?.textContent,
    };
  });
  console.log('Labels after toggle:', JSON.stringify(labelsAfterHide, null, 2));

  // Reset camera to default or side view to see clean model without labels
  await page.click('#cam-iso');
  await page.waitForTimeout(600);
  const ss3Path = path.resolve('scratch/03_model_labels_off.png');
  await page.screenshot({ path: ss3Path, fullPage: false });
  console.log('Saved:', ss3Path);

  // Turn labels back on
  console.log('Turning labels back ON...');
  await page.click('#btn-toggle-labels');
  await page.waitForTimeout(500);

  const labelsAfterShow = await page.evaluate(() => {
    const env = window.gomikinEnvelope;
    let labelVisibleCount = 0;
    env.traverse(child => {
      if (child.userData && child.userData.isEngineeringLabel && child.visible) {
        labelVisibleCount++;
      }
    });
    return {
      currentlyVisible: labelVisibleCount,
      btnText: document.getElementById('btn-toggle-labels')?.textContent,
    };
  });
  console.log('Labels after show:', JSON.stringify(labelsAfterShow, null, 2));

  await browser.close();
  console.log('Verification finished successfully!');
})();
