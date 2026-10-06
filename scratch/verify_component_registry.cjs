const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyComponentRegistry() {
  console.log('Launching browser to verify component registry...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.text().includes('USDZ') || msg.text().includes('Component') || msg.text().includes('Status:')) {
      console.log(`[Browser Console]: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => console.error('[Page Error]:', err.message));

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for window.componentRegistry...');
  await page.waitForFunction(() => !!window.componentRegistry && !!window.usdModel, { timeout: 60000 });
  console.log('window.componentRegistry is ready!');

  // Detailed verification of registry
  const verification = await page.evaluate(() => {
    const reg = window.componentRegistry;
    const model = window.usdModel;

    const names = reg.getNames();
    const entries = reg.getEntries();
    const groupNames = reg.groupNames;

    const expectedNames = [
      'Funnel',
      'Main_Housing',
      'Rightside_Divider',
      'central_divider',
      'storage_chamber',
      'decompostion_chamber',
      'leachate_section',
      'inorganic_output_chamber',
      'leftover_food_outpu_section',
      'door_mechanism_left',
      'door_mechanism_right',
      'cutting_blades',
      'cutting_motor',
      'cutting_mesh',
      'circular_frame',
      'agitator',
      'exhaust_fan',
      'carbon_filter',
      'servo',
      'battery_pack',
      'control_unit',
      'camera_module',
      'ultrasonic_sensor',
      'temperature_sensor',
      'moisture_sensor',
      'load_cell',
      'motor_support',
      'cutting_motor_support',
      'top_closuer',
      'leftover_food_closur',
      'bottom_of_decomposition_section',
      'rotating_base',
      'display'
    ];

    const results = [];
    let allValid = true;

    for (const name of expectedNames) {
      const comp = reg.get(name);
      const entry = reg.getEntry(name);
      const directComp = reg.components[name];
      const propComp = reg[name];
      const modelComp = model.getComponent(name);
      const getObjComp = model.getObjectByName(name);

      const isMesh = comp && comp.isMesh;
      const pointsToRealMesh = comp === directComp && comp === propComp && comp === modelComp && comp === getObjComp;
      const hasGeometry = comp && !!comp.geometry && comp.geometry.attributes.position.count > 0;
      const hasParentGroup = comp && !!comp.parent;

      if (!isMesh || !pointsToRealMesh || !hasGeometry) {
        allValid = false;
      }

      results.push({
        name,
        found: !!comp,
        type: comp ? comp.type : null,
        targetClass: comp ? comp.constructor.name : null,
        parentGroupName: comp && comp.parent ? comp.parent.name : null,
        hierarchyPath: entry ? entry.hierarchyPath : null,
        vertexCount: entry ? entry.vertexCount : 0,
        boxDimensions: entry ? [
          Number(entry.size.x.toFixed(4)),
          Number(entry.size.y.toFixed(4)),
          Number(entry.size.z.toFixed(4))
        ] : null,
        boxCenter: entry ? [
          Number(entry.center.x.toFixed(4)),
          Number(entry.center.y.toFixed(4)),
          Number(entry.center.z.toFixed(4))
        ] : null,
        pointsToRealMesh
      });
    }

    // Verify debug reporting utility
    const reportData = reg.report(false);

    return {
      totalMeshesFound: names.length,
      totalGroupsFound: groupNames.length,
      expectedCount: expectedNames.length,
      allValid,
      reportDataSummary: {
        totalComponents: reportData.totalComponents,
        totalGroups: reportData.totalGroups,
        allExpectedPresent: reportData.allExpectedPresent,
        missing: reportData.missingComponents
      },
      results
    };
  });

  fs.writeFileSync('scratch/component_registry_results.json', JSON.stringify(verification, null, 2));
  console.log('Saved scratch/component_registry_results.json');

  // Verify render and capture canvas screenshot
  const screenshotPath = path.resolve('scratch', 'registry_verified_render.png');
  const dataUrl = await page.evaluate(() => {
    if (window.renderer && window.scene && window.camera) {
      window.renderer.render(window.scene, window.camera);
    }
    const canvas = document.querySelector('#app-canvas');
    return canvas ? canvas.toDataURL('image/png') : null;
  });

  if (dataUrl) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(screenshotPath, base64Data, 'base64');
    console.log('Screenshot saved to:', screenshotPath);
  }

  await browser.close();

  return verification;
}

verifyComponentRegistry()
  .then((v) => {
    console.log('\n--- VERIFICATION SUMMARY ---');
    console.log('Total meshes found:', v.totalMeshesFound, '(Expected: 33)');
    console.log('Total groups found:', v.totalGroupsFound, '(Expected: 34)');
    console.log('All 33 expected components present and valid:', v.allValid);
    console.log('Report utility allExpectedPresent:', v.reportDataSummary.allExpectedPresent);
    process.exit(v.allValid ? 0 : 1);
  })
  .catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
