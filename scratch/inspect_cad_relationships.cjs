const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('--- Connecting to Gomikin 3D App for Mechanical Audit ---');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.setDefaultTimeout(120000);
  page.on('console', msg => {
    if (msg.text().includes('Loading USDZ:') || msg.type() === 'error') {
      console.log(`[PAGE LOG]: ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:5173/');

  console.log('Waiting for model and registry to initialize...');
  await page.waitForFunction(() => {
    return window.usdModel &&
           window.componentRegistry &&
           window.viewCoordinator;
  }, {}, { timeout: 120000 });

  console.log('✓ Model loaded! Extracting full mechanical data...');

  const auditData = await page.evaluate(() => {
    const reg = window.componentRegistry;
    const names = reg.getNames();
    const THREE = window.THREE;

    // Helper to get bounding box in world space
    function getWorldBox(mesh) {
      mesh.updateMatrixWorld(true);
      const box = new THREE.Box3();
      box.setFromObject(mesh);
      return box;
    }

    // Helper to get local geometry bounds
    function getLocalGeoBox(mesh) {
      if (!mesh.geometry) return null;
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      return mesh.geometry.boundingBox;
    }

    const components = {};

    for (const name of names) {
      const mesh = reg.get(name);
      const entry = reg.getEntry(name);
      const worldBox = getWorldBox(mesh);
      const localBox = getLocalGeoBox(mesh);

      const wSize = new THREE.Vector3();
      worldBox.getSize(wSize);
      const wCenter = new THREE.Vector3();
      worldBox.getCenter(wCenter);

      const lSize = localBox ? new THREE.Vector3().subVectors(localBox.max, localBox.min) : null;
      const lCenter = localBox ? new THREE.Vector3().addVectors(localBox.max, localBox.min).multiplyScalar(0.5) : null;

      // Extract hierarchy chain
      const hierarchy = [];
      let curr = mesh;
      while (curr) {
        hierarchy.push({
          name: curr.name,
          type: curr.type,
          pos: { x: curr.position.x, y: curr.position.y, z: curr.position.z },
          rot: { x: curr.rotation.x, y: curr.rotation.y, z: curr.rotation.z },
          scale: { x: curr.scale.x, y: curr.scale.y, z: curr.scale.z }
        });
        curr = curr.parent;
      }

      // Check if mesh has children
      const children = mesh.children.map(c => ({ name: c.name, type: c.type }));

      components[name] = {
        name,
        type: mesh.type,
        parentName: entry.parentName,
        hierarchy,
        children,
        initialPos: { x: entry.initialPosition.x, y: entry.initialPosition.y, z: entry.initialPosition.z },
        initialRot: { x: entry.initialRotation.x, y: entry.initialRotation.y, z: entry.initialRotation.z },
        initialScale: { x: entry.initialScale.x, y: entry.initialScale.y, z: entry.initialScale.z },
        worldBox: {
          min: { x: worldBox.min.x, y: worldBox.min.y, z: worldBox.min.z },
          max: { x: worldBox.max.x, y: worldBox.max.y, z: worldBox.max.z },
          size: { x: wSize.x, y: wSize.y, z: wSize.z },
          center: { x: wCenter.x, y: wCenter.y, z: wCenter.z }
        },
        localBox: localBox ? {
          min: { x: localBox.min.x, y: localBox.min.y, z: localBox.min.z },
          max: { x: localBox.max.x, y: localBox.max.y, z: localBox.max.z },
          size: { x: lSize.x, y: lSize.y, z: lSize.z },
          center: { x: lCenter.x, y: lCenter.y, z: lCenter.z }
        } : null,
        vertexCount: entry.vertexCount,
        faceCount: entry.faceCount
      };
    }

    // Interpenetration / clearance matrix between moving mechanisms and surrounding parts
    const movingNames = [
      'rotating_base',
      'cutting_blades',
      'door_mechanism_left',
      'door_mechanism_right',
      'leftover_food_closur',
      'agitator'
    ];

    const clearances = {};
    for (const mName of movingNames) {
      clearances[mName] = {};
      const mMesh = reg.get(mName);
      const mBox = getWorldBox(mMesh);

      for (const otherName of names) {
        if (otherName === mName) continue;
        const oMesh = reg.get(otherName);
        const oBox = getWorldBox(oMesh);

        const intersects = mBox.intersectsBox(oBox);
        const intersectionBox = new THREE.Box3();
        let overlapVolume = 0;
        let gapDistance = 0;

        if (intersects) {
          intersectionBox.copy(mBox).intersect(oBox);
          const iSize = new THREE.Vector3();
          intersectionBox.getSize(iSize);
          overlapVolume = iSize.x * iSize.y * iSize.z;
        } else {
          // Approximate distance between disjoint boxes
          gapDistance = mBox.distanceToPoint(oBox.getCenter(new THREE.Vector3()));
        }

        if (intersects || gapDistance < 0.15) {
          clearances[mName][otherName] = {
            intersects,
            overlapVolume,
            overlapSize: intersects ? {
              x: intersectionBox.max.x - intersectionBox.min.x,
              y: intersectionBox.max.y - intersectionBox.min.y,
              z: intersectionBox.max.z - intersectionBox.min.z
            } : null,
            gapDistance
          };
        }
      }
    }

    return {
      components,
      clearances,
      totalComponents: names.length
    };
  });

  fs.writeFileSync('scratch/cad_mechanical_audit.json', JSON.stringify(auditData, null, 2));
  console.log(`✓ Audited ${auditData.totalComponents} components. Saved to scratch/cad_mechanical_audit.json`);

  await browser.close();
})();
