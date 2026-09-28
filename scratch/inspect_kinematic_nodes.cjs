const fs = require('fs');

const items = JSON.parse(fs.readFileSync('scratch/model_inventory.json', 'utf8'));

const kinematicKeywords = ['Pivot', 'Hinge', 'Rotor', 'Shaft', 'Door', 'Agitator', 'BaseAssembly', 'AccessDoor'];
const kItems = items.filter(i => kinematicKeywords.some(k => i.name.includes(k)));

console.log('=== KINEMATIC & PIVOT NODES FOUND IN MODEL ===');
kItems.forEach(k => {
  console.log(`Node: ${k.name} | Type: ${k.type} | Parent: ${k.parentName}`);
  console.log(`  Local Pos: [${k.posLocal.map(v=>Number(v.toFixed(4)))}]`);
  console.log(`  Local Rot: [${k.rotLocal.map(v=>Number(v.toFixed(4)))}]`);
  console.log(`  World Center: [${k.worldCenter.map(v=>Number(v.toFixed(4)))}]`);
  console.log(`  World Size: [${k.worldSize.map(v=>Number(v.toFixed(4)))}]`);
  if (k.userData && Object.keys(k.userData).length > 0) {
    console.log(`  UserData: ${JSON.stringify(k.userData)}`);
  }
  console.log('---');
});
