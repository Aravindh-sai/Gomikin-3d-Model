const { chromium } = require('playwright');

async function testCoordinateMapping() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.componentRegistry);

  const testResult = await page.evaluate(() => {
    const reg = window.componentRegistry;
    const funnel = reg.get('Funnel');
    const entry = reg.getEntry('Funnel');

    // 1. Initial world center of funnel
    const initialBox = new window.THREE.Box3().setFromObject(funnel);
    const initialWorldCenter = new window.THREE.Vector3();
    initialBox.getCenter(initialWorldCenter);

    // 2. We want to place funnel at world target: (X = 1.5, Y = 2.0, Z = 0.0)
    const targetWorld = new window.THREE.Vector3(1.5, 2.0, 0.0);
    const deltaW = new window.THREE.Vector3().subVectors(targetWorld, initialWorldCenter);

    // Coordinate mapping formula:
    // deltaLocal.x = deltaW.x * 1000
    // deltaLocal.y = -deltaW.z * 1000
    // deltaLocal.z = deltaW.y * 1000
    const deltaLocal = new window.THREE.Vector3(
      deltaW.x * 1000,
      -deltaW.z * 1000,
      deltaW.y * 1000
    );

    // Apply to funnel position
    funnel.position.copy(deltaLocal);
    window.scene.updateMatrixWorld(true);

    // 3. Measure resulting world center
    const newBox = new window.THREE.Box3().setFromObject(funnel);
    const newWorldCenter = new window.THREE.Vector3();
    newBox.getCenter(newWorldCenter);

    // Restore funnel position
    reg.resetComponent('Funnel');
    window.scene.updateMatrixWorld(true);

    const error = newWorldCenter.distanceTo(targetWorld);

    return {
      initialWorldCenter: [initialWorldCenter.x, initialWorldCenter.y, initialWorldCenter.z],
      targetWorld: [targetWorld.x, targetWorld.y, targetWorld.z],
      newWorldCenter: [newWorldCenter.x, newWorldCenter.y, newWorldCenter.z],
      error
    };
  });

  console.log('Coordinate Mapping Test Result:', testResult);
  await browser.close();

  const success = testResult.error < 0.001; // less than 1 mm error
  console.log('Coordinate mapping test passed:', success);
  process.exit(success ? 0 : 1);
}

testCoordinateMapping().catch(err => {
  console.error(err);
  process.exit(1);
});
