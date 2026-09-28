const fs = require('fs');

const items = JSON.parse(fs.readFileSync('scratch/model_inventory.json', 'utf8'));

console.log('--- ALL OBJECTS IN OrganicChambers ---');
const orgItems = items.filter(i => {
  let p = i;
  while (p && p.parentName) {
    if (p.parentName === 'OrganicChambers') return true;
    p = items.find(x => x.name === p.parentName);
  }
  return false;
});

orgItems.forEach(i => {
  if (i.type === 'Mesh' || i.name.includes('Pivot') || i.name.includes('Hinge') || i.name.includes('Assembly') || i.name.includes('Shaft') || i.name.includes('Door') || i.name.includes('Agitator') || i.name.includes('Fan')) {
    console.log(`[${i.type}] ${i.name} (parent: ${i.parentName}) posLocal: [${i.posLocal.map(v=>Number(v.toFixed(3)))}] worldCenter: [${i.worldCenter.map(v=>Number(v.toFixed(3)))}] worldSize: [${i.worldSize.map(v=>Number(v.toFixed(3)))}]`);
  }
});
