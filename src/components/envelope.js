import * as THREE from 'three';
import { GOMIKIN_BASELINE_PARAMS, getDerivedGeometry, validateParameters } from '../utils/parameters.js';

/**
 * Creates a text canvas sprite with dynamic width measurement so text is never clipped.
 */
function createTextSprite(text, color = '#00ffcc', bgColor = 'rgba(10, 15, 25, 0.88)') {
  if (typeof document === 'undefined') {
    const fallback = new THREE.Group();
    fallback.name = `TextSpriteFallback_${text}`;
    fallback.userData.isEngineeringLabel = true;
    return fallback;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Measure text width dynamically
  ctx.font = 'bold 24px "Segoe UI", "Courier New", monospace, sans-serif';
  const textMetrics = ctx.measureText(text);
  const textWidth = Math.ceil(textMetrics.width);
  const padX = 32;
  const padY = 16;

  canvas.width = Math.max(160, textWidth + padX * 2);
  canvas.height = 64;

  // Re-apply font after canvas resize
  ctx.font = 'bold 24px "Segoe UI", "Courier New", monospace, sans-serif';

  // Background rounded pill
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(3, 3, canvas.width - 6, canvas.height - 6, 10);
  ctx.fill();

  // Border outline
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(3, 3, canvas.width - 6, canvas.height - 6, 10);
  ctx.stroke();

  // Crisp centered text
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.userData.isEngineeringLabel = true;

  const aspect = canvas.width / canvas.height;
  const spriteH = 0.055;
  sprite.scale.set(spriteH * aspect, spriteH, 1);
  return sprite;
}

/**
 * Creates a circular boundary reference plane with an edge ring and cross grid.
 */
function createBoundaryPlaneMesh(radius, colorHex, name) {
  const planeGroup = new THREE.Group();
  planeGroup.name = name;

  // Translucent disc
  const discGeo = new THREE.CircleGeometry(radius, 64);
  discGeo.rotateX(-Math.PI / 2); // Lay flat on XZ plane
  const discMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const discMesh = new THREE.Mesh(discGeo, discMat);
  discMesh.name = `${name}_Disc`;
  planeGroup.add(discMesh);

  // Outer boundary ring
  const ringGeo = new THREE.RingGeometry(radius * 0.992, radius, 64);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.name = `${name}_Ring`;
  planeGroup.add(ringMesh);

  // Cross hair lines for alignment
  const lineMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.5 });
  const linePoints = [
    new THREE.Vector3(-radius, 0, 0),
    new THREE.Vector3(radius, 0, 0),
    new THREE.Vector3(0, 0, -radius),
    new THREE.Vector3(0, 0, radius),
  ];
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
  const crossHair = new THREE.LineSegments(lineGeo, lineMat);
  crossHair.name = `${name}_CrossHair`;
  planeGroup.add(crossHair);

  return planeGroup;
}

/**
 * Creates a watertight, solid semi-cylindrical chamber envelope geometry.
 * Conforms to the 180° Organic sector (-X side), bounded by:
 * - A curved cylindrical outer wall of specified radius
 * - A flat chord plane at x = xFlat along the central divider
 * - Flat bottom and top caps
 *
 * @param {number} radius - Outer cylinder radius of the chamber
 * @param {number} height - Chamber vertical height
 * @param {number} xFlat - Lateral X coordinate of the flat divider face (negative for -X organic sector)
 * @param {number} [segments=48] - Number of radial subdivision segments along the arc
 * @returns {THREE.BufferGeometry} Watertight solid semi-cylinder geometry
 */
function createSemiCylinderChamberGeometry(radius, height, xFlat, segments = 48) {
  const geometry = new THREE.BufferGeometry();

  const zMax = Math.sqrt(Math.max(0, radius * radius - xFlat * xFlat));
  const phi1 = Math.atan2(zMax, xFlat);
  const phi2 = Math.PI * 2 - phi1;

  // Precompute arc points on XZ plane
  const arcPoints = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const phi = phi1 + t * (phi2 - phi1);
    arcPoints.push({
      x: i === 0 || i === segments ? xFlat : radius * Math.cos(phi),
      z: i === 0 ? zMax : i === segments ? -zMax : radius * Math.sin(phi),
      u: t,
    });
  }

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  let vertOffset = 0;

  // 1. BOTTOM CAP (Y = 0, normal = [0, -1, 0])
  // Triangle fan from chord midpoint (xFlat, 0, 0)
  const bottomCenterIdx = vertOffset++;
  positions.push(xFlat, 0, 0);
  normals.push(0, -1, 0);
  uvs.push(0.5, 0.5);

  const bottomArcIndices = [];
  for (let i = 0; i <= segments; i++) {
    bottomArcIndices.push(vertOffset++);
    const pt = arcPoints[i];
    positions.push(pt.x, 0, pt.z);
    normals.push(0, -1, 0);
    uvs.push((pt.x / radius + 1) * 0.5, (pt.z / radius + 1) * 0.5);
  }

  for (let i = 0; i < segments; i++) {
    indices.push(bottomCenterIdx, bottomArcIndices[i], bottomArcIndices[i + 1]);
  }

  // 2. TOP CAP (Y = height, normal = [0, 1, 0])
  // Triangle fan from chord midpoint (xFlat, height, 0)
  const topCenterIdx = vertOffset++;
  positions.push(xFlat, height, 0);
  normals.push(0, 1, 0);
  uvs.push(0.5, 0.5);

  const topArcIndices = [];
  for (let i = 0; i <= segments; i++) {
    topArcIndices.push(vertOffset++);
    const pt = arcPoints[i];
    positions.push(pt.x, height, pt.z);
    normals.push(0, 1, 0);
    uvs.push((pt.x / radius + 1) * 0.5, (pt.z / radius + 1) * 0.5);
  }

  for (let i = 0; i < segments; i++) {
    indices.push(topCenterIdx, topArcIndices[i + 1], topArcIndices[i]);
  }

  // 3. CURVED OUTER WALL
  for (let i = 0; i < segments; i++) {
    const ptA = arcPoints[i];
    const ptB = arcPoints[i + 1];

    const idxP0 = vertOffset++;
    const idxP1 = vertOffset++;
    const idxP2 = vertOffset++;
    const idxP3 = vertOffset++;

    positions.push(ptA.x, 0, ptA.z);
    positions.push(ptB.x, 0, ptB.z);
    positions.push(ptB.x, height, ptB.z);
    positions.push(ptA.x, height, ptA.z);

    const lenA = Math.hypot(ptA.x, ptA.z) || 1;
    const lenB = Math.hypot(ptB.x, ptB.z) || 1;
    normals.push(ptA.x / lenA, 0, ptA.z / lenA);
    normals.push(ptB.x / lenB, 0, ptB.z / lenB);
    normals.push(ptB.x / lenB, 0, ptB.z / lenB);
    normals.push(ptA.x / lenA, 0, ptA.z / lenA);

    uvs.push(ptA.u, 0);
    uvs.push(ptB.u, 0);
    uvs.push(ptB.u, 1);
    uvs.push(ptA.u, 1);

    indices.push(idxP0, idxP3, idxP2);
    indices.push(idxP0, idxP2, idxP1);
  }

  // 4. FLAT DIVIDER WALL (along X = xFlat from z = -zMax to z = +zMax)
  // Normal points in +X (towards CentralDivider, outward from organic chamber)
  const idxF0 = vertOffset++;
  const idxF1 = vertOffset++;
  const idxF2 = vertOffset++;
  const idxF3 = vertOffset++;

  positions.push(xFlat, 0, -zMax);
  positions.push(xFlat, 0, zMax);
  positions.push(xFlat, height, zMax);
  positions.push(xFlat, height, -zMax);

  normals.push(1, 0, 0);
  normals.push(1, 0, 0);
  normals.push(1, 0, 0);
  normals.push(1, 0, 0);

  uvs.push(0, 0);
  uvs.push(1, 0);
  uvs.push(1, 1);
  uvs.push(0, 1);

  indices.push(idxF0, idxF2, idxF1);
  indices.push(idxF0, idxF3, idxF2);

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  return geometry;
}

/**
 * Creates a watertight, solid 90° quadrant chamber envelope geometry.
 * Conforms to a 90° sector (+X, +Z for Leftover Food; +X, -Z for Inorganic), bounded by:
 * - A curved cylindrical outer wall of specified radius
 * - A flat chord plane at x = xFlat along the central divider
 * - A flat chord plane at z = zFlat along the radial divider
 * - Flat bottom and top caps
 *
 * @param {number} radius - Outer cylinder radius of the quadrant
 * @param {number} height - Vertical height
 * @param {number} xFlat - Lateral X coordinate of the divider face (positive for +X non-organic sectors)
 * @param {number} zFlat - Sagittal Z coordinate of the divider face (+ for Leftover Food, - for Inorganic)
 * @param {boolean} isPositiveZ - True for Leftover Food (+Z), False for Inorganic (-Z)
 * @param {number} [segments=32] - Number of radial subdivision segments along the arc
 * @returns {THREE.BufferGeometry} Watertight solid quadrant geometry
 */
function createQuadrantChamberGeometry(radius, height, xFlat, zFlat, isPositiveZ, segments = 32) {
  const geometry = new THREE.BufferGeometry();

  const corner = { x: xFlat, z: zFlat };

  // Calculate intersections with the cylinder:
  // On X = xFlat:
  const zEnd1 = (isPositiveZ ? 1 : -1) * Math.sqrt(Math.max(0, radius * radius - xFlat * xFlat));
  // On Z = zFlat:
  const xEnd2 = Math.sqrt(Math.max(0, radius * radius - zFlat * zFlat));

  // Determine arc angles
  let phiStart, phiEnd;
  if (isPositiveZ) {
    // Leftover Food (+X, +Z): from (xEnd2, zFlat) to (xFlat, zEnd1) in CCW direction
    phiStart = Math.atan2(zFlat, xEnd2);
    phiEnd = Math.atan2(zEnd1, xFlat);
  } else {
    // Inorganic (+X, -Z): from (xFlat, zEnd1) to (xEnd2, zFlat) in CCW direction
    phiStart = Math.atan2(zEnd1, xFlat);
    phiEnd = Math.atan2(zFlat, xEnd2);
  }

  // Precompute arc points on XZ plane in CCW order
  const arcPoints = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const phi = phiStart + t * (phiEnd - phiStart);
    let px, pz;
    if (isPositiveZ) {
      px = i === 0 ? xEnd2 : (i === segments ? xFlat : radius * Math.cos(phi));
      pz = i === 0 ? zFlat : (i === segments ? zEnd1 : radius * Math.sin(phi));
    } else {
      px = i === 0 ? xFlat : (i === segments ? xEnd2 : radius * Math.cos(phi));
      pz = i === 0 ? zEnd1 : (i === segments ? zFlat : radius * Math.sin(phi));
    }
    arcPoints.push({ x: px, z: pz, u: t });
  }

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  let vertOffset = 0;

  // 1. BOTTOM CAP (Y = 0, normal = [0, -1, 0])
  const bottomCenterIdx = vertOffset++;
  positions.push(corner.x, 0, corner.z);
  normals.push(0, -1, 0);
  uvs.push(0.5, 0.5);

  const bottomArcIndices = [];
  for (let i = 0; i <= segments; i++) {
    bottomArcIndices.push(vertOffset++);
    const pt = arcPoints[i];
    positions.push(pt.x, 0, pt.z);
    normals.push(0, -1, 0);
    uvs.push((pt.x / radius + 1) * 0.5, (pt.z / radius + 1) * 0.5);
  }

  // Winding for normal [0, -1, 0] (clockwise when looking down):
  for (let i = 0; i < segments; i++) {
    indices.push(bottomCenterIdx, bottomArcIndices[i + 1], bottomArcIndices[i]);
  }

  // 2. TOP CAP (Y = height, normal = [0, 1, 0])
  const topCenterIdx = vertOffset++;
  positions.push(corner.x, height, corner.z);
  normals.push(0, 1, 0);
  uvs.push(0.5, 0.5);

  const topArcIndices = [];
  for (let i = 0; i <= segments; i++) {
    topArcIndices.push(vertOffset++);
    const pt = arcPoints[i];
    positions.push(pt.x, height, pt.z);
    normals.push(0, 1, 0);
    uvs.push((pt.x / radius + 1) * 0.5, (pt.z / radius + 1) * 0.5);
  }

  // Winding for normal [0, 1, 0] (counter-clockwise when looking down):
  for (let i = 0; i < segments; i++) {
    indices.push(topCenterIdx, topArcIndices[i], topArcIndices[i + 1]);
  }

  // 3. CURVED OUTER WALL
  for (let i = 0; i < segments; i++) {
    const ptA = arcPoints[i];
    const ptB = arcPoints[i + 1];

    const idxP0 = vertOffset++;
    const idxP1 = vertOffset++;
    const idxP2 = vertOffset++;
    const idxP3 = vertOffset++;

    positions.push(ptA.x, 0, ptA.z);
    positions.push(ptB.x, 0, ptB.z);
    positions.push(ptB.x, height, ptB.z);
    positions.push(ptA.x, height, ptA.z);

    const lenA = Math.hypot(ptA.x, ptA.z) || 1;
    const lenB = Math.hypot(ptB.x, ptB.z) || 1;
    normals.push(ptA.x / lenA, 0, ptA.z / lenA);
    normals.push(ptB.x / lenB, 0, ptB.z / lenB);
    normals.push(ptB.x / lenB, 0, ptB.z / lenB);
    normals.push(ptA.x / lenA, 0, ptA.z / lenA);

    uvs.push(ptA.u, 0);
    uvs.push(ptB.u, 0);
    uvs.push(ptB.u, 1);
    uvs.push(ptA.u, 1);

    indices.push(idxP0, idxP3, idxP2);
    indices.push(idxP0, idxP2, idxP1);
  }

  // 4. FLAT DIVIDER WALL ALONG CENTRAL DIVIDER (X = xFlat)
  // Normal points in -X (towards CentralDivider, outward from quadrant)
  const idxC0 = vertOffset++;
  const idxC1 = vertOffset++;
  const idxC2 = vertOffset++;
  const idxC3 = vertOffset++;

  const zCentralEnd = zEnd1;
  if (isPositiveZ) {
    // Leftover Food: arc ended at (xFlat, zEnd1). Corner is at (xFlat, zFlat) with zFlat < zEnd1
    positions.push(xFlat, 0, zCentralEnd);
    positions.push(xFlat, 0, corner.z);
    positions.push(xFlat, height, corner.z);
    positions.push(xFlat, height, zCentralEnd);

    normals.push(-1, 0, 0);
    normals.push(-1, 0, 0);
    normals.push(-1, 0, 0);
    normals.push(-1, 0, 0);

    uvs.push(0, 0); uvs.push(1, 0); uvs.push(1, 1); uvs.push(0, 1);
    indices.push(idxC0, idxC3, idxC2);
    indices.push(idxC0, idxC2, idxC1);
  } else {
    // Inorganic: arc started at (xFlat, zEnd1). Corner is at (xFlat, zFlat) with zFlat > zEnd1
    positions.push(xFlat, 0, corner.z);
    positions.push(xFlat, 0, zCentralEnd);
    positions.push(xFlat, height, zCentralEnd);
    positions.push(xFlat, height, corner.z);

    normals.push(-1, 0, 0);
    normals.push(-1, 0, 0);
    normals.push(-1, 0, 0);
    normals.push(-1, 0, 0);

    uvs.push(0, 0); uvs.push(1, 0); uvs.push(1, 1); uvs.push(0, 1);
    indices.push(idxC0, idxC3, idxC2);
    indices.push(idxC0, idxC2, idxC1);
  }

  // 5. FLAT DIVIDER WALL ALONG RADIAL DIVIDER (Z = zFlat)
  const idxR0 = vertOffset++;
  const idxR1 = vertOffset++;
  const idxR2 = vertOffset++;
  const idxR3 = vertOffset++;

  if (isPositiveZ) {
    // Leftover Food: Normal points in -Z (towards RadialDivider)
    // Wall between corner (xFlat, zFlat) and arc start (xEnd2, zFlat) with xFlat < xEnd2
    positions.push(corner.x, 0, zFlat);
    positions.push(xEnd2, 0, zFlat);
    positions.push(xEnd2, height, zFlat);
    positions.push(corner.x, height, zFlat);

    normals.push(0, 0, -1);
    normals.push(0, 0, -1);
    normals.push(0, 0, -1);
    normals.push(0, 0, -1);

    uvs.push(0, 0); uvs.push(1, 0); uvs.push(1, 1); uvs.push(0, 1);
    indices.push(idxR0, idxR3, idxR2);
    indices.push(idxR0, idxR2, idxR1);
  } else {
    // Inorganic: Normal points in +Z (towards RadialDivider)
    // Wall between arc end (xEnd2, zFlat) and corner (xFlat, zFlat) with xEnd2 > xFlat
    positions.push(xEnd2, 0, zFlat);
    positions.push(corner.x, 0, zFlat);
    positions.push(corner.x, height, zFlat);
    positions.push(xEnd2, height, zFlat);

    normals.push(0, 0, 1);
    normals.push(0, 0, 1);
    normals.push(0, 0, 1);
    normals.push(0, 0, 1);

    uvs.push(0, 0); uvs.push(1, 0); uvs.push(1, 1); uvs.push(0, 1);
    indices.push(idxR0, idxR3, idxR2);
    indices.push(idxR0, idxR2, idxR1);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  return geometry;
}

/**
 * Procedurally generates a planar horizontal 90° sector cap disc geometry
 * covering the +X, +Z quadrant from phi = 0 (+X) to phi = PI/2 (+Z).
 *
 * @param {number} radius - Sector arc radius
 * @param {number} [segments=36] - Radial subdivision segments along the arc
 * @returns {THREE.BufferGeometry} Watertight 90° planar sector disc geometry with upward normals (+Y)
 */
function createSectorCapGeometry(radius, segments = 36) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  // Center apex vertex at (0, 0, 0)
  positions.push(0, 0, 0);
  normals.push(0, 1, 0);
  uvs.push(0, 0);

  // Perimeter arc points from phi = 0 (+X) to phi = PI/2 (+Z)
  for (let i = 0; i <= segments; i++) {
    const phi = (i / segments) * (Math.PI / 2);
    const px = radius * Math.cos(phi);
    const pz = radius * Math.sin(phi);
    positions.push(px, 0, pz);
    normals.push(0, 1, 0);
    uvs.push((px / radius + 1) * 0.5, (pz / radius + 1) * 0.5);
  }

  // Winding for upward normal (+Y): (0, i + 2, i + 1)
  for (let i = 0; i < segments; i++) {
    indices.push(0, i + 2, i + 1);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  return geometry;
}

/**
 * Creates the master physical envelope of Gomikin.
 *
 * Suggested Object Hierarchy:
 * GomikinEnvelope
 * ├── MainShell
 * ├── ReferenceGeometry
 * │   ├── CenterAxis
 * │   ├── OuterCylinder
 * │   ├── InnerCylinder
 * │   ├── InputBoundary
 * │   └── LeachateBoundary
 * ├── RegionMarkers
 * │   ├── InputRegionMarker
 * │   ├── MiddleRegionMarker
 * │   └── LeachateRegionMarker
 * ├── StructuralArchitecture (Dividers)
 * │   ├── CentralDivider
 * │   └── RadialDivider
 * ├── OrganicChambers
 * │   ├── OrganicStorageChamber
 * │   ├── OrganicDecompositionChamber
 * │   └── OrganicStorageDecompositionGap
 * ├── InorganicSection
 * │   └── InorganicOutputDrawerEnvelope
 * └── LeftoverFoodSection
 *     ├── LeftoverFoodOuterDrawerEnvelope
 *     └── RemovableStrainerBasketEnvelope
 *
 * @param {Object} [initialParams] Baseline parameters (optional overrides)
 * @returns {THREE.Group} GomikinEnvelope group with attached updateParameters method
 */
