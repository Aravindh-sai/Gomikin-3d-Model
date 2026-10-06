const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('scratch/component_registry_results.json'));

const groups = [
  {
    name: 'GROUP 1 — INPUT / SENSING',
    components: [
      'Funnel',
      'display',
      'camera_module',
      'ultrasonic_sensor',
      'load_cell',
      'temperature_sensor',
      'moisture_sensor'
    ]
  },
  {
    name: 'GROUP 2 — CUTTING / PREPROCESSING',
    components: [
      'circular_frame',
      'cutting_mesh',
      'cutting_blades',
      'cutting_motor',
      'cutting_motor_support',
      'motor_support'
    ]
  },
  {
    name: 'GROUP 3 — ORGANIC PROCESSING',
    components: [
      'storage_chamber',
      'decompostion_chamber',
      'bottom_of_decomposition_section',
      'agitator',
      'door_mechanism_left',
      'door_mechanism_right'
    ]
  },
  {
    name: 'GROUP 4 — SEGREGATION / OUTPUT',
    components: [
      'central_divider',
      'Rightside_Divider',
      'inorganic_output_chamber',
      'leftover_food_outpu_section',
      'leftover_food_closur',
      'top_closuer'
    ]
  },
  {
    name: 'GROUP 5 — AIR & ENVIRONMENT',
    components: [
      'exhaust_fan',
      'carbon_filter'
    ]
  },
  {
    name: 'GROUP 6 — CONTROL & POWER',
    components: [
      'control_unit',
      'battery_pack',
      'servo',
      'rotating_base'
    ]
  },
  {
    name: 'GROUP 7 — STRUCTURE',
    components: [
      'Main_Housing',
      'leachate_section'
    ]
  }
];

const compMap = new Map();
raw.results.forEach(r => compMap.set(r.name, r));

console.log('--- COMPONENT GROUPS & SIZES ---');
groups.forEach(g => {
  console.log(`\n${g.name} (${g.components.length} items):`);
  g.components.forEach(name => {
    const item = compMap.get(name);
    if (!item) {
      console.log('  MISSING:', name);
    } else {
      console.log(`  ${name.padEnd(32)} dims: ${item.boxDimensions.map(d => (d/1000).toFixed(3)).join(' x ')} m`);
    }
  });
});
