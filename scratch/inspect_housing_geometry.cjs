const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scratch/cad_mechanical_audit.json', 'utf8'));
const housing = data.components['Main_Housing'];

console.log('Main_Housing Overview:');
console.log(`  Vertices: ${housing.vertexCount}, Faces: ${housing.faceCount}`);
console.log(`  World Bounds: X[${housing.worldBox.min.x}, ${housing.worldBox.max.x}], Y[${housing.worldBox.min.y}, ${housing.worldBox.max.y}], Z[${housing.worldBox.min.z}, ${housing.worldBox.max.z}]`);
console.log(`  World Size: [${housing.worldBox.size.x}, ${housing.worldBox.size.y}, ${housing.worldBox.size.z}]`);
