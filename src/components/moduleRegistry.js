import * as THREE from 'three';

/**
 * Authoritative Gomikin Engineering Modules definition.
 * Groups all 33 USDZ component meshes into 7 functional, inspectable sub-assemblies.
 */
export const GOMIKIN_MODULES = [
  {
    id: 'input',
    name: 'Input & Intake Module',
    shortName: 'Input',
    icon: '📥',
    color: '#00ffcc',
    description: 'Waste intake funnel, 2-axis orientable sorting platform, optical camera, ultrasonic sensor, and status OLED display.',
    components: [
      'Funnel',
      'rotating_base',
      'display',
      'camera_module',
      'ultrasonic_sensor',
      'servo',
      'top_closuer'
    ],
    camera: {
      position: [0.35, 1.25, 0.55],
      target: [0, 0.98, 0]
    },
    // Exploded offsets relative to assembled positions for sub-assembly dissection (meters)
    explodedOffsets: {
      Funnel: [0.0, 0.18, 0.0],
      top_closuer: [0.0, 0.12, -0.15],
      display: [-0.12, 0.08, 0.08],
      camera_module: [0.05, 0.08, 0.10],
      ultrasonic_sensor: [0.0, 0.08, 0.12],
      servo: [0.08, -0.05, 0.0],
      rotating_base: [0.0, -0.10, 0.0]
    }
  },
  {
    id: 'cutting',
    name: 'Organic Preprocessing & Cutting Module',
    shortName: 'Cutting',
    icon: '⚙️',
    color: '#38bdf8',
    description: 'High-speed top drive motor, cross mounting braces, rotary shear cutting blades, and 8 mm sizing mesh.',
    components: [
      'cutting_motor',
      'cutting_motor_support',
      'motor_support',
      'circular_frame',
      'cutting_blades',
      'cutting_mesh'
    ],
    camera: {
      position: [-0.45, 1.15, 0.35],
      target: [-0.12, 0.88, 0]
    },
    explodedOffsets: {
      cutting_motor: [0.0, 0.16, 0.0],
      cutting_motor_support: [0.0, 0.10, 0.0],
      motor_support: [-0.08, 0.08, 0.0],
      circular_frame: [0.0, 0.0, 0.0],
      cutting_blades: [0.0, -0.08, 0.0],
      cutting_mesh: [0.0, -0.16, 0.0]
    }
  },
  {
    id: 'storage',
    name: 'Organic Storage & Drainage Module',
    shortName: 'Storage',
    icon: '📦',
    color: '#a855f7',
    description: '180° primary biological accumulation chamber with hydrostatic moisture drainage and dual synchronized drop doors.',
    components: [
      'storage_chamber',
      'door_mechanism_left',
      'door_mechanism_right'
    ],
    camera: {
      position: [-0.55, 0.95, 0.45],
      target: [-0.12, 0.72, 0]
    },
    explodedOffsets: {
      storage_chamber: [0.0, 0.08, 0.0],
      door_mechanism_left: [0.0, -0.12, 0.12],
      door_mechanism_right: [0.0, -0.12, -0.12]
    }
  },
  {
    id: 'decomposition',
    name: 'Decomposition & Agitation Module',
    shortName: 'Decomposition',
    icon: '🌱',
    color: '#22c55e',
    description: 'Thermophilic digestion vessel, dual-helix mixing agitator, structural base, load cell, and environmental telemetry sensors.',
    components: [
      'decompostion_chamber',
      'agitator',
      'bottom_of_decomposition_section',
      'load_cell',
      'temperature_sensor',
      'moisture_sensor'
    ],
    camera: {
      position: [-0.55, 0.45, 0.40],
      target: [-0.12, 0.22, 0]
    },
    explodedOffsets: {
      decompostion_chamber: [0.0, 0.15, 0.0],
      agitator: [0.0, 0.04, 0.0],
      bottom_of_decomposition_section: [0.0, -0.08, 0.0],
      load_cell: [0.08, -0.08, 0.08],
      temperature_sensor: [0.08, -0.05, -0.08],
      moisture_sensor: [-0.08, -0.05, -0.08]
    }
  },
  {
    id: 'inorganic',
    name: 'Inorganic Storage & Segregation Module',
    shortName: 'Inorganic',
    icon: '🥫',
    color: '#06b6d4',
    description: 'Dedicated dry recyclables vertical shaft, central divider bulkheads, and lower sliding inorganic extraction drawer.',
    components: [
      'inorganic_output_chamber',
      'Rightside_Divider',
      'central_divider'
    ],
    camera: {
      position: [0.55, 0.55, 0.45],
      target: [0.12, 0.40, 0.05]
    },
    explodedOffsets: {
      inorganic_output_chamber: [0.15, -0.05, 0.12],
      Rightside_Divider: [0.0, 0.05, -0.08],
      central_divider: [-0.10, 0.05, 0.0]
    }
  },
  {
    id: 'leftover_food',
    name: 'Leftover Cooked Food Module',
    shortName: 'Leftover Food',
    icon: '🍲',
    color: '#f59e0b',
    description: 'Front-loading food intake door, isolated quadrant chamber, dual-layer perforated tray, and slidably removable output section.',
    components: [
      'leftover_food_outpu_section',
      'leftover_food_closur'
    ],
    camera: {
      position: [0.55, 0.60, -0.35],
      target: [0.12, 0.42, -0.12]
    },
    explodedOffsets: {
      leftover_food_closur: [0.08, 0.12, -0.08],
      leftover_food_outpu_section: [0.15, -0.05, -0.12]
    }
  },
  {
    id: 'chassis_power',
    name: 'Chassis, Power & Air Handling Module',
    shortName: 'Chassis & Power',
    icon: '⚡',
    color: '#ec4899',
    description: 'Main cylindrical enclosure, lower leachate drainage plinth, LiFePO4 battery pack, master MCU, and negative-pressure carbon filter.',
    components: [
      'Main_Housing',
      'leachate_section',
      'battery_pack',
      'control_unit',
      'exhaust_fan',
      'carbon_filter'
    ],
    camera: {
      position: [0.75, 0.85, 0.95],
      target: [0, 0.51, 0]
    },
    explodedOffsets: {
      Main_Housing: [0.0, 0.22, 0.0],
      leachate_section: [0.0, -0.15, 0.0],
      battery_pack: [0.12, 0.10, -0.10],
      control_unit: [0.12, 0.08, 0.05],
      exhaust_fan: [-0.20, 0.05, 0.0],
      carbon_filter: [-0.25, 0.05, 0.0]
    }
  }
];

/**
 * Fast lookup map from component name to module id.
 */
export const COMPONENT_TO_MODULE_MAP = {};
GOMIKIN_MODULES.forEach(mod => {
  mod.components.forEach(compName => {
    COMPONENT_TO_MODULE_MAP[compName] = mod.id;
  });
});

/**
 * Retrieves module definition by ID.
 * @param {string} id
 * @returns {Object|null}
 */
export function getModuleById(id) {
  return GOMIKIN_MODULES.find(m => m.id === id) || null;
}

/**
 * Computes the collective bounding box and center of a module in world space.
 * @param {Object} moduleDef
 * @param {ComponentRegistry} registry
 * @returns {{box: THREE.Box3, center: THREE.Vector3, size: THREE.Vector3}}
 */
export function computeModuleBounds(moduleDef, registry) {
  const box = new THREE.Box3();
  let hasValid = false;

  for (const compName of moduleDef.components) {
    const mesh = registry.get(compName);
    if (mesh) {
      box.expandByObject(mesh);
      hasValid = true;
    }
  }

  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  if (hasValid) {
    box.getCenter(center);
    box.getSize(size);
  }

  return { box, center, size };
}
