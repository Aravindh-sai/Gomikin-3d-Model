const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/cad_mechanical_audit.json', 'utf8'));
const { components } = data;

console.log('--- Agitator & Decomposition Floor Sensors Deep Inspection ---');
['agitator', 'bottom_of_decomposition_section', 'load_cell', 'temperature_sensor', 'moisture_sensor'].forEach(name => {
  const c = components[name];
  console.log(`${name}:`);
  console.log(`  World Bounds: X[${c.worldBox.min.x.toFixed(4)}, ${c.worldBox.max.x.toFixed(4)}], Y[${c.worldBox.min.y.toFixed(4)}, ${c.worldBox.max.y.toFixed(4)}], Z[${c.worldBox.min.z.toFixed(4)}, ${c.worldBox.max.z.toFixed(4)}]`);
  console.log(`  Center: [${c.worldBox.center.x.toFixed(4)}, ${c.worldBox.center.y.toFixed(4)}, ${c.worldBox.center.z.toFixed(4)}]`);
});
