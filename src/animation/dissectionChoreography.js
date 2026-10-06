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

  // 7-Row Catalogue Layout
  // Shifted upward with generous spacing to give all 33 parts room and ensure zero overlap with bottom UI
  const rowLayouts = [
    // Row 1: Sensors & Input (5 items)
    {
      groupTitle: 'Input & Sensing',
      categoryTag: 'INPUT',
      rowY: 2.85,
      spacingX: 1.90,
      components: ['Funnel', 'display', 'camera_module', 'ultrasonic_sensor', 'load_cell']
    },
    // Row 2: Sensing & Filtration (5 items)
    {
      groupTitle: 'Filtration & Monitoring',
      categoryTag: 'CUTTING',
      rowY: 1.95,
      spacingX: 1.90,
      components: ['temperature_sensor', 'moisture_sensor', 'circular_frame', 'cutting_mesh', 'cutting_blades']
    },
    // Row 3: Cutting Drive & Agitation (5 items)
    {
      groupTitle: 'Cutting & Preprocessing',
      categoryTag: 'DRIVE',
      rowY: 1.05,
      spacingX: 1.90,
      components: ['cutting_motor', 'cutting_motor_support', 'motor_support', 'agitator', 'bottom_of_decomposition_section']
    },
    // Row 4: Organic Processing Chambers & Doors (4 items)
    {
      groupTitle: 'Organic Processing',
      categoryTag: 'ORGANIC',
      rowY: 0.15,
      spacingX: 2.15,
      components: ['storage_chamber', 'decompostion_chamber', 'door_mechanism_left', 'door_mechanism_right']
    },
    // Row 5: Segregation & Output (4 items)
    {
      groupTitle: 'Segregation & Output',
      categoryTag: 'OUTPUT',
      rowY: -0.75,
      spacingX: 2.10,
      components: ['central_divider', 'Rightside_Divider', 'inorganic_output_chamber', 'leftover_food_outpu_section']
    },
    // Row 6: Closures, Air & Power (5 items)
    {
      groupTitle: 'Control & Environment',
      categoryTag: 'AIR / CTRL',
      rowY: -1.65,
      spacingX: 1.90,
      components: ['leftover_food_closur', 'top_closuer', 'exhaust_fan', 'carbon_filter', 'control_unit']
    },
    // Row 7: Battery, Motion & Enclosure Chassis (5 items)
    {
      groupTitle: 'Enclosure & Structure',
      categoryTag: 'STRUCTURE',
      rowY: -2.55,
      spacingX: 1.95,
      components: ['battery_pack', 'servo', 'rotating_base', 'Main_Housing', 'leachate_section']
    }
  ];

  // Calculate catalogue targets and pivot geometries for each component
  for (const row of rowLayouts) {
    const count = row.components.length;
    const startX = -((count - 1) * row.spacingX) / 2;

    row.components.forEach((name, idx) => {
      const entry = componentRegistry.getEntry(name);
      if (!entry) {
        console.warn(`[Choreography] Component "${name}" not found in registry.`);
        return;
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
      const targetWorldCenter = new THREE.Vector3(
        startX + idx * row.spacingX,
        row.rowY,
        0.0 // catalogue plane
      );

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
        groupTitle: row.groupTitle || 'Gomikin Component',
        categoryTag: row.categoryTag || 'PART',
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
    });
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
    const catWidth = 8.8;
    const catHeight = 6.6;
    const catCenter = new THREE.Vector3(0.0, 0.15, 0.0);

    const fov = 45.0 * (Math.PI / 180.0);
    const tanHalfFov = Math.tan(fov * 0.5);

    const distY = (catHeight * 0.5 * 1.15) / tanHalfFov;
    const distX = (catWidth * 0.5 * 1.15) / (tanHalfFov * Math.max(0.5, aspectRatio));

    const finalZ = Math.max(distY, distX, 9.6);

    return {
      position: new THREE.Vector3(catCenter.x, catCenter.y, finalZ),
      target: catCenter.clone()
    };
  }

  return {
    componentData,
    evaluateAtProgress,
    calculateCatalogueCamera,
    easeInOutCubic,
    catalogueCenter: new THREE.Vector3(0.0, 0.15, 0.0),
    cameraAssembled: {
      position: new THREE.Vector3(0.95, 1.15, 1.55),
      target: new THREE.Vector3(0, 0.51, 0)
    },
    cameraCatalogue: calculateCatalogueCamera(typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9)
  };
}
