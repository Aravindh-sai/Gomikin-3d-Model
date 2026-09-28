const { chromium } = require('c:/Dev/Gomikin-3d/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const sceneTree = await page.evaluate(() => {
    const env = window.gomikinEnvelope;
    if (!env) return { error: 'window.gomikinEnvelope not found' };

    function dumpNode(node, depth = 0) {
      const info = {
        name: node.name || `(${node.type})`,
        type: node.type,
        pos: [Number(node.position.x.toFixed(4)), Number(node.position.y.toFixed(4)), Number(node.position.z.toFixed(4))],
        rot: [Number(node.rotation.x.toFixed(4)), Number(node.rotation.y.toFixed(4)), Number(node.rotation.z.toFixed(4))],
        visible: node.visible,
        userData: node.userData,
        children: []
      };

      for (const child of node.children) {
        // filter out debug sprite labels to keep output clean, but note how many
        if (child.userData && child.userData.isEngineeringLabel) {
          info.labelCount = (info.labelCount || 0) + 1;
        } else {
          info.children.push(dumpNode(child, depth + 1));
        }
      }
      return info;
    }

    return dumpNode(env);
  });

  console.log('=== SCENE HIERARCHY ===');
  console.log(JSON.stringify(sceneTree, null, 2));

  await browser.close();
})();
