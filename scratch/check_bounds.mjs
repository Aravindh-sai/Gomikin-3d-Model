import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  const info = await page.evaluate(() => {
    const scene = window.scene;
    let door = null;
    let top = null;
    let hinge = null;
    let section = null;
    scene.traverse((obj) => {
      if (obj.name === 'LeftoverFoodAccessDoor') door = obj;
      if (obj.name === 'LeftoverFoodTopClosure') top = obj;
      if (obj.name === 'LeftoverFoodAccessDoor_Hinge') hinge = obj;
      if (obj.name === 'LeftoverFoodSection') section = obj;
    });

    function getBounds(obj) {
      if (!obj) return null;
      obj.updateMatrixWorld(true);
      const box = new window.THREE.Box3().setFromObject(obj);
      return {
        min: { x: box.min.x, y: box.min.y, z: box.min.z },
        max: { x: box.max.x, y: box.max.y, z: box.max.z },
      };
    }

    return {
      sectionVisible: section ? section.visible : null,
      sectionRotation: section ? section.rotation.y : null,
      hingeVisible: hinge ? hinge.visible : null,
      hingePosition: hinge ? hinge.position : null,
      doorVisible: door ? door.visible : null,
      doorMaterial: door ? {
        color: door.material.color.getHexString(),
        opacity: door.material.opacity,
        transparent: door.material.transparent,
        depthWrite: door.material.depthWrite,
        side: door.material.side,
        visible: door.material.visible,
      } : null,
      doorBounds: getBounds(door),
      topVisible: top ? top.visible : null,
      topMaterial: top ? {
        color: top.material.color.getHexString(),
        opacity: top.material.opacity,
        transparent: top.material.transparent,
        depthWrite: top.material.depthWrite,
        side: top.material.side,
        visible: top.material.visible,
      } : null,
      topBounds: getBounds(top),
      outerDrawerBounds: getBounds(scene.getObjectByName('LeftoverFoodOuterDrawerEnvelope')),
    };
  });

  console.log('Geometry Bounds & Transforms:');
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
