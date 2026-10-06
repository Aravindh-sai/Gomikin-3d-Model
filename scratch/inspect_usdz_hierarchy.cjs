const { chromium } = require('playwright');

async function inspectHierarchy() {
  console.log('Launching browser to inspect USDZ hierarchy...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Loading USDZ') || text.includes('loaded') || text.includes('Error')) {
      console.log(`[Browser]: ${text}`);
    }
  });

  page.on('pageerror', err => console.error('[PageError]:', err.message));

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for window.usdModel...');
  await page.waitForFunction(() => !!window.usdModel, { timeout: 60000 });
  console.log('window.usdModel loaded!');

  const hierarchy = await page.evaluate(() => {
    const model = window.usdModel;
    if (!model) return null;

    function dump(node, depth = 0) {
      const item = {
        name: node.name || '(unnamed)',
        type: node.type,
        isMesh: !!node.isMesh,
        isGroup: !!node.isGroup,
        depth: depth,
        childrenCount: node.children ? node.children.length : 0,
        pos: [node.position.x, node.position.y, node.position.z],
        rot: [node.rotation.x, node.rotation.y, node.rotation.z],
        children: []
      };
      if (node.children) {
        for (const child of node.children) {
          item.children.push(dump(child, depth + 1));
        }
      }
      return item;
    }

    const flatList = [];
    model.traverse((node) => {
      flatList.push({
        name: node.name,
        type: node.type,
        isMesh: !!node.isMesh,
        isGroup: !!node.isGroup,
        parentName: node.parent ? node.parent.name : null,
        childrenCount: node.children ? node.children.length : 0
      });
    });

    return {
      tree: dump(model),
      flatList: flatList
    };
  });

  const fs = require('fs');
  fs.writeFileSync('scratch/usdz_hierarchy.json', JSON.stringify(hierarchy, null, 2));
  console.log('Saved scratch/usdz_hierarchy.json with', hierarchy.flatList.length, 'nodes');

  await browser.close();
}

inspectHierarchy().catch(err => {
  console.error(err);
  process.exit(1);
});
