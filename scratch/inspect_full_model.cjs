const { chromium } = require('c:/Dev/Gomikin-3d/node_modules/playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  console.log('Connecting to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const report = await page.evaluate(() => {
    const env = window.gomikinEnvelope;
    const items = [];

    env.traverse((obj) => {
      if (obj.userData && obj.userData.isEngineeringLabel) return;
      if (obj.type === 'LineSegments' && obj.name.endsWith('_Edges')) return;

      const box = new window.THREE.Box3().setFromObject(obj);
      const size = new window.THREE.Vector3();
      box.getSize(size);
      const center = new window.THREE.Vector3();
      box.getCenter(center);

      items.push({
        name: obj.name || `(${obj.type})`,
        type: obj.type,
        parentName: obj.parent ? obj.parent.name : null,
        posLocal: [obj.position.x, obj.position.y, obj.position.z],
        rotLocal: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
        worldCenter: [center.x, center.y, center.z],
        worldSize: [size.x, size.y, size.z],
        userData: obj.userData,
        childrenCount: obj.children.length,
      });
    });

    return items;
  });

  fs.writeFileSync('scratch/model_inventory.json', JSON.stringify(report, null, 2));
  console.log(`Saved ${report.length} items to scratch/model_inventory.json`);

  await browser.close();
})();
