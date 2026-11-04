import * as THREE from 'three';

/**
 * Gomikin Official Brand Design System Color Tokens
 */
export const GOMIKIN_TOKENS = Object.freeze({
  IVORY: '#F2EFE6',      // Primary highlights & typography
  GRAPHITE: '#343B36',   // Primary architectural dark tone
  CHAMPAGNE: '#B99A63',  // Refined metallic accent
  SAGE: '#A5AA91',       // Engineering & technical label tone
  SAND: '#D8C7A5',       // Warm neutral parameter readout
  STEEL_POLISHED: '#D0D6DC',
  STEEL_BRUSHED: '#B8C0C6',
  STEEL_INDUSTRIAL: '#8E9692',
  FRAME_DARK: '#2B312D',
  BASE_MUTED_GRAPHITE: '#383F3B',
  DOOR_CONTRAST: '#3C433E',
  ELECTRONICS_MATTE: '#1E2320',
  RUBBER_DARK: '#181C19',
  DISPLAY_GLASS: '#0A0E0C'
});

/**
 * Creates physically based PBR materials adhering to Gomikin industrial design guidelines.
 */
export function createGomikinPBRMaterials() {
  return {
    // 1. Main Cylindrical Enclosure: Refined Graphite dark neutral metal
    mainEnclosure: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_MainEnclosure',
      color: new THREE.Color(GOMIKIN_TOKENS.GRAPHITE),
      roughness: 0.42,
      metalness: 0.35,
      envMapIntensity: 1.0
    }),

    // 2. Structural Frame: Dark graphite structural metal
    structuralFrame: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_StructuralFrame',
      color: new THREE.Color(GOMIKIN_TOKENS.FRAME_DARK),
      roughness: 0.52,
      metalness: 0.32,
      envMapIntensity: 0.8
    }),

    // 3. Access Doors & Closures: Graphite with subtle material contrast
    accessDoors: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_AccessDoors',
      color: new THREE.Color(GOMIKIN_TOKENS.DOOR_CONTRAST),
      roughness: 0.38,
      metalness: 0.45,
      envMapIntensity: 1.1
    }),

    // Top Closure Lid (refined dark graphite / satin finish, replaces beige Warm Stone)
    topClosure: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_TopClosure',
      color: new THREE.Color('#323834'),
      roughness: 0.40,
      metalness: 0.38,
      envMapIntensity: 1.0
    }),

    // 4. Cutting Blades: High-grade polished/brushed tool steel
    cuttingBlades: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_CuttingBlades',
      color: new THREE.Color(GOMIKIN_TOKENS.STEEL_POLISHED),
      roughness: 0.20,
      metalness: 0.88,
      envMapIntensity: 1.3
    }),

    // Intake Funnel & Shear Screen: Precision brushed stainless steel
    brushedSteel: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_BrushedSteel',
      color: new THREE.Color(GOMIKIN_TOKENS.STEEL_BRUSHED),
      roughness: 0.28,
      metalness: 0.80,
      envMapIntensity: 1.2
    }),

    // 5. Segregator Base: Muted metallic graphite (replaces bright shiny gold)
    segregatorBase: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_SegregatorBase',
      color: new THREE.Color(GOMIKIN_TOKENS.BASE_MUTED_GRAPHITE),
      roughness: 0.32,
      metalness: 0.65,
      envMapIntensity: 1.1
    }),

    // 6. Internal Processing Components: Restrained steel and sage accents
    internalChambers: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_InternalChambers',
      color: new THREE.Color(GOMIKIN_TOKENS.STEEL_INDUSTRIAL),
      roughness: 0.36,
      metalness: 0.58,
      envMapIntensity: 0.9
    }),

    // Decomposition & biological recovery section (subtle sage-tinted industrial alloy)
    decompositionChamber: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_DecompChamber',
      color: new THREE.Color('#858E88'),
      roughness: 0.34,
      metalness: 0.55,
      envMapIntensity: 0.95
    }),

    // Leachate & drainage lower section
    leachateSection: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_LeachateSection',
      color: new THREE.Color('#2C322E'),
      roughness: 0.46,
      metalness: 0.35,
      envMapIntensity: 0.8
    }),

    // 7. Precision Electronics & Sensors: Technical dark composite
    electronicsMatte: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_Electronics',
      color: new THREE.Color(GOMIKIN_TOKENS.ELECTRONICS_MATTE),
      roughness: 0.48,
      metalness: 0.22,
      envMapIntensity: 0.7
    }),

    // 8. Technical Rubber & Filters: Matte black vulcanized polymer
    rubberComponents: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_Rubber',
      color: new THREE.Color(GOMIKIN_TOKENS.RUBBER_DARK),
      roughness: 0.72,
      metalness: 0.05,
      envMapIntensity: 0.5
    }),

    // 9. Display Glass: Deep gloss optical panel
    displayGlass: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_DisplayGlass',
      color: new THREE.Color(GOMIKIN_TOKENS.DISPLAY_GLASS),
      roughness: 0.12,
      metalness: 0.75,
      envMapIntensity: 1.4
    }),

    // 10. Selected Brand-Identifying Trim: Champagne metallic accent
    champagneTrim: new THREE.MeshStandardMaterial({
      name: 'GOMIKIN_PBR_ChampagneTrim',
      color: new THREE.Color(GOMIKIN_TOKENS.CHAMPAGNE),
      roughness: 0.26,
      metalness: 0.78,
      envMapIntensity: 1.25
    })
  };
}