export function createGomikinEnvelope(initialParams = GOMIKIN_BASELINE_PARAMS) {
  const envelope = new THREE.Group();
  envelope.name = 'GomikinEnvelope';

  let currentDerived = getDerivedGeometry(initialParams);
  let middleOutputDatumVisible = true;
  let organicChambersVisible = true;
  let decompAgitatorVisible = true;
  let decompSensorsVisible = false; // Hidden by specification ("hide them, don't need to show them. but we need them")
  let inorganicSectionVisible = true;
  let leftoverFoodSectionVisible = true;
  let leftoverFoodDoorVisible = true;
  let leftoverFoodDoorAngleDeg = 0; // Phase 3B kinematic rotation angle (0° to 90°)
  let leftoverFoodTopClosureVisible = true;
  let inputAssemblyVisible = true;
  let labelsVisible = true;

  // Materials cache
  const shellMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a8b98,
    metalness: 0.45,
    roughness: 0.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.28, // Clear translucent shell by default to verify hollow interior without occluding internal mechanisms
    depthWrite: false, // Must be false for transparent outer enclosure to prevent z-buffer occlusion of internal objects
  });

  const lipMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d4852,
    metalness: 0.6,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });

  // ==========================================
  // 1. MAIN CYLINDRICAL SHELL (Hollow interior)
  // ==========================================
  const mainShell = new THREE.Group();
  mainShell.name = 'MainShell';
  mainShell.renderOrder = 99; // Render shell after internal components
  envelope.add(mainShell);

  function buildMainShell(derived) {
    mainShell.clear();

    const { outer_radius, inner_radius, overall_height } = derived.scene;
    const halfH = overall_height / 2;

    // 1a. Outer wall cylinder (open-ended)
    const outerGeo = new THREE.CylinderGeometry(outer_radius, outer_radius, overall_height, 64, 1, true);
    const outerMesh = new THREE.Mesh(outerGeo, shellMaterial);
    outerMesh.name = 'ShellOuterWall';
    outerMesh.position.y = halfH;
    outerMesh.castShadow = true;
    outerMesh.receiveShadow = true;
    mainShell.add(outerMesh);

    // 1b. Inner wall cylinder (open-ended, facing inward)
    const innerGeo = new THREE.CylinderGeometry(inner_radius, inner_radius, overall_height, 64, 1, true);
    const innerMesh = new THREE.Mesh(innerGeo, shellMaterial);
    innerMesh.name = 'ShellInnerWall';
    innerMesh.position.y = halfH;
    mainShell.add(innerMesh);

    // 1c. Top annular lip (ring connecting inner to outer radius, center remains completely open & hollow)
    const topLipGeo = new THREE.RingGeometry(inner_radius, outer_radius, 64);
    topLipGeo.rotateX(-Math.PI / 2);
    const topLipMesh = new THREE.Mesh(topLipGeo, lipMaterial);
    topLipMesh.name = 'ShellTopLip';
    topLipMesh.position.y = overall_height;
    mainShell.add(topLipMesh);

    // 1d. Bottom annular lip (ground contact rim, center remains hollow)
    const bottomLipGeo = new THREE.RingGeometry(inner_radius, outer_radius, 64);
    bottomLipGeo.rotateX(Math.PI / 2);
    const bottomLipMesh = new THREE.Mesh(bottomLipGeo, lipMaterial);
    bottomLipMesh.name = 'ShellBottomLip';
    bottomLipMesh.position.y = 0.001; // Slightly above ground to prevent z-fighting
    mainShell.add(bottomLipMesh);
  }

  // ==========================================
  // 2. REFERENCE GEOMETRY
  // ==========================================
  const referenceGeometry = new THREE.Group();
  referenceGeometry.name = 'ReferenceGeometry';
  envelope.add(referenceGeometry);

  function buildReferenceGeometry(derived) {
    referenceGeometry.clear();

    const {
      outer_radius,
      inner_radius,
      overall_height,
      y_leachate_boundary,
      y_middle_output_datum,
      y_input_boundary,
    } = derived.scene;

    // 2a. CenterAxis (X=left/right, Y=vertical up, Z=front/back, +Z=front)
    const centerAxis = new THREE.Group();
    centerAxis.name = 'CenterAxis';

    // Vertical line from Y = 0 to overall_height * 1.1
    const axisHeight = overall_height * 1.12;
    const axisMat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, axisHeight, 0),
    ]);
    const verticalLine = new THREE.Line(axisGeo, axisMat);
    verticalLine.name = 'VerticalAxisLine';
    centerAxis.add(verticalLine);

    // Ground Triad Arrows (+X red, +Y green, +Z blue/front)
    const arrowLen = outer_radius * 0.75;
    const headLen = arrowLen * 0.25;
    const headWidth = arrowLen * 0.12;

    const arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0.005, 0), arrowLen, 0xff3344, headLen, headWidth);
    arrowX.name = 'Axis_PlusX_Right';
    centerAxis.add(arrowX);

    const arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, overall_height, 0), outer_radius * 0.4, 0x00ff88, headLen * 0.6, headWidth * 0.6);
    arrowY.name = 'Axis_PlusY_Up';
    centerAxis.add(arrowY);

    const arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0.005, 0), arrowLen, 0x3388ff, headLen, headWidth);
    arrowZ.name = 'Axis_PlusZ_Front';
    centerAxis.add(arrowZ);

    // Front direction label sprite
    const frontLabel = createTextSprite('+Z FRONT', '#33aaff');
    frontLabel.position.set(0, 0.05, arrowLen + 0.08);
    frontLabel.scale.set(0.25, 0.065, 1);
    centerAxis.add(frontLabel);

    referenceGeometry.add(centerAxis);

    // 2b. OuterCylinder Reference Geometry (delicate wireframe reference rings)
    const outerRef = new THREE.Group();
    outerRef.name = 'OuterCylinder';
    const wireMatOuter = new THREE.LineDashedMaterial({
      color: 0x44aacc,
      dashSize: 0.02,
      gapSize: 0.015,
      transparent: true,
      opacity: 0.6,
    });
    // Reference rings at bottom, leachate boundary, input boundary, and top
    [0, y_leachate_boundary, y_input_boundary, overall_height].forEach((yPos, idx) => {
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, outer_radius, 0, Math.PI * 2, true).getPoints(64)
      ), wireMatOuter);
      ring.computeLineDistances();
      ring.rotateX(-Math.PI / 2);
      ring.position.y = yPos;
      ring.name = `OuterRefRing_${idx}`;
      outerRef.add(ring);
    });
    referenceGeometry.add(outerRef);

    // 2c. InnerCylinder Reference Geometry (inner diameter reference rings)
    const innerRef = new THREE.Group();
    innerRef.name = 'InnerCylinder';
    const wireMatInner = new THREE.LineDashedMaterial({
      color: 0xff88aa,
      dashSize: 0.02,
      gapSize: 0.015,
      transparent: true,
      opacity: 0.6,
    });
    [0, y_leachate_boundary, y_input_boundary, overall_height].forEach((yPos, idx) => {
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, inner_radius, 0, Math.PI * 2, true).getPoints(64)
      ), wireMatInner);
      ring.computeLineDistances();
      ring.rotateX(-Math.PI / 2);
      ring.position.y = yPos;
      ring.name = `InnerRefRing_${idx}`;
      innerRef.add(ring);
    });
    referenceGeometry.add(innerRef);

    // 2d. Horizontal Reference Plane: BasePlane (Y = 0 mm)
    // Derived from ground baseline datum (Y = 0)
    const basePlane = createBoundaryPlaneMesh(outer_radius * 1.02, 0x4a7288, 'BasePlane');
    basePlane.position.y = 0.001; // Slightly above ground grid to avoid z-fighting
    basePlane.userData = {
      name: 'BasePlane',
      elevation_m: 0,
      elevation_mm: 0,
      role: 'Base ground contact reference datum (Y = 0 mm)',
    };

    const basePlaneLabel = createTextSprite(
      `BASE PLANE (Y = ${derived.mm.y_ground} mm)`,
      '#7da5b5'
    );
    basePlaneLabel.position.set(0, 0.03, outer_radius * 1.08);
    referenceGeometry.add(basePlane);
    referenceGeometry.add(basePlaneLabel);

    // 2e. Horizontal Reference Plane: LeachateBoundary (Y = 100 mm)
    // Derived from: Y = leachate_section_height = 100 mm (0.1 m)
    // Offset from top: input_section_height + middle_section_height = 800 mm
    const leachateBoundary = createBoundaryPlaneMesh(outer_radius * 1.02, 0xffaa00, 'LeachateBoundary');
    leachateBoundary.position.y = y_leachate_boundary;
    leachateBoundary.userData = {
      name: 'LeachateBoundary',
      elevation_m: y_leachate_boundary,
      elevation_mm: derived.mm.y_leachate_boundary,
      offsetFromTop_mm: derived.mm.top_offset_leachate_boundary,
      role: 'Boundary between Middle Section (700mm) and Leachate Section (bottom 100mm)',
    };

    const leachatePlaneLabel = createTextSprite(
      `MIDDLE / LEACHATE BOUNDARY (Y = ${derived.mm.y_leachate_boundary} mm)`,
      '#ffaa00'
    );
    leachatePlaneLabel.position.set(0, y_leachate_boundary + 0.03, outer_radius * 1.08);
    referenceGeometry.add(leachateBoundary);
    referenceGeometry.add(leachatePlaneLabel);

    // 2f. Horizontal Reference Plane / Ring: MiddleOutputDatum (Y = 320 mm)
    // Parametric derivation: Top of 220 mm decomposition chamber
    const middleOutputDatum = createBoundaryPlaneMesh(outer_radius * 1.02, 0xc084fc, 'MiddleOutputDatum');
    middleOutputDatum.position.y = y_middle_output_datum;
    middleOutputDatum.userData = {
      name: 'MiddleOutputDatum',
      elevation_m: y_middle_output_datum,
      elevation_mm: derived.mm.y_middle_output_datum,
      purpose: 'Bottom of the 130 mm storage/decomposition gap, top of the 220 mm decomposition chamber',
      status: 'BASELINE / CHANGEABLE',
      represents: [
        'Bottom of 130 mm storage/decomposition gap',
        'Top of 220 mm decomposition chamber',
      ],
    };

    const middleOutputDatumLabel = createTextSprite(
      `MIDDLE OUTPUT DATUM (Y = ${derived.mm.y_middle_output_datum} mm)`,
      '#c084fc'
    );
    middleOutputDatumLabel.name = 'MiddleOutputDatum_Label';
    middleOutputDatumLabel.position.set(0, 0.03, outer_radius * 1.08);
    middleOutputDatum.add(middleOutputDatumLabel);
    middleOutputDatum.visible = middleOutputDatumVisible;
    referenceGeometry.add(middleOutputDatum);

    // 2g. Horizontal Reference Plane: InputBoundary (Y = 800 mm)
    // Derived from: Y = leachate_section_height + middle_section_height = 800 mm (0.8 m)
    // Offset from top: input_section_height = 100 mm
    const inputBoundary = createBoundaryPlaneMesh(outer_radius * 1.02, 0x00ffcc, 'InputBoundary');
    inputBoundary.position.y = y_input_boundary;
    inputBoundary.userData = {
      name: 'InputBoundary',
      elevation_m: y_input_boundary,
      elevation_mm: derived.mm.y_input_boundary,
      offsetFromTop_mm: derived.mm.top_offset_input_boundary,
      role: 'Boundary between Input Section (top 100mm) and Middle Section (700mm)',
    };

    const inputPlaneLabel = createTextSprite(
      `INPUT / MIDDLE BOUNDARY (Y = ${derived.mm.y_input_boundary} mm)`,
      '#00ffcc'
    );
    inputPlaneLabel.position.set(0, y_input_boundary + 0.03, outer_radius * 1.08);
    referenceGeometry.add(inputBoundary);
    referenceGeometry.add(inputPlaneLabel);

    // 2h. Horizontal Reference Datum: RotatingBaseDatum (Y = 810 mm)
    // Reference elevation for central 2-axis rotating platform (10 mm above Input/Middle boundary)
    const rotatingBaseDatum = createBoundaryPlaneMesh(outer_radius * 0.45, 0xf59e0b, 'RotatingBaseDatum');
    rotatingBaseDatum.position.y = derived.scene.y_rotating_base;
    rotatingBaseDatum.userData = {
      name: 'RotatingBaseDatum',
      elevation_m: derived.scene.y_rotating_base,
      elevation_mm: derived.mm.y_rotating_base,
      offset_above_input_boundary_mm: derived.mm.rotating_base_elevation_offset || 10,
      role: 'Reference datum for two-axis rotating waste platform at divider intersection (0, 0)',
    };
    const rotatingBaseDatumLabel = createTextSprite(
      `ROTATING BASE DATUM (Y = ${derived.mm.y_rotating_base} mm)`,
      '#f59e0b'
    );
    rotatingBaseDatumLabel.position.set(0, derived.scene.y_rotating_base + 0.02, outer_radius * 0.52);
    referenceGeometry.add(rotatingBaseDatum);
    referenceGeometry.add(rotatingBaseDatumLabel);

    // 2i. Horizontal Reference Plane: TopPlane (Y = 900 mm)
    // Derived from: Y = overall_height = 900 mm (0.9 m)
    const topPlane = createBoundaryPlaneMesh(outer_radius * 1.02, 0x38bdf8, 'TopPlane');
    topPlane.position.y = overall_height;
    topPlane.userData = {
      name: 'TopPlane',
      elevation_m: overall_height,
      elevation_mm: derived.mm.y_top,
      role: 'Top envelope boundary datum (Y = overall_height = 900 mm)',
    };

    const topPlaneLabel = createTextSprite(
      `TOP PLANE (Y = ${derived.mm.y_top} mm)`,
      '#38bdf8'
    );
    topPlaneLabel.position.set(0, overall_height + 0.03, outer_radius * 1.08);
    referenceGeometry.add(topPlane);
    referenceGeometry.add(topPlaneLabel);
  }

  // ==========================================
  // 3. REGION MARKERS (Clearly mark the 3 vertical regions)
  // ==========================================
  const regionMarkers = new THREE.Group();
  regionMarkers.name = 'RegionMarkers';
  envelope.add(regionMarkers);

  function buildRegionMarkers(derived) {
    regionMarkers.clear();

    const {
      outer_radius,
      overall_height,
      y_leachate_boundary,
      y_input_boundary,
      input_section_height,
      middle_section_height,
      leachate_section_height,
    } = derived.scene;

    const markerX = -(outer_radius + 0.08); // Placed slightly to the left (-X) for clear lateral viewing

    // Helper: Build a vertical dimension bracket / caliper line
    function createDimensionBracket(yMin, yMax, labelText, colorHex, regionName) {
      const group = new THREE.Group();
      group.name = regionName;

      const lineMat = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2 });
      const tickLen = 0.05;

      // Vertical spine + top/bottom horizontal ticks
      const points = [
        new THREE.Vector3(markerX + tickLen, yMin, 0),
        new THREE.Vector3(markerX, yMin, 0),
        new THREE.Vector3(markerX, yMax, 0),
        new THREE.Vector3(markerX + tickLen, yMax, 0),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, lineMat);
      group.add(line);

      // Translucent cylindrical colored band to highlight the region envelope
      const height = yMax - yMin;
      const bandGeo = new THREE.CylinderGeometry(outer_radius * 1.005, outer_radius * 1.005, height, 48, 1, true);
      const bandMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = yMin + height / 2;
      group.add(band);

      // Floating label
      const midY = (yMin + yMax) / 2;
      const label = createTextSprite(labelText, colorHex);
      label.position.set(markerX - 0.22, midY, 0);
      group.add(label);

      return group;
    }

    // Region 1: INPUT = 200 mm (from y_input_boundary to overall_height)
    const inputMarker = createDimensionBracket(
      y_input_boundary,
      overall_height,
      `INPUT: ${derived.mm.input_section_height} mm`,
      '#00ffcc',
      'InputRegionMarker'
    );
    regionMarkers.add(inputMarker);

    // Region 2: MIDDLE = 600 mm (from y_leachate_boundary to y_input_boundary)
    const middleMarker = createDimensionBracket(
      y_leachate_boundary,
      y_input_boundary,
      `MIDDLE: ${derived.mm.middle_section_height} mm`,
      '#33aaff',
      'MiddleRegionMarker'
    );
    regionMarkers.add(middleMarker);

    // Region 3: LEACHATE = 100 mm (from ground Y=0 to y_leachate_boundary)
    const leachateMarker = createDimensionBracket(
      0,
      y_leachate_boundary,
      `LEACHATE: ${derived.mm.leachate_section_height} mm`,
      '#ffaa00',
      'LeachateRegionMarker'
    );
    regionMarkers.add(leachateMarker);
  }

  // ==========================================
  // 4. STRUCTURAL ARCHITECTURE (Phase 2A Sector Dividers)
  // ==========================================
  const structuralArchitecture = new THREE.Group();
  structuralArchitecture.name = 'StructuralArchitecture';
  envelope.add(structuralArchitecture);

  const dividerMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155, // Slate structural alloy
    metalness: 0.65,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });

  const dividerEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0x64748b,
    transparent: true,
    opacity: 0.8,
  });

  function buildStructuralArchitecture(derived) {
    structuralArchitecture.clear();

    const {
      inner_radius,
      divider_height,
      divider_wall_thickness,
      divider_y_center,
      central_divider_length,
      radial_divider_length,
    } = derived.scene;

    // Apply configurable angular orientation relative to +Z front
    const orientationDeg = derived.raw.sector_orientation_deg || 0;
    structuralArchitecture.rotation.y = THREE.MathUtils.degToRad(orientationDeg);
    structuralArchitecture.userData = {
      name: 'StructuralArchitecture',
      sector_orientation_deg: orientationDeg,
      sectors: {
        organic: { angle_deg: derived.raw.organic_sector_angle, span: '180° semi-cylinder' },
        inorganic: { angle_deg: derived.raw.inorganic_sector_angle, span: '90° quadrant' },
        leftover_food: { angle_deg: derived.raw.food_sector_angle, span: '90° quadrant' },
      },
      source: 'docs/master_geometry.md Section 3',
      status: 'CONFIRMED SECTOR ARCHITECTURE / CHANGEABLE ORIENTATION',
    };

    // 4a. CentralDivider (Primary diameter divider wall)
    // Partitions cylinder into 180° Organic (nominally -X) and 180° Non-Organic (nominally +X)
    // Spans inner diameter along Z: thickness=X, height=Y, length=Z
    const centralGeo = new THREE.BoxGeometry(divider_wall_thickness, divider_height, central_divider_length);
    const centralMesh = new THREE.Mesh(centralGeo, dividerMaterial);
    centralMesh.name = 'CentralDivider';
    centralMesh.position.set(0, divider_y_center, 0);
    centralMesh.castShadow = true;
    centralMesh.receiveShadow = true;

    // Edge outline for crisp visibility against inner shell
    const centralEdges = new THREE.LineSegments(new THREE.EdgesGeometry(centralGeo), dividerEdgeMaterial);
    centralMesh.add(centralEdges);

    centralMesh.userData = {
      name: 'CentralDivider',
      role: 'Primary vertical divider separating 180° Organic sector from Non-Organic sectors',
      divides: ['Organic Sector (180°)', 'Inorganic (90°) & Leftover Food (90°) Sectors'],
      length_mm: derived.mm.central_divider_length,
      height_mm: derived.mm.divider_height,
      thickness_mm: derived.mm.divider_wall_thickness,
      elevation_bottom_mm: derived.mm.divider_y_bottom,
      elevation_top_mm: derived.mm.divider_y_top,
      angular_span_deg: 180,
      orientation_deg: orientationDeg,
      input_section_free_of_dividers: true,
      termination_rule: `Terminates exactly at Y = ${derived.mm.y_input_boundary} mm (y_input_boundary); Y = ${derived.mm.y_input_boundary} to ${derived.mm.y_top} mm remains 100% free of divider walls`,
      source: 'docs/master_geometry.md Section 3 & docs/model_blueprint.md',
      status: 'CONFIRMED GEOMETRY / CHANGEABLE ORIENTATION',
      collisionRequired: true,
    };
    structuralArchitecture.add(centralMesh);

    // 4b. RadialDivider (Secondary radial divider wall)
    // Partitions the 180° non-organic half into 90° Inorganic and 90° Leftover Food quadrants
    // Spans from central axis (X = 0) to inner shell wall (X = inner_radius) along +X
    // Length=X, height=Y, thickness=Z
    const radialGeo = new THREE.BoxGeometry(radial_divider_length, divider_height, divider_wall_thickness);
    const radialMesh = new THREE.Mesh(radialGeo, dividerMaterial);
    radialMesh.name = 'RadialDivider';
    // Position offset along +X so inner edge meets center (X=0) and outer edge meets inner wall (X = inner_radius)
    radialMesh.position.set(radial_divider_length / 2, divider_y_center, 0);
    radialMesh.castShadow = true;
    radialMesh.receiveShadow = true;

    const radialEdges = new THREE.LineSegments(new THREE.EdgesGeometry(radialGeo), dividerEdgeMaterial);
    radialMesh.add(radialEdges);

    radialMesh.userData = {
      name: 'RadialDivider',
      role: 'Secondary radial divider separating 90° Inorganic quadrant from 90° Leftover Food quadrant',
      divides: ['Inorganic Sector (90°)', 'Leftover Food Sector (90°)'],
      length_mm: derived.mm.radial_divider_length,
      height_mm: derived.mm.divider_height,
      thickness_mm: derived.mm.divider_wall_thickness,
      elevation_bottom_mm: derived.mm.divider_y_bottom,
      elevation_top_mm: derived.mm.divider_y_top,
      angular_span_deg: 90,
      orientation_deg: orientationDeg,
      input_section_free_of_dividers: true,
      termination_rule: `Terminates exactly at Y = ${derived.mm.y_input_boundary} mm (y_input_boundary); Y = ${derived.mm.y_input_boundary} to ${derived.mm.y_top} mm remains 100% free of divider walls`,
      source: 'docs/master_geometry.md Section 3 & docs/model_blueprint.md',
      status: 'CONFIRMED GEOMETRY / CHANGEABLE ORIENTATION',
      collisionRequired: true,
    };
    structuralArchitecture.add(radialMesh);

    // 4c. Sector Labels / Badges (visual indicators positioned inside each sector at the divider base plane)
    // Organic Sector: -X side (180°)
    const orgLabel = createTextSprite('ORGANIC (180°)', '#00ffcc');
    orgLabel.position.set(-inner_radius * 0.55, divider_y_center, 0);
    orgLabel.scale.multiplyScalar(0.75);
    orgLabel.name = 'OrganicSectorLabel';
    structuralArchitecture.add(orgLabel);

    // Leftover Food Sector: +X, +Z quadrant (90°)
    const foodLabel = createTextSprite('LEFTOVER FOOD (90°)', '#f59e0b');
    foodLabel.position.set(inner_radius * 0.48, divider_y_center, inner_radius * 0.48);
    foodLabel.scale.multiplyScalar(0.68);
    foodLabel.name = 'LeftoverFoodSectorLabel';
    structuralArchitecture.add(foodLabel);

    // Inorganic Sector: +X, -Z quadrant (90°)
    const inorgLabel = createTextSprite('INORGANIC (90°)', '#38bdf8');
    inorgLabel.position.set(inner_radius * 0.48, divider_y_center, -inner_radius * 0.48);
    inorgLabel.scale.multiplyScalar(0.68);
    inorgLabel.name = 'InorganicSectorLabel';
    structuralArchitecture.add(inorgLabel);
  }

  // ==========================================
  // 5. ORGANIC SECTION CHAMBER ENVELOPES
  // ==========================================
  const organicChambers = new THREE.Group();
  organicChambers.name = 'OrganicChambers';
  envelope.add(organicChambers);

  // Materials for Organic Chamber Envelopes
  const storageChamberMaterial = new THREE.MeshStandardMaterial({
    color: 0x059669, // Rich emerald green for organic storage & drainage
    metalness: 0.2,
    roughness: 0.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.72,
    depthWrite: true,
  });

  const storageEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.85,
  });

  const decompChamberMaterial = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Warm biological amber for thermophilic decomposition
    metalness: 0.2,
    roughness: 0.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.72,
    depthWrite: true,
  });

  const decompEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.85,
  });

  // Materials for Organic Cutting Mechanism
  const cuttingSupportMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569, // Slate steel structural frame
    metalness: 0.65,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });

  const cuttingCollarEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.85,
  });

  const cuttingMotorMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Dark industrial electromechanical casing
    metalness: 0.8,
    roughness: 0.25,
  });

  const cuttingMotorAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Industrial blue junction & accent
    metalness: 0.5,
    roughness: 0.3,
  });

  const cuttingShaftMaterial = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Precision machined high-torque drive shaft
    metalness: 0.9,
    roughness: 0.15,
  });

  const cuttingBladeMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Hardened tool steel shear blades
    metalness: 0.95,
    roughness: 0.12,
    side: THREE.DoubleSide,
  });

  const cuttingBladeEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0x38bdf8, // Sharp cutting edge highlight
  });

  const cuttingScreenMaterial = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Perforated stainless steel sizing screen
    metalness: 0.7,
    roughness: 0.3,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.82,
  });

  const cuttingScreenGridMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffcc, // Perforation aperture grid accent
    transparent: true,
    opacity: 0.75,
  });

  // Materials for Organic Storage Fan & Door Mechanism (Phase 2C Storage Section Assembly)
  const fanCasingMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Industrial slate/dark composite axial fan shroud
    metalness: 0.4,
    roughness: 0.5,
  });

  const fanBladeMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8, // Aerodynamic impeller blades
    metalness: 0.6,
    roughness: 0.25,
    side: THREE.DoubleSide,
  });

  const fanFilterMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155, // Activated carbon filtration canister
    metalness: 0.5,
    roughness: 0.6,
  });

  const fanGrilleMaterial = new THREE.LineBasicMaterial({
    color: 0x94a3b8, // Protective intake wire grille
    transparent: true,
    opacity: 0.8,
  });

  const doorSpineMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569, // Structural aluminum central support spine
    metalness: 0.7,
    roughness: 0.35,
  });

  const doorPanelMaterial = new THREE.MeshStandardMaterial({
    color: 0x2563eb, // Solid 4 mm drop door flap panel
    metalness: 0.6,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });

  const doorPanelEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0x60a5fa, // Highlight for door flap perimeter
  });

  const doorScreenMaterial = new THREE.MeshStandardMaterial({
    color: 0x059669, // Perforated drainage screen mesh plate
    metalness: 0.5,
    roughness: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });

  const doorScreenGridMaterial = new THREE.LineBasicMaterial({
    color: 0x34d399, // Drainage mesh aperture grid lines
    transparent: true,
    opacity: 0.75,
  });

  const doorDrainPortMaterial = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Leachate drain fitting & collar
    metalness: 0.6,
    roughness: 0.3,
  });

  const doorVibratorMaterial = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Electro-mechanical vibration actuator
    metalness: 0.7,
    roughness: 0.3,
  });

  // Decomposition Agitator Materials
  const agitatorMountMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569, // Industrial slate/cast journal housing
    metalness: 0.7,
    roughness: 0.35,
  });

  const agitatorMountEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0x64748b,
  });

  const agitatorShaftMaterial = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Stainless precision-machined vertical shaft
    metalness: 0.85,
    roughness: 0.2,
  });

  const agitatorHubMaterial = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Heavy-duty clamp hub collar
    metalness: 0.6,
    roughness: 0.35,
  });

  const agitatorPaddleMaterial = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Amber industrial composite mixing paddles
    metalness: 0.35,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });

  const agitatorPaddleEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0xfbbf24,
  });

  // Materials for Organic Decomposition Sensory Feedback Array (Base Section)
  const decompSensorHousingMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Industrial sealed encapsulation potting
    metalness: 0.35,
    roughness: 0.45,
  });

  const sensorPuckMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569, // Precision alloy shear-beam body
    metalness: 0.75,
    roughness: 0.25,
  });

  const sensorProbeMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Precision stainless steel probe needle / prongs
    metalness: 0.9,
    roughness: 0.15,
  });

  const sensorGoldMaterial = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Gold contact interface & load button
    metalness: 0.85,
    roughness: 0.2,
  });

  // Phase 3 Mechanical Architecture Materials
  const drawerHandleMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Ergonomic matte slate pull handle
    metalness: 0.5,
    roughness: 0.35,
  });

  const slideRailMaterial = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Stainless linear slide track
    metalness: 0.85,
    roughness: 0.2,
  });

  const quickReleaseMaterial = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Machined stainless quick-release coupling hub
    metalness: 0.85,
    roughness: 0.2,
  });

  const motorHousingMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155, // Industrial motor casting
    metalness: 0.75,
    roughness: 0.3,
  });

  const segregationHubMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569, // Structural divider intersection hub
    metalness: 0.75,
    roughness: 0.25,
  });

  const electronicsHousingMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Translucent protective electronics enclosure
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });

  const pcbMaterial = new THREE.MeshStandardMaterial({
    color: 0x15803d, // Industrial solder-mask green PCB
    metalness: 0.2,
    roughness: 0.5,
  });

  const batteryBoxMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Industrial battery container
    metalness: 0.4,
    roughness: 0.3,
  });

  const batteryCellMaterial = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // LiFePO4 cell technical cyan
    metalness: 0.8,
    roughness: 0.2,
  });

  const wiringMaterial = new THREE.MeshStandardMaterial({
    color: 0xeab308, // Insulated copper wiring bundle
    metalness: 0.1,
    roughness: 0.6,
  });

  /**
   * Builds the Organic Cutting Mechanism (Phase 2C Storage Section Assembly)
   * Occupies Y = 770 mm to 795 mm (H = 25 mm cutting allocation).
   * Hierarchy:
   *   OrganicCuttingMechanism
   *   ├── CuttingAssemblySupport (circular collar and sector mounting brackets)
   *   ├── CuttingMotor (top-mounted upside-down above cutting zone)
   *   ├── CuttingShaft (downward vertical drive shaft)
   *   ├── CuttingBlades (4-blade pitched shear rotor with hooked tips)
   *   └── CuttingSizingScreen (horizontal perforated sizing mesh screen)
   */
  function buildOrganicCuttingMechanism(derived, chamberRadius, xDividerFace) {
    const cuttingGroup = new THREE.Group();
    cuttingGroup.name = 'OrganicCuttingMechanism';

    const {
      cutting_center_x,
      cutting_center_z,
      cutting_collar_radius,
      cutting_collar_inner_radius,
      cutting_collar_wall_thickness,
      cutting_height,
      y_cutting_bottom,
      y_cutting_top,
      cutting_motor_radius,
      cutting_motor_height,
      cutting_motor_bottom_y,
      cutting_motor_top_y,
      cutting_shaft_radius,
      cutting_shaft_length,
      cutting_shaft_bottom_y,
      cutting_shaft_top_y,
      cutting_rotor_radius,
      cutting_rotor_span,
      cutting_blade_width,
      cutting_blade_thickness,
      cutting_blade_pitch_deg,
      cutting_hook_length,
      cutting_screen_y,
      cutting_blade_y,
      cutting_screen_thickness,
      cutting_blade_screen_clearance,
    } = derived.scene;

    // ----------------------------------------------------
    // 1. CUTTING ASSEMBLY SUPPORT (Collar & Mounting Interface)
    // ----------------------------------------------------
    const supportGroup = new THREE.Group();
    supportGroup.name = 'CuttingAssemblySupport';

    const collarYCenter = (y_cutting_bottom + y_cutting_top) / 2; // Y = 685 mm

    // 1a. Circular Cutting Collar Cylinder (Y = 670 to 700 mm, H = 30 mm)
    // Nested inside 180° semi-cylinder, outer diameter = 200 mm
    const outerCollarGeo = new THREE.CylinderGeometry(
      cutting_collar_radius,
      cutting_collar_radius,
      cutting_height,
      48,
      1,
      true
    );
    const outerCollarMesh = new THREE.Mesh(outerCollarGeo, cuttingSupportMaterial);
    outerCollarMesh.name = 'CuttingCollar_Outer';
    outerCollarMesh.position.set(cutting_center_x, collarYCenter, cutting_center_z);
    outerCollarMesh.castShadow = true;
    outerCollarMesh.receiveShadow = true;
    supportGroup.add(outerCollarMesh);

    const innerCollarGeo = new THREE.CylinderGeometry(
      cutting_collar_inner_radius,
      cutting_collar_inner_radius,
      cutting_height,
      48,
      1,
      true
    );
    const innerCollarMesh = new THREE.Mesh(innerCollarGeo, cuttingSupportMaterial);
    innerCollarMesh.name = 'CuttingCollar_Inner';
    innerCollarMesh.position.set(cutting_center_x, collarYCenter, cutting_center_z);
    supportGroup.add(innerCollarMesh);

    // Rim rings on top and bottom of the collar cylinder
    const topRimGeo = new THREE.RingGeometry(cutting_collar_inner_radius, cutting_collar_radius, 48);
    topRimGeo.rotateX(-Math.PI / 2);
    const topRimMesh = new THREE.Mesh(topRimGeo, cuttingSupportMaterial);
    topRimMesh.name = 'CuttingCollar_TopRim';
    topRimMesh.position.set(cutting_center_x, y_cutting_top, cutting_center_z);
    supportGroup.add(topRimMesh);

    const bottomRimGeo = new THREE.RingGeometry(cutting_collar_inner_radius, cutting_collar_radius, 48);
    bottomRimGeo.rotateX(Math.PI / 2);
    const bottomRimMesh = new THREE.Mesh(bottomRimGeo, cuttingSupportMaterial);
    bottomRimMesh.name = 'CuttingCollar_BottomRim';
    bottomRimMesh.position.set(cutting_center_x, y_cutting_bottom, cutting_center_z);
    supportGroup.add(bottomRimMesh);

    // Collar edge line rings
    const topRimEdge = new THREE.LineSegments(new THREE.EdgesGeometry(topRimGeo), cuttingCollarEdgeMaterial);
    topRimEdge.position.set(cutting_center_x, y_cutting_top + 0.0002, cutting_center_z);
    supportGroup.add(topRimEdge);

    const bottomRimEdge = new THREE.LineSegments(new THREE.EdgesGeometry(bottomRimGeo), cuttingCollarEdgeMaterial);
    bottomRimEdge.position.set(cutting_center_x, y_cutting_bottom - 0.0002, cutting_center_z);
    supportGroup.add(bottomRimEdge);

    // 1b. Motor Mount Top Crossbeam Bridge (spanning across top rim at Y = 700 mm)
    // Provides structural bearing bridge supporting the inverted top motor
    const bridgeSpan = cutting_collar_radius * 2;
    const bridgeWidth = 0.016; // 16 mm beam width
    const bridgeHeight = 0.006; // 6 mm beam height
    const bridgeGeoZ = new THREE.BoxGeometry(bridgeWidth, bridgeHeight, bridgeSpan);
    const bridgeMeshZ = new THREE.Mesh(bridgeGeoZ, cuttingSupportMaterial);
    bridgeMeshZ.name = 'CuttingMotorMount_Crossbeam_Z';
    bridgeMeshZ.position.set(cutting_center_x, y_cutting_top + bridgeHeight / 2, cutting_center_z);
    bridgeMeshZ.castShadow = true;
    supportGroup.add(bridgeMeshZ);

    const bridgeGeoX = new THREE.BoxGeometry(bridgeSpan, bridgeHeight, bridgeWidth);
    const bridgeMeshX = new THREE.Mesh(bridgeGeoX, cuttingSupportMaterial);
    bridgeMeshX.name = 'CuttingMotorMount_Crossbeam_X';
    bridgeMeshX.position.set(cutting_center_x, y_cutting_top + bridgeHeight / 2, cutting_center_z);
    bridgeMeshX.castShadow = true;
    supportGroup.add(bridgeMeshX);

    // Central bearing / motor seat ring at intersection
    const seatRingGeo = new THREE.CylinderGeometry(
      cutting_motor_radius * 1.15,
      cutting_motor_radius * 1.15,
      bridgeHeight * 1.2,
      24
    );
    const seatRingMesh = new THREE.Mesh(seatRingGeo, cuttingSupportMaterial);
    seatRingMesh.name = 'CuttingMotorMount_SeatRing';
    seatRingMesh.position.set(cutting_center_x, y_cutting_top + bridgeHeight / 2, cutting_center_z);
    supportGroup.add(seatRingMesh);

    // 1c. Radial Structural Mounting Struts (connecting collar to Organic sector walls)
    // Strut to Central Divider (+X direction):
    const strutDividerStartX = cutting_center_x + cutting_collar_radius; // ~ -24 mm
    const strutDividerEndX = xDividerFace; // ~ -2 mm
    const strutDividerLen = Math.abs(strutDividerEndX - strutDividerStartX);
    const strutDividerGeo = new THREE.BoxGeometry(strutDividerLen, 0.012, 0.010);
    const strutDividerMesh = new THREE.Mesh(strutDividerGeo, cuttingSupportMaterial);
    strutDividerMesh.name = 'CuttingSupportStrut_Divider';
    strutDividerMesh.position.set(
      (strutDividerStartX + strutDividerEndX) / 2,
      collarYCenter,
      cutting_center_z
    );
    strutDividerMesh.castShadow = true;
    supportGroup.add(strutDividerMesh);

    // Strut to Outer Cylindrical Shell (-X direction):
    const strutOuterStartX = cutting_center_x - cutting_collar_radius; // ~ -224 mm
    const strutOuterEndX = -derived.scene.inner_radius; // ~ -246 mm
    const strutOuterLen = Math.abs(strutOuterStartX - strutOuterEndX);
    const strutOuterGeo = new THREE.BoxGeometry(strutOuterLen, 0.012, 0.010);
    const strutOuterMesh = new THREE.Mesh(strutOuterGeo, cuttingSupportMaterial);
    strutOuterMesh.name = 'CuttingSupportStrut_OuterWall';
    strutOuterMesh.position.set(
      (strutOuterStartX + strutOuterEndX) / 2,
      collarYCenter,
      cutting_center_z
    );
    strutOuterMesh.castShadow = true;
    supportGroup.add(strutOuterMesh);

    // Transverse stabilizer struts along ±Z:
    const zSpanDist = Math.sqrt(Math.max(0, chamberRadius * chamberRadius - cutting_center_x * cutting_center_x)) - cutting_collar_radius;
    if (zSpanDist > 0.005) {
      const zStrutGeo = new THREE.BoxGeometry(0.010, 0.010, zSpanDist);
      const zStrutPos = new THREE.Mesh(zStrutGeo, cuttingSupportMaterial);
      zStrutPos.name = 'CuttingSupportStrut_ZPos';
      zStrutPos.position.set(cutting_center_x, collarYCenter, cutting_center_z + cutting_collar_radius + zSpanDist / 2);
      supportGroup.add(zStrutPos);

      const zStrutNeg = new THREE.Mesh(zStrutGeo, cuttingSupportMaterial);
      zStrutNeg.name = 'CuttingSupportStrut_ZNeg';
      zStrutNeg.position.set(cutting_center_x, collarYCenter, cutting_center_z - (cutting_collar_radius + zSpanDist / 2));
      supportGroup.add(zStrutNeg);
    }

    supportGroup.userData = {
      name: 'CuttingAssemblySupport',
      role: 'Circular cutting collar and structural mounting brackets connecting cutting mechanism to Organic sector',
      collar_diameter_mm: derived.mm.cutting_collar_diameter,
      collar_height_mm: derived.mm.cutting_height,
      center_coordinates_mm: {
        x: derived.mm.cutting_center_x,
        y: derived.mm.y_cutting_bottom + derived.mm.cutting_height / 2,
        z: derived.mm.cutting_center_z,
      },
      status: 'CONFIRMED GEOMETRY / BASELINE TBD DIMENSIONS',
    };
    cuttingGroup.add(supportGroup);

    // ----------------------------------------------------
    // 2. TOP-MOUNTED MOTOR (Upside-down above cutting zone)
    // ----------------------------------------------------
    const motorGroup = new THREE.Group();
    motorGroup.name = 'CuttingMotor';
    motorGroup.position.set(cutting_center_x, y_cutting_top, cutting_center_z);

    // Motor main body (cylinder rising from Y = 700 mm to 735 mm)
    const motorBodyGeo = new THREE.CylinderGeometry(
      cutting_motor_radius,
      cutting_motor_radius,
      cutting_motor_height,
      32
    );
    const motorBodyMesh = new THREE.Mesh(motorBodyGeo, cuttingMotorMaterial);
    motorBodyMesh.name = 'CuttingMotor_Body';
    motorBodyMesh.position.set(0, cutting_motor_height / 2, 0);
    motorBodyMesh.castShadow = true;
    motorGroup.add(motorBodyMesh);

    // Cooling rib fins around motor body for realistic aesthetic
    const finCount = 5;
    for (let f = 1; f <= finCount; f++) {
      const finRingGeo = new THREE.TorusGeometry(cutting_motor_radius, 0.0012, 8, 32);
      finRingGeo.rotateX(Math.PI / 2);
      const finRing = new THREE.Mesh(finRingGeo, cuttingMotorMaterial);
      finRing.position.set(0, (cutting_motor_height / (finCount + 1)) * f, 0);
      motorGroup.add(finRing);
    }

    // Top end bell cap of motor
    const motorCapGeo = new THREE.CylinderGeometry(
      cutting_motor_radius * 0.9,
      cutting_motor_radius,
      0.004,
      32
    );
    const motorCapMesh = new THREE.Mesh(motorCapGeo, cuttingMotorMaterial);
    motorCapMesh.name = 'CuttingMotor_TopCap';
    motorCapMesh.position.set(0, cutting_motor_height + 0.002, 0);
    motorGroup.add(motorCapMesh);

    // Motor mounting flange at bottom (rests on top crossbeam bridge at Y = 700 mm)
    const motorFlangeGeo = new THREE.CylinderGeometry(
      cutting_motor_radius * 1.25,
      cutting_motor_radius * 1.25,
      0.003,
      32
    );
    const motorFlangeMesh = new THREE.Mesh(motorFlangeGeo, cuttingSupportMaterial);
    motorFlangeMesh.name = 'CuttingMotor_MountFlange';
    motorFlangeMesh.position.set(0, 0.0015, 0);
    motorFlangeMesh.castShadow = true;
    motorGroup.add(motorFlangeMesh);

    // Electrical terminal junction box on side (+Z front side)
    const terminalBoxGeo = new THREE.BoxGeometry(0.016, 0.016, 0.012);
    const terminalBoxMesh = new THREE.Mesh(terminalBoxGeo, cuttingMotorAccentMaterial);
    terminalBoxMesh.name = 'CuttingMotor_TerminalBox';
    terminalBoxMesh.position.set(0, cutting_motor_height * 0.55, cutting_motor_radius + 0.006);
    terminalBoxMesh.castShadow = true;
    motorGroup.add(terminalBoxMesh);

    // Output drive seal / bearing boss (protruding downward into collar)
    const bearingBossGeo = new THREE.CylinderGeometry(
      cutting_shaft_radius * 1.6,
      cutting_shaft_radius * 1.6,
      0.006,
      24
    );
    const bearingBossMesh = new THREE.Mesh(bearingBossGeo, cuttingSupportMaterial);
    bearingBossMesh.name = 'CuttingMotor_BearingBoss';
    bearingBossMesh.position.set(0, -0.003, 0);
    motorGroup.add(bearingBossMesh);

    const motorBadge = createTextSprite('CUTTING MOTOR (TOP-MOUNTED)', '#38bdf8');
    motorBadge.name = 'CuttingMotor_Badge';
    motorBadge.position.set(0, cutting_motor_height + 0.025, 0);
    motorBadge.scale.multiplyScalar(0.6);
    motorGroup.add(motorBadge);

    motorGroup.userData = {
      name: 'CuttingMotor',
      component_type: 'High-Torque Induction Motor',
      mounting_topology: 'Upside-down top-mounted above cutting zone',
      moisture_isolation: 'Completely isolated from gravitational moisture ingress',
      diameter_mm: derived.mm.cutting_motor_diameter,
      height_mm: derived.mm.cutting_motor_height,
      elevation_mm: {
        bottom: derived.mm.cutting_motor_bottom_y,
        top: derived.mm.cutting_motor_top_y,
      },
      actuation: 'PWM Soft-Start (1500 ms logarithmic ramp)',
      monitoring: 'Continuous electrical current-sensing power draw monitoring for jam detection',
      status: 'CONFIRMED TOPOLOGY / BASELINE TBD DIMENSIONS',
      source: 'Version 1 feature specific document.txt Line 18 & docs/model_blueprint.md Line 336',
    };
    cuttingGroup.add(motorGroup);

    // ----------------------------------------------------
    // 3. DOWNWARD ROTARY SHAFT (Vertical Y-axis Drive)
    // ----------------------------------------------------
    const shaftMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(cutting_shaft_radius, cutting_shaft_radius, cutting_shaft_length, 24),
      cuttingShaftMaterial
    );
    shaftMesh.name = 'CuttingShaft';
    // Centers cylinder vertically between motor bottom (Y = 700 mm) and blade hub (Y = 674 mm)
    shaftMesh.position.set(
      cutting_center_x,
      cutting_shaft_bottom_y + cutting_shaft_length / 2,
      cutting_center_z
    );
    shaftMesh.castShadow = true;

    // Shaft locking collar / coupling adapter right above blade hub
    const couplerGeo = new THREE.CylinderGeometry(
      cutting_shaft_radius * 1.5,
      cutting_shaft_radius * 1.5,
      0.005,
      24
    );
    const couplerMesh = new THREE.Mesh(couplerGeo, cuttingShaftMaterial);
    couplerMesh.name = 'CuttingShaft_Coupler';
    couplerMesh.position.set(cutting_center_x, cutting_blade_y + 0.006, cutting_center_z);
    cuttingGroup.add(couplerMesh);

    shaftMesh.userData = {
      name: 'CuttingShaft',
      component_type: 'Downward-facing vertical rotary drive shaft',
      shaft_diameter_mm: derived.mm.cutting_shaft_diameter,
      shaft_length_mm: derived.mm.cutting_shaft_length,
      kinematics: 'Continuous high-speed rotation around vertical Y-axis',
      elevation_mm: {
        bottom: derived.mm.cutting_shaft_bottom_y,
        top: derived.mm.cutting_shaft_top_y,
      },
      status: 'CONFIRMED GEOMETRY / BASELINE TBD DIMENSIONS',
      source: 'Version 1 feature specific document.txt Line 18 & docs/model_blueprint.md Line 207',
    };
    cuttingGroup.add(shaftMesh);

    // ----------------------------------------------------
    // 4. PITCHED SHEAR-BLADE ASSEMBLY (4-Arm Aerodynamic Cross with Hooked Tips)
    // ----------------------------------------------------
    const bladesGroup = new THREE.Group();
    bladesGroup.name = 'CuttingBlades';
    bladesGroup.position.set(cutting_center_x, cutting_blade_y, cutting_center_z);

    // Central Blade Hub boss
    const hubRadius = 0.014; // 14 mm radius
    const hubHeight = 0.008; // 8 mm height
    const hubGeo = new THREE.CylinderGeometry(hubRadius, hubRadius, hubHeight, 24);
    const hubMesh = new THREE.Mesh(hubGeo, cuttingBladeMaterial);
    hubMesh.name = 'CuttingBlades_Hub';
    hubMesh.castShadow = true;
    bladesGroup.add(hubMesh);

    // Hub retaining center bolt cap
    const boltCapGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.003, 16);
    const boltCap = new THREE.Mesh(boltCapGeo, cuttingShaftMaterial);
    boltCap.position.y = hubHeight / 2 + 0.001;
    bladesGroup.add(boltCap);

    // Exactly 4 orthogonal blade arms with aerodynamic suction pitch and hooked tips
    const armCount = 4;
    const armLength = cutting_rotor_radius - hubRadius; // 90 - 14 = 76 mm
    const pitchRad = THREE.MathUtils.degToRad(cutting_blade_pitch_deg); // 22° pitch

    for (let i = 0; i < armCount; i++) {
      const armGroup = new THREE.Group();
      armGroup.name = `CuttingBlades_Arm_${i}`;
      const angle = (Math.PI / 2) * i;
      armGroup.rotation.y = angle;

      // Primary blade arm bar
      const armBarGeo = new THREE.BoxGeometry(armLength, cutting_blade_thickness, cutting_blade_width);
      const armBarMesh = new THREE.Mesh(armBarGeo, cuttingBladeMaterial);
      armBarMesh.name = `CuttingBlades_Bar_${i}`;
      // Positioned along +X local from hub out to tip
      armBarMesh.position.set(hubRadius + armLength / 2, 0, 0);
      // Aerodynamic pitch angle: rotate around longitudinal X-axis
      armBarMesh.rotation.x = pitchRad;
      armBarMesh.castShadow = true;
      armGroup.add(armBarMesh);

      // Sharp leading edge highlight
      const edgeLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(hubRadius, 0, cutting_blade_width / 2),
        new THREE.Vector3(hubRadius + armLength, 0, cutting_blade_width / 2),
      ]);
      const edgeLine = new THREE.Line(edgeLineGeo, cuttingBladeEdgeMaterial);
      edgeLine.position.set(0, 0, 0);
      armBarMesh.add(edgeLine);

      // Tangential hooked tip at outer extremity (from sketch IMG_20260925_175201.jpg)
      // Extends tangentially forward (+Z in local arm space)
      const hookGeo = new THREE.BoxGeometry(0.006, cutting_blade_thickness, cutting_hook_length);
      const hookMesh = new THREE.Mesh(hookGeo, cuttingBladeMaterial);
      hookMesh.name = `CuttingBlades_Hook_${i}`;
      hookMesh.position.set(hubRadius + armLength - 0.003, 0, cutting_hook_length / 2);
      hookMesh.rotation.x = pitchRad;
      hookMesh.castShadow = true;
      armGroup.add(hookMesh);

      bladesGroup.add(armGroup);
    }

    const bladesBadge = createTextSprite('PITCHED SHEAR BLADES (4-ARM)', '#00ffcc');
    bladesBadge.name = 'CuttingBlades_Badge';
    bladesBadge.position.set(0, 0.035, 0);
    bladesBadge.scale.multiplyScalar(0.6);
    bladesGroup.add(bladesBadge);

    bladesGroup.userData = {
      name: 'CuttingBlades',
      component_type: '4-blade aerodynamic shear rotor with hooked tips',
      blade_count: 4,
      tip_to_tip_span_mm: derived.mm.cutting_rotor_span,
      blade_width_mm: derived.mm.cutting_blade_width,
      blade_thickness_mm: derived.mm.cutting_blade_thickness,
      aerodynamic_pitch_deg: derived.raw.cutting_blade_pitch_deg,
      hook_length_mm: derived.mm.cutting_hook_length,
      kinematic_motion: 'Continuous high-speed rotation around vertical Y-axis',
      aerodynamic_function: 'Generates negative pneumatic suction pulling lightweight waste downward',
      rotor_collar_clearance_mm: (derived.mm.cutting_collar_diameter - derived.mm.cutting_rotor_span) / 2,
      sizing_screen_clearance_mm: derived.mm.cutting_blade_screen_clearance,
      status: 'CONFIRMED GEOMETRY / BASELINE TBD DIMENSIONS',
      source: 'references/sketches/IMG_20260925_175201.jpg & Version 1 doc Line 18, 21',
    };
    cuttingGroup.add(bladesGroup);

    // ----------------------------------------------------
    // 5. HORIZONTAL PERFORATED SIZING SCREEN (Fixed below blade path at Y = 670 mm)
    // ----------------------------------------------------
    const screenGroup = new THREE.Group();
    screenGroup.name = 'CuttingSizingScreen';
    screenGroup.position.set(0, cutting_screen_y, 0); // At Y = 670 mm

    // 5a. Circular active sizing screen disk directly beneath cutting collar
    const screenDiscGeo = new THREE.CylinderGeometry(
      cutting_collar_radius,
      cutting_collar_radius,
      cutting_screen_thickness,
      48
    );
    const screenDiscMesh = new THREE.Mesh(screenDiscGeo, cuttingScreenMaterial);
    screenDiscMesh.name = 'CuttingSizingScreen_Disk';
    screenDiscMesh.position.set(cutting_center_x, cutting_screen_thickness / 2, cutting_center_z);
    screenDiscMesh.receiveShadow = true;
    screenGroup.add(screenDiscMesh);

    // Retaining outer rim ring around active sizing zone
    const screenRimGeo = new THREE.RingGeometry(
      cutting_collar_inner_radius,
      cutting_collar_radius,
      48
    );
    screenRimGeo.rotateX(-Math.PI / 2);
    const screenRimMesh = new THREE.Mesh(screenRimGeo, cuttingSupportMaterial);
    screenRimMesh.name = 'CuttingSizingScreen_Rim';
    screenRimMesh.position.set(cutting_center_x, cutting_screen_thickness + 0.0002, cutting_center_z);
    screenGroup.add(screenRimMesh);

    // Concentric perforation aperture rings & radial grid lines visually communicating the sizing mesh
    const apertureGridGroup = new THREE.Group();
    apertureGridGroup.name = 'CuttingSizingScreen_Grid';
    const ringRadii = [0.020, 0.035, 0.050, 0.065, 0.080, 0.092];
    for (const r of ringRadii) {
      const ringPts = [];
      for (let a = 0; a <= 36; a++) {
        const theta = (a / 36) * Math.PI * 2;
        ringPts.push(new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta)));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
      const ringLine = new THREE.Line(ringGeo, cuttingScreenGridMaterial);
      ringLine.position.set(cutting_center_x, cutting_screen_thickness + 0.0004, cutting_center_z);
      apertureGridGroup.add(ringLine);
    }

    // Radial spokes across circular sizing mesh
    const spokeCount = 12;
    for (let s = 0; s < spokeCount; s++) {
      const theta = (s / spokeCount) * Math.PI * 2;
      const spokePts = [
        new THREE.Vector3(0.010 * Math.cos(theta), 0, 0.010 * Math.sin(theta)),
        new THREE.Vector3(0.095 * Math.cos(theta), 0, 0.095 * Math.sin(theta)),
      ];
      const spokeGeo = new THREE.BufferGeometry().setFromPoints(spokePts);
      const spokeLine = new THREE.Line(spokeGeo, cuttingScreenGridMaterial);
      spokeLine.position.set(cutting_center_x, cutting_screen_thickness + 0.0004, cutting_center_z);
      apertureGridGroup.add(spokeLine);
    }
    screenGroup.add(apertureGridGroup);

    // 5b. Outer Sector Flange Plate (spanning the rest of the 180° Organic sector at Y = 670 mm)
    // Ensures waste cannot bypass the sizing screen into the storage chamber
    const flangeShape = new THREE.Shape();
    const zMaxFlange = Math.sqrt(Math.max(0, chamberRadius * chamberRadius - xDividerFace * xDividerFace));
    const phi1Flange = Math.atan2(zMaxFlange, xDividerFace);
    const phi2Flange = Math.PI * 2 - phi1Flange;

    // Outer semi-circular boundary
    flangeShape.moveTo(xDividerFace, zMaxFlange);
    flangeShape.absarc(0, 0, chamberRadius, phi1Flange, phi2Flange, false);
    flangeShape.lineTo(xDividerFace, -zMaxFlange);
    flangeShape.lineTo(xDividerFace, zMaxFlange);

    // Circular hole for the active sizing screen collar
    const collarHole = new THREE.Path();
    collarHole.absarc(cutting_center_x, cutting_center_z, cutting_collar_radius, 0, Math.PI * 2, true);
    flangeShape.holes.push(collarHole);

    const flangeGeo = new THREE.ShapeGeometry(flangeShape, 48);
    flangeGeo.rotateX(-Math.PI / 2);
    const flangeMesh = new THREE.Mesh(flangeGeo, cuttingSupportMaterial);
    flangeMesh.name = 'CuttingSizingScreen_SectorFlange';
    flangeMesh.position.set(0, cutting_screen_thickness / 2, 0);
    flangeMesh.receiveShadow = true;
    screenGroup.add(flangeMesh);

    const screenBadge = createTextSprite('SIZING SCREEN (PERFORATED MESH)', '#34d399');
    screenBadge.name = 'CuttingSizingScreen_Badge';
    screenBadge.position.set(cutting_center_x, 0.020, cutting_center_z);
    screenBadge.scale.multiplyScalar(0.55);
    screenGroup.add(screenBadge);

    screenGroup.userData = {
      name: 'CuttingSizingScreen',
      component_type: 'Horizontal perforated sizing screen / mesh',
      placement: 'Fixed immediately below rotational path of pitched blades at Y = 670 mm',
      aperture_diameter_mm: derived.mm.cutting_screen_aperture,
      screen_thickness_mm: derived.mm.cutting_screen_thickness,
      active_sizing_diameter_mm: derived.mm.cutting_collar_diameter,
      screen_blade_clearance_mm: derived.mm.cutting_blade_screen_clearance,
      spans_organic_sector: true,
      role: 'Traps organic waste until mechanically sized sufficiently to pass through screen apertures into storage chamber below',
      status: 'CONFIRMED GEOMETRY / BASELINE TBD DIMENSIONS',
      source: 'references/sketches/IMG_20260925_175201.jpg & Version 1 doc Line 18, 21',
    };
    cuttingGroup.add(screenGroup);

    // Root OrganicCuttingMechanism metadata
    cuttingGroup.userData = {
      name: 'OrganicCuttingMechanism',
      sector: 'ORGANIC',
      angular_span_deg: 180,
      mechanism_type: 'Top-mounted electric motor with downward shaft, 4 pitched aerodynamic shear blades, and sizing mesh screen',
      vertical_allocation_mm: {
        y_bottom: derived.mm.y_cutting_bottom,
        y_top: derived.mm.y_cutting_top,
        height: derived.mm.cutting_height,
      },
      hierarchy: 'GomikinEnvelope -> OrganicChambers -> OrganicStorageAssembly -> OrganicCuttingMechanism',
      structural_relationship: 'Part of Organic Storage Section assembly (total storage envelope = 295 mm: 25 mm cutter + 270 mm storage chamber)',
      not_separate_chamber: true,
      collisionRequired: true,
      status: 'CONFIRMED STRUCTURAL ARCHITECTURE / BASELINE PARAMETERS',
      source: 'docs/master_geometry.md Section 5 & references/sketches/IMG_20260925_175201.jpg',
    };

    return cuttingGroup;
  }

  /**
   * Builds the Organic Storage Fan Subsystem (Phase 2C Storage Section Assembly)
   * Active exhaust fan and activated carbon filtration matrix mounted on storage chamber shell wall at Y = 650 mm.
   * Reference: references/sketches/IMG_20260925_175220.jpg & Version 1 doc Line 32, 36
   */
  function buildOrganicStorageFan(derived, chamberRadius, xDividerFace) {
    const fanGroup = new THREE.Group();
    fanGroup.name = 'OrganicStorageFan';

    const {
      organic_fan_size,
      organic_fan_depth,
      organic_fan_bore_radius,
      organic_fan_hub_radius,
      organic_fan_blade_count,
      organic_fan_filter_radius,
      organic_fan_filter_depth,
      organic_fan_filter_x,
      organic_fan_casing_x,
      organic_fan_y,
      organic_fan_z,
    } = derived.scene;

    // 1. Fan Casing Housing
    // Flow along X axis (-X is outer shell wall, +X is chamber interior)
    const casingGroup = new THREE.Group();
    casingGroup.name = 'FanCasing';
    casingGroup.position.set(organic_fan_casing_x, organic_fan_y, organic_fan_z);

    // Cylindrical inner duct / shroud tube
    const shroudGeo = new THREE.CylinderGeometry(
      organic_fan_bore_radius,
      organic_fan_bore_radius,
      organic_fan_depth,
      32,
      1,
      true
    );
    shroudGeo.rotateZ(Math.PI / 2); // Orient axis along X
    const shroudMesh = new THREE.Mesh(shroudGeo, fanCasingMaterial);
    shroudMesh.name = 'FanCasing_Shroud';
    casingGroup.add(shroudMesh);

    // Square outer mounting frame face plates extruded along X
    const frameShape = new THREE.Shape();
    const halfSize = organic_fan_size / 2;
    frameShape.moveTo(-halfSize, -halfSize);
    frameShape.lineTo(halfSize, -halfSize);
    frameShape.lineTo(halfSize, halfSize);
    frameShape.lineTo(-halfSize, halfSize);
    frameShape.closePath();

    const boreHole = new THREE.Path();
    boreHole.absarc(0, 0, organic_fan_bore_radius, 0, Math.PI * 2, true);
    frameShape.holes.push(boreHole);

    const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
      depth: organic_fan_depth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.001,
      bevelThickness: 0.001,
    });
    frameGeo.rotateY(Math.PI / 2);
    frameGeo.translate(-organic_fan_depth / 2, 0, 0);

    const frameMesh = new THREE.Mesh(frameGeo, fanCasingMaterial);
    frameMesh.name = 'FanCasing_Frame';
    frameMesh.castShadow = true;
    casingGroup.add(frameMesh);

    // 4 Corner mounting ear bosses
    const cornerOffset = halfSize - 0.006;
    const earPositions = [
      [cornerOffset, cornerOffset],
      [cornerOffset, -cornerOffset],
      [-cornerOffset, cornerOffset],
      [-cornerOffset, -cornerOffset],
    ];
    earPositions.forEach(([ey, ez], idx) => {
      const earGeo = new THREE.CylinderGeometry(0.003, 0.003, organic_fan_depth + 0.001, 16);
      earGeo.rotateZ(Math.PI / 2);
      const earMesh = new THREE.Mesh(earGeo, fanCasingMaterial);
      earMesh.name = `FanCasing_MountEar_${idx}`;
      earMesh.position.set(0, ey, ez);
      casingGroup.add(earMesh);
    });

    fanGroup.add(casingGroup);

    // 2. Fan Rotor (Hub + Aerofoil Blades)
    const rotorGroup = new THREE.Group();
    rotorGroup.name = 'FanRotor';
    rotorGroup.position.set(organic_fan_casing_x, organic_fan_y, organic_fan_z);

    const hubLength = organic_fan_depth * 0.75;
    const hubGeo = new THREE.CylinderGeometry(organic_fan_hub_radius, organic_fan_hub_radius, hubLength, 24);
    hubGeo.rotateZ(Math.PI / 2);
    const hubMesh = new THREE.Mesh(hubGeo, fanBladeMaterial);
    hubMesh.name = 'FanRotor_Hub';
    rotorGroup.add(hubMesh);

    const noseGeo = new THREE.ConeGeometry(organic_fan_hub_radius, 0.008, 24);
    noseGeo.rotateZ(-Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, fanBladeMaterial);
    noseMesh.name = 'FanRotor_NoseCone';
    noseMesh.position.set(hubLength / 2 + 0.004, 0, 0);
    rotorGroup.add(noseMesh);

    const bladeSpan = (organic_fan_bore_radius - organic_fan_hub_radius) - 0.0015; // 1.5 mm tip clearance
    const bladeWidth = 0.012; // 12 mm chord width
    const bladeThickness = 0.0018; // 1.8 mm blade thickness
    const bladeCount = organic_fan_blade_count || 5;

    for (let b = 0; b < bladeCount; b++) {
      const bladeGroup = new THREE.Group();
      bladeGroup.name = `FanRotor_Blade_${b}`;
      const angle = (b / bladeCount) * Math.PI * 2;
      bladeGroup.rotation.x = angle; // Rotates around X axis

      const bladeGeo = new THREE.BoxGeometry(bladeWidth, bladeSpan, bladeThickness);
      const bladeMesh = new THREE.Mesh(bladeGeo, fanBladeMaterial);
      bladeMesh.name = `FanRotor_BladeMesh_${b}`;
      bladeMesh.position.set(0, organic_fan_hub_radius + bladeSpan / 2, 0);
      bladeMesh.rotation.y = THREE.MathUtils.degToRad(32); // Aerodynamic pitch angle
      bladeMesh.castShadow = true;
      bladeGroup.add(bladeMesh);

      rotorGroup.add(bladeGroup);
    }
    fanGroup.add(rotorGroup);

    // 3. Activated Carbon Filter Canister (Exhaust side, -X against outer shell)
    const filterGroup = new THREE.Group();
    filterGroup.name = 'FanCarbonFilter';
    filterGroup.position.set(organic_fan_filter_x, organic_fan_y, organic_fan_z);

    const filterCanisterGeo = new THREE.CylinderGeometry(
      organic_fan_filter_radius,
      organic_fan_filter_radius,
      organic_fan_filter_depth,
      32
    );
    filterCanisterGeo.rotateZ(Math.PI / 2);
    const filterCanisterMesh = new THREE.Mesh(filterCanisterGeo, fanFilterMaterial);
    filterCanisterMesh.name = 'FanCarbonFilter_Canister';
    filterCanisterMesh.castShadow = true;
    filterGroup.add(filterCanisterMesh);

    // Filter exhaust face wire rings representing granule retaining mesh
    const filterFaceX = -organic_fan_filter_depth / 2 - 0.0005;
    const filterRingCount = 4;
    for (let r = 1; r <= filterRingCount; r++) {
      const ringRadius = (organic_fan_filter_radius / (filterRingCount + 1)) * r;
      const ringPts = [];
      for (let a = 0; a <= 32; a++) {
        const theta = (a / 32) * Math.PI * 2;
        ringPts.push(new THREE.Vector3(filterFaceX, ringRadius * Math.cos(theta), ringRadius * Math.sin(theta)));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
      const ringLine = new THREE.Line(ringGeo, fanGrilleMaterial);
      filterGroup.add(ringLine);
    }
    fanGroup.add(filterGroup);

    // 4. Protective Intake Wire Grille (Intake side, +X facing chamber interior)
    const grilleGroup = new THREE.Group();
    grilleGroup.name = 'FanProtectiveGrille';
    grilleGroup.position.set(organic_fan_casing_x + organic_fan_depth / 2 + 0.001, organic_fan_y, organic_fan_z);

    const grilleRings = [0.015, 0.022, 0.028];
    grilleRings.forEach((gr) => {
      const pts = [];
      for (let a = 0; a <= 32; a++) {
        const theta = (a / 32) * Math.PI * 2;
        pts.push(new THREE.Vector3(0, gr * Math.cos(theta), gr * Math.sin(theta)));
      }
      const gGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const gLine = new THREE.Line(gGeo, fanGrilleMaterial);
      grilleGroup.add(gLine);
    });
    for (let s = 0; s < 4; s++) {
      const theta = (s / 4) * Math.PI * 2;
      const pts = [
        new THREE.Vector3(0, 0.008 * Math.cos(theta), 0.008 * Math.sin(theta)),
        new THREE.Vector3(0, (organic_fan_bore_radius - 0.001) * Math.cos(theta), (organic_fan_bore_radius - 0.001) * Math.sin(theta)),
      ];
      const sGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const sLine = new THREE.Line(sGeo, fanGrilleMaterial);
      grilleGroup.add(sLine);
    }
    fanGroup.add(grilleGroup);

    // 5. Engineering Badge Label
    const fanBadge = createTextSprite(
      `EXHAUST FAN & CARBON FILTER (Y = ${derived.mm.organic_fan_elevation} mm)`,
      '#38bdf8'
    );
    fanBadge.name = 'OrganicStorageFan_Badge';
    fanBadge.position.set(organic_fan_casing_x + 0.035, organic_fan_y + 0.05, 0);
    fanBadge.scale.multiplyScalar(0.55);
    fanGroup.add(fanBadge);

    fanGroup.userData = {
      name: 'OrganicStorageFan',
      sector: 'ORGANIC',
      component: 'Active Exhaust Fan & Activated Carbon Filter Subsystem',
      role: 'Continuous/intermittent negative pneumatic pressure odor mitigation; neutralizes VOCs prior to atmospheric venting',
      fan_size_mm: derived.mm.organic_fan_size,
      fan_depth_mm: derived.mm.organic_fan_depth,
      bore_diameter_mm: derived.mm.organic_fan_bore_diameter,
      hub_diameter_mm: derived.mm.organic_fan_hub_diameter,
      blade_count: bladeCount,
      filter_diameter_mm: derived.mm.organic_fan_filter_diameter,
      filter_depth_mm: derived.mm.organic_fan_filter_depth,
      elevation_y_mm: derived.mm.organic_fan_elevation,
      mounting_location: 'Outer curved shell wall of 180° Organic sector',
      motion: 'Static structural assembly (fan rotor rotation un-animated per specification)',
      status: 'CONFIRMED TOPOLOGY / BASELINE TBD PARAMETERS',
      source: 'references/sketches/IMG_20260925_175220.jpg & Version 1 doc Line 32, 36',
    };

    return fanGroup;
  }

  /**
   * Builds the Organic Storage Door Mechanism & Base Assembly (Phase 2C Storage Section Assembly)
   * Center-hinged double-door mechanism with central support spine, perforated drainage screen,
   * leachate drain port, and electro-mechanical vibration actuator.
   * DOOR THICKNESS IS STRICTLY MANDATED AT EXACTLY 4 mm.
   * Reference: references/sketches/IMG_20260925_175220.jpg & Version 1 doc Line 32, 34, 37
   */
  function buildOrganicStorageDoorMechanism(derived, chamberRadius, xDividerFace) {
    const doorMechanismGroup = new THREE.Group();
    doorMechanismGroup.name = 'OrganicStorageDoorMechanism';

    const {
      door_thickness,
      door_clearance,
      door_slope_angle_deg,
      door_central_spine_width,
      door_central_spine_height,
      door_hinge_barrel_diameter,
      door_hinge_barrel_radius,
      door_drainage_screen_thickness,
      door_drainage_screen_gap,
      door_drain_hole_diameter,
      door_vibrator_length,
      door_vibrator_diameter,
      y_door_base,
      y_door_mesh_bottom,
      spine_x_start,
      spine_x_end,
      spine_length,
      spine_x_center,
      spine_y_center,
    } = derived.scene;

    const doorRadius = chamberRadius - door_clearance;
    const halfSpine = door_central_spine_width / 2;

    // ----------------------------------------------------
    // 1. CENTRAL SUPPORT SPINE (Longitudinal beam along Z = 0)
    // ----------------------------------------------------
    const spineGroup = new THREE.Group();
    spineGroup.name = 'CentralSupportSpine';

    // Main structural spine beam
    const spineBeamGeo = new THREE.BoxGeometry(spine_length, door_central_spine_height, door_central_spine_width);
    const spineBeamMesh = new THREE.Mesh(spineBeamGeo, doorSpineMaterial);
    spineBeamMesh.name = 'CentralSupportSpine_Beam';
    spineBeamMesh.position.set(spine_x_center, spine_y_center, 0);
    spineBeamMesh.castShadow = true;
    spineBeamMesh.receiveShadow = true;
    spineGroup.add(spineBeamMesh);

    // Left and Right longitudinal hinge barrels running along spine sides
    const leftHingeBarGeo = new THREE.CylinderGeometry(door_hinge_barrel_radius, door_hinge_barrel_radius, spine_length, 16);
    leftHingeBarGeo.rotateZ(Math.PI / 2);
    const leftHingeBarMesh = new THREE.Mesh(leftHingeBarGeo, doorSpineMaterial);
    leftHingeBarMesh.name = 'CentralSupportSpine_HingeLeft';
    leftHingeBarMesh.position.set(spine_x_center, y_door_base + door_hinge_barrel_radius, halfSpine);
    spineGroup.add(leftHingeBarMesh);

    const rightHingeBarMesh = new THREE.Mesh(leftHingeBarGeo, doorSpineMaterial);
    rightHingeBarMesh.name = 'CentralSupportSpine_HingeRight';
    rightHingeBarMesh.position.set(spine_x_center, y_door_base + door_hinge_barrel_radius, -halfSpine);
    spineGroup.add(rightHingeBarMesh);

    doorMechanismGroup.add(spineGroup);

    // ----------------------------------------------------
    // 2. STORAGE DOUBLE-DOOR KINEMATIC STRUCTURE (Synchronized Assembly)
    // MANDATED EXACTLY 4 mm THICKNESS
    // Synchronized assembly with local origins centered on physical hinge axes
    // Hinge rod elevations: Y = 624 mm, Z = ±8 mm
    // ----------------------------------------------------
    const yHinge = y_door_base + door_hinge_barrel_radius; // 624 mm
    const syncDoorsAssembly = new THREE.Group();
    syncDoorsAssembly.name = 'StorageSynchronizedDoorsAssembly';

    const zMax = Math.sqrt(Math.max(0, doorRadius * doorRadius - spine_x_start * spine_x_start));
    const xAtHalfSpine = Math.sqrt(Math.max(0, doorRadius * doorRadius - halfSpine * halfSpine));

    // Left Door 2D Shape in X-Z coordinates (Y is extruded depth)
    const leftDoorShape = new THREE.Shape();
    const phiBLeft = Math.atan2(zMax, spine_x_start);
    const phiCLeft = Math.atan2(halfSpine, -xAtHalfSpine);

    leftDoorShape.moveTo(spine_x_start, halfSpine);
    leftDoorShape.lineTo(spine_x_start, zMax);
    leftDoorShape.absarc(0, 0, doorRadius, phiBLeft, phiCLeft, false);
    leftDoorShape.lineTo(-xAtHalfSpine, halfSpine);
    leftDoorShape.closePath();

    const leftDoorGeo = new THREE.ExtrudeGeometry(leftDoorShape, {
      depth: door_thickness, // EXACTLY 0.004 m (4 mm)
      bevelEnabled: false,
    });
    // Rotate and translate so extrusion is along +Y with 4 mm thickness
    leftDoorGeo.rotateX(Math.PI / 2);
    leftDoorGeo.translate(0, door_thickness, 0);

    // Left Door Kinematic Pivot Group centered directly on left hinge rod axis (Z = +halfSpine, Y = yHinge)
    const leftDoorGroup = new THREE.Group();
    leftDoorGroup.name = 'StorageDoorLeft';
    leftDoorGroup.position.set(0, yHinge, halfSpine);

    const leftDoorMesh = new THREE.Mesh(leftDoorGeo, doorPanelMaterial);
    leftDoorMesh.name = 'StorageDoorLeft_Panel';
    // Position mesh relative to local hinge axis origin
    leftDoorMesh.position.set(0, -door_hinge_barrel_radius, -halfSpine);
    leftDoorMesh.castShadow = true;
    leftDoorMesh.receiveShadow = true;
    leftDoorGroup.add(leftDoorMesh);

    const leftDoorEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(leftDoorGeo, 20),
      doorPanelEdgeMaterial
    );
    leftDoorEdges.name = 'StorageDoorLeft_Edges';
    leftDoorMesh.add(leftDoorEdges);

    // Generic Linkage Attachment Point (Lug) on door underside
    const lugGeo = new THREE.BoxGeometry(0.010, 0.012, 0.008);
    const leftLug = new THREE.Mesh(lugGeo, doorSpineMaterial);
    leftLug.name = 'StorageDoorLeft_LinkageLug';
    leftLug.position.set(spine_x_center, -door_hinge_barrel_radius - 0.006, 0.040);
    leftDoorGroup.add(leftLug);

    leftDoorGroup.userData = {
      name: 'StorageDoorLeft',
      sector: 'ORGANIC',
      component: 'Left Sloped Solid Drop Door Flap',
      thickness_mm: derived.mm.door_thickness, // EXACTLY 4 mm
      mandated_thickness_mm: 4,
      status: 'CONFIRMED SPECIFICATION (EXACTLY 4 mm DOOR THICKNESS)',
      hinge_axis: 'Local X-axis at (0, 624 mm, +8 mm)',
      motion_type: 'Angular downward swing around longitudinal spine left hinge axis',
      kinematic_rotation: 'Positive rotation around local X swings door downward toward decomposition section',
      synchronized: true,
      slope_angle_deg: derived.raw.door_slope_angle_deg,
      source: 'User mandate & Version 1 doc Line 32, 34, 37 & IMG_20260925_175220.jpg',
      collisionRequired: true,
    };
    syncDoorsAssembly.add(leftDoorGroup);

    // Right Door
    const rightDoorShape = new THREE.Shape();
    const phiCRight = Math.atan2(-halfSpine, -xAtHalfSpine);
    const phiBRight = Math.atan2(-zMax, spine_x_start);

    rightDoorShape.moveTo(spine_x_start, -halfSpine);
    rightDoorShape.lineTo(-xAtHalfSpine, -halfSpine);
    rightDoorShape.absarc(0, 0, doorRadius, phiCRight, phiBRight, false);
    rightDoorShape.lineTo(spine_x_start, -zMax);
    rightDoorShape.closePath();

    const rightDoorGeo = new THREE.ExtrudeGeometry(rightDoorShape, {
      depth: door_thickness, // EXACTLY 0.004 m (4 mm)
      bevelEnabled: false,
    });
    rightDoorGeo.rotateX(Math.PI / 2);
    rightDoorGeo.translate(0, door_thickness, 0);

    // Right Door Kinematic Pivot Group centered directly on right hinge rod axis (Z = -halfSpine, Y = yHinge)
    const rightDoorGroup = new THREE.Group();
    rightDoorGroup.name = 'StorageDoorRight';
    rightDoorGroup.position.set(0, yHinge, -halfSpine);

    const rightDoorMesh = new THREE.Mesh(rightDoorGeo, doorPanelMaterial);
    rightDoorMesh.name = 'StorageDoorRight_Panel';
    // Position mesh relative to local hinge axis origin
    rightDoorMesh.position.set(0, -door_hinge_barrel_radius, halfSpine);
    rightDoorMesh.castShadow = true;
    rightDoorMesh.receiveShadow = true;
    rightDoorGroup.add(rightDoorMesh);

    const rightDoorEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(rightDoorGeo, 20),
      doorPanelEdgeMaterial
    );
    rightDoorEdges.name = 'StorageDoorRight_Edges';
    rightDoorMesh.add(rightDoorEdges);

    // Generic Linkage Attachment Point (Lug) on door underside
    const rightLug = new THREE.Mesh(lugGeo, doorSpineMaterial);
    rightLug.name = 'StorageDoorRight_LinkageLug';
    rightLug.position.set(spine_x_center, -door_hinge_barrel_radius - 0.006, -0.040);
    rightDoorGroup.add(rightLug);

    rightDoorGroup.userData = {
      name: 'StorageDoorRight',
      sector: 'ORGANIC',
      component: 'Right Sloped Solid Drop Door Flap',
      thickness_mm: derived.mm.door_thickness, // EXACTLY 4 mm
      mandated_thickness_mm: 4,
      status: 'CONFIRMED SPECIFICATION (EXACTLY 4 mm DOOR THICKNESS)',
      hinge_axis: 'Local X-axis at (0, 624 mm, -8 mm)',
      motion_type: 'Angular downward swing around longitudinal spine right hinge axis',
      kinematic_rotation: 'Negative rotation around local X swings door downward toward decomposition section',
      synchronized: true,
      slope_angle_deg: derived.raw.door_slope_angle_deg,
      source: 'User mandate & Version 1 doc Line 32, 34, 37 & IMG_20260925_175220.jpg',
      collisionRequired: true,
    };
    syncDoorsAssembly.add(rightDoorGroup);

    syncDoorsAssembly.userData = {
      name: 'StorageSynchronizedDoorsAssembly',
      role: 'Synchronized double-door assembly operating synchronously around longitudinal spine hinge rods',
      hinge_elevation_y_mm: yHinge * 1000, // 624 mm
      hinge_offset_z_mm: halfSpine * 1000, // ±8 mm
      kinematics: 'Synchronous opposing rotation around hinge rods discharging waste into 250 mm gap',
      synchronized: true,
      status: 'CONFIRMED PHASE 3C KINEMATIC REFINEMENT',
    };
    doorMechanismGroup.add(syncDoorsAssembly);

    // ----------------------------------------------------
    // 4. PERFORATED DRAINAGE SCREEN (Parallel above solid doors)
    // ----------------------------------------------------
    const screenGroup = new THREE.Group();
    screenGroup.name = 'PerforatedDrainageScreen';

    const leftScreenGeo = new THREE.ExtrudeGeometry(leftDoorShape, {
      depth: door_drainage_screen_thickness,
      bevelEnabled: false,
    });
    leftScreenGeo.rotateX(Math.PI / 2);
    leftScreenGeo.translate(0, door_drainage_screen_thickness, 0);

    const leftScreenMesh = new THREE.Mesh(leftScreenGeo, doorScreenMaterial);
    leftScreenMesh.name = 'DrainageScreen_LeftPlate';
    leftScreenMesh.position.set(0, y_door_mesh_bottom, 0);
    screenGroup.add(leftScreenMesh);

    const rightScreenGeo = new THREE.ExtrudeGeometry(rightDoorShape, {
      depth: door_drainage_screen_thickness,
      bevelEnabled: false,
    });
    rightScreenGeo.rotateX(Math.PI / 2);
    rightScreenGeo.translate(0, door_drainage_screen_thickness, 0);

    const rightScreenMesh = new THREE.Mesh(rightScreenGeo, doorScreenMaterial);
    rightScreenMesh.name = 'DrainageScreen_RightPlate';
    rightScreenMesh.position.set(0, y_door_mesh_bottom, 0);
    screenGroup.add(rightScreenMesh);

    // Concentric perforation grid lines communicating drainage mesh apertures
    const gridRings = [0.06, 0.10, 0.14, 0.18, 0.22];
    gridRings.forEach((gr) => {
      const pts = [];
      for (let a = 9; a <= 27; a++) {
        const theta = (a / 36) * Math.PI * 2;
        pts.push(new THREE.Vector3(gr * Math.cos(theta), y_door_mesh_bottom + door_drainage_screen_thickness + 0.0003, gr * Math.sin(theta)));
      }
      const rGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const rLine = new THREE.Line(rGeo, doorScreenGridMaterial);
      screenGroup.add(rLine);
    });

    screenGroup.userData = {
      name: 'PerforatedDrainageScreen',
      sector: 'ORGANIC',
      component: 'Perforated Drainage Screen / Mesh Plate',
      thickness_mm: derived.mm.door_drainage_screen_thickness,
      gap_above_doors_mm: derived.mm.door_drainage_screen_gap,
      elevation_y_mm: derived.mm.y_door_mesh_bottom,
      role: 'Supports accumulated organic waste under natural hydrostatic compression; allows liquids to percolate through to sloped doors below',
      status: 'CONFIRMED COMPONENT / BASELINE TBD PARAMETERS',
      source: 'references/sketches/IMG_20260925_175220.jpg & Version 1 doc Line 32, 34',
    };
    doorMechanismGroup.add(screenGroup);

    // ----------------------------------------------------
    // 5. LEACHATE DRAIN PORT & OUTLET FITTING (DEFERRED)
    // Removed per design directive: will be created in a subsequent phase.
    // ----------------------------------------------------

    // ----------------------------------------------------
    // 6. ELECTRO-MECHANICAL VIBRATION ACTUATOR (HIDDEN)
    // Modeled per specification, hidden because current under-spine
    // mounting obstructs door opening/closing swing.
    // ----------------------------------------------------
    const vibratorGroup = new THREE.Group();
    vibratorGroup.name = 'VibrationActuator';
    vibratorGroup.visible = false; // Hidden per directive
    const vibratorX = spine_x_center;
    const vibratorY = y_door_base - 0.012;
    vibratorGroup.position.set(vibratorX, vibratorY, 0);

    const vibratorCylinderGeo = new THREE.CylinderGeometry(
      door_vibrator_diameter / 2,
      door_vibrator_diameter / 2,
      door_vibrator_length,
      24
    );
    vibratorCylinderGeo.rotateZ(Math.PI / 2);
    const vibratorMesh = new THREE.Mesh(vibratorCylinderGeo, doorVibratorMaterial);
    vibratorMesh.name = 'VibrationActuator_Motor';
    vibratorMesh.castShadow = true;
    vibratorGroup.add(vibratorMesh);

    const clampGeo = new THREE.BoxGeometry(door_vibrator_length * 0.7, 0.008, door_central_spine_width * 1.1);
    const clampMesh = new THREE.Mesh(clampGeo, doorSpineMaterial);
    clampMesh.name = 'VibrationActuator_Clamp';
    clampMesh.position.set(0, 0.007, 0);
    vibratorGroup.add(clampMesh);

    vibratorGroup.userData = {
      name: 'VibrationActuator',
      sector: 'ORGANIC',
      component: 'Electro-Mechanical Vibration Actuator',
      length_mm: derived.mm.door_vibrator_length,
      diameter_mm: derived.mm.door_vibrator_diameter,
      role: 'Intermittent vibratory anti-clogging agitation; disrupts surface tension and ensures colloidal release during batch drop',
      hidden: true,
      visibility_rationale: 'Hidden by design instruction: under-spine placement obstructs door kinematic opening/closing swing; pending mounting relocation',
      status: 'CONFIRMED COMPONENT / HIDDEN',
      source: 'Version 1 doc Line 32, 35, 37',
    };
    doorMechanismGroup.add(vibratorGroup);

    // ----------------------------------------------------
    // 7. ENGINEERING BADGE LABEL
    // ----------------------------------------------------
    const doorBadge = createTextSprite(
      `DOUBLE-DOOR MECHANISM: 4 mm (Y = ${derived.mm.y_storage_bottom} mm)`,
      '#34d399'
    );
    doorBadge.name = 'OrganicStorageDoorMechanism_Badge';
    doorBadge.position.set(spine_x_center, y_door_base + 0.045, 0);
    doorBadge.scale.multiplyScalar(0.55);
    doorMechanismGroup.add(doorBadge);

    // Root OrganicStorageDoorMechanism metadata
    doorMechanismGroup.userData = {
      name: 'OrganicStorageDoorMechanism',
      sector: 'ORGANIC',
      component: 'Dynamic Base Assembly & Hydrostatic Drainage Subsystem',
      role: 'Dynamic base assembly featuring center-hinged double-door mechanism with central support spine, perforated drainage screen, and vibration actuator (hidden; drain port deferred)',
      elevation_datum_y_mm: derived.mm.y_storage_bottom,
      door_thickness_mm: 4, // MANDATED EXACTLY 4 mm
      door_slope_angle_deg: derived.raw.door_slope_angle_deg,
      drainage_screen_thickness_mm: derived.mm.door_drainage_screen_thickness,
      drainage_screen_gap_mm: derived.mm.door_drainage_screen_gap,
      motion: 'Static structural assembly (door swing un-animated per specification)',
      status: 'CONFIRMED ARCHITECTURE / MANDATED 4 mm DOOR THICKNESS',
      source: 'references/sketches/IMG_20260925_175220.jpg & Version 1 doc Line 32, 34, 37',
      collisionRequired: true,
    };

    return doorMechanismGroup;
  }

  /**
   * Builds the Organic Decomposition Agitator Mechanism (Phase 2D Decomposition Chamber Assembly).
   * Authoritative references:
   *   - references/sketches/IMG_20260925_175238.jpg (Decomposition Section: Agitator)
   *   - references/documentation/Version 1 feature specific document.txt (Lines 65–70)
   *   - docs/master_geometry.md (Section 10 "Agitator")
   *
   * Hierarchy:
   *   OrganicDecompositionAgitator
   *   ├── AgitatorMount (cylindrical base boss & flange on decomposition floor)
   *   ├── AgitatorVerticalShaft (central drive shaft along Y-axis)
   *   ├── AgitatorHub (sleeve collar clamp on shaft)
   *   ├── AgitatorMixingPaddles (Group containing 2 opposed mixing arms)
   *   │   ├── AgitatorArm_Primary (horizontal pitched blade + upward tip sweep)
   *   │   └── AgitatorArm_Secondary (horizontal pitched blade + upward tip sweep)
   *   └── Agitator_Badge (engineering label sprite)
   */
  function buildOrganicDecompositionAgitator(derived, chamberRadius, xDividerFace) {
    const agitatorGroup = new THREE.Group();
    agitatorGroup.name = 'OrganicDecompositionAgitator';

    const {
      agitator_center_x,
      agitator_center_z,
      agitator_mount_radius,
      agitator_mount_height,
      agitator_shaft_radius,
      agitator_shaft_height,
      agitator_hub_radius,
      agitator_hub_height,
      agitator_hub_y,
      agitator_floor_clearance,
      agitator_paddle_span,
      agitator_paddle_radius,
      agitator_paddle_arm_length,
      agitator_paddle_width,
      agitator_paddle_thickness,
      agitator_paddle_pitch_deg,
      agitator_tip_upright_height,
      agitator_tip_upright_width,
      agitator_paddle_y,
      y_decomp_bottom,
      y_decomp_top,
    } = derived.scene;

    agitatorGroup.position.set(agitator_center_x, 0, agitator_center_z);

    // 1. Floor Mount Boss & Bearing Flange (AgitatorMount)
    const mountGroup = new THREE.Group();
    mountGroup.name = 'AgitatorMount';

    // Flange rim
    const flangeRadius = agitator_mount_radius * 1.25;
    const flangeH = agitator_mount_height * 0.25;
    const flangeGeo = new THREE.CylinderGeometry(flangeRadius, flangeRadius, flangeH, 32);
    const flangeMesh = new THREE.Mesh(flangeGeo, agitatorMountMaterial);
    flangeMesh.position.y = y_decomp_bottom + flangeH / 2;
    flangeMesh.castShadow = true;
    flangeMesh.receiveShadow = true;
    mountGroup.add(flangeMesh);

    // Main bearing boss cylinder
    const bossH = agitator_mount_height * 0.75;
    const bossGeo = new THREE.CylinderGeometry(agitator_mount_radius, agitator_mount_radius, bossH, 32);
    const bossMesh = new THREE.Mesh(bossGeo, agitatorMountMaterial);
    bossMesh.position.y = y_decomp_bottom + flangeH + bossH / 2;
    bossMesh.castShadow = true;
    bossMesh.receiveShadow = true;

    const bossEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(bossGeo, 25),
      agitatorMountEdgeMaterial
    );
    bossMesh.add(bossEdges);
    mountGroup.add(bossMesh);

    // 4 Bolt heads on the flange for structural mechanical detail
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const boltR = agitator_mount_radius * 1.1;
      const boltGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.004, 12);
      const boltMesh = new THREE.Mesh(boltGeo, agitatorShaftMaterial);
      boltMesh.position.set(Math.cos(angle) * boltR, y_decomp_bottom + flangeH + 0.002, Math.sin(angle) * boltR);
      mountGroup.add(boltMesh);
    }

    mountGroup.userData = {
      name: 'AgitatorMount',
      diameter_mm: derived.mm.agitator_mount_diameter,
      height_mm: derived.mm.agitator_mount_height,
      elevation_bottom_mm: derived.mm.y_decomp_bottom,
      role: 'Floor-mounted bearing housing and motor journal boss',
      collisionRequired: true,
    };
    agitatorGroup.add(mountGroup);

    // 2. Vertical Drive Shaft (AgitatorVerticalShaft)
    const shaftGeo = new THREE.CylinderGeometry(
      agitator_shaft_radius,
      agitator_shaft_radius,
      agitator_shaft_height,
      24
    );
    const shaftMesh = new THREE.Mesh(shaftGeo, agitatorShaftMaterial);
    shaftMesh.name = 'AgitatorVerticalShaft';
    shaftMesh.position.y = y_decomp_bottom + agitator_shaft_height / 2;
    shaftMesh.castShadow = true;
    shaftMesh.receiveShadow = true;

    // Shaft top cap chamfer
    const capGeo = new THREE.CylinderGeometry(agitator_shaft_radius * 0.8, agitator_shaft_radius, 0.004, 24);
    const capMesh = new THREE.Mesh(capGeo, agitatorShaftMaterial);
    capMesh.position.y = y_decomp_bottom + agitator_shaft_height + 0.002;
    agitatorGroup.add(capMesh);

    shaftMesh.userData = {
      name: 'AgitatorVerticalShaft',
      diameter_mm: derived.mm.agitator_shaft_diameter,
      height_mm: derived.mm.agitator_shaft_height,
      elevation_bottom_mm: derived.mm.y_decomp_bottom,
      motion_axis: 'Y',
      role: 'Vertical rotary drive shaft for agitation paddle assembly',
      collisionRequired: true,
    };
    agitatorGroup.add(shaftMesh);

    // 3. Central Mounting Sleeve Hub (AgitatorHub)
    const hubGeo = new THREE.CylinderGeometry(
      agitator_hub_radius,
      agitator_hub_radius,
      agitator_hub_height,
      24
    );
    const hubMesh = new THREE.Mesh(hubGeo, agitatorHubMaterial);
    hubMesh.name = 'AgitatorHub';
    hubMesh.position.y = agitator_hub_y;
    hubMesh.castShadow = true;
    hubMesh.receiveShadow = true;

    const hubEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(hubGeo, 25),
      agitatorPaddleEdgeMaterial
    );
    hubMesh.add(hubEdges);

    hubMesh.userData = {
      name: 'AgitatorHub',
      diameter_mm: derived.mm.agitator_hub_diameter,
      height_mm: derived.mm.agitator_hub_height,
      elevation_center_mm: derived.mm.agitator_hub_y,
      role: 'Central mounting clamp hub for mixing paddle arms',
      collisionRequired: true,
    };
    agitatorGroup.add(hubMesh);

    // 4. Mixing Paddle Assembly (AgitatorMixingPaddles)
    const paddlesGroup = new THREE.Group();
    paddlesGroup.name = 'AgitatorMixingPaddles';
    paddlesGroup.position.y = agitator_paddle_y;

    // Dual opposed arms (Arm 0 at angle 0, Arm 1 at angle Math.PI)
    const armAngles = [0, Math.PI];
    armAngles.forEach((armAngle, idx) => {
      const armGroup = new THREE.Group();
      armGroup.name = `AgitatorArm_${idx === 0 ? 'Primary' : 'Secondary'}`;
      armGroup.rotation.y = armAngle;

      // a. Horizontal Sweep Blade (pitched for lifting and oxygenation)
      const bladeArmLen = agitator_paddle_arm_length;
      const bladeGeo = new THREE.BoxGeometry(
        bladeArmLen,
        agitator_paddle_thickness,
        agitator_paddle_width
      );
      const bladeMesh = new THREE.Mesh(bladeGeo, agitatorPaddleMaterial);
      bladeMesh.name = `${armGroup.name}_Blade`;
      bladeMesh.position.set(agitator_hub_radius + bladeArmLen / 2, 0, 0);
      bladeMesh.rotation.x = THREE.MathUtils.degToRad(agitator_paddle_pitch_deg);
      bladeMesh.castShadow = true;
      bladeMesh.receiveShadow = true;

      const bladeEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(bladeGeo, 20),
        agitatorPaddleEdgeMaterial
      );
      bladeMesh.add(bladeEdges);
      armGroup.add(bladeMesh);

      // b. Upward-Turned Tip Sweep Paddle (upright outer paddle as sketched in IMG_20260925_175238.jpg)
      const tipGeo = new THREE.BoxGeometry(
        agitator_paddle_thickness,
        agitator_tip_upright_height,
        agitator_tip_upright_width
      );
      const tipMesh = new THREE.Mesh(tipGeo, agitatorPaddleMaterial);
      tipMesh.name = `${armGroup.name}_TipSweep`;
      tipMesh.position.set(
        agitator_paddle_radius - agitator_paddle_thickness / 2,
        agitator_tip_upright_height / 2,
        0
      );
      tipMesh.castShadow = true;
      tipMesh.receiveShadow = true;

      const tipEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(tipGeo, 20),
        agitatorPaddleEdgeMaterial
      );
      tipMesh.add(tipEdges);
      armGroup.add(tipMesh);

      paddlesGroup.add(armGroup);
    });

    paddlesGroup.userData = {
      name: 'AgitatorMixingPaddles',
      arm_count: 2,
      span_mm: derived.mm.agitator_paddle_span,
      chord_width_mm: derived.mm.agitator_paddle_width,
      blade_thickness_mm: derived.mm.agitator_paddle_thickness,
      pitch_angle_deg: derived.mm.agitator_paddle_pitch_deg,
      upright_sweep_height_mm: derived.mm.agitator_tip_upright_height,
      floor_clearance_mm: derived.mm.agitator_floor_clearance,
      role: 'Blunt aeration mixing blades with upward wall sweeps for turnover and oxygenation',
      collisionRequired: true,
    };
    agitatorGroup.add(paddlesGroup);

    // 5. Engineering Label Badge
    const agitatorBadge = createTextSprite(
      'DECOMPOSITION AGITATOR (PADDLE MIXER)',
      '#fbbf24'
    );
    agitatorBadge.name = 'Agitator_Badge';
    agitatorBadge.position.set(0, y_decomp_bottom + agitator_shaft_height + 0.035, 0);
    agitatorBadge.scale.multiplyScalar(0.65);
    agitatorGroup.add(agitatorBadge);

    agitatorGroup.userData = {
      name: 'OrganicDecompositionAgitator',
      sector: 'ORGANIC',
      mechanism: 'ROTATING_PADDLE_AGITATOR',
      rotational_axis: 'Y',
      pivot_x_mm: derived.mm.agitator_center_x,
      pivot_z_mm: derived.mm.agitator_center_z,
      elevation_bottom_mm: derived.mm.y_decomp_bottom,
      paddle_span_mm: derived.mm.agitator_paddle_span,
      shaft_height_mm: derived.mm.agitator_shaft_height,
      floor_clearance_mm: derived.mm.agitator_floor_clearance,
      tip_upright_height_mm: derived.mm.agitator_tip_upright_height,
      pitch_deg: derived.mm.agitator_paddle_pitch_deg,
      status: 'BASELINE / TBD PARAMETERS',
      source: 'references/sketches/IMG_20260925_175238.jpg & docs/master_geometry.md Section 10',
      role: 'Aerobic homogenization and oxygenation paddle agitator with anti-jam clearing protocol',
      collisionRequired: true,
    };

    return agitatorGroup;
  }

  /**
   * Builds the Organic Decomposition Sensory Feedback Array (Phase 2D Decomposition Chamber Base).
   * Authoritative references:
   *   - references/documentation/Version 1 feature specific document.txt (Lines 48, 50-52, 65, 68, 125, 134)
   *   - docs/master_geometry.md Section 10
   *
   * Includes:
   *   1. Mass-sensing load cell positioned beneath the decomposition chamber floor
   *   2. Core biomass temperature probe extending upward into organic biomass
   *   3. Capacitive/dielectric moisture sensor prongs extending upward into biomass
   *
   * HIERARCHY:
   *   DecompositionSensorArray (hidden by default)
   *   ├── DecompositionLoadCell
   *   ├── DecompositionTemperatureSensor
   *   └── DecompositionMoistureSensor
   */
  function buildOrganicDecompositionSensors(derived, chamberRadius, xDividerFace) {
    const sensorArrayGroup = new THREE.Group();
    sensorArrayGroup.name = 'DecompositionSensorArray';
    sensorArrayGroup.visible = decompSensorsVisible; // Hidden by default (mandated: "hide them, don't need to show them. but we need them")

    const {
      y_decomp_bottom,
      decomp_load_cell_diameter,
      decomp_load_cell_height,
      decomp_load_cell_x,
      decomp_load_cell_y,
      decomp_load_cell_z,
      decomp_temp_sensor_probe_length,
      decomp_temp_sensor_probe_diameter,
      decomp_temp_sensor_x,
      decomp_temp_sensor_y,
      decomp_temp_sensor_z,
      decomp_moisture_sensor_length,
      decomp_moisture_sensor_prong_spacing,
      decomp_moisture_sensor_x,
      decomp_moisture_sensor_y,
      decomp_moisture_sensor_z,
    } = derived.scene;

    // -----------------------------------------------------------------
    // 1. MASS-SENSING LOAD CELL ARCHITECTURE (Positioned beneath removable vessel)
    // Reference: Decision A & Version 1 doc Lines 48, 50, 51, 52, 65, 68
    // Load cell concept supports the removable decomposition chamber from underneath.
    // Dual lateral support pads flank the agitator shaft at Z = ±decomp_load_cell_offset_z
    // Completely clear of agitator shaft and quick-release coupling.
    // Measures gross mass = empty chamber + contents; baseline tare = empty chamber.
    // -----------------------------------------------------------------
    const loadCellGroup = new THREE.Group();
    loadCellGroup.name = 'DecompositionLoadCell';

    const offsetZ = derived.scene.decomp_load_cell_offset_z || 0.090; // ±90 mm lateral offset
    const padPositions = [
      { name: 'DecompositionLoadCell_Support_Front', z: offsetZ },
      { name: 'DecompositionLoadCell_Support_Rear', z: -offsetZ },
    ];

    const puckRadius = decomp_load_cell_diameter / 2;

    padPositions.forEach((pad) => {
      const padGroup = new THREE.Group();
      padGroup.name = pad.name;
      padGroup.position.set(decomp_load_cell_x, decomp_load_cell_y, pad.z);

      // Cylindrical shear-beam puck body
      const puckGeo = new THREE.CylinderGeometry(puckRadius, puckRadius, decomp_load_cell_height, 24);
      const puckMesh = new THREE.Mesh(puckGeo, sensorPuckMaterial);
      puckMesh.name = `${pad.name}_Puck`;
      padGroup.add(puckMesh);

      // Central load button on top of puck contacting chamber floor underside (Y = 100 mm)
      const buttonGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.003, 16);
      const buttonMesh = new THREE.Mesh(buttonGeo, sensorGoldMaterial);
      buttonMesh.name = `${pad.name}_Button`;
      buttonMesh.position.y = decomp_load_cell_height / 2 + 0.0015;
      padGroup.add(buttonMesh);

      // Flanged base mounting ring attached to lower plinth structure
      const ringGeo = new THREE.CylinderGeometry(puckRadius + 0.006, puckRadius + 0.006, 0.002, 24);
      const ringMesh = new THREE.Mesh(ringGeo, decompSensorHousingMaterial);
      ringMesh.name = `${pad.name}_Flange`;
      ringMesh.position.y = -decomp_load_cell_height / 2 + 0.001;
      padGroup.add(ringMesh);

      padGroup.userData = {
        name: pad.name,
        role: 'Lateral load-cell support pad beneath removable vessel; clears central agitator shaft',
        offset_z_mm: pad.z * 1000,
        elevation_y_mm: derived.mm.decomp_load_cell_y,
      };
      loadCellGroup.add(padGroup);
    });

    // Central Engineering Label Sprite
    const loadCellBadge = createTextSprite('LOAD CELLS: TARE BASELINE & VESSEL MASS (DUAL)', '#38bdf8');
    loadCellBadge.name = 'DecompositionLoadCell_Badge';
    loadCellBadge.position.set(decomp_load_cell_x, decomp_load_cell_y - decomp_load_cell_height - 0.015, 0);
    loadCellBadge.scale.multiplyScalar(0.45);
    loadCellBadge.userData.isEngineeringLabel = true;
    loadCellGroup.add(loadCellBadge);

    loadCellGroup.userData = {
      name: 'DecompositionLoadCell',
      sensor_type: 'DUAL_SHEAR_BEAM_LOAD_CELL_SUPPORTS',
      role: 'Measures gross mass (removable vessel + organic contents) with empty vessel as tare baseline',
      tare_concept: 'Measured mass = vessel + contents; Baseline = empty vessel; Useful mass = contents',
      elevation_datum_y_mm: derived.mm.decomp_load_cell_y, // 95 mm
      diameter_mm: derived.mm.decomp_load_cell_diameter,
      height_mm: derived.mm.decomp_load_cell_height,
      support_pads_z_offsets_mm: [-offsetZ * 1000, offsetZ * 1000],
      mounting: 'Plinth top below decomposition chamber floor; does not interfere with central shaft or drawer pull-out',
      shaft_clearance_verified: true,
      allows_drawer_extraction: true,
      hidden: true,
      status: 'CONFIRMED DECISION A ARCHITECTURE',
      source: 'Phase 3 Decision A & Version 1 doc Lines 48, 50-52, 65, 68',
    };
    sensorArrayGroup.add(loadCellGroup);

    // -----------------------------------------------------------------
    // 2. CORE BIOMASS TEMPERATURE SENSOR (Conceptual Probe)
    // Reference: Version 1 doc Lines 48, 50, 65, 125, 134
    // DEFERRED DECISION: Mechanical interface for removable vessel is deferred.
    // -----------------------------------------------------------------
    const tempSensorGroup = new THREE.Group();
    tempSensorGroup.name = 'DecompositionTemperatureSensor';
    tempSensorGroup.position.set(decomp_temp_sensor_x, decomp_temp_sensor_y, decomp_temp_sensor_z);

    // Hex base mounting fitting/bushing in floor
    const hexGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.008, 6);
    const hexMesh = new THREE.Mesh(hexGeo, decompSensorHousingMaterial);
    hexMesh.name = 'DecompositionTemperatureSensor_HexMount';
    hexMesh.position.y = 0.004;
    tempSensorGroup.add(hexMesh);

    // Stainless steel needle probe extending upward into organic biomass
    const probeLen = decomp_temp_sensor_probe_length;
    const probeDia = decomp_temp_sensor_probe_diameter;
    const probeGeo = new THREE.CylinderGeometry(probeDia / 2, probeDia / 2, probeLen, 16);
    const probeMesh = new THREE.Mesh(probeGeo, sensorProbeMaterial);
    probeMesh.name = 'DecompositionTemperatureSensor_Probe';
    probeMesh.position.y = 0.008 + probeLen / 2;
    tempSensorGroup.add(probeMesh);

    // Rounded tip
    const tipGeo = new THREE.SphereGeometry(probeDia / 2, 12, 12);
    const tipMesh = new THREE.Mesh(tipGeo, sensorProbeMaterial);
    tipMesh.name = 'DecompositionTemperatureSensor_Tip';
    tipMesh.position.y = 0.008 + probeLen;
    tempSensorGroup.add(tipMesh);

    // Engineering Label Sprite
    const tempBadge = createTextSprite('TEMPERATURE SENSOR: THERMOPHILIC MONITOR (DEFERRED INTERFACE)', '#f43f5e');
    tempBadge.name = 'DecompositionTemperatureSensor_Badge';
    tempBadge.position.set(0, probeLen + 0.025, 0);
    tempBadge.scale.multiplyScalar(0.45);
    tempBadge.userData.isEngineeringLabel = true;
    tempSensorGroup.add(tempBadge);

    tempSensorGroup.userData = {
      name: 'DecompositionTemperatureSensor',
      sensor_type: 'THERMISTOR_CORE_TEMPERATURE_PROBE',
      role: 'Evaluates thermophilic peak vs ambient stabilization for compost maturity and biological curing verification',
      probe_length_mm: derived.mm.decomp_temp_sensor_probe_length,
      probe_diameter_mm: derived.mm.decomp_temp_sensor_probe_diameter,
      mounting: 'Chamber floor, vertical immersion into biomass (clear of paddle sweep)',
      mechanical_interface_decision: 'TEMPERATURE/MOISTURE SENSOR REMOVABLE-VESSEL INTERFACE — DEFERRED ARCHITECTURAL DECISION',
      wiring_routed_through_interface: false,
      hidden: true,
      status: 'CONCEPTUAL PRESERVED / INTERFACE DEFERRED',
      source: 'Version 1 doc Lines 48, 50, 65, 125, 134',
    };
    sensorArrayGroup.add(tempSensorGroup);

    // -----------------------------------------------------------------
    // 3. CAPACITIVE/DIELECTRIC MOISTURE SENSOR (Dual-prong sensor at floor)
    // Reference: Version 1 doc Lines 48, 65, 125
    // -----------------------------------------------------------------
    const moistureSensorGroup = new THREE.Group();
    moistureSensorGroup.name = 'DecompositionMoistureSensor';
    moistureSensorGroup.position.set(decomp_moisture_sensor_x, decomp_moisture_sensor_y, decomp_moisture_sensor_z);

    // Base potting enclosure
    const baseBoxGeo = new THREE.BoxGeometry(0.022, 0.008, 0.016);
    const baseBoxMesh = new THREE.Mesh(baseBoxGeo, decompSensorHousingMaterial);
    baseBoxMesh.name = 'DecompositionMoistureSensor_Base';
    baseBoxMesh.position.y = 0.004;
    moistureSensorGroup.add(baseBoxMesh);

    // Dual stainless capacitive sensing prongs
    const prongLen = decomp_moisture_sensor_length;
    const prongDia = 0.0025; // 2.5 mm
    const prongSpacing = decomp_moisture_sensor_prong_spacing;
    [-prongSpacing / 2, prongSpacing / 2].forEach((offsetZ, pIdx) => {
      const prongGeo = new THREE.CylinderGeometry(prongDia / 2, prongDia / 2, prongLen, 12);
      const prongMesh = new THREE.Mesh(prongGeo, sensorProbeMaterial);
      prongMesh.name = `DecompositionMoistureSensor_Prong_${pIdx + 1}`;
      prongMesh.position.set(0, 0.008 + prongLen / 2, offsetZ);
      moistureSensorGroup.add(prongMesh);

      // Gold contact tips
      const contactGeo = new THREE.SphereGeometry(prongDia / 2, 8, 8);
      const contactMesh = new THREE.Mesh(contactGeo, sensorGoldMaterial);
      contactMesh.name = `DecompositionMoistureSensor_Tip_${pIdx + 1}`;
      contactMesh.position.set(0, 0.008 + prongLen, offsetZ);
      moistureSensorGroup.add(contactMesh);
    });

    // Engineering Label Sprite
    const moistureBadge = createTextSprite('MOISTURE SENSOR: DIELECTRIC / CAPACITIVE', '#06b6d4');
    moistureBadge.name = 'DecompositionMoistureSensor_Badge';
    moistureBadge.position.set(0, prongLen + 0.025, 0);
    moistureBadge.scale.multiplyScalar(0.45);
    moistureBadge.userData.isEngineeringLabel = true;
    moistureSensorGroup.add(moistureBadge);

    moistureSensorGroup.userData = {
      name: 'DecompositionMoistureSensor',
      sensor_type: 'CAPACITIVE_DIELECTRIC_MOISTURE_PROBE',
      role: 'Monitors moisture percentage in compost core to ensure optimal microbial respiration',
      prong_length_mm: derived.mm.decomp_moisture_sensor_length,
      prong_spacing_mm: derived.mm.decomp_moisture_sensor_prong_spacing,
      mounting: 'Chamber floor, vertical immersion into biomass (clear of paddle sweep)',
      mechanical_interface_decision: 'TEMPERATURE/MOISTURE SENSOR REMOVABLE-VESSEL INTERFACE — DEFERRED ARCHITECTURAL DECISION',
      wiring_routed_through_interface: false,
      hidden: true,
      status: 'CONCEPTUAL PRESERVED / INTERFACE DEFERRED',
      source: 'Version 1 doc Lines 48, 65, 125',
    };
    sensorArrayGroup.add(moistureSensorGroup);

    sensorArrayGroup.userData = {
      name: 'DecompositionSensorArray',
      sector: 'ORGANIC',
      sensors: ['LoadCell', 'TemperatureSensor', 'MoistureSensor'],
      hidden: true,
      deferred_issue: 'TEMPERATURE/MOISTURE SENSOR REMOVABLE-VESSEL INTERFACE — DEFERRED ARCHITECTURAL DECISION',
      visibility_rationale: 'Hidden by specification: sensors modeled and integrated into base architecture, default display state is hidden',
      source: 'Version 1 doc Lines 48, 50, 65, 125, 134',
    };

    return sensorArrayGroup;
  }

  function buildOrganicChambers(derived) {
    organicChambers.clear();
    organicChambers.visible = organicChambersVisible;

    const orientationDeg = derived.raw.sector_orientation_deg || 0;
    organicChambers.rotation.y = THREE.MathUtils.degToRad(orientationDeg);

    // Clearance from inner shell wall and central divider face (1 mm to eliminate z-fighting)
    const clearance = 0.001; // 1 mm clearance in scene units (meters)
    const chamberRadius = derived.scene.inner_radius - clearance;
    const xDividerFace = -(derived.scene.divider_wall_thickness / 2 + clearance);

    // ========================================================
    // ORGANIC STORAGE ASSEMBLY (Total envelope: Y = 500 to 795 mm, H = 295 mm)
    // Combines Storage Chamber (Y = 500–770 mm) and Cutting Mechanism (Y = 770–795 mm)
    // ========================================================
    const storageAssembly = new THREE.Group();
    storageAssembly.name = 'OrganicStorageAssembly';
    storageAssembly.userData = {
      name: 'OrganicStorageAssembly',
      sector: 'ORGANIC',
      angular_span_deg: 180,
      total_envelope_height_mm: derived.mm.organic_cutting_height + derived.mm.storage_height, // 295 mm
      y_bottom_mm: derived.mm.y_storage_bottom, // 500 mm
      y_top_mm: derived.mm.y_cutting_top, // 795 mm
      cutting_mechanism_height_mm: derived.mm.cutting_height, // 25 mm
      storage_chamber_height_mm: derived.mm.storage_height, // 270 mm
      status: 'CONFIRMED HIERARCHY / BASELINE PARAMETERS',
      source: 'docs/master_geometry.md Section 5 & docs/model_blueprint.md',
      role: 'Complete Organic Storage Section assembly combining holding chamber and cutting mechanism',
    };
    organicChambers.add(storageAssembly);

    // 1a. OrganicStorageChamber
    // Occupies the existing 180° Organic sector (-X side)
    // Vertical envelope: Y = 450-670 mm
    // Height derived from organic_storage_height
    const storageGeo = createSemiCylinderChamberGeometry(
      chamberRadius,
      derived.scene.storage_height,
      xDividerFace,
      48
    );
    const storageMesh = new THREE.Mesh(storageGeo, storageChamberMaterial);
    storageMesh.name = 'OrganicStorageChamber';
    storageMesh.position.set(0, derived.scene.y_storage_bottom, 0);
    storageMesh.castShadow = true;
    storageMesh.receiveShadow = true;

    const storageEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(storageGeo, 25),
      storageEdgeMaterial
    );
    storageEdges.name = 'OrganicStorageChamber_Edges';
    storageMesh.add(storageEdges);

    const storageBadge = createTextSprite(
      `STORAGE CHAMBER (Y = ${derived.mm.y_storage_bottom}–${derived.mm.y_storage_top} mm)`,
      '#34d399'
    );
    storageBadge.name = 'OrganicStorageChamber_Badge';
    storageBadge.position.set(xDividerFace * 0.5 - chamberRadius * 0.35, derived.scene.storage_height / 2, 0);
    storageBadge.scale.multiplyScalar(0.7);
    storageMesh.add(storageBadge);

    storageMesh.userData = {
      name: 'OrganicStorageChamber',
      sector: 'ORGANIC',
      angular_span_deg: 180,
      height_mm: derived.mm.storage_height,
      bottom_elevation_mm: derived.mm.y_storage_bottom,
      top_elevation_mm: derived.mm.y_storage_top,
      status: 'BASELINE / CHANGEABLE',
      source: 'docs/master_geometry.md',
      role: 'Organic storage and hydrostatic drainage chamber envelope',
      storage_assembly_total_mm: derived.mm.organic_cutting_height + derived.mm.storage_height,
      cutting_mechanism_allocation_mm: derived.mm.organic_cutting_height,
      collisionRequired: true,
    };
    storageAssembly.add(storageMesh);

    // 1b. OrganicCuttingMechanism (25 mm cutting allocation at Y = 770 to 795 mm)
    const cuttingMechanism = buildOrganicCuttingMechanism(derived, chamberRadius, xDividerFace);
    storageAssembly.add(cuttingMechanism);

    // 1c. OrganicStorageFan (Active exhaust fan & activated carbon filter at Y = 650 mm)
    const storageFan = buildOrganicStorageFan(derived, chamberRadius, xDividerFace);
    storageAssembly.add(storageFan);

    // 1d. OrganicStorageDoorMechanism (Center-hinged double-door mechanism with mandated 4 mm door thickness at Y = 500 mm)
    const storageDoorMechanism = buildOrganicStorageDoorMechanism(derived, chamberRadius, xDividerFace);
    storageAssembly.add(storageDoorMechanism);

    // 2. OrganicDecompositionChamber & Removable Decomposition Vessel Drawer (Decision A)
    // Occupies the 180° Organic sector (-X side), Y = 100–370 mm (Height = 270 mm).
    // The decomposition chamber itself IS the removable drawer/vessel.
    // When pulled out: complete vessel comes out with attached agitator assembly.
    // Drive motor remains stationary below in the plinth (Y < 100 mm).
    // Quick-release coupling separates agitator shaft from stationary motor.
    // Dual load-cell supports sit under the chamber floor at Y = 95 mm.
    const decompGroup = new THREE.Group();
    decompGroup.name = 'OrganicDecompositionChamber';

    // 2a. Removable Drawer Assembly (DecompositionVessel_Drawer)
    const decompVesselDrawer = new THREE.Group();
    decompVesselDrawer.name = 'DecompositionVessel_Drawer';

    const decompGeo = createSemiCylinderChamberGeometry(
      chamberRadius,
      derived.scene.decomp_height,
      xDividerFace,
      48
    );
    const decompMesh = new THREE.Mesh(decompGeo, decompChamberMaterial);
    decompMesh.name = 'OrganicDecompositionChamber_Vessel';
    decompMesh.position.set(0, derived.scene.y_decomp_bottom, 0);
    decompMesh.castShadow = true;
    decompMesh.receiveShadow = true;

    const decompEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(decompGeo, 25),
      decompEdgeMaterial
    );
    decompEdges.name = 'OrganicDecompositionChamber_Edges';
    decompMesh.add(decompEdges);

    // Front-facing ergonomic pull handle on curved shell outer face (-X side)
    const handleY = derived.scene.y_decomp_bottom + derived.scene.decomp_height / 2; // Mid-height (235 mm)
    const handleRadius = chamberRadius + 0.005;
    const handleGroup = new THREE.Group();
    handleGroup.name = 'DecompositionVessel_Handle';
    handleGroup.position.set(-handleRadius, handleY, 0);

    // Arched grab handle bar
    const barGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.120, 16);
    const barMesh = new THREE.Mesh(barGeo, drawerHandleMaterial);
    barMesh.name = 'DecompositionVessel_Handle_Bar';
    barMesh.position.set(-0.015, 0, 0);
    handleGroup.add(barMesh);

    // Two standoffs connecting bar to vessel front
    [-0.050, 0.050].forEach((zOff, sIdx) => {
      const standGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.018, 12);
      standGeo.rotateZ(Math.PI / 2);
      const standMesh = new THREE.Mesh(standGeo, drawerHandleMaterial);
      standMesh.name = `DecompositionVessel_Handle_Standoff_${sIdx + 1}`;
      standMesh.position.set(-0.008, zOff, 0);
      handleGroup.add(standMesh);
    });

    handleGroup.userData = {
      name: 'DecompositionVessel_Handle',
      role: 'Ergonomic front pull handle on removable decomposition vessel drawer',
      extraction_axis: '-X (linear outward pull)',
    };
    decompVesselDrawer.add(handleGroup);

    // Upper Quick-Release Mechanical Coupling Hub (attached under vessel floor)
    const qrRadius = 0.018; // 18 mm radius
    const qrHeight = 0.012; // 12 mm height
    const qrUpperGeo = new THREE.CylinderGeometry(qrRadius, qrRadius * 0.9, qrHeight, 20);
    const qrUpperMesh = new THREE.Mesh(qrUpperGeo, quickReleaseMaterial);
    qrUpperMesh.name = 'AgitatorQuickRelease_UpperCoupling';
    qrUpperMesh.position.set(derived.scene.agitator_center_x, derived.scene.y_decomp_bottom - qrHeight / 2, derived.scene.agitator_center_z);
    decompVesselDrawer.add(qrUpperMesh);

    // 2b. Internal Decomposition Agitator (attached to and traveling WITH the removable vessel!)
    const agitatorAssembly = buildOrganicDecompositionAgitator(derived, chamberRadius, xDividerFace);
    decompVesselDrawer.add(agitatorAssembly);

    const decompBadge = createTextSprite(
      `REMOVABLE DECOMPOSITION VESSEL (Y = ${derived.mm.y_decomp_bottom}–${derived.mm.y_decomp_top} mm)`,
      '#fbbf24'
    );
    decompBadge.name = 'OrganicDecompositionChamber_Badge';
    decompBadge.position.set(xDividerFace * 0.5 - chamberRadius * 0.35, derived.scene.decomp_height / 2, 0);
    decompBadge.scale.multiplyScalar(0.7);
    decompMesh.add(decompBadge);

    decompMesh.userData = {
      name: 'OrganicDecompositionChamber_Vessel',
      sector: 'ORGANIC',
      angular_span_deg: 180,
      height_mm: derived.mm.decomp_height,
      bottom_elevation_mm: derived.mm.y_decomp_bottom,
      top_elevation_mm: derived.mm.y_decomp_top,
      status: 'CONFIRMED DECISION A ARCHITECTURE',
      source: 'docs/master_geometry.md & Decision A',
      role: 'Organic thermophilic decomposition removable vessel container',
      meets_middle_output_datum: true,
      output_drawer_start_datum_mm: derived.mm.y_middle_output_datum,
      collisionRequired: true,
    };
    decompVesselDrawer.add(decompMesh);

    decompVesselDrawer.userData = {
      name: 'DecompositionVessel_Drawer',
      sector: 'ORGANIC',
      role: 'Air-fryer style removable decomposition vessel drawer with attached agitator',
      is_removable_drawer: true,
      extraction_vector: [-1, 0, 0],
      agitator_travels_with_vessel: true,
      drive_motor_remains_below: true,
      quick_release_coupling: true,
      tare_mass_baseline: true,
      status: 'CONFIRMED DECISION A ARCHITECTURE',
    };
    decompGroup.add(decompVesselDrawer);

    // 2c. Stationary Drive Motor (Remains fixed below in the plinth at Y = 0–100 mm)
    const stationaryMotorGroup = new THREE.Group();
    stationaryMotorGroup.name = 'DecompositionStationaryDriveMotor';

    const motorDia = 0.055; // 55 mm diameter
    const motorH = 0.065; // 65 mm height
    const motorY = derived.scene.y_decomp_bottom - 0.005 - motorH / 2; // centered at Y = 62.5 mm

    const motorBodyGeo = new THREE.CylinderGeometry(motorDia / 2, motorDia / 2, motorH, 24);
    const motorBodyMesh = new THREE.Mesh(motorBodyGeo, motorHousingMaterial);
    motorBodyMesh.name = 'DecompositionDriveMotor_Casing';
    motorBodyMesh.position.set(derived.scene.agitator_center_x, motorY, derived.scene.agitator_center_z);
    motorBodyMesh.castShadow = true;
    stationaryMotorGroup.add(motorBodyMesh);

    // Lower Quick-Release Coupling Hub (mounted atop stationary motor output shaft)
    const qrLowerGeo = new THREE.CylinderGeometry(qrRadius * 0.9, qrRadius, qrHeight, 20);
    const qrLowerMesh = new THREE.Mesh(qrLowerGeo, quickReleaseMaterial);
    qrLowerMesh.name = 'AgitatorQuickRelease_LowerCoupling';
    qrLowerMesh.position.set(derived.scene.agitator_center_x, derived.scene.y_decomp_bottom - qrHeight * 1.5, derived.scene.agitator_center_z);
    stationaryMotorGroup.add(qrLowerMesh);

    // Motor mounting bracket to plinth floor
    const bracketGeo = new THREE.BoxGeometry(0.080, 0.006, 0.080);
    const bracketMesh = new THREE.Mesh(bracketGeo, motorHousingMaterial);
    bracketMesh.name = 'DecompositionDriveMotor_MountBracket';
    bracketMesh.position.set(derived.scene.agitator_center_x, motorY - motorH / 2 - 0.003, derived.scene.agitator_center_z);
    stationaryMotorGroup.add(bracketMesh);

    stationaryMotorGroup.userData = {
      name: 'DecompositionStationaryDriveMotor',
      location: 'Fixed in plinth below Y = 100 mm apparatus datum',
      is_stationary: true,
      remains_in_plinth: true,
      separates_from_vessel_on_pullout: true,
      quick_release_coupling: 'Slotted / splined jaw decoupling interface at Y = 100 mm',
      status: 'CONFIRMED DECISION A ARCHITECTURE',
    };
    decompGroup.add(stationaryMotorGroup);

    // 2d. Sensory Feedback Array (Load Cell Dual Support Pads beneath vessel, Temp & Moisture Probes)
    const sensorArray = buildOrganicDecompositionSensors(derived, chamberRadius, xDividerFace);
    decompGroup.add(sensorArray);

    decompGroup.userData = {
      name: 'OrganicDecompositionChamber',
      sector: 'ORGANIC',
      angular_span_deg: 180,
      height_mm: derived.mm.decomp_height,
      bottom_elevation_mm: derived.mm.y_decomp_bottom,
      top_elevation_mm: derived.mm.y_decomp_top,
      status: 'CONFIRMED DECISION A ARCHITECTURE',
      source: 'docs/master_geometry.md & Decision A',
      role: 'Complete decomposition section combining removable vessel drawer, attached agitator, stationary motor, and load cells',
      meets_middle_output_datum: true,
      output_drawer_start_datum_mm: derived.mm.y_middle_output_datum,
      collisionRequired: true,
    };
    organicChambers.add(decompGroup);

    // 3. OrganicStorageDecompositionGap
    // Represent the Y = 320–450 mm region as an intentionally open structural gap/reference volume.
    // Do NOT fill it with geometry.
    const gapGroup = new THREE.Group();
    gapGroup.name = 'OrganicStorageDecompositionGap';

    const gapWireMat = new THREE.LineDashedMaterial({
      color: 0xc084fc,
      dashSize: 0.02,
      gapSize: 0.015,
      transparent: true,
      opacity: 0.75,
    });

    const zMaxGap = Math.sqrt(Math.max(0, chamberRadius * chamberRadius - xDividerFace * xDividerFace));
    const phi1Gap = Math.atan2(zMaxGap, xDividerFace);
    const phi2Gap = Math.PI * 2 - phi1Gap;

    const gapArcPoints = [];
    const gapSegs = 24;
    for (let i = 0; i <= gapSegs; i++) {
      const t = i / gapSegs;
      const phi = phi1Gap + t * (phi2Gap - phi1Gap);
      gapArcPoints.push(new THREE.Vector3(
        i === 0 || i === gapSegs ? xDividerFace : chamberRadius * Math.cos(phi),
        0,
        i === 0 ? zMaxGap : i === gapSegs ? -zMaxGap : chamberRadius * Math.sin(phi)
      ));
    }
    gapArcPoints.push(new THREE.Vector3(xDividerFace, 0, zMaxGap));

    // Bottom boundary wire loop at Y = y_gap_bottom (Y = 320 mm)
    const bottomLoopGeo = new THREE.BufferGeometry().setFromPoints(gapArcPoints);
    const bottomLoop = new THREE.Line(bottomLoopGeo, gapWireMat);
    bottomLoop.computeLineDistances();
    bottomLoop.position.y = derived.scene.y_gap_bottom;
    bottomLoop.name = 'OrganicStorageDecompositionGap_BottomLoop';
    gapGroup.add(bottomLoop);

    // Top boundary wire loop at Y = y_gap_top (Y = 450 mm)
    const topLoopGeo = new THREE.BufferGeometry().setFromPoints(gapArcPoints);
    const topLoop = new THREE.Line(topLoopGeo, gapWireMat);
    topLoop.computeLineDistances();
    topLoop.position.y = derived.scene.y_gap_top;
    topLoop.name = 'OrganicStorageDecompositionGap_TopLoop';
    gapGroup.add(topLoop);

    // Caliper vertical boundary lines connecting the gap corners
    const caliperMat = new THREE.LineBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.6 });
    const cornerPoints = [
      new THREE.Vector3(xDividerFace, derived.scene.y_gap_bottom, zMaxGap),
      new THREE.Vector3(xDividerFace, derived.scene.y_gap_top, zMaxGap),
      new THREE.Vector3(xDividerFace, derived.scene.y_gap_bottom, -zMaxGap),
      new THREE.Vector3(xDividerFace, derived.scene.y_gap_top, -zMaxGap),
      new THREE.Vector3(-chamberRadius, derived.scene.y_gap_bottom, 0),
      new THREE.Vector3(-chamberRadius, derived.scene.y_gap_top, 0),
    ];
    const caliperGeo = new THREE.BufferGeometry().setFromPoints(cornerPoints);
    const caliperLines = new THREE.LineSegments(caliperGeo, caliperMat);
    caliperLines.name = 'OrganicStorageDecompositionGap_CaliperLines';
    gapGroup.add(caliperLines);

    // Centered label badge in the open clearance volume
    const yGapCenter = derived.scene.y_gap_bottom + derived.scene.gap_height / 2;
    const gapBadge = createTextSprite(
      `INTER-CHAMBER GAP: ${derived.mm.gap_height} mm (OPEN CLEARANCE)`,
      '#c084fc'
    );
    gapBadge.name = 'OrganicStorageDecompositionGap_Badge';
    gapBadge.position.set(xDividerFace * 0.5 - chamberRadius * 0.35, yGapCenter, 0);
    gapBadge.scale.multiplyScalar(0.7);
    gapGroup.add(gapBadge);

    gapGroup.userData = {
      name: 'OrganicStorageDecompositionGap',
      sector: 'ORGANIC',
      angular_span_deg: 180,
      height_mm: derived.mm.gap_height,
      bottom_elevation_mm: derived.mm.y_gap_bottom,
      top_elevation_mm: derived.mm.y_gap_top,
      status: 'BASELINE / CHANGEABLE',
      source: 'docs/master_geometry.md',
      role: 'Intentionally open structural clearance gap between storage chamber base and decomposition chamber',
      filled_with_geometry: false,
    };
    organicChambers.add(gapGroup);

    // 4. OrganicCuttingHeadroom (Y = 795 mm to 805 mm, H = 10 mm)
    // Open clearance headroom between cutting mechanism top and base of segregation mechanism
    const headroomGroup = new THREE.Group();
    headroomGroup.name = 'OrganicCuttingHeadroom';

    const headroomWireMat = new THREE.LineDashedMaterial({
      color: 0xa78bfa, // Subtle violet/purple accent
      dashSize: 0.02,
      gapSize: 0.015,
      transparent: true,
      opacity: 0.75,
    });

    const headroomBottomLoop = new THREE.Line(bottomLoopGeo.clone(), headroomWireMat);
    headroomBottomLoop.computeLineDistances();
    headroomBottomLoop.position.y = derived.scene.y_cutting_headroom_bottom;
    headroomBottomLoop.name = 'OrganicCuttingHeadroom_BottomLoop';
    headroomGroup.add(headroomBottomLoop);

    const headroomTopLoop = new THREE.Line(bottomLoopGeo.clone(), headroomWireMat);
    headroomTopLoop.computeLineDistances();
    headroomTopLoop.position.y = derived.scene.y_cutting_headroom_top;
    headroomTopLoop.name = 'OrganicCuttingHeadroom_TopLoop';
    headroomGroup.add(headroomTopLoop);

    const yHeadroomCenter = (derived.scene.y_cutting_headroom_bottom + derived.scene.y_cutting_headroom_top) / 2;
    const headroomBadge = createTextSprite(
      `HEADROOM: ${derived.mm.cutting_headroom_height} mm (Y = ${derived.mm.y_cutting_headroom_bottom}–${derived.mm.y_cutting_headroom_top} mm)`,
      '#a78bfa'
    );
    headroomBadge.name = 'OrganicCuttingHeadroom_Badge';
    headroomBadge.position.set(xDividerFace * 0.5 - chamberRadius * 0.35, yHeadroomCenter, 0);
    headroomBadge.scale.multiplyScalar(0.65);
    headroomGroup.add(headroomBadge);

    headroomGroup.userData = {
      name: 'OrganicCuttingHeadroom',
      sector: 'ORGANIC',
      angular_span_deg: 180,
      height_mm: derived.mm.cutting_headroom_height,
      bottom_elevation_mm: derived.mm.y_cutting_headroom_bottom,
      top_elevation_mm: derived.mm.y_cutting_headroom_top,
      status: 'CONFIRMED HEADROOM / BASELINE PARAMETERS',
      role: 'Headroom between cutting mechanism and base of segregation mechanism',
      filled_with_geometry: false,
    };
    organicChambers.add(headroomGroup);
  }

  // ==========================================
  // 6. INORGANIC SECTION OUTPUT ENVELOPE (90° Sector: +X, -Z)
  // ==========================================
  const inorganicSection = new THREE.Group();
  inorganicSection.name = 'InorganicSection';
  envelope.add(inorganicSection);

  // Materials for Inorganic Output Section
  const inorganicDrawerMaterial = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Vibrant technical cyan-blue for inorganic dry recyclables
    metalness: 0.35,
    roughness: 0.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65,
    depthWrite: true,
  });

  const inorganicEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
  });

  function buildInorganicSection(derived) {
    inorganicSection.clear();
    inorganicSection.visible = inorganicSectionVisible;

    const orientationDeg = derived.raw.sector_orientation_deg || 0;
    inorganicSection.rotation.y = THREE.MathUtils.degToRad(orientationDeg);

    const clearance = derived.scene.drawer_perimeter_clearance || 0.001; // 1 mm clearance in scene units
    const drawerRadius = derived.scene.inner_radius - clearance;
    const xDividerFace = (derived.scene.divider_wall_thickness / 2) + clearance;
    const zDividerFace = -((derived.scene.divider_wall_thickness / 2) + clearance);

    // ----------------------------------------------------
    // INORGANIC PULL-OUT DRAWER (Decision B: Air-Fryer Style Removable Drawer)
    // Starts at Y = 480 mm datum, extends downward to middle-section bottom (Y = 100 mm)
    // Height = 380 mm (derived parametrically: non_organic_output_height)
    // Linear extraction vector: Outward along +X through shell opening
    // ----------------------------------------------------
    const inorganicDrawerGroup = new THREE.Group();
    inorganicDrawerGroup.name = 'InorganicDrawer';

    const inorganicGeo = createQuadrantChamberGeometry(
      drawerRadius,
      derived.scene.non_organic_output_height,
      xDividerFace,
      zDividerFace,
      false, // isPositiveZ = false for Inorganic (+X, -Z)
      36
    );

    const inorganicMesh = new THREE.Mesh(inorganicGeo, inorganicDrawerMaterial);
    inorganicMesh.name = 'InorganicDrawer_Body';
    inorganicMesh.position.set(0, derived.scene.y_non_organic_output_bottom, 0);
    inorganicMesh.castShadow = true;
    inorganicMesh.receiveShadow = true;

    const inorganicEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(inorganicGeo, 25),
      inorganicEdgeMaterial
    );
    inorganicEdges.name = 'InorganicDrawer_Edges';
    inorganicMesh.add(inorganicEdges);

    // Front-facing handle on outer curved shell face (midpoint of +X, -Z arc: theta = -45°)
    const handleMidPhi = -Math.PI / 4;
    const handleR = drawerRadius + 0.005;
    const handleX = handleR * Math.cos(handleMidPhi); // ~ +175 mm
    const handleZ = handleR * Math.sin(handleMidPhi); // ~ -175 mm
    const handleY = derived.scene.y_non_organic_output_bottom + derived.scene.non_organic_output_height / 2; // Y = 290 mm

    const handleGroup = new THREE.Group();
    handleGroup.name = 'InorganicDrawer_Handle';
    handleGroup.position.set(handleX, handleY, handleZ);
    handleGroup.rotation.y = Math.PI / 4; // Face outward along (+X, -Z)

    // Vertical grab bar
    const barGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.130, 16);
    const barMesh = new THREE.Mesh(barGeo, drawerHandleMaterial);
    barMesh.name = 'InorganicDrawer_Handle_Bar';
    barMesh.position.set(0.015, 0, 0);
    handleGroup.add(barMesh);

    // Two standoffs connecting bar to drawer front
    [-0.050, 0.050].forEach((yOff, sIdx) => {
      const standGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.018, 12);
      standGeo.rotateZ(Math.PI / 2);
      const standMesh = new THREE.Mesh(standGeo, drawerHandleMaterial);
      standMesh.name = `InorganicDrawer_Handle_Standoff_${sIdx + 1}`;
      standMesh.position.set(0.008, yOff, 0);
      handleGroup.add(standMesh);
    });

    handleGroup.userData = {
      name: 'InorganicDrawer_Handle',
      role: 'Ergonomic pull handle for inorganic drawer extraction',
      extraction_vector: [1, 0, 0],
    };
    inorganicDrawerGroup.add(handleGroup);

    const inorganicBadge = createTextSprite(
      `INORGANIC PULL-OUT DRAWER (Y = ${derived.mm.y_non_organic_output_bottom}–${derived.mm.y_non_organic_output_top} mm)`,
      '#38bdf8'
    );
    inorganicBadge.name = 'InorganicOutputDrawer_Badge';
    inorganicBadge.position.set(drawerRadius * 0.45, derived.scene.non_organic_output_height / 2, -drawerRadius * 0.45);
    inorganicBadge.scale.multiplyScalar(0.7);
    inorganicMesh.add(inorganicBadge);

    // Alias wrapper: also create 'InorganicOutputDrawerEnvelope' reference for backwards compatibility
    const envelopeAlias = new THREE.Group();
    envelopeAlias.name = 'InorganicOutputDrawerEnvelope';
    inorganicMesh.add(envelopeAlias);

    inorganicMesh.userData = {
      name: 'InorganicDrawer_Body',
      sector: 'INORGANIC',
      angular_span_deg: 90,
      bottom_elevation_mm: derived.mm.y_non_organic_output_bottom,
      top_elevation_mm: derived.mm.y_non_organic_output_top,
      height_mm: derived.mm.non_organic_output_height,
      status: 'CONFIRMED DECISION B ARCHITECTURE',
      source: 'docs/master_geometry.md Section 5 & Phase 3 Decision B',
      role: 'Physical container body for recyclable inorganic output drawer',
      collisionRequired: true,
    };
    inorganicDrawerGroup.add(inorganicMesh);

    inorganicDrawerGroup.userData = {
      name: 'InorganicDrawer',
      sector: 'INORGANIC',
      angular_span_deg: 90,
      bottom_elevation_mm: derived.mm.y_non_organic_output_bottom,
      top_elevation_mm: derived.mm.y_non_organic_output_top,
      extraction_mechanism: 'Simple linear extraction outward (+X)',
      extraction_vector: [1, 0, 0],
      no_radial_extraction: true,
      no_rear_extraction: true,
      no_angled_extraction: true,
      status: 'CONFIRMED DECISION B ARCHITECTURE',
      source: 'Phase 3 Decision B',
      role: 'Air-fryer style removable inorganic drawer container',
    };

    inorganicSection.userData = {
      name: 'InorganicSection',
      sector: 'INORGANIC',
      angular_span_deg: 90,
      bottom_elevation_mm: derived.mm.y_non_organic_output_bottom,
      top_elevation_mm: derived.mm.y_non_organic_output_top,
      status: 'CONFIRMED DECISION B ARCHITECTURE',
      source: 'docs/master_geometry.md Section 5 & Phase 3 Decision B',
    };

    inorganicSection.add(inorganicDrawerGroup);
  }

  // ==========================================
  // 7. LEFTOVER FOOD SECTION ENVELOPES (90° Sector: +X, +Z)
  // ==========================================
  const leftoverFoodSection = new THREE.Group();
  leftoverFoodSection.name = 'LeftoverFoodSection';
  envelope.add(leftoverFoodSection);

  // Materials for Leftover Food Output Section (Dual-Layer Nested Architecture)
  const leftoverFoodOuterDrawerMaterial = new THREE.MeshStandardMaterial({
    color: 0xb45309, // Rich terracotta / amber for outer solid liquid-containment drawer carriage
    metalness: 0.25,
    roughness: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
    depthWrite: true,
  });

  const leftoverFoodOuterEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.9,
  });

  const strainerBasketMaterial = new THREE.MeshStandardMaterial({
    color: 0xeab308, // Bright golden yellow representing removable perforated strainer basket
    metalness: 0.4,
    roughness: 0.3,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75,
    depthWrite: true,
  });

  const strainerBasketEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.95,
  });

  const leftoverFoodTopClosureMaterial = new THREE.MeshStandardMaterial({
    color: 0xb45309, // Rich structural amber / dark terracotta
    metalness: 0.35,
    roughness: 0.4,
    side: THREE.DoubleSide,
    transparent: false, // Solid opaque cap for prominent, clear visibility
    depthWrite: true,
  });

  const leftoverFoodTopClosureEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0xfbbf24, // Warm amber-gold outline
    transparent: false,
    linewidth: 2,
  });

  const leftoverFoodAccessDoorMaterial = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Rich amber/bronze door panel
    metalness: 0.45,
    roughness: 0.3,
    side: THREE.DoubleSide,
    transparent: false, // Solid opaque door panel for prominent, clear visibility
    depthWrite: true,
  });

  const leftoverFoodAccessDoorEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0xfef08a, // Crisp light gold wireframe edges
    transparent: false,
    linewidth: 2,
  });

  const leftoverFoodHingeMaterial = new THREE.LineBasicMaterial({
    color: 0x22d3ee, // Bright cyan line to clearly identify the fixed hinge pivot axis
    transparent: false,
    linewidth: 2,
  });

  function buildLeftoverFoodSection(derived) {
    leftoverFoodSection.clear();
    leftoverFoodSection.visible = leftoverFoodSectionVisible;

    const orientationDeg = derived.raw.sector_orientation_deg || 0;
    leftoverFoodSection.rotation.y = THREE.MathUtils.degToRad(orientationDeg);

    const clearance = derived.scene.drawer_perimeter_clearance || 0.001; // 1 mm clearance in scene units
    const drawerRadius = derived.scene.inner_radius - clearance;
    const xDividerFace = (derived.scene.divider_wall_thickness / 2) + clearance;
    const zDividerFace = (derived.scene.divider_wall_thickness / 2) + clearance;

    // 1. LEFTOVER FOOD OUTPUT DRAWER (Decision 6: Physical Removable Drawer)
    // Starts at Y = 480 mm datum, extends downward toward middle-section bottom (Y = 100 mm)
    // Height = 380 mm (derived parametrically: non_organic_output_height)
    // Linear extraction vector: Outward along +Z through front opening
    const foodDrawerGroup = new THREE.Group();
    foodDrawerGroup.name = 'LeftoverFoodDrawer';

    const outerDrawerGeo = createQuadrantChamberGeometry(
      drawerRadius,
      derived.scene.non_organic_output_height,
      xDividerFace,
      zDividerFace,
      true, // isPositiveZ = true for Leftover Food (+X, +Z)
      36
    );

    const outerDrawerMesh = new THREE.Mesh(outerDrawerGeo, leftoverFoodOuterDrawerMaterial);
    outerDrawerMesh.name = 'LeftoverFoodDrawer_Body';
    outerDrawerMesh.position.set(0, derived.scene.y_non_organic_output_bottom, 0);
    outerDrawerMesh.castShadow = true;
    outerDrawerMesh.receiveShadow = true;

    const outerDrawerEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(outerDrawerGeo, 25),
      leftoverFoodOuterEdgeMaterial
    );
    outerDrawerEdges.name = 'LeftoverFoodDrawer_Edges';
    outerDrawerMesh.add(outerDrawerEdges);

    // Front-facing handle on outer curved shell face (midpoint of +X, +Z arc: theta = 45°)
    const handleMidPhi = Math.PI / 4;
    const handleR = drawerRadius + 0.005;
    const handleX = handleR * Math.sin(handleMidPhi); // ~ +175 mm
    const handleZ = handleR * Math.cos(handleMidPhi); // ~ +175 mm
    const handleY = derived.scene.y_non_organic_output_bottom + derived.scene.non_organic_output_height / 2; // Y = 290 mm

    const handleGroup = new THREE.Group();
    handleGroup.name = 'LeftoverFoodDrawer_Handle';
    handleGroup.position.set(handleX, handleY, handleZ);
    handleGroup.rotation.y = -Math.PI / 4; // Face outward along (+X, +Z)

    // Vertical grab bar
    const barGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.130, 16);
    const barMesh = new THREE.Mesh(barGeo, drawerHandleMaterial);
    barMesh.name = 'LeftoverFoodDrawer_Handle_Bar';
    barMesh.position.set(0, 0, 0.015);
    handleGroup.add(barMesh);

    // Two standoffs connecting bar to drawer front
    [-0.050, 0.050].forEach((yOff, sIdx) => {
      const standGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.018, 12);
      standGeo.rotateX(Math.PI / 2);
      const standMesh = new THREE.Mesh(standGeo, drawerHandleMaterial);
      standMesh.name = `LeftoverFoodDrawer_Handle_Standoff_${sIdx + 1}`;
      standMesh.position.set(0, yOff, 0.008);
      handleGroup.add(standMesh);
    });

    handleGroup.userData = {
      name: 'LeftoverFoodDrawer_Handle',
      role: 'Ergonomic pull handle for leftover food drawer extraction',
      extraction_vector: [0, 0, 1],
    };
    foodDrawerGroup.add(handleGroup);

    const outerBadge = createTextSprite(
      `LEFTOVER FOOD DRAWER (Y = ${derived.mm.y_non_organic_output_bottom}–${derived.mm.y_non_organic_output_top} mm)`,
      '#f59e0b'
    );
    outerBadge.name = 'LeftoverFoodOuterDrawer_Badge';
    outerBadge.position.set(drawerRadius * 0.45, derived.scene.non_organic_output_height / 2, drawerRadius * 0.45);
    outerBadge.scale.multiplyScalar(0.7);
    outerDrawerMesh.add(outerBadge);

    // Alias wrapper: also create 'LeftoverFoodOuterDrawerEnvelope' reference for backwards compatibility
    const foodEnvelopeAlias = new THREE.Group();
    foodEnvelopeAlias.name = 'LeftoverFoodOuterDrawerEnvelope';
    outerDrawerMesh.add(foodEnvelopeAlias);

    outerDrawerMesh.userData = {
      name: 'LeftoverFoodDrawer_Body',
      sector: 'LEFTOVER_FOOD',
      angular_span_deg: 90,
      bottom_elevation_mm: derived.mm.y_non_organic_output_bottom,
      top_elevation_mm: derived.mm.y_non_organic_output_top,
      height_mm: derived.mm.non_organic_output_height,
      status: 'CONFIRMED DECISION 6 ARCHITECTURE',
      source: 'docs/master_geometry.md Section 5 & Decision 6',
      role: 'Physical container body for leftover food output drawer',
      collisionRequired: true,
    };
    foodDrawerGroup.add(outerDrawerMesh);

    foodDrawerGroup.userData = {
      name: 'LeftoverFoodDrawer',
      sector: 'LEFTOVER_FOOD',
      angular_span_deg: 90,
      bottom_elevation_mm: derived.mm.y_non_organic_output_bottom,
      top_elevation_mm: derived.mm.y_non_organic_output_top,
      extraction_mechanism: 'Simple linear extraction outward (+Z)',
      extraction_vector: [0, 0, 1],
      no_radial_extraction: true,
      no_rear_extraction: true,
      no_angled_extraction: true,
      status: 'CONFIRMED DECISION 6 ARCHITECTURE',
      source: 'Phase 3 Decision 6',
      role: 'Air-fryer style removable leftover food drawer container',
    };
    leftoverFoodSection.add(foodDrawerGroup);

    // 2. RemovableStrainerBasketEnvelope (Deprecated from active display per Decision 6)
    // Preserved hidden/schematic to avoid introducing unapproved drainage complexity
    const basketRadius = drawerRadius - derived.scene.strainer_basket_wall_inset;
    const xFlatBasket = xDividerFace + derived.scene.strainer_basket_wall_inset;
    const zFlatBasket = zDividerFace + derived.scene.strainer_basket_wall_inset;

    const basketGeo = createQuadrantChamberGeometry(
      basketRadius,
      derived.scene.strainer_basket_height,
      xFlatBasket,
      zFlatBasket,
      true, // isPositiveZ = true (+X, +Z)
      36
    );

    const basketMesh = new THREE.Mesh(basketGeo, strainerBasketMaterial);
    basketMesh.name = 'RemovableStrainerBasketEnvelope';
    basketMesh.position.set(0, derived.scene.y_strainer_basket_bottom, 0);
    basketMesh.visible = false; // Hidden per Decision 6 ("Do not introduce advanced strainer/drainage architecture yet")
    basketMesh.castShadow = false;
    basketMesh.receiveShadow = false;

    basketMesh.userData = {
      name: 'RemovableStrainerBasketEnvelope',
      sector: 'LEFTOVER_FOOD',
      angular_span_deg: 90,
      bottom_elevation_mm: derived.mm.y_strainer_basket_bottom,
      top_elevation_mm: derived.mm.y_strainer_basket_top,
      status: 'HIDDEN / SCHEMATIC (DECISION 6)',
      role: 'Nested strainer basket omitted from active display per Decision 6 baseline directive',
    };
    leftoverFoodSection.add(basketMesh);

    leftoverFoodSection.userData = {
      name: 'LeftoverFoodSection',
      sector: 'LEFTOVER_FOOD',
      angular_span_deg: 90,
      bottom_elevation_mm: derived.mm.y_non_organic_output_bottom,
      top_elevation_mm: derived.mm.y_input_boundary, // Spans Y = 100 mm to 925 mm
      top_closure_elevation_mm: derived.mm.y_input_boundary,
      access_door_bottom_elevation_mm: derived.mm.food_door_bottom_y,
      access_door_top_elevation_mm: derived.mm.food_door_top_y,
      status: 'CONFIRMED PHASE 3 REFINEMENT',
      source: 'docs/master_geometry.md Section 7 & Decisions B, 2, 6',
    };

    // ========================================================
    // 3. LeftoverFoodTopClosure (Y = 925 mm, 90° Sector)
    // ========================================================
    // Closes the entire 90° arc at the top of the Leftover Food chamber at Y = 925 mm.
    // Strictly within Leftover Food sector (+X, +Z quadrant: theta = 0 to pi/2 rad).
    // Conforms to cylindrical sector geometry (radius = inner_radius).
    // Serves as the structural mounting floor for the Electronics Bay above.
    const topClosureGeo = createSectorCapGeometry(derived.scene.inner_radius, 48);
    const topClosureMesh = new THREE.Mesh(topClosureGeo, leftoverFoodTopClosureMaterial);
    topClosureMesh.name = 'LeftoverFoodTopClosure';
    topClosureMesh.position.set(0, derived.scene.y_input_boundary, 0); // Elevation Y = 925 mm
    topClosureMesh.visible = leftoverFoodTopClosureVisible;
    topClosureMesh.castShadow = true;
    topClosureMesh.receiveShadow = true;

    const topClosureEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(topClosureGeo),
      leftoverFoodTopClosureEdgeMaterial
    );
    topClosureEdges.name = 'LeftoverFoodTopClosure_Edges';
    topClosureMesh.add(topClosureEdges);

    const topClosureBadge = createTextSprite(
      `LEFTOVER FOOD TOP CLOSURE (Y = ${derived.mm.y_input_boundary} mm)`,
      '#f59e0b'
    );
    topClosureBadge.name = 'LeftoverFoodTopClosure_Badge';
    topClosureBadge.position.set(
      derived.scene.inner_radius * 0.45,
      0.015,
      derived.scene.inner_radius * 0.45
    );
    topClosureBadge.scale.multiplyScalar(0.68);
    topClosureMesh.add(topClosureBadge);

    topClosureMesh.userData = {
      name: 'LeftoverFoodTopClosure',
      sector: 'LEFTOVER_FOOD',
      angular_span_deg: 90,
      angular_span_rad: Math.PI / 2,
      theta_start_rad: 0,
      theta_end_rad: Math.PI / 2,
      elevation_y_mm: derived.mm.y_input_boundary, // 925 mm
      elevation_y_m: derived.scene.y_input_boundary, // 0.925 m
      radius_mm: derived.mm.inner_radius, // 246 mm
      purpose: 'Prevents objects from falling vertically into the Leftover Food chamber from above; supports electronics bay above',
      status: 'CONFIRMED REFINEMENT',
      collisionRequired: true,
    };
    leftoverFoodSection.add(topClosureMesh);

    // ================================================================
    // 4. LeftoverFoodAccessDoor & LeftoverFoodAccessDoor_Hinge (Phase 3B)
    // ================================================================
    // Resolved architecturally with TWO PHYSICAL HINGES at the lower corners,
    // defining a single straight horizontal chord axis at Y = 700 mm.
    // Corner 1: near Central Divider (X ≈ 10 mm, Y = 700 mm, Z ≈ 245.8 mm)
    // Corner 2: near Radial Divider (X ≈ 245.8 mm, Y = 700 mm, Z ≈ 10 mm)
    // Chord midpoint: (127.9 mm, 700 mm, 127.9 mm), chord length ≈ 333.5 mm.
    // The door opens outward to form a ramp.
    // Preserves the 10 mm arc padding and the 4 mm curved door panel profile.
    const doorRadius = derived.scene.inner_radius;
    const doorHeight = derived.scene.food_door_height; // 0.100 m (100 mm)
    const doorBottomY = derived.scene.food_door_bottom_y; // 0.700 m (700 mm)
    const doorTopY = derived.scene.food_door_top_y; // 0.800 m (800 mm)

    const arcPaddingM = derived.scene.food_door_arc_padding; // 0.010 m (10 mm)
    const deltaTheta = derived.scene.food_door_delta_theta || (arcPaddingM / doorRadius);
    const thetaStart = deltaTheta;
    const thetaLength = (Math.PI / 2) - (2 * deltaTheta);
    const thetaEnd = thetaStart + thetaLength;

    // Corner A (near Central Divider) and Corner B (near Radial Divider)
    const pA = new THREE.Vector3(doorRadius * Math.sin(thetaStart), 0, doorRadius * Math.cos(thetaStart));
    const pB = new THREE.Vector3(doorRadius * Math.sin(thetaEnd), 0, doorRadius * Math.cos(thetaEnd));
    const pMid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);

    // Two physical hinge brackets mounted to the respective divider walls
    const hingeBracketMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Structural bracket slate
      metalness: 0.75,
      roughness: 0.25,
    });

    // Hinge 1 (Central Divider Corner): Flange mounted to Central Divider at X = 2 mm
    const hinge1Group = new THREE.Group();
    hinge1Group.name = 'LeftoverFoodDoorHinge_Central';
    hinge1Group.position.set(pA.x, doorBottomY, pA.z);

    const hPinGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.020, 16);
    hPinGeo.rotateZ(Math.PI / 4); // Aligned with chord vector
    const h1PinMesh = new THREE.Mesh(hPinGeo, quickReleaseMaterial);
    h1PinMesh.name = 'LeftoverFoodDoorHinge_Central_Pin';
    hinge1Group.add(h1PinMesh);

    const hFlangeGeo = new THREE.BoxGeometry(0.012, 0.016, 0.012);
    const h1FlangeMesh = new THREE.Mesh(hFlangeGeo, hingeBracketMat);
    h1FlangeMesh.name = 'LeftoverFoodDoorHinge_Central_Bracket';
    h1FlangeMesh.position.set(-0.005, 0, 0);
    hinge1Group.add(h1FlangeMesh);

    hinge1Group.userData = {
      name: 'LeftoverFoodDoorHinge_Central',
      role: 'Physical hinge point 1 supported by Central Divider wall',
      position_mm: { x: pA.x * 1000, y: doorBottomY * 1000, z: pA.z * 1000 },
      status: 'CONFIRMED PHASE 3B REFINEMENT',
    };
    leftoverFoodSection.add(hinge1Group);

    // Hinge 2 (Radial Divider Corner): Flange mounted to Radial Divider at Z = 2 mm
    const hinge2Group = new THREE.Group();
    hinge2Group.name = 'LeftoverFoodDoorHinge_Radial';
    hinge2Group.position.set(pB.x, doorBottomY, pB.z);

    const h2PinMesh = new THREE.Mesh(hPinGeo, quickReleaseMaterial);
    h2PinMesh.name = 'LeftoverFoodDoorHinge_Radial_Pin';
    hinge2Group.add(h2PinMesh);

    const h2FlangeMesh = new THREE.Mesh(hFlangeGeo, hingeBracketMat);
    h2FlangeMesh.name = 'LeftoverFoodDoorHinge_Radial_Bracket';
    h2FlangeMesh.position.set(0, 0, -0.005);
    hinge2Group.add(h2FlangeMesh);

    hinge2Group.userData = {
      name: 'LeftoverFoodDoorHinge_Radial',
      role: 'Physical hinge point 2 supported by Radial Divider wall',
      position_mm: { x: pB.x * 1000, y: doorBottomY * 1000, z: pB.z * 1000 },
      status: 'CONFIRMED PHASE 3B REFINEMENT',
    };
    leftoverFoodSection.add(hinge2Group);

    // Physical Straight Chord Hinge Pin Rod connecting the two hinges
    const chordLen = pA.distanceTo(pB); // ~ 333.5 mm
    const chordRodGeo = new THREE.CylinderGeometry(0.003, 0.003, chordLen, 16);
    chordRodGeo.rotateZ(Math.PI / 2);
    const chordRodMesh = new THREE.Mesh(chordRodGeo, quickReleaseMaterial);
    chordRodMesh.name = 'LeftoverFoodDoorHinge_ChordRod';
    chordRodMesh.position.set(pMid.x, doorBottomY, pMid.z);
    chordRodMesh.rotation.y = Math.PI / 4;
    leftoverFoodSection.add(chordRodMesh);

    // Fixed rotational hinge pivot group positioned directly at the chord midpoint
    const doorHinge = new THREE.Group();
    doorHinge.name = 'LeftoverFoodDoor_Pivot';
    doorHinge.position.set(pMid.x, doorBottomY, pMid.z);
    doorHinge.rotation.order = 'YXZ'; // Critical: ensures rotation.x is around the chord axis connecting the two physical hinges
    doorHinge.rotation.y = Math.PI / 4; // Local X-axis aligns exactly with the straight chord axis!
    doorHinge.rotation.x = THREE.MathUtils.degToRad(leftoverFoodDoorAngleDeg); // Phase 3B kinematic rotation angle
    doorHinge.visible = leftoverFoodDoorVisible;

    // Curved door panel geometry translated and transformed into local hinge coordinates
    const doorGeo = new THREE.CylinderGeometry(
      doorRadius,
      doorRadius,
      doorHeight,
      36,
      1,
      true, // openEnded = true
      thetaStart,
      thetaLength
    );
    doorGeo.translate(0, doorHeight / 2, 0);

    // Transform geometry from world/quadrant coordinates into doorHinge local coordinate frame:
    // 1. Translate by (-pMid.x, 0, -pMid.z)
    // 2. Rotate by -Math.PI / 4 around Y
    const doorTransformMat = new THREE.Matrix4();
    doorTransformMat.makeRotationY(-Math.PI / 4);
    doorTransformMat.multiply(new THREE.Matrix4().makeTranslation(-pMid.x, 0, -pMid.z));
    doorGeo.applyMatrix4(doorTransformMat);

    const doorMesh = new THREE.Mesh(doorGeo, leftoverFoodAccessDoorMaterial);
    doorMesh.name = 'LeftoverFoodAccessDoor';
    doorMesh.position.set(0, 0, 0); // Sits at local origin (hinge axis)
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;

    const doorEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(doorGeo),
      leftoverFoodAccessDoorEdgeMaterial
    );
    doorEdges.name = 'LeftoverFoodAccessDoor_Edges';
    doorMesh.add(doorEdges);

    const doorBadge = createTextSprite(
      `FOOD ACCESS DOOR (RAMP: Y = ${derived.mm.food_door_bottom_y}–${derived.mm.food_door_top_y} mm)`,
      '#f59e0b'
    );
    doorBadge.name = 'LeftoverFoodAccessDoor_Badge';
    doorBadge.position.set(0, doorHeight / 2, 0.075);
    doorBadge.scale.multiplyScalar(0.65);
    doorMesh.add(doorBadge);

    doorHinge.userData = {
      name: 'LeftoverFoodDoor_Pivot',
      alias: 'LeftoverFoodAccessDoor_Hinge',
      role: 'Rigid-body rotational hinge node around straight horizontal chord axis',
      elevation_y_mm: derived.mm.food_door_bottom_y, // 700 mm
      chord_midpoint_mm: { x: pMid.x * 1000, y: doorBottomY * 1000, z: pMid.z * 1000 },
      chord_length_mm: chordLen * 1000,
      hinge_points: ['LeftoverFoodDoorHinge_Central', 'LeftoverFoodDoorHinge_Radial'],
      revolute_axis: 'Straight horizontal chord axis connecting the two supported lower corner hinges',
      motion: 'Outward/downward rotation around local X-axis forming an access ramp',
      status: 'CONFIRMED PHASE 3B REFINEMENT',
      source: 'Phase 3 Decision 2 / Approved Architecture',
    };

    doorMesh.userData = {
      name: 'LeftoverFoodAccessDoor',
      role: 'Rigid curved access door / ramp opening outward around two supported hinge points',
      sector: 'LEFTOVER_FOOD',
      door_top_y_mm: derived.mm.food_door_top_y, // 800 mm
      door_bottom_y_mm: derived.mm.food_door_bottom_y, // 700 mm
      door_height_mm: derived.mm.food_door_height, // 100 mm
      arc_padding_mm: derived.mm.food_door_arc_padding, // 10 mm
      angular_padding_rad: deltaTheta,
      angular_span_rad: thetaLength,
      radius_mm: derived.mm.inner_radius, // 246 mm
      kinematic_state: 'CLOSED_POSITION',
      hinge_node: 'LeftoverFoodDoor_Pivot',
      status: 'CONFIRMED PHASE 3B REFINEMENT',
      collisionRequired: true,
    };

    doorHinge.add(doorMesh);
    leftoverFoodSection.add(doorHinge);
  }

  // ==========================================
  // 8. INPUT + SEGREGATION ASSEMBLY
  // ==========================================
  const inputSegregationAssembly = new THREE.Group();
  inputSegregationAssembly.name = 'InputSegregationAssembly';
  envelope.add(inputSegregationAssembly);

  // Materials for Input & Segregation Assembly
  const topClosureMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Deep structural slate
    metalness: 0.55,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });

  const topClosureEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0x64748b,
    transparent: true,
    opacity: 0.85,
  });

  const funnelMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569, // Smooth chute metallic composite
    metalness: 0.7,
    roughness: 0.25,
    side: THREE.DoubleSide,
  });

  const funnelEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffcc,
    transparent: true,
    opacity: 0.9,
  });

  const rotatingBaseMaterial = new THREE.MeshStandardMaterial({
    color: 0xd97706, // High-contrast amber/gold platform plate
    metalness: 0.75,
    roughness: 0.25,
    side: THREE.DoubleSide,
  });

  const rotatingBaseEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.95,
  });

  const gimbalMaterial = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Machined pivot gimbal alloy
    metalness: 0.8,
    roughness: 0.2,
  });

  const displayHousingMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Matte black bezel casing
    metalness: 0.3,
    roughness: 0.45,
  });

  const displayScreenMaterial = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Glowing OLED interface panel
    emissive: 0x0369a1,
    emissiveIntensity: 0.55,
    metalness: 0.1,
    roughness: 0.2,
  });

  const sensorHousingMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155, // Industrial camera/sensor housing
    metalness: 0.65,
    roughness: 0.3,
  });

  const cameraLensMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e40af, // Optical glass lens
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.9,
  });

  const ultrasonicTransducerMaterial = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Acoustic transducer mesh
    metalness: 0.85,
    roughness: 0.2,
  });

  function buildInputSegregationAssembly(derived) {
    inputSegregationAssembly.clear();
    inputSegregationAssembly.visible = inputAssemblyVisible;

    inputSegregationAssembly.userData = {
      name: 'InputSegregationAssembly',
      elevation_bottom_mm: derived.mm.y_input_boundary,
      elevation_top_mm: derived.mm.y_top,
      height_mm: derived.mm.input_section_height,
      role: 'Top input receiving, sensor scanning, and 2-axis automated segregation assembly',
      source: 'docs/master_geometry.md Section 4B & references/sketches/',
      status: 'CONFIRMED GEOMETRY / CHANGEABLE PARAMETERS',
    };

    // ----------------------------------------------------
    // 1. TOP CLOSURE (Option 1 Selected: Rear Lid Hood & Bulkhead)
    // ----------------------------------------------------
    const topClosure = new THREE.Group();
    topClosure.name = 'TopClosure';

    const closureHeight = derived.scene.input_section_height; // 0.1 m
    const closureYCenter = derived.scene.y_input_boundary + closureHeight / 2;

    // 1a. Rear outer cylindrical wall (covers -Z half, from +X through -Z to -X)
    const wallGeo = new THREE.CylinderGeometry(
      derived.scene.inner_radius,
      derived.scene.inner_radius,
      closureHeight,
      48,
      1,
      true,
      Math.PI / 2,
      Math.PI
    );
    const wallMesh = new THREE.Mesh(wallGeo, topClosureMaterial);
    wallMesh.name = 'TopClosure_RearWall';
    wallMesh.position.set(0, closureYCenter, 0);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    topClosure.add(wallMesh);

    // 1b. Rear semi-circular top lid disc at Y = y_top covering Z <= 0 (-Z rear half)
    const lidGeo = new THREE.CircleGeometry(derived.scene.inner_radius, 48, 0, Math.PI);
    lidGeo.rotateX(-Math.PI / 2);
    const lidMesh = new THREE.Mesh(lidGeo, topClosureMaterial);
    lidMesh.name = 'TopClosure_TopLid';
    lidMesh.position.set(0, derived.scene.y_top, 0);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    topClosure.add(lidMesh);

    // 1c. Transverse mounting fascia under front rim of closed hood at Z = 0
    // Slim fascia spanning from X = -inner_radius to +inner_radius, Y = y_top - 0.02 to y_top (height = 20 mm).
    // Seals front edge of top hood and provides sensor mounting without dividing the input bay below Y = 880 mm.
    const fasciaHeight = 0.02; // 20 mm mounting fascia
    const fasciaThickness = 0.006; // 6 mm thickness
    const fasciaYCenter = derived.scene.y_top - fasciaHeight / 2; // Y = 890 mm
    const fasciaGeo = new THREE.BoxGeometry(
      derived.scene.inner_radius * 2,
      fasciaHeight,
      fasciaThickness
    );
    const fasciaMesh = new THREE.Mesh(fasciaGeo, topClosureMaterial);
    fasciaMesh.name = 'TopClosure_Fascia';
    fasciaMesh.position.set(0, fasciaYCenter, -fasciaThickness / 2);
    fasciaMesh.castShadow = true;
    fasciaMesh.receiveShadow = true;
    topClosure.add(fasciaMesh);

    const fasciaEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(fasciaGeo),
      topClosureEdgeMaterial
    );
    fasciaMesh.add(fasciaEdges);

    // Maintain alias for any inspector querying TopClosure_Bulkhead
    const bulkheadAlias = new THREE.Group();
    bulkheadAlias.name = 'TopClosure_Bulkhead';
    topClosure.add(bulkheadAlias);

    topClosure.userData = {
      name: 'TopClosure',
      selected_design: 'Option 1 (Rear Dome Hood & Front Aperture, IMG_20260925_175015.jpg)',
      elevation_bottom_mm: derived.mm.y_input_boundary,
      elevation_top_mm: derived.mm.y_top,
      height_mm: derived.mm.input_section_height,
      angular_span: '180° Rear Half (-Z)',
      source: 'references/sketches/IMG_20260925_175015.jpg & docs/master_geometry.md Section 4B',
      status: 'BASELINE / CHANGEABLE',
      role: 'Protective enclosure for sensor bay and electronics; defines front open input aperture',
    };

    const closureBadge = createTextSprite('TOP CLOSURE (REAR HOOD)', '#38bdf8');
    closureBadge.name = 'TopClosure_Badge';
    closureBadge.position.set(0, derived.scene.y_top + 0.02, -derived.scene.inner_radius * 0.45);
    topClosure.add(closureBadge);

    inputSegregationAssembly.add(topClosure);

    // ----------------------------------------------------
    // 2. USER INTERACTION DISPLAY (Externally Mounted ON TOP OF Closed Rear Lid)
    // ----------------------------------------------------
    const display = new THREE.Group();
    display.name = 'UserInteractionDisplay';

    // Positioned directly on the exterior top surface of TopClosure_TopLid:
    // X = 0 (centered), Y = derived.scene.display_mount_y (exact lid surface: Y = 900 mm),
    // Z = derived.scene.display_mount_z (midpoint of the closed rear semicircular arc: ~ -177 mm).
    display.position.set(
      derived.scene.display_mount_x,
      derived.scene.display_mount_y,
      derived.scene.display_mount_z
    );

    // 2a. Physical Mounting Bracket / Pedestal (attached directly to top surface of TopClosure_TopLid)
    const pedestalGroup = new THREE.Group();
    pedestalGroup.name = 'UserInteractionDisplay_Pedestal';

    // Foot base flange sitting flat and flush directly on the lid surface (Y = 0 local -> Y = 900 mm world)
    const footWidth = derived.scene.display_width * 0.72; // ~49 mm
    const footDepth = 0.020; // 20 mm footprint along Z
    const footHeight = 0.003; // 3 mm slim flange
    const footGeo = new THREE.BoxGeometry(footWidth, footHeight, footDepth);
    const footMesh = new THREE.Mesh(footGeo, displayHousingMaterial);
    footMesh.name = 'UserInteractionDisplay_Pedestal_Foot';
    footMesh.position.set(0, footHeight / 2, 0); // bottom sits at Y = 0 (exact lid surface)
    footMesh.castShadow = true;
    pedestalGroup.add(footMesh);

    // Upright bracket riser rising from the foot to support the tilted display head
    const riserWidth = derived.scene.display_width * 0.44; // ~30 mm
    const riserHeight = 0.014; // 14 mm height
    const riserDepth = 0.007; // 7 mm depth
    const riserGeo = new THREE.BoxGeometry(riserWidth, riserHeight, riserDepth);
    const riserMesh = new THREE.Mesh(riserGeo, displayHousingMaterial);
    riserMesh.name = 'UserInteractionDisplay_Pedestal_Riser';
    riserMesh.position.set(0, footHeight + riserHeight / 2, -0.002);
    riserMesh.castShadow = true;
    pedestalGroup.add(riserMesh);

    pedestalGroup.userData = {
      name: 'UserInteractionDisplay_Pedestal',
      role: 'Physical mounting bracket attached directly to top surface of TopClosure_TopLid',
      attachment: 'Exterior top surface of closed rear lid at Y = 900 mm',
      externally_mounted: true,
      physically_attached: true,
      rear_arc_midpoint: true,
      user_facing: true,
      status: 'CONFIRMED / BASELINE',
    };
    display.add(pedestalGroup);

    // 2b. Tilted Display Head (angled upward and forward facing +Z front for ergonomic standing user view)
    const displayHead = new THREE.Group();
    displayHead.name = 'UserInteractionDisplay_Head';
    displayHead.position.set(0, footHeight + riserHeight, -0.002);

    const displayTiltRad = THREE.MathUtils.degToRad(derived.raw.display_tilt_deg || 25);
    displayHead.rotation.x = -displayTiltRad; // Negative angle tilts face upward (+Y) towards user eye-level

    // Display Casing Bezel
    const bezelGeo = new THREE.BoxGeometry(
      derived.scene.display_width,
      derived.scene.display_height,
      derived.scene.display_depth
    );
    const bezelMesh = new THREE.Mesh(bezelGeo, displayHousingMaterial);
    bezelMesh.name = 'UserInteractionDisplay_Bezel';
    bezelMesh.position.set(0, derived.scene.display_height * 0.4, 0);
    bezelMesh.castShadow = true;
    displayHead.add(bezelMesh);

    // Glowing Screen Panel on front face (directed toward +Z user)
    const screenGeo = new THREE.PlaneGeometry(
      derived.scene.display_width * 0.88,
      derived.scene.display_height * 0.78
    );
    const screenMesh = new THREE.Mesh(screenGeo, displayScreenMaterial);
    screenMesh.name = 'UserInteractionDisplay_Screen';
    screenMesh.position.set(0, derived.scene.display_height * 0.4, derived.scene.display_depth / 2 + 0.0005);
    displayHead.add(screenMesh);

    // Screen Border Outline (crisp cyan accent)
    const halfW = derived.scene.display_width * 0.44;
    const halfH = derived.scene.display_height * 0.39;
    const zOffset = derived.scene.display_depth / 2 + 0.001;
    const screenBorderGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-halfW, derived.scene.display_height * 0.4 - halfH, zOffset),
      new THREE.Vector3(halfW, derived.scene.display_height * 0.4 - halfH, zOffset),
      new THREE.Vector3(halfW, derived.scene.display_height * 0.4 + halfH, zOffset),
      new THREE.Vector3(-halfW, derived.scene.display_height * 0.4 + halfH, zOffset),
      new THREE.Vector3(-halfW, derived.scene.display_height * 0.4 - halfH, zOffset),
    ]);
    const screenBorder = new THREE.Line(screenBorderGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8 }));
    screenBorder.name = 'UserInteractionDisplay_ScreenBorder';
    displayHead.add(screenBorder);

    display.add(displayHead);

    display.userData = {
      name: 'UserInteractionDisplay',
      component_type: 'OLED / Touch Interface Screen',
      mounting_location: 'Midpoint of closed rear semicircular arc on exterior surface of TopClosure_TopLid',
      mounting_type: 'Externally mounted via physical mounting bracket/pedestal directly attached to top surface of rear lid',
      mount_coordinates_mm: {
        x: derived.mm.display_mount_x,
        y: derived.mm.display_mount_y,
        z: derived.mm.display_mount_z,
      },
      dimensions_mm: {
        width: derived.mm.display_width,
        height: derived.mm.display_height,
        depth: derived.mm.display_depth,
        pedestal_height_mm: 17,
        total_assembly_height_mm: 36,
      },
      orientation: 'Tilted 25° upward toward +Z front for ergonomic standing user interaction',
      externally_mounted: true,
      physically_attached: true,
      rear_arc_midpoint: true,
      user_facing: true,
      within_input_envelope: true,
      status: 'CONFIRMED LOCATION / BASELINE PARAMETERS',
      source: 'references/sketches/IMG_20260925_175015.jpg Option 1 & docs/model_blueprint.md',
    };

    const displayBadge = createTextSprite('USER DISPLAY (OLED)', '#00ffcc');
    displayBadge.name = 'UserInteractionDisplay_Badge';
    displayBadge.position.set(0, 0.048, 0);
    displayBadge.scale.multiplyScalar(0.65);
    display.add(displayBadge);

    // Alias wrapper: also create 'Display' child pointing to UserInteractionDisplay for hierarchy compliance
    const displayWrapper = new THREE.Group();
    displayWrapper.name = 'Display';
    displayWrapper.add(display);
    inputSegregationAssembly.add(displayWrapper);

    // ----------------------------------------------------
    // 3. CENTRAL FUNNEL
    // ----------------------------------------------------
    const funnelGroup = new THREE.Group();
    funnelGroup.name = 'Funnel';

    // Funnel truncated cone geometry
    const funnelGeo = new THREE.CylinderGeometry(
      derived.scene.funnel_top_radius,
      derived.scene.funnel_bottom_radius,
      derived.scene.funnel_height,
      48,
      1,
      true
    );
    const funnelMesh = new THREE.Mesh(funnelGeo, funnelMaterial);
    funnelMesh.name = 'Funnel_ChuteMesh';
    funnelMesh.position.set(0, derived.scene.funnel_y_center, 0);
    funnelMesh.castShadow = true;
    funnelMesh.receiveShadow = true;
    funnelGroup.add(funnelMesh);

    // Edge wireframe rings for crisp mechanical definition
    const funnelTopRing = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, derived.scene.funnel_top_radius, 0, Math.PI * 2, true).getPoints(48)
      ),
      funnelEdgeMaterial
    );
    funnelTopRing.rotateX(-Math.PI / 2);
    funnelTopRing.position.set(0, derived.scene.funnel_top_y, 0);
    funnelGroup.add(funnelTopRing);

    const funnelBottomRing = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, derived.scene.funnel_bottom_radius, 0, Math.PI * 2, true).getPoints(48)
      ),
      funnelEdgeMaterial
    );
    funnelBottomRing.rotateX(-Math.PI / 2);
    funnelBottomRing.position.set(0, derived.scene.funnel_bottom_y, 0);
    funnelGroup.add(funnelBottomRing);

    funnelGroup.userData = {
      name: 'Funnel',
      top_opening_diameter_mm: derived.mm.inner_diameter,
      funnel_opening_diameter_mm: derived.mm.funnel_opening_diameter,
      elevation_top_mm: derived.mm.y_top,
      elevation_bottom_mm: derived.mm.funnel_bottom_y,
      height_mm: derived.mm.funnel_height,
      alignment: 'Centered at (0, 0) sector divider intersection and rotating base platform',
      throat_clearance_to_base_mm: 5,
      source: 'references/sketches/ & docs/master_geometry.md Section 4B',
      status: 'BASELINE / CHANGEABLE (Supports 100–200 mm throat)',
    };

    const funnelBadge = createTextSprite(
      `CENTRAL FUNNEL (Ø${derived.mm.funnel_opening_diameter} mm THROAT)`,
      '#00ffcc'
    );
    funnelBadge.name = 'Funnel_Badge';
    funnelBadge.position.set(0, derived.scene.funnel_y_center, derived.scene.funnel_top_radius * 0.45);
    funnelBadge.scale.multiplyScalar(0.72);
    funnelGroup.add(funnelBadge);

    inputSegregationAssembly.add(funnelGroup);

    // ----------------------------------------------------
    // 3b. STRUCTURAL SEGREGATION SUPPORT HUB & DRIVE MOTOR (Phase 3A)
    // ----------------------------------------------------
    // 3b. STRUCTURAL SEGREGATION BASE SUPPORT ASSEMBLY (Phase 3 Mechanical Embodiment)
    // Mounted at the (0, 0) intersection of CentralDivider and RadialDivider.
    // Primary Structural Load Path:
    // Rotating Platform -> Gimbal Trunnion -> Vertical Yaw Spindle -> Dual Precision Bearings ->
    // Support Housing -> Divider Saddle Brackets -> Central & Radial Divider Walls -> Outer Shell.
    // Motor is mounted beneath the platform, coaxial with the vertical yaw axis [0, 1, 0].
    // Arduino MCU and LiFePO4 battery box are NOT located here (isolated in Upper Electronics Bay).
    // ----------------------------------------------------
    const segregationSupportGroup = new THREE.Group();
    segregationSupportGroup.name = 'SegregationStructuralSupport';

    const hubRadius = derived.scene.segregation_hub_diameter / 2; // 19 mm (OD = 38 mm)
    const hubH = derived.scene.segregation_hub_height; // 8 mm
    const hubBottomY = derived.scene.y_input_boundary; // 925 mm (seated directly on divider top rim)
    const hubTopY = hubBottomY + hubH; // 933 mm (leaves 2 mm running clearance to platform base at 935 mm)
    const hubMidY = (hubBottomY + hubTopY) / 2; // 929 mm

    // 1. Central Support Housing Body (Rigid bearing carrier seated on divider intersection)
    const hubGeo = new THREE.CylinderGeometry(hubRadius, hubRadius * 1.04, hubH, 32);
    const hubMesh = new THREE.Mesh(hubGeo, segregationHubMaterial);
    hubMesh.name = 'SegregationSupportHub';
    hubMesh.position.set(0, hubMidY, 0);
    hubMesh.castShadow = true;
    hubMesh.receiveShadow = true;
    segregationSupportGroup.add(hubMesh);

    const hubEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(hubGeo, 25),
      topClosureEdgeMaterial
    );
    hubMesh.add(hubEdges);

    // 2. Dual Precision Spindle Bearings (Upper thrust/radial + Lower radial)
    const brgOuterR = derived.scene.segregation_bearing_outer_dia / 2; // 9.5 mm (OD = 19 mm)
    const brgInnerR = derived.scene.segregation_spindle_diameter / 2; // 4.0 mm (ID = 8 mm)
    const brgH = derived.scene.segregation_bearing_height; // 3.5 mm

    // Upper Bearing: Carries axial waste impact thrust and upper radial load
    const brgUpperGeo = new THREE.CylinderGeometry(brgOuterR, brgOuterR, brgH, 24);
    const brgUpperMesh = new THREE.Mesh(brgUpperGeo, quickReleaseMaterial);
    brgUpperMesh.name = 'SegregationSpindleBearing_Upper';
    brgUpperMesh.position.set(0, hubTopY - brgH / 2, 0); // Y = 931.25 mm
    segregationSupportGroup.add(brgUpperMesh);

    // Lower Bearing: Provides dual-span constraint eliminating angular spindle wobble
    const brgLowerGeo = new THREE.CylinderGeometry(brgOuterR, brgOuterR, brgH, 24);
    const brgLowerMesh = new THREE.Mesh(brgLowerGeo, quickReleaseMaterial);
    brgLowerMesh.name = 'SegregationSpindleBearing_Lower';
    brgLowerMesh.position.set(0, hubBottomY + brgH / 2, 0); // Y = 926.75 mm
    segregationSupportGroup.add(brgLowerMesh);

    // 3. Structural Divider Saddle Brackets (Mechanically anchoring housing to divider intersection)
    // Bracket material: heavy-gauge structural bracket alloy
    const saddleBracketMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Structural slate casting
      metalness: 0.8,
      roughness: 0.25,
    });
    const boltMat = quickReleaseMaterial;

    // 3a. Central Divider Saddle Bracket (Spans along Z across Central Divider at X = 0)
    // Central Divider has thickness 4 mm along X (X in [-2, +2] mm)
    const centralBracketGroup = new THREE.Group();
    centralBracketGroup.name = 'SegregationDividerMount_Central';

    const cSpanZ = derived.scene.segregation_bracket_span * 2; // 40 mm span along Z
    const cFlangeH = 0.008; // 8 mm drop below Y = 925 mm (down to Y = 917 mm)
    const cFlangeThick = 0.0025; // 2.5 mm wall thickness of saddle ear

    // Left and right clamping ears flanking the Central Divider at X = -0.00325 and +0.00325 m
    [-0.00325, 0.00325].forEach((xOff, fIdx) => {
      const earGeo = new THREE.BoxGeometry(cFlangeThick, cFlangeH, cSpanZ);
      const earMesh = new THREE.Mesh(earGeo, saddleBracketMat);
      earMesh.name = `SegregationDividerMount_Central_Ear_${fIdx + 1}`;
      earMesh.position.set(xOff, hubBottomY - cFlangeH / 2, 0);
      centralBracketGroup.add(earMesh);
    });

    // Clamping socket-head bolts securing saddle to Central Divider
    [-0.014, 0.014].forEach((zBolt, bIdx) => {
      const boltGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.009, 12);
      boltGeo.rotateZ(Math.PI / 2);
      const boltMesh = new THREE.Mesh(boltGeo, boltMat);
      boltMesh.name = `SegregationDividerMount_Central_Bolt_${bIdx + 1}`;
      boltMesh.position.set(0, hubBottomY - cFlangeH * 0.55, zBolt);
      centralBracketGroup.add(boltMesh);
    });
    segregationSupportGroup.add(centralBracketGroup);

    // 3b. Radial Divider Saddle Bracket (Spans along +X across Radial Divider at Z = 0)
    // Radial Divider has thickness 4 mm along Z (Z in [-2, +2] mm), extending from X = 0 to inner_radius
    const radialBracketGroup = new THREE.Group();
    radialBracketGroup.name = 'SegregationDividerMount_Radial';

    const rSpanX = derived.scene.segregation_bracket_span; // 20 mm along +X
    [-0.00325, 0.00325].forEach((zOff, fIdx) => {
      const earGeo = new THREE.BoxGeometry(rSpanX, cFlangeH, cFlangeThick);
      const earMesh = new THREE.Mesh(earGeo, saddleBracketMat);
      earMesh.name = `SegregationDividerMount_Radial_Ear_${fIdx + 1}`;
      earMesh.position.set(rSpanX / 2, hubBottomY - cFlangeH / 2, zOff);
      radialBracketGroup.add(earMesh);
    });

    // Clamping bolt securing saddle to Radial Divider
    const rBoltGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.009, 12);
    rBoltGeo.rotateX(Math.PI / 2);
    const rBoltMesh = new THREE.Mesh(rBoltGeo, boltMat);
    rBoltMesh.name = 'SegregationDividerMount_Radial_Bolt_1';
    rBoltMesh.position.set(rSpanX * 0.6, hubBottomY - cFlangeH * 0.55, 0);
    radialBracketGroup.add(rBoltMesh);
    segregationSupportGroup.add(radialBracketGroup);

    // 4. Segregation Drive Motor (Rotary Actuator seated below platform at Y = 901–921 mm)
    // Coaxial with vertical yaw axis [0, 1, 0] at X = 0, Z = 0
    const motorRadius = derived.scene.segregation_motor_diameter / 2; // 14 mm (OD = 28 mm)
    const motorH = derived.scene.segregation_motor_height; // 20 mm
    const motorTopY = derived.scene.segregation_motor_top_y; // 921 mm
    const motorMidY = motorTopY - motorH / 2; // 911 mm

    const motorGeo = new THREE.CylinderGeometry(motorRadius, motorRadius, motorH, 24);
    const motorMesh = new THREE.Mesh(motorGeo, motorHousingMaterial);
    motorMesh.name = 'SegregationDriveMotor';
    motorMesh.position.set(0, motorMidY, 0);
    motorMesh.castShadow = true;
    segregationSupportGroup.add(motorMesh);

    // Motor output drive shaft extending upward toward coupling (Ø5 mm x 6 mm)
    const motorShaftGeo = new THREE.CylinderGeometry(0.0025, 0.0025, 0.006, 16);
    const motorShaftMesh = new THREE.Mesh(motorShaftGeo, quickReleaseMaterial);
    motorShaftMesh.name = 'SegregationDriveMotor_OutputShaft';
    motorShaftMesh.position.set(0, motorTopY + 0.003, 0); // Y = 924 mm
    segregationSupportGroup.add(motorShaftMesh);

    // 5. Motor Mounting Bracket Flange (Rigidly suspends motor stator from housing base)
    const flangeRadius = motorRadius * 1.25; // 17.5 mm (OD = 35 mm)
    const flangeH = 0.003; // 3 mm
    const flangeGeo = new THREE.CylinderGeometry(flangeRadius, flangeRadius, flangeH, 24);
    const flangeMesh = new THREE.Mesh(flangeGeo, saddleBracketMat);
    flangeMesh.name = 'SegregationDriveMotor_Flange';
    flangeMesh.position.set(0, motorTopY + flangeH / 2, 0); // Y = 922.5 mm
    segregationSupportGroup.add(flangeMesh);

    // 6. Precision Shaft Coupling (Mechanically connects motor output shaft to yaw spindle)
    const coupRadius = derived.scene.segregation_coupling_diameter / 2; // 7 mm (OD = 14 mm)
    const coupH = derived.scene.segregation_coupling_height; // 6 mm
    const coupGeo = new THREE.CylinderGeometry(coupRadius, coupRadius, coupH, 20);
    const coupMesh = new THREE.Mesh(coupGeo, quickReleaseMaterial);
    coupMesh.name = 'SegregationMotorShaftCoupling';
    coupMesh.position.set(0, hubBottomY - coupH / 2 + 0.001, 0); // Y = 923 mm (spanning 920–926 mm)
    segregationSupportGroup.add(coupMesh);

    segregationSupportGroup.userData = {
      name: 'SegregationStructuralSupport',
      role: 'Rigid structural mounting and bearing/motor housing at divider intersection',
      hub_diameter_mm: derived.mm.segregation_hub_diameter,
      hub_height_mm: derived.mm.segregation_hub_height,
      motor_diameter_mm: derived.mm.segregation_motor_diameter,
      motor_height_mm: derived.mm.segregation_motor_height,
      spindle_diameter_mm: derived.mm.segregation_spindle_diameter,
      bearing_outer_dia_mm: derived.mm.segregation_bearing_outer_dia,
      bearing_height_mm: derived.mm.segregation_bearing_height,
      bracket_span_mm: derived.mm.segregation_bracket_span,
      coupling_diameter_mm: derived.mm.segregation_coupling_diameter,
      coupling_height_mm: derived.mm.segregation_coupling_height,
      support_location: 'Central & Radial Divider intersection at (0, 0)',
      structural_foundation: 'CentralDivider (180°) & RadialDivider (90°)',
      supports_spindle: true,
      bearing_arrangement: 'Dual-bearing journal (Upper radial/thrust + Lower radial)',
      motor_position: 'Directly below platform at Y = 901–921 mm',
      motor_axis: 'Vertical Y-axis [0, 1, 0] coaxial with yaw spindle',
      load_path: 'Platform -> Trunnion -> Spindle -> Bearings -> Housing -> Divider Saddles -> Dividers -> Shell',
      electronics_at_center: false,
      status: 'CONFIRMED PHASE 3 MECHANICAL EMBODIMENT',
      source: 'Approved Architecture / Phase 3 Readiness',
    };
    inputSegregationAssembly.add(segregationSupportGroup);

    // ----------------------------------------------------
    // 4. TWO-AXIS ROTATING BASE ASSEMBLY
    // ----------------------------------------------------
    // Hierarchy:
    // RotatingBaseAssembly (at 0, y_rotating_base, 0)
    // └── AxisPivot_1 (Yaw rotation around vertical Y-axis)
    //     └── AxisPivot_2 (Pitch/tilt rotation around horizontal axis)
    //         └── RotatingBase (Physical contoured platform plate)
    const rotatingBaseAssembly = new THREE.Group();
    rotatingBaseAssembly.name = 'RotatingBaseAssembly';
    rotatingBaseAssembly.position.set(0, derived.scene.y_rotating_base, 0); // Y = 935 mm

    const axisPivot1 = new THREE.Group();
    axisPivot1.name = 'AxisPivot_1';

    // Vertical Yaw Spindle Shaft extending downward into dual bearings and shaft coupling
    const spindleRadius = derived.scene.segregation_spindle_diameter / 2; // 4 mm (Ø8 mm)
    const spindleH = 0.014; // 14 mm length extending down from Y = 935 mm to Y = 921 mm
    const spindleGeo = new THREE.CylinderGeometry(spindleRadius, spindleRadius, spindleH, 24);
    const spindleMesh = new THREE.Mesh(spindleGeo, gimbalMaterial);
    spindleMesh.name = 'AxisPivot_1_Spindle';
    spindleMesh.position.set(0, -spindleH / 2, 0); // Extends from 0 to -14 mm (Y = 935 to 921 mm)
    axisPivot1.add(spindleMesh);

    axisPivot1.userData = {
      name: 'AxisPivot_1',
      motion_type: 'Revolute (Yaw)',
      axis: 'Y-axis (Vertical: 0, 1, 0)',
      function: 'Rotates platform to aim at Organic (180°), Inorganic (90°), or Leftover Food (90°) sector',
      spindle_diameter_mm: derived.mm.segregation_spindle_diameter,
      spindle_length_mm: spindleH * 1000,
      bearing_supported: true,
      status: 'CONFIRMED PHASE 3 MECHANICAL EMBODIMENT',
    };

    const axisPivot2 = new THREE.Group();
    axisPivot2.name = 'AxisPivot_2';

    // Visual Axis 2 (Pitch/Tilt) horizontal trunnion pins along X
    const trunnionGeo = new THREE.CylinderGeometry(0.0035, 0.0035, derived.scene.rotating_base_waist_width * 0.9, 16);
    trunnionGeo.rotateZ(Math.PI / 2);
    const trunnionMesh = new THREE.Mesh(trunnionGeo, gimbalMaterial);
    trunnionMesh.name = 'AxisPivot_2_Trunnion';
    axisPivot2.add(trunnionMesh);

    axisPivot2.userData = {
      name: 'AxisPivot_2',
      motion_type: 'Revolute (Pitch/Tilt)',
      axis: 'Local X-axis (Horizontal Transverse)',
      function: 'Tilts platform downward to gravitationally discharge waste into the selected sector',
      status: 'BASELINE / CHANGEABLE',
    };

    // Contoured peanut / dumbbell platform plate (IMG_20260925_175139.jpg)
    const L = derived.scene.rotating_base_length; // 0.085 m
    const W_lobe = derived.scene.rotating_base_lobe_width; // 0.070 m
    const W_waist = derived.scene.rotating_base_waist_width; // 0.050 m
    const T = derived.scene.rotating_base_thickness; // 0.004 m

    const R1 = W_lobe / 2; // 0.035 m
    const R0 = W_waist / 2; // 0.025 m
    const zLobe = Math.max(0.005, L / 2 - R1); // lobe center offset along Z

    const peanutShape = new THREE.Shape();
    peanutShape.moveTo(-R1, zLobe);
    peanutShape.absarc(0, zLobe, R1, Math.PI, 0, true);
    peanutShape.bezierCurveTo(R1, zLobe * 0.3, R0, zLobe * 0.15, R0, 0);
    peanutShape.bezierCurveTo(R0, -zLobe * 0.15, R1, -zLobe * 0.3, R1, -zLobe);
    peanutShape.absarc(0, -zLobe, R1, 0, Math.PI, true);
    peanutShape.bezierCurveTo(-R1, -zLobe * 0.3, -R0, -zLobe * 0.15, -R0, 0);
    peanutShape.bezierCurveTo(-R0, zLobe * 0.15, -R1, zLobe * 0.3, -R1, zLobe);

    const extrudeSettings = {
      depth: T,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.001,
      bevelThickness: 0.001,
    };
    const plateGeo = new THREE.ExtrudeGeometry(peanutShape, extrudeSettings);
    plateGeo.rotateX(-Math.PI / 2); // Lay flat on XZ plane
    plateGeo.translate(0, -T / 2, 0);

    const rotatingBaseMesh = new THREE.Mesh(plateGeo, rotatingBaseMaterial);
    rotatingBaseMesh.name = 'RotatingBase';
    rotatingBaseMesh.castShadow = true;
    rotatingBaseMesh.receiveShadow = true;

    const plateEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(plateGeo, 20),
      rotatingBaseEdgeMaterial
    );
    plateEdges.name = 'RotatingBase_Edges';
    rotatingBaseMesh.add(plateEdges);

    rotatingBaseMesh.userData = {
      name: 'RotatingBase',
      component_type: 'Two-Axis Contoured Waste Platform (NOT a flap)',
      elevation_center_mm: derived.mm.y_rotating_base,
      offset_above_input_boundary_mm: derived.mm.rotating_base_elevation_offset || 10,
      contour_geometry: 'Contoured peanut/dumbbell profile',
      dimensions_mm: {
        length: derived.mm.rotating_base_length,
        lobe_width: derived.mm.rotating_base_lobe_width,
        waist_width: derived.mm.rotating_base_waist_width,
        thickness: derived.mm.rotating_base_thickness,
      },
      intended_two_axis_rotation: {
        axis_1: 'Primary Yaw rotation around vertical Y-axis (aligns with 180° Organic, 90° Inorganic, or 90° Leftover Food sectors)',
        axis_2: 'Secondary Pitch/tilt rotation around horizontal axis (tilts to discharge waste downward into target sector)',
      },
      pivot_hierarchy: 'RotatingBaseAssembly -> AxisPivot_1 -> AxisPivot_2 -> RotatingBase',
      alignment: 'Vertically aligned at (0, 0) divider intersection',
      source: 'references/sketches/IMG_20260925_175139.jpg & patent Alternative Embodiment B',
      status: 'BASELINE / CHANGEABLE',
      collisionRequired: true,
    };

    const baseBadge = createTextSprite(
      `TWO-AXIS ROTATING BASE (Y = ${derived.mm.y_rotating_base} mm)`,
      '#f59e0b'
    );
    baseBadge.name = 'RotatingBase_Badge';
    baseBadge.position.set(0, 0.03, 0);
    baseBadge.scale.multiplyScalar(0.72);
    rotatingBaseMesh.add(baseBadge);

    // Assemble pivot hierarchy
    axisPivot2.add(rotatingBaseMesh);
    axisPivot1.add(axisPivot2);
    rotatingBaseAssembly.add(axisPivot1);

    rotatingBaseAssembly.userData = {
      name: 'RotatingBaseAssembly',
      elevation_mm: derived.mm.y_rotating_base,
      alignment: 'Centered at (0, 0) sector divider intersection',
      status: 'BASELINE / CHANGEABLE',
      intended_two_axis_rotation: true,
    };

    inputSegregationAssembly.add(rotatingBaseAssembly);

    // ----------------------------------------------------
    // 5. INPUT CAMERA (Left Side -X, IMG_20260925_175102.jpg)
    // ----------------------------------------------------
    const cameraGroup = new THREE.Group();
    cameraGroup.name = 'InputCamera';

    cameraGroup.position.set(
      derived.scene.camera_mount_x,
      derived.scene.sensor_mount_y,
      derived.scene.sensor_mount_z
    );
    // Aim optical axis toward rotating base at (0, y_rotating_base, 0)
    cameraGroup.lookAt(0, derived.scene.y_rotating_base, 0);

    const cameraBodyGeo = new THREE.BoxGeometry(
      derived.scene.camera_width,
      derived.scene.camera_height,
      derived.scene.camera_depth
    );
    const cameraBodyMesh = new THREE.Mesh(cameraBodyGeo, sensorHousingMaterial);
    cameraBodyMesh.name = 'InputCamera_Body';
    cameraBodyMesh.castShadow = true;
    cameraGroup.add(cameraBodyMesh);

    const lensRadius = derived.scene.camera_lens_diameter / 2;
    const lensGeo = new THREE.CylinderGeometry(lensRadius, lensRadius, 0.008, 24);
    lensGeo.rotateX(Math.PI / 2);
    const lensMesh = new THREE.Mesh(lensGeo, cameraLensMaterial);
    lensMesh.name = 'InputCamera_Lens';
    lensMesh.position.set(0, 0, derived.scene.camera_depth / 2 + 0.004);
    cameraGroup.add(lensMesh);

    cameraGroup.userData = {
      name: 'InputCamera',
      component_type: 'Optical RGB/AI Classification Camera',
      mounting_location: 'Underneath TopClosure crossbeam, left side (-X)',
      orientation: 'Aimed downward-inward at rotating base platform (0, 810 mm, 0)',
      source: 'references/sketches/IMG_20260925_175102.jpg & docs/model_blueprint.md',
      status: 'BASELINE / CHANGEABLE',
    };

    const cameraBadge = createTextSprite('CAMERA (OPTICAL SCAN)', '#38bdf8');
    cameraBadge.name = 'InputCamera_Badge';
    cameraBadge.position.set(0, derived.scene.camera_height * 0.8, 0);
    cameraBadge.scale.multiplyScalar(0.65);
    cameraGroup.add(cameraBadge);

    // Alias wrapper: also create 'Camera' child pointing to InputCamera
    const cameraWrapper = new THREE.Group();
    cameraWrapper.name = 'Camera';
    cameraWrapper.add(cameraGroup);
    inputSegregationAssembly.add(cameraWrapper);

    // ----------------------------------------------------
    // 6. INPUT ULTRASONIC SENSOR (Right Side +X, IMG_20260925_175102.jpg)
    // ----------------------------------------------------
    const ultrasonicGroup = new THREE.Group();
    ultrasonicGroup.name = 'InputUltrasonicSensor';

    ultrasonicGroup.position.set(
      derived.scene.ultrasonic_mount_x,
      derived.scene.sensor_mount_y,
      derived.scene.sensor_mount_z
    );
    // Aim ultrasonic acoustic axis toward rotating base at (0, y_rotating_base, 0)
    ultrasonicGroup.lookAt(0, derived.scene.y_rotating_base, 0);

    const usBodyGeo = new THREE.BoxGeometry(
      derived.scene.ultrasonic_width,
      derived.scene.ultrasonic_height,
      derived.scene.ultrasonic_depth
    );
    const usBodyMesh = new THREE.Mesh(usBodyGeo, sensorHousingMaterial);
    usBodyMesh.name = 'InputUltrasonicSensor_Body';
    usBodyMesh.castShadow = true;
    ultrasonicGroup.add(usBodyMesh);

    // Dual transducer barrels (Transmitter 'T' and Receiver 'R')
    const transducerRadius = derived.scene.ultrasonic_transducer_diameter / 2;
    const barrelSpacing = derived.scene.ultrasonic_width * 0.24;

    [-barrelSpacing, barrelSpacing].forEach((xOffset, idx) => {
      const barrelGeo = new THREE.CylinderGeometry(transducerRadius, transducerRadius, 0.009, 24);
      barrelGeo.rotateX(Math.PI / 2);
      const barrelMesh = new THREE.Mesh(barrelGeo, ultrasonicTransducerMaterial);
      barrelMesh.name = `Ultrasonic_Transducer_${idx === 0 ? 'T' : 'R'}`;
      barrelMesh.position.set(xOffset, 0, derived.scene.ultrasonic_depth / 2 + 0.0045);
      ultrasonicGroup.add(barrelMesh);
    });

    ultrasonicGroup.userData = {
      name: 'InputUltrasonicSensor',
      component_type: 'Dual-Transducer Ultrasonic Proximity/Fill Sensor',
      mounting_location: 'Underneath TopClosure crossbeam, right side (+X)',
      orientation: 'Aimed downward-inward at rotating base platform (0, 810 mm, 0)',
      transducers: 'Dual-barrel (Transmitter T + Receiver R)',
      source: 'references/sketches/IMG_20260925_175102.jpg & docs/model_blueprint.md',
      status: 'BASELINE / CHANGEABLE',
    };

    const usBadge = createTextSprite('ULTRASONIC SENSOR (DUAL-BARREL)', '#a855f7');
    usBadge.name = 'InputUltrasonicSensor_Badge';
    usBadge.position.set(0, derived.scene.ultrasonic_height * 0.8, 0);
    usBadge.scale.multiplyScalar(0.65);
    ultrasonicGroup.add(usBadge);

    // Alias wrapper: also create 'UltrasonicSensor' child pointing to InputUltrasonicSensor
    const ultrasonicWrapper = new THREE.Group();
    ultrasonicWrapper.name = 'UltrasonicSensor';
    ultrasonicWrapper.add(ultrasonicGroup);
    inputSegregationAssembly.add(ultrasonicWrapper);

    // ----------------------------------------------------
    // 7. ELECTRONICS BAY (Phase 3F & Decision C)
    // Allocated upper region above Leftover Food chamber (+X, +Z quadrant, Y = 925–975 mm)
    // Resting on LeftoverFoodTopClosure.
    // Contains:
    // - Arduino MCU board with wiring loom
    // - Battery/Power box with 16 LiFePO4 cells arranged 4S4P
    // Completely clear of funnel cone, rotating base, dividers, and shell.
    // ----------------------------------------------------
    const electronicsBay = new THREE.Group();
    electronicsBay.name = 'ElectronicsBay';

    // Bounded enclosure dimensions (mm -> m)
    const bayW = 0.070; // 70 mm along X
    const bayH = 0.040; // 40 mm along Y (Y = 928 to 968 mm)
    const bayD = 0.070; // 70 mm along Z
    const bayX = 0.150; // centered at X = 150 mm
    const bayY = derived.scene.y_input_boundary + 0.003 + bayH / 2; // Y = 948 mm
    const bayZ = 0.105; // centered at Z = 105 mm

    electronicsBay.position.set(bayX, bayY, bayZ);

    // Protective translucent enclosure box
    const boxGeo = new THREE.BoxGeometry(bayW, bayH, bayD);
    const boxMesh = new THREE.Mesh(boxGeo, electronicsHousingMaterial);
    boxMesh.name = 'ElectronicsBay_Housing';
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    electronicsBay.add(boxMesh);

    const boxEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
    );
    boxMesh.add(boxEdges);

    // 7a. MAIN CONTROL UNIT (Arduino Board representation)
    const mcuGroup = new THREE.Group();
    mcuGroup.name = 'ElectronicsBay_MCU';
    mcuGroup.position.set(0, -bayH / 4, 0); // lower level in housing

    const pcbGeo = new THREE.BoxGeometry(0.060, 0.003, 0.048);
    const pcbMesh = new THREE.Mesh(pcbGeo, pcbMaterial);
    pcbMesh.name = 'ElectronicsBay_MCU_PCB';
    mcuGroup.add(pcbMesh);

    // Microcontroller IC package
    const icGeo = new THREE.BoxGeometry(0.015, 0.002, 0.015);
    const icMesh = new THREE.Mesh(icGeo, motorHousingMaterial);
    icMesh.name = 'ElectronicsBay_MCU_Chip';
    icMesh.position.set(-0.008, 0.0025, 0);
    mcuGroup.add(icMesh);

    // USB connector port
    const usbGeo = new THREE.BoxGeometry(0.012, 0.006, 0.008);
    const usbMesh = new THREE.Mesh(usbGeo, quickReleaseMaterial);
    usbMesh.name = 'ElectronicsBay_MCU_USB';
    usbMesh.position.set(-0.028, 0.004, -0.018);
    mcuGroup.add(usbMesh);

    // Status LED indicator
    const ledGeo = new THREE.BoxGeometry(0.003, 0.002, 0.003);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.name = 'ElectronicsBay_MCU_LED';
    ledMesh.position.set(0.020, 0.0025, 0.018);
    mcuGroup.add(ledMesh);

    mcuGroup.userData = {
      name: 'ElectronicsBay_MCU',
      board_type: 'Arduino Board / Main Control Unit',
      dimensions_mm: { width: 68, depth: 53, height: 12 },
      role: 'System supervisory control, sensor aggregation, and motor drive sequencing',
      source: 'Phase 3 Decision C / Approved Architecture',
      status: 'CONFIRMED DECISION C ARCHITECTURE',
    };
    electronicsBay.add(mcuGroup);

    // 7b. POWER MANAGEMENT SYSTEM (1 Battery Box with 16 LiFePO4 cells in 4S4P arrangement)
    const pwrGroup = new THREE.Group();
    pwrGroup.name = 'ElectronicsBay_BatteryBox';
    pwrGroup.position.set(0, bayH / 4, 0); // upper level in housing

    const pwrBoxGeo = new THREE.BoxGeometry(0.065, 0.018, 0.065);
    const pwrBoxMesh = new THREE.Mesh(pwrBoxGeo, batteryBoxMaterial);
    pwrBoxMesh.name = 'ElectronicsBay_BatteryBox_Casing';
    pwrGroup.add(pwrBoxMesh);

    // 16 LiFePO4 Cells arranged in 4S4P grid (4 rows of 4 cells)
    const cellRadius = 0.0065; // 6.5 mm radius (13 mm diameter cell)
    const cellHeight = 0.015; // 15 mm height
    const cellSpacing = 0.0145; // 14.5 mm pitch

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cx = (c - 1.5) * cellSpacing;
        const cz = (r - 1.5) * cellSpacing;
        const cellGeo = new THREE.CylinderGeometry(cellRadius, cellRadius, cellHeight, 16);
        const cellMesh = new THREE.Mesh(cellGeo, batteryCellMaterial);
        cellMesh.name = `LiFePO4_Cell_${r + 1}_${c + 1}`;
        cellMesh.position.set(cx, 0.001, cz);
        pwrGroup.add(cellMesh);
      }
    }

    pwrGroup.userData = {
      name: 'ElectronicsBay_BatteryBox',
      power_system: 'LiFePO4 Power Management System',
      cell_count: 16,
      cell_arrangement: '4S4P (4 Series, 4 Parallel)',
      chemistry: 'LiFePO4 (Lithium Iron Phosphate)',
      source: 'Phase 3 Decision C / Approved Architecture',
      status: 'CONFIRMED DECISION C ARCHITECTURE',
    };
    electronicsBay.add(pwrGroup);

    // 7c. Wiring Loom between Battery Box and MCU
    const wireGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.025, 8);
    const wireMesh = new THREE.Mesh(wireGeo, wiringMaterial);
    wireMesh.name = 'ElectronicsBay_WiringLoom';
    wireMesh.position.set(0.024, 0, 0);
    electronicsBay.add(wireMesh);

    // Engineering Label Sprite
    const elecBadge = createTextSprite('ELECTRONICS BAY: MCU & 4S4P LiFePO4', '#38bdf8');
    elecBadge.name = 'ElectronicsBay_Badge';
    elecBadge.position.set(0, bayH / 2 + 0.018, 0);
    elecBadge.scale.multiplyScalar(0.55);
    electronicsBay.add(elecBadge);

    electronicsBay.userData = {
      name: 'ElectronicsBay',
      location: 'Upper region above Leftover Food chamber (+X, +Z quadrant)',
      elevation_bottom_mm: derived.mm.y_input_boundary + 3, // Y = 928 mm
      elevation_top_mm: derived.mm.y_input_boundary + 3 + bayH * 1000, // Y = 975 mm
      housing_dimensions_mm: { width: bayW * 1000, height: bayH * 1000, depth: bayD * 1000 },
      clearances: {
        funnel_cone_clearance_mm: 16.5,
        shell_clearance_mm: 14.0,
        rotating_base_clearance_mm: 85.0,
      },
      contents: [
        'Main Control Unit: Arduino board and wiring',
        'Power Management: 1 battery box with 16 LiFePO4 cells (4S4P)',
      ],
      collision_free: true,
      status: 'CONFIRMED DECISION C ARCHITECTURE',
      source: 'Phase 3 Decision C / Approved Architecture',
    };
    inputSegregationAssembly.add(electronicsBay);
  }

  // Initial build
  buildMainShell(currentDerived);
  buildReferenceGeometry(currentDerived);
  buildRegionMarkers(currentDerived);
  buildStructuralArchitecture(currentDerived);
  buildOrganicChambers(currentDerived);
  buildInorganicSection(currentDerived);
  buildLeftoverFoodSection(currentDerived);
  buildInputSegregationAssembly(currentDerived);

  // ==========================================
  // PARAMETRIC REGENERATION METHOD
  // ==========================================
  /**
   * Updates baseline parameters and regenerates envelope geometry dynamically.
   * Validates relationship before applying. If invalid, throws error without distorting geometry.
   *
   * @param {Object} newParams
   * @returns {Object} Updated derived geometry
   */
  envelope.updateParameters = function (newParams) {
    const merged = { ...currentDerived.raw, ...newParams };

    // Validation pass: will throw error if invalid
    validateParameters(merged);

    // Compute updated derived values
    currentDerived = getDerivedGeometry(merged);

    // Regenerate child geometry modules
    buildMainShell(currentDerived);
    buildReferenceGeometry(currentDerived);
    buildRegionMarkers(currentDerived);
    buildStructuralArchitecture(currentDerived);
    buildOrganicChambers(currentDerived);
    buildInorganicSection(currentDerived);
    buildLeftoverFoodSection(currentDerived);
    buildInputSegregationAssembly(currentDerived);

    // Re-apply decomposition agitator visibility state
    const agitator = organicChambers.getObjectByName('OrganicDecompositionAgitator');
    if (agitator) agitator.visible = decompAgitatorVisible;

    // Re-apply label visibility state
    envelope.setLabelsVisible(labelsVisible);

    console.log('[GomikinEnvelope] Successfully updated geometry to parameters:', currentDerived.mm);
    return currentDerived;
  };

  /**
   * Returns current active parameters and derived metrics.
   */
  envelope.getParameters = function () {
    return currentDerived;
  };

  /**
   * Sets sector orientation angle (deg) and rotates the structural architecture.
   */
  envelope.setSectorOrientation = function (deg) {
    envelope.updateParameters({ sector_orientation_deg: deg });
  };

  /**
   * Toggle visibility of structural architecture dividers
   */
  envelope.setStructuralArchitectureVisible = function (visible) {
    structuralArchitecture.visible = visible;
  };

  /**
   * Shell visibility mode controls (to verify hollow interior)
   * Modes: 'translucent' | 'solid' | 'wireframe' | 'hidden'
   */
  envelope.setShellMode = function (mode) {
    if (mode === 'hidden') {
      mainShell.visible = false;
    } else {
      mainShell.visible = true;
      shellMaterial.wireframe = mode === 'wireframe';
      if (mode === 'translucent') {
        shellMaterial.transparent = true;
        shellMaterial.opacity = 0.28;
        shellMaterial.depthWrite = false;
      } else if (mode === 'solid') {
        shellMaterial.transparent = false;
        shellMaterial.opacity = 1.0;
        shellMaterial.depthWrite = true;
      } else if (mode === 'wireframe') {
        shellMaterial.transparent = true;
        shellMaterial.opacity = 0.4;
        shellMaterial.depthWrite = false;
      }
      shellMaterial.needsUpdate = true;
    }
  };

  /**
   * Reference geometry toggle
   */
  envelope.setReferenceGeometryVisible = function (visible) {
    referenceGeometry.visible = visible;
  };

  /**
   * Middle output datum visibility toggle (independent control)
   */
  envelope.setMiddleOutputDatumVisible = function (visible) {
    middleOutputDatumVisible = visible;
    const datum = referenceGeometry.getObjectByName('MiddleOutputDatum');
    if (datum) {
      datum.visible = visible;
    }
  };

  /**
   * Returns whether MiddleOutputDatum is currently visible
   */
  envelope.isMiddleOutputDatumVisible = function () {
    return middleOutputDatumVisible;
  };

  /**
   * Organic chamber envelopes visibility toggle (independent control)
   */
  envelope.setOrganicChambersVisible = function (visible) {
    organicChambersVisible = visible;
    organicChambers.visible = visible;
  };

  /**
   * Decomposition Agitator mechanism visibility toggle
   */
  envelope.setDecompositionAgitatorVisible = function (visible) {
    decompAgitatorVisible = visible;
    const agitator = organicChambers.getObjectByName('OrganicDecompositionAgitator');
    if (agitator) agitator.visible = visible;
  };

  /**
   * Returns whether Decomposition Agitator is currently visible
   */
  envelope.isDecompositionAgitatorVisible = function () {
    return decompAgitatorVisible;
  };

  /**
   * Decomposition Sensory Feedback Array (Load Cell, Temperature Sensor, Moisture Sensor) visibility toggle
   */
  envelope.setDecompositionSensorsVisible = function (visible) {
    decompSensorsVisible = visible;
    const sensors = organicChambers.getObjectByName('DecompositionSensorArray');
    if (sensors) sensors.visible = visible;
  };

  /**
   * Returns whether Decomposition Sensors are currently visible
   */
  envelope.isDecompositionSensorsVisible = function () {
    return decompSensorsVisible;
  };

  /**
   * Returns whether Organic Chambers are currently visible
   */
  envelope.isOrganicChambersVisible = function () {
    return organicChambersVisible;
  };

  /**
   * Inorganic section visibility toggle
   */
  envelope.setInorganicSectionVisible = function (visible) {
    inorganicSectionVisible = visible;
    inorganicSection.visible = visible;
  };

  /**
   * Returns whether Inorganic Section is currently visible
   */
  envelope.isInorganicSectionVisible = function () {
    return inorganicSectionVisible;
  };

  /**
   * Leftover food section visibility toggle
   */
  envelope.setLeftoverFoodSectionVisible = function (visible) {
    leftoverFoodSectionVisible = visible;
    leftoverFoodSection.visible = visible;
  };

  /**
   * Returns whether Leftover Food Section is currently visible
   */
  envelope.isLeftoverFoodSectionVisible = function () {
    return leftoverFoodSectionVisible;
  };

  /**
   * Leftover food access door visibility toggle
   */
  envelope.setLeftoverFoodDoorVisible = function (visible) {
    leftoverFoodDoorVisible = visible;
    const doorPivot = leftoverFoodSection.getObjectByName('LeftoverFoodDoor_Pivot')
      || leftoverFoodSection.getObjectByName('LeftoverFoodAccessDoor_Hinge');
    if (doorPivot) doorPivot.visible = visible;
  };

  envelope.isLeftoverFoodDoorVisible = function () {
    return leftoverFoodDoorVisible;
  };

  /**
   * Leftover food access door kinematic rotation angle (Phase 3B)
   * Rotates the door continuously around the straight horizontal chord axis connecting Corner A and Corner B.
   * @param {number} angleDeg - Angle in degrees (0° closed to 90° max)
   */
  envelope.setLeftoverFoodDoorAngle = function (angleDeg) {
    leftoverFoodDoorAngleDeg = Math.max(0, Math.min(90, Number(angleDeg) || 0));
    const doorPivot = leftoverFoodSection.getObjectByName('LeftoverFoodDoor_Pivot')
      || leftoverFoodSection.getObjectByName('LeftoverFoodAccessDoor_Hinge');
    if (doorPivot) {
      doorPivot.rotation.x = THREE.MathUtils.degToRad(leftoverFoodDoorAngleDeg);
      doorPivot.updateMatrixWorld(true);
    }
  };

  envelope.getLeftoverFoodDoorAngle = function () {
    return leftoverFoodDoorAngleDeg;
  };

  let decompDrawerExtMm = 0;
  let inorgDrawerExtMm = 0;
  let leftoverDrawerExtMm = 0;

  /**
   * Decomposition vessel drawer extraction control (mm along -X)
   */
  envelope.setDecompositionDrawerExtraction = function (extMm) {
    decompDrawerExtMm = Math.max(0, Math.min(300, Number(extMm) || 0));
    const drawer = envelope.getObjectByName('DecompositionVessel_Drawer');
    if (drawer) {
      drawer.position.x = -decompDrawerExtMm / 1000.0;
      drawer.updateMatrixWorld(true);
    }
  };
  envelope.getDecompositionDrawerExtraction = function () {
    return decompDrawerExtMm;
  };

  /**
   * Inorganic output drawer extraction control (mm along +X)
   */
  envelope.setInorganicDrawerExtraction = function (extMm) {
    inorgDrawerExtMm = Math.max(0, Math.min(300, Number(extMm) || 0));
    const drawer = envelope.getObjectByName('InorganicDrawer');
    if (drawer) {
      drawer.position.x = inorgDrawerExtMm / 1000.0;
      drawer.updateMatrixWorld(true);
    }
  };
  envelope.getInorganicDrawerExtraction = function () {
    return inorgDrawerExtMm;
  };

  /**
   * Leftover food output drawer extraction control (mm along +Z)
   */
  envelope.setLeftoverFoodDrawerExtraction = function (extMm) {
    leftoverDrawerExtMm = Math.max(0, Math.min(300, Number(extMm) || 0));
    const drawer = envelope.getObjectByName('LeftoverFoodDrawer');
    if (drawer) {
      drawer.position.z = leftoverDrawerExtMm / 1000.0;
      drawer.updateMatrixWorld(true);
    }
  };
  envelope.getLeftoverFoodDrawerExtraction = function () {
    return leftoverDrawerExtMm;
  };

  /**
   * Leftover food top closure visibility toggle
   */
  envelope.setLeftoverFoodTopClosureVisible = function (visible) {
    leftoverFoodTopClosureVisible = visible;
    const topClosure = leftoverFoodSection.getObjectByName('LeftoverFoodTopClosure');
    if (topClosure) topClosure.visible = visible;
  };

  envelope.isLeftoverFoodTopClosureVisible = function () {
    return leftoverFoodTopClosureVisible;
  };

  /**
   * Input & Segregation assembly visibility toggle
   */
  envelope.setInputAssemblyVisible = function (visible) {
    inputAssemblyVisible = visible;
    inputSegregationAssembly.visible = visible;
  };

  /**
   * Returns whether Input Assembly is currently visible
   */
  envelope.isInputAssemblyVisible = function () {
    return inputAssemblyVisible;
  };

  /**
   * Global engineering-label visibility toggle
   * Controls visibility of all text sprite callouts without hiding any geometry,
   * reference planes, dividers, chamber envelopes, sensors, camera, or display.
   */
  envelope.setLabelsVisible = function (visible) {
    labelsVisible = visible;
    envelope.traverse((child) => {
      if (child.userData && child.userData.isEngineeringLabel) {
        child.visible = visible;
      }
    });
  };

  /**
   * Returns whether engineering labels are currently visible
   */
  envelope.isLabelsVisible = function () {
    return labelsVisible;
  };

  /**
   * Region markers toggle
   */
  envelope.setRegionMarkersVisible = function (visible) {
    regionMarkers.visible = visible;
  };

  return envelope;
}