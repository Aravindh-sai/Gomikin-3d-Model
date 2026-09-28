const THREE = require('three');

async function test() {
  const { createGomikinEnvelope } = await import('../src/components/envelope.js');
  const env = createGomikinEnvelope();
  const door = env.getObjectByName('LeftoverFoodAccessDoor');
  const hCentral = env.getObjectByName('LeftoverFoodDoorHinge_Central');
  const hRadial = env.getObjectByName('LeftoverFoodDoorHinge_Radial');
  const hRod = env.getObjectByName('LeftoverFoodDoorHinge_ChordRod');

  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  hCentral.getWorldPosition(pA);
  hRadial.getWorldPosition(pB);
  console.log('Fixed Hinge A world:', (pA.x*1000).toFixed(2), (pA.y*1000).toFixed(2), (pA.z*1000).toFixed(2));
  console.log('Fixed Hinge B world:', (pB.x*1000).toFixed(2), (pB.y*1000).toFixed(2), (pB.z*1000).toFixed(2));

  // The door geometry attributes
  const pos = door.geometry.attributes.position;
  console.log('Total door vertices:', pos.count);

  for (const ang of [0, 30, 55, 90]) {
    env.setLeftoverFoodDoorAngle(ang);
    env.updateMatrixWorld(true);

    // Let's find the bottom corners of the door panel:
    // In CylinderGeometry with 36 radialSegments and 1 heightSegments:
    // vertex 0 to 36 are at y = top, vertex 37 to 73 are at y = bottom!
    // Or let's inspect all vertices to find which ones are at bottom-left and bottom-right at 0 deg:
    let minCornerADist = Infinity;
    let minCornerBDist = Infinity;
    let closestAIndex = -1;
    let closestBIndex = -1;

    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      door.localToWorld(v);
      const dA = v.distanceTo(pA) * 1000;
      const dB = v.distanceTo(pB) * 1000;
      if (dA < minCornerADist) {
        minCornerADist = dA;
        closestAIndex = i;
      }
      if (dB < minCornerBDist) {
        minCornerBDist = dB;
        closestBIndex = i;
      }
    }

    const vA = new THREE.Vector3().fromBufferAttribute(pos, 37); // bottom-left
    door.localToWorld(vA);
    const vB = new THREE.Vector3().fromBufferAttribute(pos, 73); // bottom-right
    door.localToWorld(vB);

    console.log(`\nAngle ${ang}°:`);
    console.log(`  Door Bottom-Left Vertex (idx 37): ${(vA.x*1000).toFixed(2)}, ${(vA.y*1000).toFixed(2)}, ${(vA.z*1000).toFixed(2)} mm`);
    console.log(`    Distance from Fixed Hinge A: ${(vA.distanceTo(pA)*1000).toFixed(2)} mm`);
    console.log(`  Door Bottom-Right Vertex (idx 73): ${(vB.x*1000).toFixed(2)}, ${(vB.y*1000).toFixed(2)}, ${(vB.z*1000).toFixed(2)} mm`);
    console.log(`    Distance from Fixed Hinge B: ${(vB.distanceTo(pB)*1000).toFixed(2)} mm`);
  }
}

test().catch(console.error);