/**
 * Maps each of the 33 genuine CAD components in Gomikin to its refined PBR material.
 * Preserves mesh geometry, hierarchy, pivots, and userData intact.
 * 
 * @param {THREE.Object3D} rootModel The loaded GLB root scene
 */
export function applyGomikinPBRMaterials(rootModel) {
  if (!rootModel) return;

  const mats = createGomikinPBRMaterials();

  // Explicit mesh-to-material mapping table
  const meshMaterialMap = {
    // Outer Enclosure & Access
    Main_Housing: mats.mainEnclosure,
    leftover_food_closur: mats.accessDoors,
    top_closuer: mats.topClosure,
    door_mechanism_left: mats.accessDoors,
    door_mechanism_right: mats.accessDoors,

    // Structural Frame & Dividers
    circular_frame: mats.structuralFrame,
    central_divider: mats.structuralFrame,
    Rightside_Divider: mats.structuralFrame,
    cutting_motor_support: mats.structuralFrame,
    motor_support: mats.structuralFrame,

    // Mechanical Core & Pivots
    rotating_base: mats.segregatorBase,
    cutting_blades: mats.cuttingBlades,
    agitator: mats.brushedSteel,
    Funnel: mats.brushedSteel,
    cutting_mesh: mats.brushedSteel,

    // Internal Processing & Storage Chambers
    decompostion_chamber: mats.decompositionChamber,
    storage_chamber: mats.internalChambers,
    inorganic_output_chamber: mats.internalChambers,
    leftover_food_outpu_section: mats.internalChambers,
    bottom_of_decomposition_section: mats.leachateSection,
    leachate_section: mats.leachateSection,

    // Sensors & Electronics
    camera_module: mats.electronicsMatte,
    control_unit: mats.electronicsMatte,
    battery_pack: mats.electronicsMatte,
    cutting_motor: mats.electronicsMatte,
    servo: mats.electronicsMatte,
    load_cell: mats.electronicsMatte,
    moisture_sensor: mats.electronicsMatte,
    temperature_sensor: mats.electronicsMatte,
    ultrasonic_sensor: mats.electronicsMatte,

    // Display & Peripheral seals
    display: mats.displayGlass,
    carbon_filter: mats.rubberComponents,
    exhaust_fan: mats.rubberComponents
  };

  let appliedCount = 0;
  rootModel.traverse((node) => {
    if (node.isMesh && node.name && meshMaterialMap[node.name]) {
      const assignedMat = meshMaterialMap[node.name];
      node.material = assignedMat;
      node.castShadow = true;
      node.receiveShadow = true;
      appliedCount++;
    }
  });

  console.log(`[GomikinMaterialSystem] Applied refined PBR engineering materials to ${appliedCount} components.`);
  return mats;
}

