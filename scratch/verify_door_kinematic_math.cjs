const THREE = require('three');

// Parameters
const R = 0.246;
const doorHeight = 0.100;
const doorBottomY = 0.700;
const doorTopY = 0.800;
const arcPadding = 0.010;
const deltaTheta = arcPadding / R;
const thetaStart = deltaTheta;
const thetaLength = (Math.PI / 2) - (2 * deltaTheta);
const thetaEnd = thetaStart + thetaLength;

const pA = new THREE.Vector3(R * Math.sin(thetaStart), doorBottomY, R * Math.cos(thetaStart));
const pB = new THREE.Vector3(R * Math.sin(thetaEnd), doorBottomY, R * Math.cos(thetaEnd));
const pMid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);

// Hinge axis unit vector:
const axisVec = new THREE.Vector3().subVectors(pB, pA).normalize();

// Pivot group:
const pivot = new THREE.Group();
pivot.name = 'LeftoverFoodDoor_Pivot';
pivot.position.copy(pMid);
pivot.rotation.order = 'YXZ';
pivot.rotation.y = Math.PI / 4;

// Geometry:
const doorGeo = new THREE.CylinderGeometry(
  R, R, doorHeight, 36, 1, true, thetaStart, thetaLength
);
doorGeo.translate(0, doorHeight / 2, 0);

// Transform geometry into pivot's local coordinates in closed position
const doorTransformMat = new THREE.Matrix4();
doorTransformMat.makeRotationY(-Math.PI / 4);
doorTransformMat.multiply(new THREE.Matrix4().makeTranslation(-pMid.x, 0, -pMid.z));
doorGeo.applyMatrix4(doorTransformMat);

const doorMesh = new THREE.Mesh(doorGeo);
doorMesh.name = 'LeftoverFoodAccessDoor';
pivot.add(doorMesh);

const scene = new THREE.Scene();
scene.add(pivot);

console.log('Fixed Hinge A world:', (pA.x*1000).toFixed(3), (pA.y*1000).toFixed(3), (pA.z*1000).toFixed(3), 'mm');
console.log('Fixed Hinge B world:', (pB.x*1000).toFixed(3), (pB.y*1000).toFixed(3), (pB.z*1000).toFixed(3), 'mm');
console.log('Hinge Axis Midpoint:', (pMid.x*1000).toFixed(3), (pMid.y*1000).toFixed(3), (pMid.z*1000).toFixed(3), 'mm');
console.log('Hinge Axis Length:', (pA.distanceTo(pB)*1000).toFixed(3), 'mm');
console.log('\n--- VERIFYING KINEMATICS ACROSS ANGLES ---');

const pos = doorGeo.attributes.position;
const v0_A = new THREE.Vector3().fromBufferAttribute(pos, 37); // Corner A in local
const v0_B = new THREE.Vector3().fromBufferAttribute(pos, 73); // Corner B in local
const v0_TopA = new THREE.Vector3().fromBufferAttribute(pos, 0); // Top Corner A
const v0_TopB = new THREE.Vector3().fromBufferAttribute(pos, 36); // Top Corner B

const d_diag_0 = v0_A.distanceTo(v0_TopB); // rigid body gauge distance

for (const ang of [0, 15, 30, 45, 55, 70, 90]) {
  pivot.rotation.x = THREE.MathUtils.degToRad(ang);
  scene.updateMatrixWorld(true);

  const curA = v0_A.clone().applyMatrix4(doorMesh.matrixWorld);
  const curB = v0_B.clone().applyMatrix4(doorMesh.matrixWorld);
  const curTopA = v0_TopA.clone().applyMatrix4(doorMesh.matrixWorld);
  const curTopB = v0_TopB.clone().applyMatrix4(doorMesh.matrixWorld);

  const distA = curA.distanceTo(pA) * 1000;
  const distB = curB.distanceTo(pB) * 1000;
  const hingeDist = curA.distanceTo(curB) * 1000;
  const cur_diag = curA.distanceTo(curTopB);
  const rigidDeform = Math.abs(cur_diag - d_diag_0) * 1000;

  // Check sector bounds: X >= 0, Z >= 0
  let minX = Infinity, minZ = Infinity, maxY = -Infinity, minY = Infinity;
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(doorMesh.matrixWorld);
    if (v.x < minX) minX = v.x;
    if (v.z < minZ) minZ = v.z;
    if (v.y > maxY) maxY = v.y;
    if (v.y < minY) minY = v.y;
  }

  console.log(`Angle ${ang.toString().padStart(2, ' ')}°: distToHingeA = ${distA.toFixed(4)} mm, distToHingeB = ${distB.toFixed(4)} mm, hingeDist = ${hingeDist.toFixed(3)} mm, rigidDelta = ${rigidDeform.toFixed(6)} mm, Y span = [${(minY*1000).toFixed(1)}, ${(maxY*1000).toFixed(1)}] mm, minX = ${(minX*1000).toFixed(2)} mm, minZ = ${(minZ*1000).toFixed(2)} mm`);
}
