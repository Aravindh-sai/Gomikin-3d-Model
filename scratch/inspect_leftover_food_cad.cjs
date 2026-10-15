const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scratch/cad_mechanical_audit.json', 'utf8'));
const { components } = data;

console.log('========================================================================');
console.log('CAD SHAPE & TOPOLOGY INSPECTION');
console.log('========================================================================\n');

// Inspect specific components to understand their physical CAD shapes
const inspectNames = [
  'rotating_base',
  'leftover_food_closur',
  'leftover_food_outpu_section',
  'door_mechanism_left',
  'door_mechanism_right',
  'cutting_blades',
  'cutting_mesh',
  'circular_frame',
  'agitator',
  'bottom_of_decomposition_section',
  'servo',
  'storage_chamber',
  'decompostion_chamber',
  'inorganic_output_chamber'
];

for (const name of inspectNames) {
  const c = components[name];
  if (!c) continue;
  console.log(`COMPONENT: ${name}`);
  console.log(`  Vertices: ${c.vertexCount}, Faces: ${c.faceCount}`);
  console.log(`  World Size: dx=${(c.worldBox.size.x*1000).toFixed(1)}mm, dy=${(c.worldBox.size.y*1000).toFixed(1)}mm, dz=${(c.worldBox.size.z*1000).toFixed(1)}mm`);
  console.log(`  World Min: [${c.worldBox.min.x.toFixed(4)}, ${c.worldBox.min.y.toFixed(4)}, ${c.worldBox.min.z.toFixed(4)}]`);
  console.log(`  World Max: [${c.worldBox.max.x.toFixed(4)}, ${c.worldBox.max.y.toFixed(4)}, ${c.worldBox.max.z.toFixed(4)}]`);
  console.log(`  World Center: [${c.worldBox.center.x.toFixed(4)}, ${c.worldBox.center.y.toFixed(4)}, ${c.worldBox.center.z.toFixed(4)}]`);
  console.log('');
}
