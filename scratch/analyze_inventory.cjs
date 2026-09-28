const fs = require('fs');

const items = JSON.parse(fs.readFileSync('scratch/model_inventory.json', 'utf8'));

// Filter out top-level or structural groups to find distinct assemblies
const topGroups = items.filter(i => i.parentName === 'GomikinEnvelope');
console.log('Top-level groups under GomikinEnvelope:');
topGroups.forEach(g => console.log(` - ${g.name} (${g.type})`));

console.log('\n--- BREAKDOWN BY GROUP ---');
for (const tg of topGroups) {
  const descendants = items.filter(i => {
    let p = i;
    while (p && p.parentName) {
      if (p.parentName === tg.name) return true;
      p = items.find(x => x.name === p.parentName);
    }
    return false;
  });
  console.log(`\n=== ${tg.name} (${descendants.length} objects) ===`);
  const named = descendants.filter(d => d.name && !d.name.startsWith('(') && d.type === 'Mesh' || d.name.includes('Pivot') || d.name.includes('Hinge') || d.name.includes('Assembly') || d.name.includes('Motor') || d.name.includes('Shaft') || d.name.includes('Blade') || d.name.includes('Door') || d.name.includes('Drawer') || d.name.includes('Basket') || d.name.includes('Tray') || d.name.includes('Agitator') || d.name.includes('Fan'));
  named.slice(0, 30).forEach(d => {
    console.log(`  * [${d.type}] ${d.name} (parent: ${d.parentName}) pos: [${d.posLocal.map(v=>Number(v.toFixed(3)))}] size: [${d.worldSize.map(v=>Number(v.toFixed(3)))}]`);
  });
}
