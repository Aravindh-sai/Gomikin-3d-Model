import * as THREE from 'three';

/**
 * Clean human-readable display names for all 33 components.
 */
export const COMPONENT_DISPLAY_NAMES = {
  Funnel: 'Receiving Funnel',
  Main_Housing: 'Main Housing',
  Rightside_Divider: 'Rightside Divider',
  central_divider: 'Central Divider',
  storage_chamber: 'Storage Chamber',
  decompostion_chamber: 'Decomposition Chamber',
  leachate_section: 'Leachate Base',
  inorganic_output_chamber: 'Inorganic Chamber',
  leftover_food_outpu_section: 'Food Output Section',
  door_mechanism_left: 'Drop Door (Left)',
  door_mechanism_right: 'Drop Door (Right)',
  cutting_blades: 'Cutting Blades',
  cutting_motor: 'Cutting Motor',
  cutting_mesh: 'Filtration Mesh',
  circular_frame: 'Circular Frame',
  agitator: 'Organic Agitator',
  exhaust_fan: 'Exhaust Fan',
  carbon_filter: 'Carbon Filter',
  servo: 'Sorting Servo',
  battery_pack: 'Battery Pack',
  control_unit: 'Control Unit',
  camera_module: 'Camera Module',
  ultrasonic_sensor: 'Ultrasonic Sensor',
  temperature_sensor: 'Temperature Sensor',
  moisture_sensor: 'Moisture Sensor',
  load_cell: 'Load Cell',
  motor_support: 'Motor Support (Aux)',
  cutting_motor_support: 'Motor Cross Support',
  top_closuer: 'Top Closure',
  leftover_food_closur: 'Food Closure',
  bottom_of_decomposition_section: 'Decomposition Base',
  rotating_base: 'Rotating Base',
  display: 'OLED Display'
};

/**
 * Phase 1 Exploded Offsets (meters in world space [X, Y, Z]).
 * Explodes components outward in 3D: housing pulls back to reveal internal mechanisms.
 */
const EXPLODED_WORLD_OFFSETS = {
  Funnel: [0.0, 0.55, 0.0],
  display: [0.0, 0.42, 0.35],
  camera_module: [0.06, 0.38, 0.30],
  ultrasonic_sensor: [0.22, 0.38, 0.22],
  load_cell: [-0.22, 0.38, 0.22],
  top_closuer: [0.0, 0.42, -0.15],
  temperature_sensor: [0.28, 0.26, 0.18],
  moisture_sensor: [-0.28, 0.26, 0.18],
  circular_frame: [0.0, 0.28, 0.0],
  cutting_mesh: [0.0, 0.20, 0.0],
  cutting_blades: [0.0, 0.12, 0.0],
  cutting_motor: [0.45, 0.22, 0.15],
  cutting_motor_support: [0.32, 0.18, 0.12],
  motor_support: [-0.32, 0.18, 0.12],
  door_mechanism_left: [-0.45, 0.08, 0.12],
  door_mechanism_right: [0.45, 0.08, 0.12],
  agitator: [0.0, 0.05, 0.0],
  bottom_of_decomposition_section: [0.0, -0.06, 0.0],
  storage_chamber: [-0.45, -0.08, 0.0],
  decompostion_chamber: [0.45, -0.08, 0.0],
  central_divider: [0.0, -0.12, 0.20],
  Rightside_Divider: [0.32, -0.15, 0.15],
  inorganic_output_chamber: [0.45, -0.28, 0.10],
  leftover_food_outpu_section: [-0.45, -0.28, 0.10],
  leftover_food_closur: [-0.35, -0.25, 0.35],
  exhaust_fan: [-0.15, -0.20, -0.45],
  carbon_filter: [0.15, -0.20, -0.50],
  control_unit: [0.0, -0.28, 0.42],
  battery_pack: [-0.35, -0.42, 0.10],
  servo: [0.35, -0.42, 0.10],
  rotating_base: [0.0, -0.50, 0.0],
  Main_Housing: [0.0, -0.20, -0.70],
  leachate_section: [0.0, -0.65, 0.0]
};

/**
 * Catalogue presentation rotations (radians [rx, ry, rz]).
 * Angled to present optimal 3D isometric profiles and prevent edge-on flatness.
 */
