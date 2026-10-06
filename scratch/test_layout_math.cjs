const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('scratch/component_registry_results.json'));

const compMap = new Map();
raw.results.forEach(r => {
  // convert mm to meters
  compMap.set(r.name, {
    name: r.name,
    // in world space (meters)
    size: {
      x: r.boxDimensions[0] / 1000,
      y: r.boxDimensions[2] / 1000, // Z in local is Y in world!
      z: r.boxDimensions[1] / 1000  // Y in local is Z in world!
    },
    localCenter: {
      x: r.boxCenter[0],
      y: r.boxCenter[1],
      z: r.boxCenter[2]
    }
  });
});

// Let's test a structured 6-row catalogue layout
const layoutDef = [
  // Row 0: Top - Input & Sensing (7 items)
  {
    rowY: 2.2,
    items: [
      { name: 'Funnel', rot: [0.35, 0, 0] },
      { name: 'display', rot: [0.3, 0, 0] },
      { name: 'camera_module', rot: [0.2, 0, 0] },
      { name: 'ultrasonic_sensor', rot: [0.2, 0, 0] },
      { name: 'load_cell', rot: [0.3, 0, 0] },
      { name: 'temperature_sensor', rot: [0.3, 0, 0] },
      { name: 'moisture_sensor', rot: [0.3, 0, 0] }
    ]
  },
  // Row 1: Cutting / Preprocessing (6 items)
  {
    rowY: 1.35,
    items: [
      { name: 'circular_frame', rot: [0.3, 0, 0] },
      { name: 'cutting_mesh', rot: [0.45, 0, 0] },
      { name: 'cutting_blades', rot: [0.45, 0, 0] },
      { name: 'cutting_motor', rot: [0.2, 0, 0] },
      { name: 'cutting_motor_support', rot: [0.2, 0, 0] },
      { name: 'motor_support', rot: [0.2, 0, 0] }
    ]
  },
  // Row 2: Organic Processing (6 items)
  {
    rowY: 0.5,
    items: [
      { name: 'storage_chamber', rot: [0, 0.2, 0] },
      { name: 'decompostion_chamber', rot: [0, -0.2, 0] },
      { name: 'bottom_of_decomposition_section', rot: [0.3, 0, 0] },
      { name: 'agitator', rot: [0.4, 0, 0] },
      { name: 'door_mechanism_left', rot: [0.35, 0, 0] },
      { name: 'door_mechanism_right', rot: [0.35, 0, 0] }
    ]
  },
  // Row 3: Segregation / Output (6 items)
  {
    rowY: -0.35,
    items: [
      { name: 'central_divider', rot: [0, 0.3, 0] },
      { name: 'Rightside_Divider', rot: [0, 0.3, 0] },
      { name: 'inorganic_output_chamber', rot: [0, 0.2, 0] },
      { name: 'leftover_food_outpu_section', rot: [0, -0.2, 0] },
      { name: 'leftover_food_closur', rot: [0.3, 0, 0] },
      { name: 'top_closuer', rot: [0.3, 0, 0] }
    ]
  },
  // Row 4: Control, Power & Air (6 items)
  {
    rowY: -1.2,
    items: [
      { name: 'control_unit', rot: [0.3, 0, 0] },
      { name: 'battery_pack', rot: [0.3, 0, 0] },
      { name: 'servo', rot: [0.2, 0, 0] },
      { name: 'rotating_base', rot: [0.4, 0, 0] },
      { name: 'exhaust_fan', rot: [0.2, 0, 0] },
      { name: 'carbon_filter', rot: [0.2, 0, 0] }
    ]
  },
  // Row 5: Structure (2 items)
  {
    rowY: -2.1,
    items: [
      { name: 'Main_Housing', rot: [0, -0.4, 0] },
      { name: 'leachate_section', rot: [0.35, 0, 0] }
    ]
  }
];

// Position items within their rows and check bounds
const placedItems = [];
layoutDef.forEach(row => {
  const count = row.items.length;
  // Compute X spread
  const spacingX = count === 2 ? 1.4 : count === 7 ? 0.65 : 0.75;
  const startX = -((count - 1) * spacingX) / 2;

  row.items.forEach((it, idx) => {
    const comp = compMap.get(it.name);
    const x = startX + idx * spacingX;
    const y = row.rowY;
    const z = 0; // catalogue plane

    placedItems.push({
      name: it.name,
      worldPos: { x, y, z },
      size: comp.size,
      rot: it.rot,
      minX: x - comp.size.x / 2,
      maxX: x + comp.size.x / 2,
      minY: y - comp.size.y / 2,
      maxY: y + comp.size.y / 2
    });
  });
});

console.log('Total placed items:', placedItems.length);

// Check for collisions / overlaps
let overlapCount = 0;
for (let i = 0; i < placedItems.length; i++) {
  for (let j = i + 1; j < placedItems.length; j++) {
    const a = placedItems[i];
    const b = placedItems[j];
    // Check 2D bounding box overlap in X-Y plane
    const overlapX = a.minX < b.maxX && a.maxX > b.minX;
    const overlapY = a.minY < b.maxY && a.maxY > b.minY;
    if (overlapX && overlapY) {
      console.log(`OVERLAP DETECTED between ${a.name} and ${b.name}`);
      overlapCount++;
    }
  }
}

console.log('Overlap count:', overlapCount);

// Measure overall catalogue bounds
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
placedItems.forEach(p => {
  minX = Math.min(minX, p.minX);
  maxX = Math.max(maxX, p.maxX);
  minY = Math.min(minY, p.minY);
  maxY = Math.max(maxY, p.maxY);
});

console.log(`Catalogue extents: Width = ${(maxX - minX).toFixed(2)}m (X: ${minX.toFixed(2)} to ${maxX.toFixed(2)})`);
console.log(`Catalogue extents: Height = ${(maxY - minY).toFixed(2)}m (Y: ${minY.toFixed(2)} to ${maxY.toFixed(2)})`);
