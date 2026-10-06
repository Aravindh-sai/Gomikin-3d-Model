const { chromium } = require('playwright');

async function testTransforms() {
  console.log('Testing component transform access...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.componentRegistry, { timeout: 60000 });

  const testReport = await page.evaluate(() => {
    const reg = window.componentRegistry;

    // Test a few critical components
    const testCases = [
      'Funnel',
      'cutting_blades',
      'door_mechanism_left',
      'door_mechanism_right',
      'rotating_base',
      'agitator'
    ];

    const results = [];

    for (const name of testCases) {
      const mesh = reg.get(name);
      if (!mesh) {
        results.push({ name, success: false, error: 'Component not found' });
        continue;
      }

      const initialPos = mesh.position.clone();
      const initialRot = mesh.rotation.clone();

      // Test modifying position
      mesh.position.y += 0.25;
      const movedY = mesh.position.y;

      // Test modifying rotation
      mesh.rotation.z += 0.5;
      const rotatedZ = mesh.rotation.z;

      // Test resetComponent
      reg.resetComponent(name);
      const resetPos = mesh.position.clone();
      const resetRot = mesh.rotation.clone();

      const success = (
        movedY === initialPos.y + 0.25 &&
        rotatedZ === initialRot.z + 0.5 &&
        resetPos.y === initialPos.y &&
        resetRot.z === initialRot.z
      );

      results.push({
        name,
        success,
        movedY,
        rotatedZ,
        resetPosY: resetPos.y,
        resetRotZ: resetRot.z
      });
    }

    return results;
  });

  console.log('Transform test results:', testReport);
  await browser.close();

  const allPassed = testReport.every(t => t.success);
  console.log('All transform tests passed:', allPassed);
  process.exit(allPassed ? 0 : 1);
}

testTransforms().catch(err => {
  console.error(err);
  process.exit(1);
});