const PRESENTATION_ROTATIONS = {
  Funnel: [0.85, -0.45, 0.2],
  display: [0.25, 0.0, 0.0],
  camera_module: [0.25, 0.35, 0.0],
  ultrasonic_sensor: [0.20, -0.25, 0.0],
  load_cell: [0.35, 0.25, 0.0],
  top_closuer: [0.50, -0.25, 0.0],
  temperature_sensor: [0.20, 0.30, 0.0],
  moisture_sensor: [0.25, -0.35, 0.1],
  circular_frame: [0.65, 0.15, 0.0],
  cutting_mesh: [0.65, 0.15, 0.0],
  cutting_blades: [0.60, 0.35, 0.0],
  cutting_motor: [0.25, -0.40, 0.0],
  cutting_motor_support: [0.25, 0.25, 0.0],
  motor_support: [0.25, -0.25, 0.0],
  door_mechanism_left: [0.35, 0.40, 0.0],
  door_mechanism_right: [0.35, -0.40, 0.0],
  agitator: [0.55, 0.45, 0.0],
  bottom_of_decomposition_section: [0.65, 0.0, 0.0],
  storage_chamber: [0.25, 0.30, 0.0],
  decompostion_chamber: [0.25, -0.30, 0.0],
  central_divider: [0.30, 0.40, 0.0],
  Rightside_Divider: [0.30, -0.40, 0.0],
  leftover_food_closur: [0.40, 0.30, 0.0],
  leftover_food_outpu_section: [0.25, 0.30, 0.0],
  inorganic_output_chamber: [0.25, -0.30, 0.0],
  exhaust_fan: [0.20, -0.35, 0.0],
  carbon_filter: [0.30, 0.35, 0.0],
  control_unit: [0.30, 0.15, 0.0],
  battery_pack: [0.35, -0.30, 0.0],
  servo: [0.35, 0.30, 0.0],
  rotating_base: [0.65, 0.0, 0.0],
  Main_Housing: [0.20, -0.35, 0.0],
  leachate_section: [0.60, 0.15, 0.0]
};

/**
 * Builds the complete Gomikin Dissection choreography.
 *
 * @param {ComponentRegistry} componentRegistry
 * @returns {Object} Choreography engine with evaluateAtProgress method
 */
