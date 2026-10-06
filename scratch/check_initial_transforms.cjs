const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.componentRegistry && window.componentRegistry.getNames().length === 33);

  const data = await page.evaluate(() => {
    const reg = window.componentRegistry;
    return reg.getNames().map(name => {
      const entry = reg.getEntry(name);
      return {
        name,
        parentName: entry.parentName,
        pos: [entry.initialPosition.x, entry.initialPosition.y, entry.initialPosition.z],
        rot: [entry.initialRotation.x, entry.initialRotation.y, entry.initialRotation.z],
        scale: [entry.initialScale.x, entry.initialScale.y, entry.initialScale.z],
        parentPos: [entry.parentGroup.position.x, entry.parentGroup.position.y, entry.parentGroup.position.z],
        parentRot: [entry.parentGroup.rotation.x, entry.parentGroup.rotation.y, entry.parentGroup.rotation.z],
        parentScale: [entry.parentGroup.scale.x, entry.parentGroup.scale.y, entry.parentGroup.scale.z]
      };
    });
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
