const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scratch/cad_mechanical_audit.json', 'utf8'));
const { components, clearances } = data;

console.log('================================================================');
console.log('MECHANICAL AUDIT: MOVING COMPONENTS AND STRUCTURAL MATING');
console.log('================================================================\n');

const movingKeys = [
  'rotating_base',
  'cutting_blades',
  'door_mechanism_left',
  'door_mechanism_right',
  'leftover_food_closur',
  'agitator'
];

for (const key of movingKeys) {
  const c = components[key];
  if (!c) {
    console.log(`[NOT FOUND] ${key}`);
    continue;
  }
  console.log(`----------------------------------------------------------------`);
  console.log(`COMPONENT: ${c.name} (${c.type})`);
  console.log(`Parent Name: ${c.parentName}`);
  console.log(`Hierarchy: ${c.hierarchy.map(h => h.name).reverse().join(' -> ')}`);
  console.log(`Initial Pos: (${c.initialPos.x.toFixed(4)}, ${c.initialPos.y.toFixed(4)}, ${c.initialPos.z.toFixed(4)})`);
  console.log(`Initial Rot: (${c.initialRot.x.toFixed(4)}, ${c.initialRot.y.toFixed(4)}, ${c.initialRot.z.toFixed(4)})`);
  console.log(`Initial Scale: (${c.initialScale.x.toFixed(4)}, ${c.initialScale.y.toFixed(4)}, ${c.initialScale.z.toFixed(4)})`);
  console.log(`World Box Min: (${c.worldBox.min.x.toFixed(4)}, ${c.worldBox.min.y.toFixed(4)}, ${c.worldBox.min.z.toFixed(4)})`);
  console.log(`World Box Max: (${c.worldBox.max.x.toFixed(4)}, ${c.worldBox.max.y.toFixed(4)}, ${c.worldBox.max.z.toFixed(4)})`);
  console.log(`World Box Size (dx, dy, dz): (${c.worldBox.size.x.toFixed(4)}, ${c.worldBox.size.y.toFixed(4)}, ${c.worldBox.size.z.toFixed(4)})`);
  console.log(`World Box Center: (${c.worldBox.center.x.toFixed(4)}, ${c.worldBox.center.y.toFixed(4)}, ${c.worldBox.center.z.toFixed(4)})`);
  if (c.localBox) {
    console.log(`Local Geo Center: (${c.localBox.center.x.toFixed(4)}, ${c.localBox.center.y.toFixed(4)}, ${c.localBox.center.z.toFixed(4)})`);
    console.log(`Local Geo Size: (${c.localBox.size.x.toFixed(4)}, ${c.localBox.size.y.toFixed(4)}, ${c.localBox.size.z.toFixed(4)})`);
  }
  console.log(`Vertices: ${c.vertexCount}, Faces: ${c.faceCount}`);

  // Clearances and intersections
  const clr = clearances[key] || {};
  console.log(`\nIntersections & Close Clearances:`);
  for (const [otherName, info] of Object.entries(clr)) {
    if (info.intersects) {
      console.log(`  [INTERSECTION] with ${otherName}: overlap size = (${info.overlapSize.x.toFixed(4)}, ${info.overlapSize.y.toFixed(4)}, ${info.overlapSize.z.toFixed(4)}), vol = ${info.overlapVolume.toFixed(6)}`);
    } else if (info.gapDistance < 0.05) {
      console.log(`  [PROXIMITY] with ${otherName}: gap dist = ${(info.gapDistance * 1000).toFixed(1)} mm`);
    }
  }
  console.log('');
}

console.log('================================================================');
console.log('STRUCTURAL & PASSIVE MATING COMPONENTS');
console.log('================================================================\n');

const staticKeys = [
  'Funnel',
  'top_closuer',
  'cutting_motor',
  'cutting_motor_support',
  'motor_support',
  'circular_frame',
  'cutting_mesh',
  'storage_chamber',
  'central_divider',
  'Rightside_Divider',
  'decompostion_chamber',
  'bottom_of_decomposition_section',
  'inorganic_output_chamber',
  'leftover_food_outpu_section',
  'leachate_section',
  'Main_Housing',
  'servo'
];

for (const key of staticKeys) {
  const c = components[key];
  if (!c) continue;
  console.log(`${c.name.padEnd(32)} | Size (m): [${c.worldBox.size.x.toFixed(3)}, ${c.worldBox.size.y.toFixed(3)}, ${c.worldBox.size.z.toFixed(3)}] | Center (m): [${c.worldBox.center.x.toFixed(3)}, ${c.worldBox.center.y.toFixed(3)}, ${c.worldBox.center.z.toFixed(3)}] | Elevation Y: [${c.worldBox.min.y.toFixed(3)} to ${c.worldBox.max.y.toFixed(3)}]`);
}
