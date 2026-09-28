const fs = require('fs');
const items = JSON.parse(fs.readFileSync('scratch/model_inventory.json', 'utf8'));

const keywords = ['plinth', 'caster', 'wheel', 'leachate', 'battery', 'cartridge', 'drawer', 'manure', 'drain'];
const matches = items.filter(i => keywords.some(k => i.name.toLowerCase().includes(k)));

console.log(`Found ${matches.length} matching items:`);
matches.forEach(m => console.log(` - [${m.type}] ${m.name} (parent: ${m.parentName}) pos: [${m.posLocal}] size: [${m.worldSize}]`));