export function buildDissectionChoreography(componentRegistry) {
  const componentData = new Map();

  // 7 Functional Modular Pods directly matching GOMIKIN_MODULES
  // Distinct spatial pods with generous boundary gaps between modules
  const modulePods = [
    // Pod 1: Input & Intake Module (7 parts)
    {
      id: 'input',
      title: 'Input & Intake Module',
      icon: '📥',
      categoryTag: 'INPUT',
      color: '#00ffcc',
      headerWorldPos: new THREE.Vector3(0.0, 4.45, 0.0),
      components: [
        { name: 'Funnel', pos: new THREE.Vector3(-4.95, 3.60, 0.0) },
        { name: 'rotating_base', pos: new THREE.Vector3(-3.30, 3.60, 0.0) },
        { name: 'display', pos: new THREE.Vector3(-1.65, 3.60, 0.0) },
        { name: 'camera_module', pos: new THREE.Vector3(0.0, 3.60, 0.0) },
        { name: 'ultrasonic_sensor', pos: new THREE.Vector3(1.65, 3.60, 0.0) },
        { name: 'servo', pos: new THREE.Vector3(3.30, 3.60, 0.0) },
        { name: 'top_closuer', pos: new THREE.Vector3(4.95, 3.60, 0.0) }
      ]
    },
    // Pod 2: Organic Preprocessing & Cutting Module (6 parts)
    {
      id: 'cutting',
      title: 'Organic Preprocessing & Cutting Module',
      icon: '⚙️',
      categoryTag: 'CUTTING',
      color: '#38bdf8',
      headerWorldPos: new THREE.Vector3(0.0, 2.65, 0.0),
      components: [
        { name: 'cutting_motor', pos: new THREE.Vector3(-4.25, 1.80, 0.0) },
        { name: 'cutting_motor_support', pos: new THREE.Vector3(-2.55, 1.80, 0.0) },
        { name: 'motor_support', pos: new THREE.Vector3(-0.85, 1.80, 0.0) },
        { name: 'circular_frame', pos: new THREE.Vector3(0.85, 1.80, 0.0) },
        { name: 'cutting_mesh', pos: new THREE.Vector3(2.55, 1.80, 0.0) },
        { name: 'cutting_blades', pos: new THREE.Vector3(4.25, 1.80, 0.0) }
      ]
    },
    // Pod 3: Organic Storage & Drainage Module (Left Cluster, 3 parts)
    {
      id: 'storage',
      title: 'Organic Storage Module',
      icon: '📦',
      categoryTag: 'STORAGE',
      color: '#a855f7',
      headerWorldPos: new THREE.Vector3(-3.50, 0.85, 0.0),
      components: [
        { name: 'storage_chamber', pos: new THREE.Vector3(-5.10, 0.00, 0.0) },
        { name: 'door_mechanism_left', pos: new THREE.Vector3(-3.50, 0.00, 0.0) },
        { name: 'door_mechanism_right', pos: new THREE.Vector3(-1.90, 0.00, 0.0) }
      ]
    },
    // Pod 4: Leftover Cooked Food Module (Center Cluster, 2 parts - distinct gap from storage and inorganic)
    {
      id: 'leftover_food',
      title: 'Cooked Food Module',
      icon: '🍲',
      categoryTag: 'FOOD',
      color: '#f59e0b',
      headerWorldPos: new THREE.Vector3(0.0, 0.85, 0.0),
      components: [
        { name: 'leftover_food_outpu_section', pos: new THREE.Vector3(-0.85, 0.00, 0.0) },
        { name: 'leftover_food_closur', pos: new THREE.Vector3(0.85, 0.00, 0.0) }
      ]
    },
    // Pod 5: Inorganic Segregation & Recycling Module (Right Cluster, 3 parts - distinct gap from food)
    {
      id: 'inorganic',
      title: 'Inorganic Recyclables',
      icon: '🥫',
      categoryTag: 'INORGANIC',
      color: '#06b6d4',
      headerWorldPos: new THREE.Vector3(3.50, 0.85, 0.0),
      components: [
        { name: 'inorganic_output_chamber', pos: new THREE.Vector3(1.90, 0.00, 0.0) },
        { name: 'Rightside_Divider', pos: new THREE.Vector3(3.50, 0.00, 0.0) },
        { name: 'central_divider', pos: new THREE.Vector3(5.10, 0.00, 0.0) }
      ]
    },
    // Pod 6: Decomposition & Agitation Module (6 parts)
    {
      id: 'decomposition',
      title: 'Decomposition & Agitation Module',
      icon: '🌱',
      categoryTag: 'DECOMP',
      color: '#22c55e',
      headerWorldPos: new THREE.Vector3(0.0, -0.95, 0.0),
      components: [
        { name: 'decompostion_chamber', pos: new THREE.Vector3(-4.25, -1.80, 0.0) },
        { name: 'agitator', pos: new THREE.Vector3(-2.55, -1.80, 0.0) },
        { name: 'bottom_of_decomposition_section', pos: new THREE.Vector3(-0.85, -1.80, 0.0) },
        { name: 'load_cell', pos: new THREE.Vector3(0.85, -1.80, 0.0) },
        { name: 'temperature_sensor', pos: new THREE.Vector3(2.55, -1.80, 0.0) },
        { name: 'moisture_sensor', pos: new THREE.Vector3(4.25, -1.80, 0.0) }
      ]
    },
    // Pod 7: Chassis, Power & Air Handling Module (6 parts)
    {
      id: 'chassis_power',
      title: 'Chassis, Power & Air Handling',
      icon: '⚡',
      categoryTag: 'CHASSIS',
      color: '#ec4899',
      headerWorldPos: new THREE.Vector3(0.0, -2.75, 0.0),
      components: [
        { name: 'Main_Housing', pos: new THREE.Vector3(-4.25, -3.60, 0.0) },
        { name: 'leachate_section', pos: new THREE.Vector3(-2.55, -3.60, 0.0) },
        { name: 'battery_pack', pos: new THREE.Vector3(-0.85, -3.60, 0.0) },
        { name: 'control_unit', pos: new THREE.Vector3(0.85, -3.60, 0.0) },
        { name: 'exhaust_fan', pos: new THREE.Vector3(2.55, -3.60, 0.0) },
        { name: 'carbon_filter', pos: new THREE.Vector3(4.25, -3.60, 0.0) }
      ]
    }
  ];

  // Calculate catalogue targets and pivot geometries for each component
  for (const pod of modulePods) {
    for (const compDef of pod.components) {
      const name = compDef.name;
      const entry = componentRegistry.getEntry(name);
      if (!entry) {
        console.warn(`[Choreography] Component "${name}" not found in registry.`);
        continue;
      }

      // Initial center in world space (meters)
      const initialWorldCenter = new THREE.Vector3(
        entry.center.x * 0.001,
        entry.center.z * 0.001,
        -entry.center.y * 0.001
      );

      // Dimensions in world space (meters)
      const worldDimensions = new THREE.Vector3(
        entry.size.x * 0.001,
        entry.size.z * 0.001,
        entry.size.y * 0.001
      );

      // Target world position in catalogue grid (meters)
      const targetWorldCenter = compDef.pos.clone();

      // Geometry center relative to mesh origin (in mesh local units)
      // Since entry.center is in parent space where mesh.scale is entry.initialScale:
      const geomCenter = new THREE.Vector3(
        entry.center.x / Math.max(0.0001, entry.initialScale.x),
        entry.center.y / Math.max(0.0001, entry.initialScale.y),
        entry.center.z / Math.max(0.0001, entry.initialScale.z)
      );

      // Exploded world center (Phase 1)
      const expOffset = EXPLODED_WORLD_OFFSETS[name] || [0, 0, 0];
      const explodedWorldCenter = new THREE.Vector3(
        initialWorldCenter.x + expOffset[0],
        initialWorldCenter.y + expOffset[1],
        initialWorldCenter.z + expOffset[2]
      );

      // Presentation rotation
      const rot = PRESENTATION_ROTATIONS[name] || [0, 0, 0];
      const presentationRotation = new THREE.Euler(rot[0], rot[1], rot[2]);

      // Balanced presentation scale multiplier for catalogue view:
      // Normalizes visual diameter of ALL 33 components to ~0.50m.
      // Small components (sensors, servo, motor support) scale up cleanly (up to 55x);
      // Large components (housing, dividers) scale down gracefully (to ~0.52x) so everything fits with perfection.
      const maxDim = Math.max(worldDimensions.x, worldDimensions.y, worldDimensions.z);
      const catalogueScaleMultiplier = THREE.MathUtils.clamp(0.52 / Math.max(0.008, maxDim), 0.52, 55.0);

      componentData.set(name, {
        name,
        displayName: COMPONENT_DISPLAY_NAMES[name] || name.replace(/_/g, ' '),
        moduleId: pod.id,
        groupTitle: pod.title,
        categoryTag: pod.categoryTag,
        moduleColor: pod.color,
        mesh: entry.mesh,
        initialPosition: entry.initialPosition.clone(),
        initialRotation: entry.initialRotation.clone(),
        initialScale: entry.initialScale.clone(),
        initialWorldCenter,
        worldDimensions,
        targetWorldCenter,
        explodedWorldCenter,
        geomCenter,
        presentationRotation,
        catalogueScaleMultiplier
      });
    }
  }

  // Smooth easing helper
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  /**
   * Evaluates the complete choreography at normalized progress [0.0, 1.0].
   * Phase 1 (0.0 -> 0.45): Cinematic disassembly into floating 3D exploded positions.
   * Phase 2 (0.45 -> 0.55): Dramatic pause / showcase hold in 3D space.
   * Phase 3 (0.55 -> 1.00): Smooth glide into 3D catalogue grid with presentation scaling.
   *
   * @param {number} progress Normalized progress [0.0, 1.0]
   * @returns {Map<string, { positionOffset: THREE.Vector3, rotationChange: THREE.Euler, scale: THREE.Vector3 }>}
   */
  function evaluateAtProgress(progress) {
    const p = Math.max(0, Math.min(1, progress));
    const outputMap = new Map();

    if (p <= 0.0) {
      // Pristine assembled state: exactly 0 offset, 0 rotation, and initialScale
      for (const [name, comp] of componentData.entries()) {
        outputMap.set(name, {
          positionOffset: new THREE.Vector3(0, 0, 0),
          rotationChange: new THREE.Euler(0, 0, 0),
          scale: comp.initialScale.clone()
        });
      }
      return outputMap;
    }

    for (const [name, comp] of componentData.entries()) {
      let targetWorld = new THREE.Vector3();
      let rotEuler = new THREE.Euler(0, 0, 0);
      let scaleMult = 1.0;

      if (p <= 0.45) {
        // Phase 1: Disassembly (0.0 -> 0.45)
        const t1 = easeInOutCubic(p / 0.45);
        targetWorld.lerpVectors(comp.initialWorldCenter, comp.explodedWorldCenter, t1);

        rotEuler.set(
          comp.presentationRotation.x * 0.20 * t1,
          comp.presentationRotation.y * 0.20 * t1,
          comp.presentationRotation.z * 0.20 * t1
        );
        scaleMult = 1.0;
      } else if (p <= 0.55) {
        // Phase 2: Dramatic Hold (0.45 -> 0.55)
        targetWorld.copy(comp.explodedWorldCenter);
        rotEuler.set(
          comp.presentationRotation.x * 0.20,
          comp.presentationRotation.y * 0.20,
          comp.presentationRotation.z * 0.20
        );
        scaleMult = 1.0;
      } else {
        // Phase 3: Catalogue Glide & Presentation (0.55 -> 1.00)
        const t2 = easeInOutCubic((p - 0.55) / 0.45);
        targetWorld.lerpVectors(comp.explodedWorldCenter, comp.targetWorldCenter, t2);

        rotEuler.set(
          THREE.MathUtils.lerp(comp.presentationRotation.x * 0.20, comp.presentationRotation.x, t2),
          THREE.MathUtils.lerp(comp.presentationRotation.y * 0.20, comp.presentationRotation.y, t2),
          THREE.MathUtils.lerp(comp.presentationRotation.z * 0.20, comp.presentationRotation.z, t2)
        );

        scaleMult = THREE.MathUtils.lerp(1.0, comp.catalogueScaleMultiplier, t2);
      }

      // Convert target world position to local coordinates inside Fusion360_USDZ_Model:
      // Local X = World X * 1000
      // Local Y = -World Z * 1000
      // Local Z = World Y * 1000
      const targetLocalCenter = new THREE.Vector3(
        targetWorld.x * 1000,
        -targetWorld.z * 1000,
        targetWorld.y * 1000
      );

      // Current scale vector
      const currentScale = new THREE.Vector3().copy(comp.initialScale).multiplyScalar(scaleMult);

      // Pivot-offset correction: ensures geometric center is exactly at targetLocalCenter
      const q = new THREE.Quaternion().setFromEuler(rotEuler);
      const scaledOffset = new THREE.Vector3().copy(comp.geomCenter).multiply(currentScale).applyQuaternion(q);
      const meshPos = new THREE.Vector3().subVectors(targetLocalCenter, scaledOffset);

      // Position offset relative to initial position
      const posOffset = new THREE.Vector3().subVectors(meshPos, comp.initialPosition);

      outputMap.set(name, {
        positionOffset: posOffset,
        rotationChange: rotEuler,
        scale: currentScale
      });
    }

    return outputMap;
  }

  function calculateCatalogueCamera(aspectRatio = 16 / 9) {
    const catWidth = 11.6;
    const catHeight = 9.4;
    const catCenter = new THREE.Vector3(0.0, 0.0, 0.0);

    const fov = 45.0 * (Math.PI / 180.0);
    const tanHalfFov = Math.tan(fov * 0.5);

    const distY = (catHeight * 0.5 * 1.15) / tanHalfFov;
    const distX = (catWidth * 0.5 * 1.15) / (tanHalfFov * Math.max(0.5, aspectRatio));

    const finalZ = Math.max(distY, distX, 13.0);

    return {
      position: new THREE.Vector3(catCenter.x, catCenter.y, finalZ),
      target: catCenter.clone()
    };
  }

  return {
    modulePods,
    componentData,
    evaluateAtProgress,
    calculateCatalogueCamera,
    easeInOutCubic,
    catalogueCenter: new THREE.Vector3(0.0, 0.45, 0.0),
    cameraAssembled: {
      position: new THREE.Vector3(0.95, 1.15, 1.55),
      target: new THREE.Vector3(0, 0.51, 0)
    },
    cameraCatalogue: calculateCatalogueCamera(typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9)
  };
}
