const { chromium } = require('playwright');

async function testComponentControl() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.usdModel, { timeout: 60000 });

  const result = await page.evaluate(() => {
    const model = window.usdModel;
    const info = {
      meshes: [],
      instances: []
    };

    model.traverse((node) => {
      if (node.isMesh) {
        const box = new window.THREE.Box3().setFromObject(node);
        const size = new window.THREE.Vector3();
        const center = new window.THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        info.meshes.push({
          name: node.name,
          type: node.type,
          parentName: node.parent ? node.parent.name : null,
          vertexCount: node.geometry ? node.geometry.attributes.position.count : 0,
          material: node.material ? (Array.isArray(node.material) ? node.material.map(m => m.name || m.type) : (node.material.name || node.material.type)) : null,
          boxSize: [size.x.toFixed(4), size.y.toFixed(4), size.z.toFixed(4)],
          boxCenter: [center.x.toFixed(4), center.y.toFixed(4), center.z.toFixed(4)]
        });
      } else if (node.name.startsWith('MeshInstance') || (node.parent && node.parent.name.startsWith('MeshInstance'))) {
        info.instances.push({
          name: node.name,
          type: node.type,
          parentName: node.parent ? node.parent.name : null,
          children: node.children.map(c => c.name),
          pos: [node.position.x, node.position.y, node.position.z],
          rot: [node.rotation.x, node.rotation.y, node.rotation.z],
          scale: [node.scale.x, node.scale.y, node.scale.z]
        });
      }
    });

    return info;
  });

  console.log('Meshes count:', result.meshes.length);
  console.log('First 5 meshes:');
  console.log(JSON.stringify(result.meshes.slice(0, 5), null, 2));

  console.log('Instances count:', result.instances.length);
  console.log('First 10 instances:');
  console.log(JSON.stringify(result.instances.slice(0, 10), null, 2));

  // Test moving a mesh directly
  const moveTest = await page.evaluate(() => {
    const funnelMesh = window.usdModel.getObjectByName('Funnel');
    const origY = funnelMesh.position.y;
    funnelMesh.position.y += 0.5;
    const newY = funnelMesh.position.y;
    funnelMesh.position.y = origY; // restore
    return {
      foundFunnel: !!funnelMesh,
      funnelType: funnelMesh ? funnelMesh.type : null,
      parentType: funnelMesh && funnelMesh.parent ? funnelMesh.parent.type : null,
      parentName: funnelMesh && funnelMesh.parent ? funnelMesh.parent.name : null,
      origY,
      newY
    };
  });

  console.log('Move test result:', moveTest);

  await browser.close();
}

testComponentControl().catch(err => {
  console.error(err);
  process.exit(1);
});
