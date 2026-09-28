/**
 * GOMIKIN MASTER PARAMETRIC SPECIFICATION
 * Authoritative Source: docs/master_geometry.md
 *
 * NOTE:
 * These are BASELINE / CHANGEABLE design parameters, NOT permanently fixed dimensions.
 * They are subject to later engineering revision.
 * Geometry must NEVER hard-code numerical dimensions; all elements must derive
 * dynamically from these named parameters.
 */

export const GOMIKIN_BASELINE_PARAMS = Object.freeze({
  // All dimensions in millimeters (mm)
  outer_diameter: 500,          // Nominal outer cylindrical shell diameter (mm)
  overall_height: 1020,         // Total ground-to-top apparatus height (mm) [increased: 900 + 120 mm]
  shell_wall_thickness: 4,      // Shell wall thickness (mm)

  input_section_height: 95,     // Top input receiving & segregation section height (mm) [Y = 925 to 1020 mm]
  middle_section_height: 825,   // Central processing & storage section height (mm) [increased: 705 + 120 mm] [Y = 100 to 925 mm]
  leachate_section_height: 100, // Bottom base plinth & leachate tray section height (mm) [Y = 0 to 100 mm]

  // Vertical Architecture Sub-Allocations (Baseline / Changeable)
  // Authoritative reference: docs/master_geometry.md Section 4 & Section 5
  organic_cutting_headroom: 10,           // Headroom between cutting mechanism and segregation mechanism base (mm) [Y = 915 to 925 mm]
  organic_cutting_height: 25,             // Cutting mechanism height envelope (mm, part of Storage Section assembly) [Y = 890 to 915 mm]
  organic_storage_height: 270,            // Storage & hydrostatic drainage chamber height (mm) [refactored: 220 + 50 mm] [Y = 620 to 890 mm]
  organic_storage_decomposition_gap: 250, // Gap between storage and decomposition chambers (mm) [increased: 130 + 120 mm for door clearance] [Y = 370 to 620 mm]
  organic_decomposition_height: 270,      // Thermophilic decomposition chamber height (mm) [refactored: 220 + 50 mm] [Y = 100 to 370 mm]
  output_drawer_start_from_middle_bottom: 380, // Output drawer start datum offset from middle bottom (mm) [480 - 100 = 380 mm]
  output_section_start_datum_y: 480,          // Architectural output-section start datum for BOTH 90° sectors (mm)

  // Input & Segregation Assembly Parameters (Baseline / Changeable)
  funnel_opening_diameter: 100,         // Funnel bottom discharge opening diameter (mm, supports 100–200 mm)
  rotating_base_elevation_offset: 10,   // Offset above Input/Middle boundary (mm), placing rotating base at Y = 810 mm
  rotating_base_length: 85,             // Peanut plate longitudinal length (mm, TBD)
  rotating_base_lobe_width: 70,         // Peanut plate outer lobe diameter (mm, TBD)
  rotating_base_waist_width: 50,        // Peanut plate center waist width (mm, TBD)
  rotating_base_thickness: 4,           // Rotating base platform plate thickness (mm, TBD)

  // Display & Sensor Parameters (TBD Baseline Dimensions)
  display_width: 72,                    // OLED display casing width (mm, TBD)
  display_height: 38,                   // OLED display casing height (mm, TBD)
  display_depth: 8,                     // OLED display casing depth (mm, TBD)
  display_tilt_deg: 25,                 // Display tilt angle upward toward standing user (deg)
  camera_width: 25,                     // Camera housing width (mm, TBD)
  camera_height: 18,                    // Camera housing height (mm, TBD)
  camera_depth: 15,                     // Camera housing depth (mm, TBD)
  camera_lens_diameter: 10,             // Camera front optical lens barrel diameter (mm, TBD)
  ultrasonic_width: 45,                 // Ultrasonic module casing width (mm, TBD)
  ultrasonic_height: 20,                // Ultrasonic module casing height (mm, TBD)
  ultrasonic_depth: 15,                 // Ultrasonic module casing depth (mm, TBD)
  ultrasonic_transducer_diameter: 14,   // Ultrasonic transducer barrel diameter (mm, TBD)

  // Non-Organic Output Envelopes Sub-Parameters (TBD Baseline Parameters)
  strainer_basket_wall_inset: 8,              // Radial/divider wall nesting inset for strainer basket (mm, TBD)
  strainer_basket_drainage_sump_height: 25,   // Height of liquid drainage collection sump beneath basket (mm, TBD)
  strainer_basket_top_lip_inset: 5,           // Top lip vertical clearance for basket (mm, TBD)
  drawer_perimeter_clearance: 1,              // Nominal perimeter clearance to prevent binding (mm, TBD)

  // Leftover Food 90° Sector Structural Refinements (Task 1 & Task 2)
  food_top_closure_y: 925,                    // Top closure elevation for Leftover Food chamber (mm, Task 1: at y_input_boundary)
  food_door_top_y: 800,                       // Top edge elevation of Leftover Food access door (mm, Task 2)
  food_door_bottom_y: 700,                    // Bottom edge / fixed hinge elevation of Leftover Food access door (mm, Task 2)
  food_door_height: 100,                      // Height of Leftover Food access door (mm, Task 2)
  food_door_arc_padding: 10,                  // Linear padding along chamber arc from left/right sector boundaries (mm, Task 2)

  // Organic Cutting Mechanism Parameters (Baseline / Changeable)
  // Authoritative reference: docs/master_geometry.md Section 5 & references/sketches/IMG_20260925_175201.jpg
  cutting_collar_diameter: 200,          // Diameter of circular cutting collar nested in 180° sector (mm, TBD)
  cutting_collar_wall_thickness: 3,      // Wall thickness of circular cutting collar (mm, TBD)
  cutting_motor_diameter: 50,            // Diameter of top-mounted inverted cutting motor body (mm, TBD)
  cutting_motor_height: 35,              // Height of top-mounted cutting motor (mm, TBD)
  cutting_shaft_diameter: 12,            // Diameter of downward rotary shaft (mm, TBD)
  cutting_rotor_span: 180,               // Tip-to-tip diameter span of 4-blade shear rotor (mm, TBD, must be < cutting_collar_diameter)
  cutting_blade_width: 14,               // Width of shear blade arm (mm, TBD)
  cutting_blade_thickness: 3,            // Thickness of shear blade arm (mm, TBD)
  cutting_blade_pitch_deg: 22,           // Aerodynamic suction pitch angle of shear blades (deg, TBD)
  cutting_hook_length: 15,               // Length of tangential hook at blade tips (mm, TBD)
  cutting_screen_aperture: 8,            // Aperture diameter of sizing screen perforations (mm, TBD)
  cutting_screen_thickness: 2,           // Thickness of horizontal sizing mesh plate (mm, TBD)
  cutting_blade_screen_clearance: 2,     // Shear clearance between blade underside and sizing screen (mm, TBD)

  // Organic Storage Fan & Odor Mitigation Subsystem Parameters (Baseline / Changeable)
  // Authoritative reference: references/sketches/IMG_20260925_175220.jpg & Version 1 doc Line 32, 36
  organic_fan_size: 70,                  // Square axial fan casing width and height (mm, TBD)
  organic_fan_depth: 20,                 // Axial fan casing thickness along flow axis (mm, TBD)
  organic_fan_bore_diameter: 62,         // Circular shroud bore / duct aperture diameter (mm, TBD)
  organic_fan_hub_diameter: 24,          // Central rotor hub diameter (mm, TBD)
  organic_fan_blade_count: 5,            // Number of impeller aerofoil fan blades (TBD)
  organic_fan_filter_diameter: 65,       // Activated carbon filter canister diameter (mm, TBD)
  organic_fan_filter_depth: 18,          // Activated carbon filter canister depth (mm, TBD)
  organic_fan_elevation: 770,            // Vertical center elevation within storage chamber Y = 620–890 mm (mm, TBD)

  // Organic Storage Dynamic Base Assembly & Double-Door Parameters (Baseline / Changeable)
  // Authoritative reference: references/sketches/IMG_20260925_175220.jpg & Version 1 doc Line 32, 34, 37
  door_thickness: 4,                     // Solid drop door leaf plate thickness (mm, MANDATED EXACTLY 4 mm)
  door_clearance: 2,                     // Perimeter clearance between door edges and chamber walls/dividers (mm, TBD)
  door_slope_angle_deg: 3,               // Downward drainage gradient angle directing fluids toward drain port (deg, TBD)
  door_central_spine_width: 16,          // Width of central structural support spine along Z = 0 (mm, TBD)
  door_central_spine_height: 14,         // Height of central structural support spine (mm, TBD)
  door_hinge_barrel_diameter: 8,         // Outer diameter of longitudinal hinge barrels along spine (mm, TBD)
  door_hinge_pin_diameter: 4,            // Hinge pivot pin diameter (mm, TBD)
  door_drainage_screen_thickness: 2,     // Perforated drainage mesh screen plate thickness (mm, TBD)
  door_drainage_screen_gap: 5,           // Hydrostatic drainage fluid clearance gap between solid doors and mesh (mm, TBD)
  door_drain_hole_diameter: 18,          // Leachate drainage outlet hole diameter (mm, TBD)
  door_vibrator_length: 35,              // Length of electro-mechanical vibration actuator cylinder (mm, TBD)
  door_vibrator_diameter: 20,            // Diameter of electro-mechanical vibration actuator cylinder (mm, TBD)

  // Organic Decomposition Chamber & Agitator Mechanism Parameters (Baseline / Changeable)
  // Authoritative reference: docs/master_geometry.md Section 10 & references/sketches/IMG_20260925_175238.jpg
  agitator_mount_diameter: 55,           // Floor-mounted bearing/motor journal base boss diameter (mm, TBD)
  agitator_mount_height: 20,             // Floor-mounted bearing boss height (mm, TBD)
  agitator_shaft_diameter: 16,           // Central vertical rotary drive shaft diameter (mm, TBD)
  agitator_shaft_height: 140,            // Central vertical drive shaft height above floor (mm, TBD)
  agitator_hub_diameter: 36,             // Central mixing paddle mounting sleeve hub diameter (mm, TBD)
  agitator_hub_height: 28,               // Central sleeve hub height (mm, TBD)
  agitator_floor_clearance: 15,          // Bottom clearance between paddle blades and chamber floor (mm, TBD)
  agitator_paddle_span: 180,             // Tip-to-tip diameter span of mixing paddle sweep (mm, TBD, must maintain wall clearance)
  agitator_paddle_width: 24,             // Chord width of horizontal mixing arm (mm, TBD)
  agitator_paddle_thickness: 4,          // Structural plate thickness of paddle arm (mm, TBD)
  agitator_paddle_pitch_deg: 20,         // Aeration/oxygenation mixing pitch angle (deg, TBD)
  agitator_tip_upright_height: 40,       // Height of upward-turned perimeter sweep paddle (mm, TBD)
  agitator_tip_upright_width: 20,        // Chord width of upward-turned perimeter sweep paddle (mm, TBD)

  // Organic Decomposition Chamber Sensory Feedback Array (Baseline / Changeable)
  // Authoritative reference: references/documentation/Version 1 feature specific document.txt (Lines 48, 50, 65, 125)
  decomp_load_cell_diameter: 50,         // Diameter of mass-sensing load cell puck beneath chamber floor (mm, TBD)
  decomp_load_cell_height: 10,           // Height of load cell puck / shear beam assembly (mm, TBD)
  decomp_temp_sensor_probe_length: 50,   // Length of core temperature probe needle extending into biomass (mm, TBD)
  decomp_temp_sensor_probe_diameter: 4,  // Diameter of stainless steel core temperature probe (mm, TBD)
  decomp_moisture_sensor_length: 35,     // Length of dual-prong biomass moisture sensor (mm, TBD)
  decomp_moisture_sensor_prong_spacing: 10,// Center-to-center spacing between capacitive prongs (mm, TBD)

  // Phase 2A: Structural Sector Architecture (Baseline / Changeable)
  sector_orientation_deg: 0,    // Rotation of primary divider plane relative to +Z front (deg, INFERRED/TBD)
  organic_sector_angle: 180,    // Organic sector angular span (deg)
  inorganic_sector_angle: 90,   // Inorganic sector angular span (deg)
  food_sector_angle: 90,        // Leftover food sector angular span (deg)
  divider_wall_thickness: 4,    // Internal structural divider wall thickness (mm)

  // Phase 3 Mechanical Architecture Parameters (Baseline / Changeable)
  // Authoritative reference: Phase 3 Architectural Decision Resolution
  segregation_hub_diameter: 38,               // Rigid support housing outer diameter at divider intersection (mm, TBD)
  segregation_hub_height: 6,                  // Rigid support housing vertical height seated on dividers at Y=925 mm (mm, leaves 1 mm running clearance to platform bottom at 932 mm)
  segregation_motor_diameter: 28,             // Generic segregation platform motor envelope diameter (mm, TBD)
  segregation_motor_height: 20,               // Generic segregation platform motor envelope height below hub (mm, TBD)
  segregation_spindle_diameter: 8,            // Vertical yaw spindle shaft diameter (mm, TBD)
  segregation_bearing_outer_dia: 19,          // Dual spindle bearing outer diameter (mm, TBD)
  segregation_bearing_height: 2.5,            // Spindle bearing sleeve height (mm, TBD)
  segregation_bracket_span: 20,               // Structural saddle bracket span along divider rims (mm, TBD)
  segregation_coupling_diameter: 14,          // Shaft coupling collar diameter (mm, TBD)
  segregation_coupling_height: 6,             // Shaft coupling collar height (mm, TBD)
  decomp_load_cell_offset_z: 90,              // Lateral offset of load-cell support pucks from Z=0 centerline (mm, clears agitator shaft)
  drawer_wall_thickness: 3,                   // Nominal wall and floor thickness of removable output drawer bins (mm, TBD)
  electronics_bay_housing_width: 130,         // Width of electronics bay housing in +X, +Z quadrant (mm, TBD)
  electronics_bay_housing_height: 85,         // Vertical height of electronics bay housing Y=925–1010 mm (mm, TBD)
  electronics_bay_housing_depth: 85,          // Depth of electronics bay housing along Z (mm, TBD)
});

// Three.js scene scale factor: 1 Three.js unit = 1 meter = 1000 mm
export const UNIT_SCALE = 0.001;

/**
 * Validates the vertical stack relationship, sector angles, and geometric sanity.
 * Enforces:
 * 1. input_section_height + middle_section_height + leachate_section_height === overall_height
 * 2. organic_sector_angle + inorganic_sector_angle + food_sector_angle === 360
 * 3. organic_cutting_headroom + organic_cutting_height + organic_storage_height + organic_storage_decomposition_gap + organic_decomposition_height <= middle_section_height
 * 4. output_drawer_start_from_middle_bottom <= middle_section_height
 * 5. funnel_opening_diameter > 0 and < inner_diameter
 *
 * @param {Object} params
 * @returns {boolean}
 * @throws {Error} if validation fails
 */
export function validateParameters(params) {
  if (!params) {
    throw new Error('[Gomikin Parametric Validation] Parameters object is null or undefined.');
  }

  const {
    outer_diameter,
    overall_height,
    shell_wall_thickness,
    input_section_height,
    middle_section_height,
    leachate_section_height,
    organic_cutting_headroom = 10,
    organic_cutting_height = 25,
    organic_storage_height = 270,
    organic_storage_decomposition_gap = 250,
    organic_decomposition_height = 270,
    output_drawer_start_from_middle_bottom = 380,
    funnel_opening_diameter = 100,
    rotating_base_elevation_offset = 10,
    sector_orientation_deg = 0,
    organic_sector_angle = 180,
    inorganic_sector_angle = 90,
    food_sector_angle = 90,
    divider_wall_thickness = 4,
  } = params;

  // 1. Positive dimensions check
  if (typeof outer_diameter !== 'number' || outer_diameter <= 0) {
    throw new Error(`[Gomikin Parametric Validation] outer_diameter must be > 0. Got: ${outer_diameter}`);
  }
  if (typeof overall_height !== 'number' || overall_height <= 0) {
    throw new Error(`[Gomikin Parametric Validation] overall_height must be > 0. Got: ${overall_height}`);
  }
  if (typeof shell_wall_thickness !== 'number' || shell_wall_thickness <= 0) {
    throw new Error(`[Gomikin Parametric Validation] shell_wall_thickness must be > 0. Got: ${shell_wall_thickness}`);
  }
  if (typeof input_section_height !== 'number' || input_section_height <= 0) {
    throw new Error(`[Gomikin Parametric Validation] input_section_height must be > 0. Got: ${input_section_height}`);
  }
  if (typeof middle_section_height !== 'number' || middle_section_height <= 0) {
    throw new Error(`[Gomikin Parametric Validation] middle_section_height must be > 0. Got: ${middle_section_height}`);
  }
  if (typeof leachate_section_height !== 'number' || leachate_section_height <= 0) {
    throw new Error(`[Gomikin Parametric Validation] leachate_section_height must be > 0. Got: ${leachate_section_height}`);
  }
  if (typeof organic_cutting_headroom !== 'number' || organic_cutting_headroom < 0) {
    throw new Error(`[Gomikin Parametric Validation] organic_cutting_headroom must be >= 0. Got: ${organic_cutting_headroom}`);
  }
  if (typeof organic_cutting_height !== 'number' || organic_cutting_height <= 0) {
    throw new Error(`[Gomikin Parametric Validation] organic_cutting_height must be > 0. Got: ${organic_cutting_height}`);
  }
  if (typeof organic_storage_height !== 'number' || organic_storage_height <= 0) {
    throw new Error(`[Gomikin Parametric Validation] organic_storage_height must be > 0. Got: ${organic_storage_height}`);
  }
  if (typeof organic_storage_decomposition_gap !== 'number' || organic_storage_decomposition_gap <= 0) {
    throw new Error(`[Gomikin Parametric Validation] organic_storage_decomposition_gap must be > 0. Got: ${organic_storage_decomposition_gap}`);
  }
  if (typeof organic_decomposition_height !== 'number' || organic_decomposition_height <= 0) {
    throw new Error(`[Gomikin Parametric Validation] organic_decomposition_height must be > 0. Got: ${organic_decomposition_height}`);
  }
  if (typeof output_drawer_start_from_middle_bottom !== 'number' || output_drawer_start_from_middle_bottom <= 0) {
    throw new Error(`[Gomikin Parametric Validation] output_drawer_start_from_middle_bottom must be > 0. Got: ${output_drawer_start_from_middle_bottom}`);
  }
  if (typeof funnel_opening_diameter !== 'number' || funnel_opening_diameter <= 0) {
    throw new Error(`[Gomikin Parametric Validation] funnel_opening_diameter must be > 0. Got: ${funnel_opening_diameter}`);
  }
  if (typeof rotating_base_elevation_offset !== 'number' || rotating_base_elevation_offset < 0) {
    throw new Error(`[Gomikin Parametric Validation] rotating_base_elevation_offset must be >= 0. Got: ${rotating_base_elevation_offset}`);
  }
  if (typeof sector_orientation_deg !== 'number' || !Number.isFinite(sector_orientation_deg)) {
    throw new Error(`[Gomikin Parametric Validation] sector_orientation_deg must be a valid number. Got: ${sector_orientation_deg}`);
  }
  if (typeof divider_wall_thickness !== 'number' || divider_wall_thickness <= 0) {
    throw new Error(`[Gomikin Parametric Validation] divider_wall_thickness must be > 0. Got: ${divider_wall_thickness}`);
  }

  // 2. Shell wall thickness sanity
  const outerRadius = outer_diameter / 2;
  if (shell_wall_thickness >= outerRadius) {
    throw new Error(
      `[Gomikin Parametric Validation] shell_wall_thickness (${shell_wall_thickness} mm) ` +
      `cannot exceed or equal outer radius (${outerRadius} mm).`
    );
  }

  const innerDiameter = outer_diameter - shell_wall_thickness * 2;
  if (funnel_opening_diameter >= innerDiameter) {
    throw new Error(
      `[Gomikin Parametric Validation] funnel_opening_diameter (${funnel_opening_diameter} mm) ` +
      `cannot exceed or equal inner diameter (${innerDiameter} mm).`
    );
  }

  const tolerance = 0.001; // Allow float rounding margin

  // 3. Vertical stack relationship validation
  // input_section_height + middle_section_height + leachate_section_height === overall_height
  const verticalSum = input_section_height + middle_section_height + leachate_section_height;
  if (Math.abs(verticalSum - overall_height) > tolerance) {
    const errorMsg =
      `[Gomikin Parametric Validation Error] Vertical stack sum mismatch!\n` +
      `  input_section_height (${input_section_height} mm) +\n` +
      `  middle_section_height (${middle_section_height} mm) +\n` +
      `  leachate_section_height (${leachate_section_height} mm)\n` +
      `  = ${verticalSum} mm, which DOES NOT EQUAL overall_height (${overall_height} mm).\n` +
      `Operation blocked to prevent silent geometric distortion.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // 4. Sector architecture angular sum validation
  // organic_sector_angle + inorganic_sector_angle + food_sector_angle === 360
  const sectorSum = organic_sector_angle + inorganic_sector_angle + food_sector_angle;
  if (Math.abs(sectorSum - 360) > tolerance) {
    const errorMsg =
      `[Gomikin Parametric Validation Error] Sector architecture angular sum mismatch!\n` +
      `  organic_sector_angle (${organic_sector_angle}°) +\n` +
      `  inorganic_sector_angle (${inorganic_sector_angle}°) +\n` +
      `  food_sector_angle (${food_sector_angle}°)\n` +
      `  = ${sectorSum}°, which DOES NOT EQUAL 360°.\n` +
      `Operation blocked to preserve sector volume integrity.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // 5. Organic middle section allocation validation
  // Preserves organic allocation: organicMiddleSum <= middle_section_height
  const organicMiddleSum =
    organic_cutting_headroom +
    organic_cutting_height +
    organic_storage_height +
    organic_storage_decomposition_gap +
    organic_decomposition_height;

  if (organicMiddleSum > middle_section_height + tolerance) {
    const errorMsg =
      `[Gomikin Parametric Validation Error] Organic middle section allocation exceeds middle section height!\n` +
      `  organic_cutting_headroom (${organic_cutting_headroom} mm) +\n` +
      `  organic_cutting_height (${organic_cutting_height} mm) +\n` +
      `  organic_storage_height (${organic_storage_height} mm) +\n` +
      `  organic_storage_decomposition_gap (${organic_storage_decomposition_gap} mm) +\n` +
      `  organic_decomposition_height (${organic_decomposition_height} mm)\n` +
      `  = ${organicMiddleSum} mm, which EXCEEDS middle_section_height (${middle_section_height} mm).\n` +
      `Operation blocked to preserve vertical architecture consistency.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // 6. Output drawer datum constraint
  // output_drawer_start_from_middle_bottom <= middle_section_height
  if (output_drawer_start_from_middle_bottom > middle_section_height) {
    throw new Error(
      `[Gomikin Parametric Validation Error] output_drawer_start_from_middle_bottom (${output_drawer_start_from_middle_bottom} mm) ` +
      `cannot exceed middle_section_height (${middle_section_height} mm).`
    );
  }

  // 7. Cutting Mechanism Geometric Constraints
  const cuttingCollarDia = params.cutting_collar_diameter || 200;
  const cuttingRotorSpan = params.cutting_rotor_span || 180;
  const innerRadiusApprox = (outer_diameter / 2) - shell_wall_thickness;
  if (cuttingCollarDia >= innerRadiusApprox * 2) {
    throw new Error(
      `[Gomikin Parametric Validation Error] cutting_collar_diameter (${cuttingCollarDia} mm) ` +
      `must be less than internal sector clearance (${innerRadiusApprox * 2} mm).`
    );
  }
  if (cuttingRotorSpan >= cuttingCollarDia) {
    throw new Error(
      `[Gomikin Parametric Validation Error] cutting_rotor_span (${cuttingRotorSpan} mm) ` +
      `must be strictly less than cutting_collar_diameter (${cuttingCollarDia} mm) to maintain blade tip clearance.`
    );
  }

  // 8. Storage Door & Fan Mechanism Constraints
  // Door thickness is strictly mandated to be 4 mm
  if (params.door_thickness !== undefined && params.door_thickness !== 4) {
    throw new Error(
      `[Gomikin Parametric Validation Error] door_thickness must be exactly 4 mm. Got: ${params.door_thickness}`
    );
  }
  if (params.organic_fan_size !== undefined && (typeof params.organic_fan_size !== 'number' || params.organic_fan_size <= 0)) {
    throw new Error(
      `[Gomikin Parametric Validation Error] organic_fan_size must be > 0. Got: ${params.organic_fan_size}`
    );
  }
  if (params.door_central_spine_width !== undefined && (typeof params.door_central_spine_width !== 'number' || params.door_central_spine_width <= 0)) {
    throw new Error(
      `[Gomikin Parametric Validation Error] door_central_spine_width must be > 0. Got: ${params.door_central_spine_width}`
    );
  }
  const fanElevation = params.organic_fan_elevation || 650;
  const storageBottom = leachate_section_height + organic_decomposition_height + organic_storage_decomposition_gap; // 500 mm
  const storageTop = storageBottom + organic_storage_height; // 770 mm
  if (fanElevation <= storageBottom || fanElevation >= storageTop) {
    throw new Error(
      `[Gomikin Parametric Validation Error] organic_fan_elevation (${fanElevation} mm) ` +
      `must be strictly within the organic storage chamber vertical envelope (${storageBottom} to ${storageTop} mm).`
    );
  }

  // 9. Decomposition Agitator Constraints
  const agitatorPaddleSpan = params.agitator_paddle_span || 180;
  const agitatorShaftHeight = params.agitator_shaft_height || 140;
  const maxPaddleSpan = (innerRadiusApprox - (divider_wall_thickness / 2)) * 2;
  if (agitatorPaddleSpan >= maxPaddleSpan) {
    throw new Error(
      `[Gomikin Parametric Validation Error] agitator_paddle_span (${agitatorPaddleSpan} mm) ` +
      `exceeds allowable sector clearance (${maxPaddleSpan} mm).`
    );
  }
  if (agitatorShaftHeight >= organic_decomposition_height) {
    throw new Error(
      `[Gomikin Parametric Validation Error] agitator_shaft_height (${agitatorShaftHeight} mm) ` +
      `must be less than organic_decomposition_height (${organic_decomposition_height} mm).`
    );
  }

  // 10. Leftover Food Structural Refinements Validation (Task 1 & Task 2)
  const foodTopClosureY = params.food_top_closure_y ?? (leachate_section_height + middle_section_height);
  const foodDoorTopY = params.food_door_top_y ?? 800;
  const foodDoorBottomY = params.food_door_bottom_y ?? 700;
  const foodDoorHeight = params.food_door_height ?? 100;
  const foodDoorArcPad = params.food_door_arc_padding ?? 10;

  if (Math.abs((foodDoorTopY - foodDoorBottomY) - foodDoorHeight) > 0.001) {
    throw new Error(
      `[Gomikin Parametric Validation Error] food_door_top_y (${foodDoorTopY} mm) - food_door_bottom_y (${foodDoorBottomY} mm) ` +
      `must equal food_door_height (${foodDoorHeight} mm).`
    );
  }
  if (foodDoorBottomY < leachate_section_height || foodDoorTopY > leachate_section_height + middle_section_height) {
    throw new Error(
      `[Gomikin Parametric Validation Error] Leftover food door vertical span (${foodDoorBottomY} to ${foodDoorTopY} mm) ` +
      `must remain strictly within middle section (${leachate_section_height} to ${leachate_section_height + middle_section_height} mm).`
    );
  }
  const sectorArcLen = innerRadiusApprox * (Math.PI / 2);
  if (foodDoorArcPad * 2 >= sectorArcLen) {
    throw new Error(
      `[Gomikin Parametric Validation Error] Total arc padding (${foodDoorArcPad * 2} mm) cannot exceed or equal sector arc length (${sectorArcLen.toFixed(1)} mm).`
    );
  }

  return true;
}

/**
 * Calculates derived geometric properties in both mm and scene units (meters).
 *
 * @param {Object} [customParams]
 * @returns {Object} Derived geometry object
 */
export function getDerivedGeometry(customParams = {}) {
  const params = { ...GOMIKIN_BASELINE_PARAMS, ...customParams };
  validateParameters(params);

  const outer_radius = params.outer_diameter / 2;
  const inner_radius = outer_radius - params.shell_wall_thickness;

  // Elevations measured from ground contact baseline (Y = 0) upwards (+Y)
  // Authoritative reference: docs/master_geometry.md Section 4 & Section 13
  const y_ground = 0;
  const y_leachate_boundary = params.leachate_section_height; // 100 mm (Middle / Leachate boundary)
  const y_input_boundary = y_leachate_boundary + params.middle_section_height; // 925 mm (Input / Middle boundary)
  const y_top = params.overall_height; // 1020 mm

  // Middle section datums:
  const middle_bottom = y_leachate_boundary; // 100 mm
  const middle_top = y_input_boundary;       // 925 mm

  // Organic Section Vertical Sub-Allocations (Fully Allocated 825 mm Middle Section):
  // Decomposition Chamber Envelope: Y = 100 mm to 370 mm (H: 270 mm [220 + 50 mm])
  const y_decomp_bottom = middle_bottom; // 100 mm
  const y_decomp_top = y_decomp_bottom + params.organic_decomposition_height; // 370 mm
  const decomp_height = params.organic_decomposition_height; // 270 mm

  // Parametric derivation of MiddleOutputDatum:
  // Datum sits at top of decomposition chamber / bottom of open gap (Y = 370 mm)
  const y_middle_output_datum = y_decomp_top; // 370 mm

  // Storage-Decomposition Gap (Open Clearance): Y = 370 mm to 620 mm (H: 250 mm)
  const y_gap_bottom = y_middle_output_datum; // 370 mm
  const y_gap_top = y_gap_bottom + params.organic_storage_decomposition_gap; // 620 mm
  const gap_height = params.organic_storage_decomposition_gap; // 250 mm

  // Organic Storage Chamber Envelope: Y = 620 mm to 890 mm (H: 270 mm [220 + 50 mm])
  const y_storage_bottom = y_gap_top; // 620 mm
  const y_storage_top = y_storage_bottom + params.organic_storage_height; // 890 mm
  const storage_height = params.organic_storage_height; // 270 mm
  const storage_bottom = y_storage_bottom; // 620 mm

  // Cutting Mechanism (Allocation): Y = 890 mm to 915 mm (H: 25 mm)
  const y_cutting_bottom = y_storage_top; // 890 mm
  const y_cutting_top = y_cutting_bottom + params.organic_cutting_height; // 915 mm
  const cutting_height = params.organic_cutting_height; // 25 mm

  // Cutting Headroom: Y = 915 mm to 925 mm (H: 10 mm)
  // Clearance between top of cutting mechanism and base of segregation mechanism
  const y_cutting_headroom_bottom = y_cutting_top; // 915 mm
  const y_cutting_headroom_top = y_input_boundary; // 925 mm
  const cutting_headroom_height = y_cutting_headroom_top - y_cutting_headroom_bottom; // 10 mm

  // Organic Total Allocated Height: 10 + 25 + 270 + 250 + 270 = 825 mm (Matches middle_section_height exactly)
  const organic_allocated_height = cutting_headroom_height + cutting_height + storage_height + gap_height + decomp_height;

  // Unresolved Middle Allocation: Completely utilized (0 mm unused space)
  const unresolved_middle_allocation = Math.max(0, params.middle_section_height - organic_allocated_height); // 0 mm
  const y_unresolved_middle_bottom = y_cutting_headroom_top; // 925 mm
  const y_unresolved_middle_top = middle_top;                // 925 mm

  // Inorganic & Leftover Food Output Sections:
  // Starts at Y = 480 mm datum, extends downward toward middle-section bottom (Y = 100 mm)
  const y_non_organic_output_top = params.output_section_start_datum_y || (middle_bottom + (params.output_drawer_start_from_middle_bottom || 380)); // 480 mm
  const y_non_organic_output_bottom = middle_bottom; // 100 mm
  const non_organic_output_height = y_non_organic_output_top - y_non_organic_output_bottom; // 380 mm

  // Leftover Food Nested Strainer Basket Sub-Allocation (Dual-Layer Concept):
  const strainer_basket_wall_inset = params.strainer_basket_wall_inset || 8;
  const strainer_basket_drainage_sump_height = params.strainer_basket_drainage_sump_height || 25;
  const strainer_basket_top_lip_inset = params.strainer_basket_top_lip_inset || 5;
  const y_strainer_basket_bottom = y_non_organic_output_bottom + strainer_basket_drainage_sump_height; // 125 mm
  const y_strainer_basket_top = y_non_organic_output_top - strainer_basket_top_lip_inset; // 475 mm
  const strainer_basket_height = y_strainer_basket_top - y_strainer_basket_bottom; // 350 mm
  const drawer_perimeter_clearance = params.drawer_perimeter_clearance || 1;

  // Offsets measured from top down:
  const top_offset_input_boundary = params.input_section_height; // 95 mm
  const top_offset_middle_output_datum = params.input_section_height + (middle_top - y_middle_output_datum); // 95 + 555 = 650 mm
  const top_offset_non_organic_output = params.input_section_height + (middle_top - y_non_organic_output_top); // 95 + 445 = 540 mm
  const top_offset_leachate_boundary = params.input_section_height + params.middle_section_height; // 920 mm

  // Phase 2A: Structural Sector Divider Dimensions
  // CentralDivider spans full inner diameter
  const central_divider_length = inner_radius * 2;
  // RadialDivider spans from central axis to inner shell wall
  const radial_divider_length = inner_radius;

  // Sector Dividers terminate exactly at the Input/Middle boundary (Y = 925 mm)
  // and begin at the Middle/Leachate boundary (Y = 100 mm).
  // They span exclusively Y = 100 mm to Y = 925 mm (middle_section_height = 825 mm).
  // The input section (Y = 925 mm to Y = 1020 mm) is strictly free of sector divider walls.
  const divider_y_bottom = y_leachate_boundary;
  const divider_y_top = y_input_boundary; // Parametrically derived from y_top - input_section_height
  const divider_height = divider_y_top - divider_y_bottom; // 825 mm
  const divider_y_center = (divider_y_bottom + divider_y_top) / 2; // 512.5 mm

  // ==========================================
  // INPUT + SEGREGATION ASSEMBLY DERIVED VALUES
  // ==========================================
  // Reference point for Rotating Base platform: 10 mm above Input/Middle boundary at Y = 925 mm -> Y = 935 mm
  const y_rotating_base = y_input_boundary + (params.rotating_base_elevation_offset ?? 10); // 935 mm
  const rotating_base_x = 0; // Vertically aligned with divider intersection
  const rotating_base_z = 0; // Vertically aligned with divider intersection

  // Rotating Base physical geometry metrics (contoured peanut/dumbbell profile):
  const rotating_base_length = params.rotating_base_length || 85;
  const rotating_base_lobe_width = params.rotating_base_lobe_width || 70;
  const rotating_base_waist_width = params.rotating_base_waist_width || 50;
  const rotating_base_thickness = params.rotating_base_thickness || 4;

  // Funnel geometric metrics:
  const funnel_opening_diameter = params.funnel_opening_diameter || 100;
  const funnel_opening_radius = funnel_opening_diameter / 2;
  const funnel_top_y = y_top; // 900 mm
  const funnel_bottom_y = y_rotating_base + 5; // 815 mm (5 mm clearance above rotating base plate)
  const funnel_height = funnel_top_y - funnel_bottom_y; // 85 mm
  const funnel_top_radius = inner_radius; // 246 mm
  const funnel_bottom_radius = funnel_opening_radius; // 50 mm
  const funnel_y_center = funnel_bottom_y + funnel_height / 2; // 857.5 mm

  // Display dimensions & mounting location (Option 1 Selected Architecture):
  // Physically mounted ON TOP OF the closed rear semicircular lid (TopClosure_TopLid at Y = 900 mm).
  // Sits on exterior surface at the midpoint of the rear semicircular arc (X = 0, -Z side).
  // Follows the curvature/orientation of the closed hood, physically attached via a mounting pedestal.
  // Compact, realistic profile tilted upward and forward toward +Z front for standing user interaction.
  const display_width = params.display_width || 72;
  const display_height = params.display_height || 38;
  const display_depth = params.display_depth || 8;
  const display_tilt_deg = params.display_tilt_deg || 25; // Ergonomic tilt upward toward +Z user
  const display_mount_x = 0; // Centered symmetrically around X = 0
  const display_mount_z = -inner_radius * 0.72; // ~ -177 mm (at the midpoint of the rear semicircular arc)
  const display_mount_y = y_top; // precisely on top exterior surface of TopClosure_TopLid (900 mm)

  // Camera & Ultrasonic Sensor mounting under front fascia of rear hood (Z ≈ -12 mm, Y ≈ 885 mm):
  const camera_width = params.camera_width || 25;
  const camera_height = params.camera_height || 18;
  const camera_depth = params.camera_depth || 15;
  const camera_lens_diameter = params.camera_lens_diameter || 10;

  const ultrasonic_width = params.ultrasonic_width || 45;
  const ultrasonic_height = params.ultrasonic_height || 20;
  const ultrasonic_depth = params.ultrasonic_depth || 15;
  const ultrasonic_transducer_diameter = params.ultrasonic_transducer_diameter || 14;

  const sensor_mount_y = y_top - 15; // 885 mm
  const sensor_mount_z = -12; // just behind fascia at Z = 0
  const camera_mount_x = -outer_radius * 0.28; // ~ -70 mm (left side)
  const ultrasonic_mount_x = outer_radius * 0.28; // ~ +70 mm (right side)

  // Organic Cutting Mechanism Metrics (Nested circular collar in 180° Organic sector):
  // Authoritative reference: docs/master_geometry.md Section 5 & references/sketches/IMG_20260925_175201.jpg
  const cutting_collar_diameter = params.cutting_collar_diameter || 200;
  const cutting_collar_radius = cutting_collar_diameter / 2; // 100 mm
  const cutting_collar_wall_thickness = params.cutting_collar_wall_thickness || 3;
  const cutting_collar_inner_radius = cutting_collar_radius - cutting_collar_wall_thickness; // 97 mm

  const cutting_motor_diameter = params.cutting_motor_diameter || 50;
  const cutting_motor_radius = cutting_motor_diameter / 2; // 25 mm
  const cutting_motor_height = params.cutting_motor_height || 35;
  const cutting_shaft_diameter = params.cutting_shaft_diameter || 12;
  const cutting_shaft_radius = cutting_shaft_diameter / 2; // 6 mm

  const cutting_rotor_span = params.cutting_rotor_span || 180;
  const cutting_rotor_radius = cutting_rotor_span / 2; // 90 mm
  const cutting_blade_width = params.cutting_blade_width || 14;
  const cutting_blade_thickness = params.cutting_blade_thickness || 3;
  const cutting_blade_pitch_deg = params.cutting_blade_pitch_deg || 22;
  const cutting_hook_length = params.cutting_hook_length || 15;

  const cutting_screen_aperture = params.cutting_screen_aperture || 8;
  const cutting_screen_thickness = params.cutting_screen_thickness || 2;
  const cutting_blade_screen_clearance = params.cutting_blade_screen_clearance || 2;

  // Center coordinates of cutting mechanism within the 180° Organic sector (-X side):
  // Positioned symmetrically along Z = 0, centered between divider wall face and outer shell inner wall
  const x_div_face = -(params.divider_wall_thickness / 2); // ~ -2 mm
  const cutting_center_x = (x_div_face - inner_radius) / 2; // ~ -124 mm
  const cutting_center_z = 0;

  // Vertical placement:
  // Cutting allocation is Y = 770 mm to 795 mm (y_cutting_bottom to y_cutting_top)
  const cutting_screen_y = y_cutting_bottom; // 770 mm
  const cutting_blade_y = cutting_screen_y + cutting_screen_thickness + cutting_blade_screen_clearance; // 774 mm
  const cutting_shaft_bottom_y = cutting_blade_y; // 774 mm
  const cutting_shaft_top_y = y_cutting_top; // 795 mm
  const cutting_shaft_length = cutting_shaft_top_y - cutting_shaft_bottom_y; // 21 mm
  const cutting_motor_bottom_y = y_cutting_top; // 795 mm (mounted above cutting zone, isolated from moisture)
  const cutting_motor_top_y = y_cutting_top + cutting_motor_height; // 830 mm

  // Organic Storage Fan & Odor Mitigation Metrics:
  // Positioned along the outer curved wall of the 180° Organic sector (-X side, Z = 0)
  const organic_fan_size = params.organic_fan_size || 70;
  const organic_fan_depth = params.organic_fan_depth || 20;
  const organic_fan_bore_diameter = params.organic_fan_bore_diameter || 62;
  const organic_fan_bore_radius = organic_fan_bore_diameter / 2;
  const organic_fan_hub_diameter = params.organic_fan_hub_diameter || 24;
  const organic_fan_hub_radius = organic_fan_hub_diameter / 2;
  const organic_fan_blade_count = params.organic_fan_blade_count || 5;
  const organic_fan_filter_diameter = params.organic_fan_filter_diameter || 65;
  const organic_fan_filter_radius = organic_fan_filter_diameter / 2;
  const organic_fan_filter_depth = params.organic_fan_filter_depth || 18;
  const organic_fan_elevation = params.organic_fan_elevation || 650; // Vertical center Y = 650 mm

  // Fan coordinates: Mounted on outer shell wall facing inward along X-axis
  // Activated carbon canister mounted directly against outer shell inner face (X = -inner_radius)
  const organic_fan_filter_x = -inner_radius + organic_fan_filter_depth / 2;
  const organic_fan_casing_x = -inner_radius + organic_fan_filter_depth + organic_fan_depth / 2;
  const organic_fan_x = organic_fan_casing_x;
  const organic_fan_z = 0;
  const organic_fan_y = organic_fan_elevation;

  // Organic Storage Door Mechanism & Base Assembly Metrics:
  // Positioned at the base of the Organic Storage Chamber (Y = y_storage_bottom = 500 mm)
  const door_thickness = params.door_thickness || 4; // Mandated EXACTLY 4 mm
  const door_clearance = params.door_clearance || 2;
  const door_slope_angle_deg = params.door_slope_angle_deg || 3;
  const door_central_spine_width = params.door_central_spine_width || 16;
  const door_central_spine_height = params.door_central_spine_height || 14;
  const door_hinge_barrel_diameter = params.door_hinge_barrel_diameter || 8;
  const door_hinge_barrel_radius = door_hinge_barrel_diameter / 2;
  const door_hinge_pin_diameter = params.door_hinge_pin_diameter || 4;
  const door_drainage_screen_thickness = params.door_drainage_screen_thickness || 2;
  const door_drainage_screen_gap = params.door_drainage_screen_gap || 5;
  const door_drain_hole_diameter = params.door_drain_hole_diameter || 18;
  const door_vibrator_length = params.door_vibrator_length || 35;
  const door_vibrator_diameter = params.door_vibrator_diameter || 20;

  // Door vertical datums:
  const y_door_base = y_storage_bottom; // 500 mm
  const y_door_mesh_bottom = y_door_base + door_thickness + door_drainage_screen_gap; // 509 mm
  const y_door_mesh_top = y_door_mesh_bottom + door_drainage_screen_thickness; // 511 mm

  // Spine coordinates: Runs along Z = 0 from X = x_div_face to X = -(inner_radius - door_clearance)
  const spine_x_start = x_div_face;
  const spine_x_end = -(inner_radius - door_clearance);
  const spine_length = Math.abs(spine_x_end - spine_x_start);
  const spine_x_center = (spine_x_start + spine_x_end) / 2;
  const spine_y_center = y_door_base + door_central_spine_height / 2;

  // Organic Decomposition Agitator Metrics (authoritative ref: docs/master_geometry.md Section 10 & IMG_20260925_175238.jpg):
  const agitator_mount_diameter = params.agitator_mount_diameter || 55;
  const agitator_mount_radius = agitator_mount_diameter / 2;
  const agitator_mount_height = params.agitator_mount_height || 20;

  const agitator_shaft_diameter = params.agitator_shaft_diameter || 16;
  const agitator_shaft_radius = agitator_shaft_diameter / 2;
  const agitator_shaft_height = params.agitator_shaft_height || 140;

  const agitator_hub_diameter = params.agitator_hub_diameter || 36;
  const agitator_hub_radius = agitator_hub_diameter / 2;
  const agitator_hub_height = params.agitator_hub_height || 28;
  const agitator_floor_clearance = params.agitator_floor_clearance || 15;

  const agitator_paddle_span = params.agitator_paddle_span || 180;
  const agitator_paddle_radius = agitator_paddle_span / 2;
  const agitator_paddle_arm_length = Math.max(10, agitator_paddle_radius - agitator_hub_radius);
  const agitator_paddle_width = params.agitator_paddle_width || 24;
  const agitator_paddle_thickness = params.agitator_paddle_thickness || 4;
  const agitator_paddle_pitch_deg = params.agitator_paddle_pitch_deg || 20;
  const agitator_tip_upright_height = params.agitator_tip_upright_height || 40;
  const agitator_tip_upright_width = params.agitator_tip_upright_width || 20;

  // Center coordinates of agitator pivot in 180° Organic sector (-X side, Z = 0)
  // Symmetrically centered between the central divider face and the inner shell wall
  const agitator_center_x = (x_div_face - inner_radius) / 2; // ~ -124 mm
  const agitator_center_z = 0;

  // Vertical placement datums:
  const agitator_mount_bottom_y = y_decomp_bottom; // 100 mm
  const agitator_mount_top_y = agitator_mount_bottom_y + agitator_mount_height; // 120 mm
  const agitator_shaft_bottom_y = y_decomp_bottom; // 100 mm
  const agitator_shaft_top_y = agitator_shaft_bottom_y + agitator_shaft_height; // 240 mm
  const agitator_paddle_y = y_decomp_bottom + agitator_floor_clearance; // 115 mm
  const agitator_hub_y = agitator_paddle_y + (agitator_hub_height / 2); // 129 mm

  // Organic Decomposition Chamber Sensory Feedback Array metrics:
  const decomp_load_cell_diameter = params.decomp_load_cell_diameter || 50;
  const decomp_load_cell_height = params.decomp_load_cell_height || 10;
  const decomp_temp_sensor_probe_length = params.decomp_temp_sensor_probe_length || 50;
  const decomp_temp_sensor_probe_diameter = params.decomp_temp_sensor_probe_diameter || 4;
  const decomp_moisture_sensor_length = params.decomp_moisture_sensor_length || 35;
  const decomp_moisture_sensor_prong_spacing = params.decomp_moisture_sensor_prong_spacing || 10;

  const decomp_load_cell_x = agitator_center_x;
  const decomp_load_cell_z = agitator_center_z;
  const decomp_load_cell_y = y_decomp_bottom - decomp_load_cell_height / 2;

  const decomp_temp_sensor_x = agitator_center_x;
  const decomp_temp_sensor_z = 135;
  const decomp_temp_sensor_y = y_decomp_bottom;

  const decomp_moisture_sensor_x = agitator_center_x;
  const decomp_moisture_sensor_z = -135;
  const decomp_moisture_sensor_y = y_decomp_bottom;

  // Leftover Food 90° Sector Structural Refinements (Task 1 & Task 2):
  const food_top_closure_y = params.food_top_closure_y ?? y_input_boundary; // 925 mm
  const food_door_top_y = params.food_door_top_y ?? 800;                     // 800 mm
  const food_door_bottom_y = params.food_door_bottom_y ?? 700;               // 700 mm
  const food_door_height = params.food_door_height ?? 100;                   // 100 mm
  const food_door_arc_padding = params.food_door_arc_padding ?? 10;          // 10 mm along arc
  const food_door_delta_theta = food_door_arc_padding / inner_radius;        // ~0.04065 rad (~2.33°)
  const food_door_theta_start = food_door_delta_theta;
  const food_door_theta_length = (Math.PI / 2) - (2 * food_door_delta_theta);
  const food_door_theta_end = food_door_theta_start + food_door_theta_length;
  const food_door_arc_width = food_door_theta_length * inner_radius;         // Arc width along door (mm)

  // Phase 3 Mechanical Architecture Derived Values:
  const segregation_hub_diameter = params.segregation_hub_diameter || 38;
  const segregation_hub_radius = segregation_hub_diameter / 2;
  const segregation_hub_height = params.segregation_hub_height !== undefined ? params.segregation_hub_height : 6;
  const segregation_hub_bottom_y = y_input_boundary; // 925 mm (seated on divider intersection)
  const segregation_hub_top_y = segregation_hub_bottom_y + segregation_hub_height; // 931 mm (leaves 1 mm running clearance to platform bottom at 932 mm)

  const segregation_motor_diameter = params.segregation_motor_diameter || 28;
  const segregation_motor_radius = segregation_motor_diameter / 2;
  const segregation_motor_height = params.segregation_motor_height || 20;
  const segregation_motor_top_y = segregation_hub_bottom_y - 4; // 921 mm (4 mm collar/coupling zone)
  const segregation_motor_bottom_y = segregation_motor_top_y - segregation_motor_height; // 901 mm

  const segregation_spindle_diameter = params.segregation_spindle_diameter || 8;
  const segregation_spindle_radius = segregation_spindle_diameter / 2;
  const segregation_bearing_outer_dia = params.segregation_bearing_outer_dia || 19;
  const segregation_bearing_radius = segregation_bearing_outer_dia / 2;
  const segregation_bearing_height = params.segregation_bearing_height !== undefined ? params.segregation_bearing_height : 2.5;
  const segregation_bracket_span = params.segregation_bracket_span || 20;
  const segregation_coupling_diameter = params.segregation_coupling_diameter || 14;
  const segregation_coupling_radius = segregation_coupling_diameter / 2;
  const segregation_coupling_height = params.segregation_coupling_height || 6;

  const decomp_load_cell_offset_z = params.decomp_load_cell_offset_z || 90;
  const drawer_wall_thickness = params.drawer_wall_thickness || 3;

  const electronics_bay_housing_width = params.electronics_bay_housing_width || 130;
  const electronics_bay_housing_height = params.electronics_bay_housing_height || 85;
  const electronics_bay_housing_depth = params.electronics_bay_housing_depth || 85;
  const electronics_bay_y_bottom = y_input_boundary; // 925 mm (above leftover food closure)

  // Leftover Food Access Door Corner and Chord Hinge calculations (Decision 2):
  // Angle theta_start is along +Z (from Central Divider), theta_end is along +X (near Radial Divider)
  const food_door_corner_1_x = inner_radius * Math.sin(food_door_theta_start);
  const food_door_corner_1_z = inner_radius * Math.cos(food_door_theta_start);
  const food_door_corner_2_x = inner_radius * Math.sin(food_door_theta_end);
  const food_door_corner_2_z = inner_radius * Math.cos(food_door_theta_end);
  const food_door_chord_mid_x = (food_door_corner_1_x + food_door_corner_2_x) / 2;
  const food_door_chord_mid_z = (food_door_corner_1_z + food_door_corner_2_z) / 2;
  const food_door_chord_dx = food_door_corner_2_x - food_door_corner_1_x;
  const food_door_chord_dz = food_door_corner_2_z - food_door_corner_1_z;
  const food_door_chord_length = Math.sqrt(food_door_chord_dx * food_door_chord_dx + food_door_chord_dz * food_door_chord_dz);
  const food_door_chord_angle = Math.atan2(food_door_chord_dz, food_door_chord_dx);

  return {
    raw: { ...params },

    // Millimeter units
    mm: {
      outer_diameter: params.outer_diameter,
      outer_radius,
      inner_diameter: inner_radius * 2,
      inner_radius,
      shell_wall_thickness: params.shell_wall_thickness,
      overall_height: params.overall_height,

      input_section_height: params.input_section_height,
      middle_section_height: params.middle_section_height,
      leachate_section_height: params.leachate_section_height,

      // Organic section vertical sub-allocations
      organic_cutting_headroom: params.organic_cutting_headroom || 10,
      y_cutting_headroom_bottom,
      y_cutting_headroom_top,
      cutting_headroom_height,
      organic_cutting_height: params.organic_cutting_height,
      organic_storage_height: params.organic_storage_height,
      organic_storage_decomposition_gap: params.organic_storage_decomposition_gap,
      organic_decomposition_height: params.organic_decomposition_height,
      organic_allocated_height,
      unresolved_middle_allocation,
      y_unresolved_middle_bottom,
      y_unresolved_middle_top,

      output_drawer_start_from_middle_bottom: params.output_drawer_start_from_middle_bottom,

      y_ground,
      y_leachate_boundary, // 100 mm
      y_middle_output_datum, // 370 mm (Shared architectural datum)
      y_input_boundary,    // 805 mm
      y_top,               // 900 mm

      middle_bottom,       // 100 mm
      middle_top,          // 805 mm
      storage_bottom,      // 500 mm

      // Chamber boundary elevations & heights
      y_cutting_bottom,
      y_cutting_top,
      cutting_height,

      y_storage_bottom,
      y_storage_top,
      storage_height,

      y_gap_bottom,
      y_gap_top,
      gap_height,

      y_decomp_bottom,
      y_decomp_top,
      decomp_height,

      // Non-Organic Output Section & Drawer Metrics:
      output_section_start_datum_y: y_non_organic_output_top, // 480 mm
      y_non_organic_output_top,                              // 480 mm
      y_non_organic_output_bottom,                           // 100 mm
      non_organic_output_height,                             // 380 mm

      // Nested Strainer Basket Envelope metrics:
      y_strainer_basket_top,
      y_strainer_basket_bottom,
      strainer_basket_height,
      strainer_basket_wall_inset,
      strainer_basket_drainage_sump_height,
      strainer_basket_top_lip_inset,
      drawer_perimeter_clearance,

      top_offset_input_boundary,      // 95 mm
      top_offset_middle_output_datum, // 530 mm from top
      top_offset_non_organic_output,  // 420 mm from top
      top_offset_leachate_boundary,   // 800 mm

      // Sector architecture parameters
      sector_orientation_deg: params.sector_orientation_deg,
      organic_sector_angle: params.organic_sector_angle,
      inorganic_sector_angle: params.inorganic_sector_angle,
      food_sector_angle: params.food_sector_angle,
      divider_wall_thickness: params.divider_wall_thickness,

      central_divider_length,
      radial_divider_length,
      divider_height,
      divider_y_center,
      divider_y_bottom,
      divider_y_top,

      // Input & Segregation Assembly metrics:
      y_rotating_base,
      rotating_base_x,
      rotating_base_z,
      rotating_base_length,
      rotating_base_lobe_width,
      rotating_base_waist_width,
      rotating_base_thickness,

      funnel_opening_diameter,
      funnel_opening_radius,
      funnel_top_y,
      funnel_bottom_y,
      funnel_height,
      funnel_top_radius,
      funnel_bottom_radius,
      funnel_y_center,

      display_width,
      display_height,
      display_depth,
      display_tilt_deg,
      display_mount_x,
      display_mount_y,
      display_mount_z,

      camera_width,
      camera_height,
      camera_depth,
      camera_lens_diameter,
      ultrasonic_width,
      ultrasonic_height,
      ultrasonic_depth,
      ultrasonic_transducer_diameter,
      sensor_mount_y,
      sensor_mount_z,
      camera_mount_x,
      ultrasonic_mount_x,

      // Organic Cutting Mechanism metrics (mm):
      cutting_collar_diameter,
      cutting_collar_radius,
      cutting_collar_wall_thickness,
      cutting_collar_inner_radius,
      cutting_motor_diameter,
      cutting_motor_radius,
      cutting_motor_height,
      cutting_shaft_diameter,
      cutting_shaft_radius,
      cutting_shaft_length,
      cutting_rotor_span,
      cutting_rotor_radius,
      cutting_blade_width,
      cutting_blade_thickness,
      cutting_blade_pitch_deg,
      cutting_hook_length,
      cutting_screen_aperture,
      cutting_screen_thickness,
      cutting_blade_screen_clearance,
      cutting_center_x,
      cutting_center_z,
      cutting_screen_y,
      cutting_blade_y,
      cutting_shaft_bottom_y,
      cutting_shaft_top_y,
      cutting_motor_bottom_y,
      cutting_motor_top_y,

      // Organic Storage Fan & Odor Mitigation Metrics (mm):
      organic_fan_size,
      organic_fan_depth,
      organic_fan_bore_diameter,
      organic_fan_bore_radius,
      organic_fan_hub_diameter,
      organic_fan_hub_radius,
      organic_fan_blade_count,
      organic_fan_filter_diameter,
      organic_fan_filter_radius,
      organic_fan_filter_depth,
      organic_fan_elevation,
      organic_fan_filter_x,
      organic_fan_casing_x,
      organic_fan_x,
      organic_fan_z,
      organic_fan_y,

      // Organic Storage Door Mechanism & Base Assembly Metrics (mm):
      door_thickness,
      door_clearance,
      door_slope_angle_deg,
      door_central_spine_width,
      door_central_spine_height,
      door_hinge_barrel_diameter,
      door_hinge_barrel_radius,
      door_hinge_pin_diameter,
      door_drainage_screen_thickness,
      door_drainage_screen_gap,
      door_drain_hole_diameter,
      door_vibrator_length,
      door_vibrator_diameter,
      y_door_base,
      y_door_mesh_bottom,
      y_door_mesh_top,
      spine_x_start,
      spine_x_end,
      spine_length,
      spine_x_center,
      spine_y_center,

      // Organic Decomposition Chamber & Agitator Metrics (mm):
      agitator_mount_diameter,
      agitator_mount_radius,
      agitator_mount_height,
      agitator_shaft_diameter,
      agitator_shaft_radius,
      agitator_shaft_height,
      agitator_hub_diameter,
      agitator_hub_radius,
      agitator_hub_height,
      agitator_floor_clearance,
      agitator_paddle_span,
      agitator_paddle_radius,
      agitator_paddle_arm_length,
      agitator_paddle_width,
      agitator_paddle_thickness,
      agitator_paddle_pitch_deg,
      agitator_tip_upright_height,
      agitator_tip_upright_width,
      agitator_center_x,
      agitator_center_z,
      agitator_mount_bottom_y,
      agitator_mount_top_y,
      agitator_shaft_bottom_y,
      agitator_shaft_top_y,
      agitator_paddle_y,
      agitator_hub_y,

      // Organic Decomposition Chamber Sensors (mm):
      decomp_load_cell_diameter,
      decomp_load_cell_height,
      decomp_load_cell_x,
      decomp_load_cell_y,
      decomp_load_cell_z,
      decomp_temp_sensor_probe_length,
      decomp_temp_sensor_probe_diameter,
      decomp_temp_sensor_x,
      decomp_temp_sensor_y,
      decomp_temp_sensor_z,
      decomp_moisture_sensor_length,
      decomp_moisture_sensor_prong_spacing,
      decomp_moisture_sensor_x,
      decomp_moisture_sensor_y,
      decomp_moisture_sensor_z,

      // Leftover Food 90° Sector Refinements (mm):
      food_top_closure_y,
      food_door_top_y,
      food_door_bottom_y,
      food_door_height,
      food_door_arc_padding,
      food_door_delta_theta,
      food_door_theta_start,
      food_door_theta_length,
      food_door_theta_end,
      food_door_arc_width,

      // Phase 3 Mechanical Architecture metrics (mm):
      segregation_hub_diameter,
      segregation_hub_radius,
      segregation_hub_height,
      segregation_hub_bottom_y,
      segregation_hub_top_y,
      segregation_motor_diameter,
      segregation_motor_radius,
      segregation_motor_height,
      segregation_motor_bottom_y,
      segregation_motor_top_y,
      segregation_spindle_diameter,
      segregation_spindle_radius,
      segregation_bearing_outer_dia,
      segregation_bearing_radius,
      segregation_bearing_height,
      segregation_bracket_span,
      segregation_coupling_diameter,
      segregation_coupling_radius,
      segregation_coupling_height,
      decomp_load_cell_offset_z,
      drawer_wall_thickness,
      electronics_bay_housing_width,
      electronics_bay_housing_height,
      electronics_bay_housing_depth,
      electronics_bay_y_bottom,
      food_door_corner_1_x,
      food_door_corner_1_z,
      food_door_corner_2_x,
      food_door_corner_2_z,
      food_door_chord_mid_x,
      food_door_chord_mid_z,
      food_door_chord_length,
      food_door_chord_angle,
    },

    // Scene units (meters for Three.js: 1 unit = 1 m)
    scene: {
      outer_diameter: params.outer_diameter * UNIT_SCALE,
      outer_radius: outer_radius * UNIT_SCALE,
      inner_diameter: (inner_radius * 2) * UNIT_SCALE,
      inner_radius: inner_radius * UNIT_SCALE,
      shell_wall_thickness: params.shell_wall_thickness * UNIT_SCALE,
      overall_height: params.overall_height * UNIT_SCALE,

      input_section_height: params.input_section_height * UNIT_SCALE,
      middle_section_height: params.middle_section_height * UNIT_SCALE,
      leachate_section_height: params.leachate_section_height * UNIT_SCALE,

      organic_cutting_headroom: (params.organic_cutting_headroom || 10) * UNIT_SCALE,
      y_cutting_headroom_bottom: y_cutting_headroom_bottom * UNIT_SCALE,
      y_cutting_headroom_top: y_cutting_headroom_top * UNIT_SCALE,
      cutting_headroom_height: cutting_headroom_height * UNIT_SCALE,
      organic_cutting_height: params.organic_cutting_height * UNIT_SCALE,
      organic_storage_height: params.organic_storage_height * UNIT_SCALE,
      organic_storage_decomposition_gap: params.organic_storage_decomposition_gap * UNIT_SCALE,
      organic_decomposition_height: params.organic_decomposition_height * UNIT_SCALE,
      organic_allocated_height: organic_allocated_height * UNIT_SCALE,
      unresolved_middle_allocation: unresolved_middle_allocation * UNIT_SCALE,
      y_unresolved_middle_bottom: y_unresolved_middle_bottom * UNIT_SCALE,
      y_unresolved_middle_top: y_unresolved_middle_top * UNIT_SCALE,

      output_drawer_start_from_middle_bottom: params.output_drawer_start_from_middle_bottom * UNIT_SCALE,

      y_ground: 0,
      y_leachate_boundary: y_leachate_boundary * UNIT_SCALE, // 0.1 m
      y_middle_output_datum: y_middle_output_datum * UNIT_SCALE, // 0.37 m
      y_input_boundary: y_input_boundary * UNIT_SCALE,       // 0.805 m
      y_top: y_top * UNIT_SCALE,                             // 0.9 m

      middle_bottom: middle_bottom * UNIT_SCALE,
      middle_top: middle_top * UNIT_SCALE,
      storage_bottom: storage_bottom * UNIT_SCALE,

      // Chamber boundary elevations & heights in scene units
      y_cutting_bottom: y_cutting_bottom * UNIT_SCALE,
      y_cutting_top: y_cutting_top * UNIT_SCALE,
      cutting_height: cutting_height * UNIT_SCALE,

      y_storage_bottom: y_storage_bottom * UNIT_SCALE,
      y_storage_top: y_storage_top * UNIT_SCALE,
      storage_height: storage_height * UNIT_SCALE,

      y_gap_bottom: y_gap_bottom * UNIT_SCALE,
      y_gap_top: y_gap_top * UNIT_SCALE,
      gap_height: gap_height * UNIT_SCALE,

      y_decomp_bottom: y_decomp_bottom * UNIT_SCALE,
      y_decomp_top: y_decomp_top * UNIT_SCALE,
      decomp_height: decomp_height * UNIT_SCALE,

      // Non-Organic Output Section & Drawer Metrics in scene units:
      output_section_start_datum_y: y_non_organic_output_top * UNIT_SCALE, // 0.48 m
      y_non_organic_output_top: y_non_organic_output_top * UNIT_SCALE,     // 0.48 m
      y_non_organic_output_bottom: y_non_organic_output_bottom * UNIT_SCALE, // 0.10 m
      non_organic_output_height: non_organic_output_height * UNIT_SCALE,   // 0.38 m

      // Nested Strainer Basket Envelope in scene units:
      y_strainer_basket_top: y_strainer_basket_top * UNIT_SCALE,
      y_strainer_basket_bottom: y_strainer_basket_bottom * UNIT_SCALE,
      strainer_basket_height: strainer_basket_height * UNIT_SCALE,
      strainer_basket_wall_inset: strainer_basket_wall_inset * UNIT_SCALE,
      strainer_basket_drainage_sump_height: strainer_basket_drainage_sump_height * UNIT_SCALE,
      strainer_basket_top_lip_inset: strainer_basket_top_lip_inset * UNIT_SCALE,
      drawer_perimeter_clearance: drawer_perimeter_clearance * UNIT_SCALE,

      sector_orientation_rad: (params.sector_orientation_deg * Math.PI) / 180,
      organic_sector_rad: (params.organic_sector_angle * Math.PI) / 180,
      inorganic_sector_rad: (params.inorganic_sector_angle * Math.PI) / 180,
      food_sector_rad: (params.food_sector_angle * Math.PI) / 180,
      divider_wall_thickness: params.divider_wall_thickness * UNIT_SCALE,

      central_divider_length: central_divider_length * UNIT_SCALE,
      radial_divider_length: radial_divider_length * UNIT_SCALE,
      divider_height: divider_height * UNIT_SCALE,
      divider_y_center: divider_y_center * UNIT_SCALE,
      divider_y_bottom: divider_y_bottom * UNIT_SCALE,
      divider_y_top: divider_y_top * UNIT_SCALE,

      // Input & Segregation Assembly in scene units:
      y_rotating_base: y_rotating_base * UNIT_SCALE,
      rotating_base_x: rotating_base_x * UNIT_SCALE,
      rotating_base_z: rotating_base_z * UNIT_SCALE,
      rotating_base_length: rotating_base_length * UNIT_SCALE,
      rotating_base_lobe_width: rotating_base_lobe_width * UNIT_SCALE,
      rotating_base_waist_width: rotating_base_waist_width * UNIT_SCALE,
      rotating_base_thickness: rotating_base_thickness * UNIT_SCALE,

      funnel_opening_diameter: funnel_opening_diameter * UNIT_SCALE,
      funnel_opening_radius: funnel_opening_radius * UNIT_SCALE,
      funnel_top_y: funnel_top_y * UNIT_SCALE,
      funnel_bottom_y: funnel_bottom_y * UNIT_SCALE,
      funnel_height: funnel_height * UNIT_SCALE,
      funnel_top_radius: funnel_top_radius * UNIT_SCALE,
      funnel_bottom_radius: funnel_bottom_radius * UNIT_SCALE,
      funnel_y_center: funnel_y_center * UNIT_SCALE,

      display_width: display_width * UNIT_SCALE,
      display_height: display_height * UNIT_SCALE,
      display_depth: display_depth * UNIT_SCALE,
      display_tilt_deg,
      display_mount_x: display_mount_x * UNIT_SCALE,
      display_mount_y: display_mount_y * UNIT_SCALE,
      display_mount_z: display_mount_z * UNIT_SCALE,

      camera_width: camera_width * UNIT_SCALE,
      camera_height: camera_height * UNIT_SCALE,
      camera_depth: camera_depth * UNIT_SCALE,
      camera_lens_diameter: camera_lens_diameter * UNIT_SCALE,
      ultrasonic_width: ultrasonic_width * UNIT_SCALE,
      ultrasonic_height: ultrasonic_height * UNIT_SCALE,
      ultrasonic_depth: ultrasonic_depth * UNIT_SCALE,
      ultrasonic_transducer_diameter: ultrasonic_transducer_diameter * UNIT_SCALE,
      sensor_mount_y: sensor_mount_y * UNIT_SCALE,
      sensor_mount_z: sensor_mount_z * UNIT_SCALE,
      camera_mount_x: camera_mount_x * UNIT_SCALE,
      ultrasonic_mount_x: ultrasonic_mount_x * UNIT_SCALE,

      // Organic Cutting Mechanism metrics (scene units: meters):
      cutting_collar_diameter: cutting_collar_diameter * UNIT_SCALE,
      cutting_collar_radius: cutting_collar_radius * UNIT_SCALE,
      cutting_collar_wall_thickness: cutting_collar_wall_thickness * UNIT_SCALE,
      cutting_collar_inner_radius: cutting_collar_inner_radius * UNIT_SCALE,
      cutting_motor_diameter: cutting_motor_diameter * UNIT_SCALE,
      cutting_motor_radius: cutting_motor_radius * UNIT_SCALE,
      cutting_motor_height: cutting_motor_height * UNIT_SCALE,
      cutting_shaft_diameter: cutting_shaft_diameter * UNIT_SCALE,
      cutting_shaft_radius: cutting_shaft_radius * UNIT_SCALE,
      cutting_shaft_length: cutting_shaft_length * UNIT_SCALE,
      cutting_rotor_span: cutting_rotor_span * UNIT_SCALE,
      cutting_rotor_radius: cutting_rotor_radius * UNIT_SCALE,
      cutting_blade_width: cutting_blade_width * UNIT_SCALE,
      cutting_blade_thickness: cutting_blade_thickness * UNIT_SCALE,
      cutting_blade_pitch_deg,
      cutting_hook_length: cutting_hook_length * UNIT_SCALE,
      cutting_screen_aperture: cutting_screen_aperture * UNIT_SCALE,
      cutting_screen_thickness: cutting_screen_thickness * UNIT_SCALE,
      cutting_blade_screen_clearance: cutting_blade_screen_clearance * UNIT_SCALE,
      cutting_center_x: cutting_center_x * UNIT_SCALE,
      cutting_center_z: cutting_center_z * UNIT_SCALE,
      cutting_screen_y: cutting_screen_y * UNIT_SCALE,
      cutting_blade_y: cutting_blade_y * UNIT_SCALE,
      cutting_shaft_bottom_y: cutting_shaft_bottom_y * UNIT_SCALE,
      cutting_shaft_top_y: cutting_shaft_top_y * UNIT_SCALE,
      cutting_motor_bottom_y: cutting_motor_bottom_y * UNIT_SCALE,
      cutting_motor_top_y: cutting_motor_top_y * UNIT_SCALE,

      // Organic Storage Fan & Odor Mitigation Metrics (scene units: meters):
      organic_fan_size: organic_fan_size * UNIT_SCALE,
      organic_fan_depth: organic_fan_depth * UNIT_SCALE,
      organic_fan_bore_diameter: organic_fan_bore_diameter * UNIT_SCALE,
      organic_fan_bore_radius: organic_fan_bore_radius * UNIT_SCALE,
      organic_fan_hub_diameter: organic_fan_hub_diameter * UNIT_SCALE,
      organic_fan_hub_radius: organic_fan_hub_radius * UNIT_SCALE,
      organic_fan_blade_count,
      organic_fan_filter_diameter: organic_fan_filter_diameter * UNIT_SCALE,
      organic_fan_filter_radius: organic_fan_filter_radius * UNIT_SCALE,
      organic_fan_filter_depth: organic_fan_filter_depth * UNIT_SCALE,
      organic_fan_elevation: organic_fan_elevation * UNIT_SCALE,
      organic_fan_filter_x: organic_fan_filter_x * UNIT_SCALE,
      organic_fan_casing_x: organic_fan_casing_x * UNIT_SCALE,
      organic_fan_x: organic_fan_x * UNIT_SCALE,
      organic_fan_z: organic_fan_z * UNIT_SCALE,
      organic_fan_y: organic_fan_y * UNIT_SCALE,

      // Organic Storage Door Mechanism & Base Assembly Metrics (scene units: meters):
      door_thickness: door_thickness * UNIT_SCALE, // Exactly 0.004 m
      door_clearance: door_clearance * UNIT_SCALE,
      door_slope_angle_deg,
      door_central_spine_width: door_central_spine_width * UNIT_SCALE,
      door_central_spine_height: door_central_spine_height * UNIT_SCALE,
      door_hinge_barrel_diameter: door_hinge_barrel_diameter * UNIT_SCALE,
      door_hinge_barrel_radius: door_hinge_barrel_radius * UNIT_SCALE,
      door_hinge_pin_diameter: door_hinge_pin_diameter * UNIT_SCALE,
      door_drainage_screen_thickness: door_drainage_screen_thickness * UNIT_SCALE,
      door_drainage_screen_gap: door_drainage_screen_gap * UNIT_SCALE,
      door_drain_hole_diameter: door_drain_hole_diameter * UNIT_SCALE,
      door_vibrator_length: door_vibrator_length * UNIT_SCALE,
      door_vibrator_diameter: door_vibrator_diameter * UNIT_SCALE,
      y_door_base: y_door_base * UNIT_SCALE,
      y_door_mesh_bottom: y_door_mesh_bottom * UNIT_SCALE,
      y_door_mesh_top: y_door_mesh_top * UNIT_SCALE,
      spine_x_start: spine_x_start * UNIT_SCALE,
      spine_x_end: spine_x_end * UNIT_SCALE,
      spine_length: spine_length * UNIT_SCALE,
      spine_x_center: spine_x_center * UNIT_SCALE,
      spine_y_center: spine_y_center * UNIT_SCALE,

      // Organic Decomposition Chamber & Agitator Metrics (scene units: meters):
      agitator_mount_diameter: agitator_mount_diameter * UNIT_SCALE,
      agitator_mount_radius: agitator_mount_radius * UNIT_SCALE,
      agitator_mount_height: agitator_mount_height * UNIT_SCALE,
      agitator_shaft_diameter: agitator_shaft_diameter * UNIT_SCALE,
      agitator_shaft_radius: agitator_shaft_radius * UNIT_SCALE,
      agitator_shaft_height: agitator_shaft_height * UNIT_SCALE,
      agitator_hub_diameter: agitator_hub_diameter * UNIT_SCALE,
      agitator_hub_radius: agitator_hub_radius * UNIT_SCALE,
      agitator_hub_height: agitator_hub_height * UNIT_SCALE,
      agitator_floor_clearance: agitator_floor_clearance * UNIT_SCALE,
      agitator_paddle_span: agitator_paddle_span * UNIT_SCALE,
      agitator_paddle_radius: agitator_paddle_radius * UNIT_SCALE,
      agitator_paddle_arm_length: agitator_paddle_arm_length * UNIT_SCALE,
      agitator_paddle_width: agitator_paddle_width * UNIT_SCALE,
      agitator_paddle_thickness: agitator_paddle_thickness * UNIT_SCALE,
      agitator_paddle_pitch_deg,
      agitator_tip_upright_height: agitator_tip_upright_height * UNIT_SCALE,
      agitator_tip_upright_width: agitator_tip_upright_width * UNIT_SCALE,
      agitator_center_x: agitator_center_x * UNIT_SCALE,
      agitator_center_z: agitator_center_z * UNIT_SCALE,
      agitator_mount_bottom_y: agitator_mount_bottom_y * UNIT_SCALE,
      agitator_mount_top_y: agitator_mount_top_y * UNIT_SCALE,
      agitator_shaft_bottom_y: agitator_shaft_bottom_y * UNIT_SCALE,
      agitator_shaft_top_y: agitator_shaft_top_y * UNIT_SCALE,
      agitator_paddle_y: agitator_paddle_y * UNIT_SCALE,
      agitator_hub_y: agitator_hub_y * UNIT_SCALE,

      // Organic Decomposition Chamber Sensors (scene units: meters):
      decomp_load_cell_diameter: decomp_load_cell_diameter * UNIT_SCALE,
      decomp_load_cell_height: decomp_load_cell_height * UNIT_SCALE,
      decomp_load_cell_x: decomp_load_cell_x * UNIT_SCALE,
      decomp_load_cell_y: decomp_load_cell_y * UNIT_SCALE,
      decomp_load_cell_z: decomp_load_cell_z * UNIT_SCALE,
      decomp_temp_sensor_probe_length: decomp_temp_sensor_probe_length * UNIT_SCALE,
      decomp_temp_sensor_probe_diameter: decomp_temp_sensor_probe_diameter * UNIT_SCALE,
      decomp_temp_sensor_x: decomp_temp_sensor_x * UNIT_SCALE,
      decomp_temp_sensor_y: decomp_temp_sensor_y * UNIT_SCALE,
      decomp_temp_sensor_z: decomp_temp_sensor_z * UNIT_SCALE,
      decomp_moisture_sensor_length: decomp_moisture_sensor_length * UNIT_SCALE,
      decomp_moisture_sensor_prong_spacing: decomp_moisture_sensor_prong_spacing * UNIT_SCALE,
      decomp_moisture_sensor_x: decomp_moisture_sensor_x * UNIT_SCALE,
      decomp_moisture_sensor_y: decomp_moisture_sensor_y * UNIT_SCALE,
      decomp_moisture_sensor_z: decomp_moisture_sensor_z * UNIT_SCALE,

      // Leftover Food 90° Sector Refinements (scene units: meters):
      food_top_closure_y: food_top_closure_y * UNIT_SCALE,
      food_door_top_y: food_door_top_y * UNIT_SCALE,
      food_door_bottom_y: food_door_bottom_y * UNIT_SCALE,
      food_door_height: food_door_height * UNIT_SCALE,
      food_door_arc_padding: food_door_arc_padding * UNIT_SCALE,
      food_door_delta_theta,
      food_door_theta_start,
      food_door_theta_length,
      food_door_theta_end,
      food_door_arc_width: food_door_arc_width * UNIT_SCALE,

      // Phase 3 Mechanical Architecture metrics (scene units: meters):
      segregation_hub_diameter: segregation_hub_diameter * UNIT_SCALE,
      segregation_hub_radius: segregation_hub_radius * UNIT_SCALE,
      segregation_hub_height: segregation_hub_height * UNIT_SCALE,
      segregation_hub_bottom_y: segregation_hub_bottom_y * UNIT_SCALE,
      segregation_hub_top_y: segregation_hub_top_y * UNIT_SCALE,
      segregation_motor_diameter: segregation_motor_diameter * UNIT_SCALE,
      segregation_motor_radius: segregation_motor_radius * UNIT_SCALE,
      segregation_motor_height: segregation_motor_height * UNIT_SCALE,
      segregation_motor_bottom_y: segregation_motor_bottom_y * UNIT_SCALE,
      segregation_motor_top_y: segregation_motor_top_y * UNIT_SCALE,
      segregation_spindle_diameter: segregation_spindle_diameter * UNIT_SCALE,
      segregation_spindle_radius: segregation_spindle_radius * UNIT_SCALE,
      segregation_bearing_outer_dia: segregation_bearing_outer_dia * UNIT_SCALE,
      segregation_bearing_radius: segregation_bearing_radius * UNIT_SCALE,
      segregation_bearing_height: segregation_bearing_height * UNIT_SCALE,
      segregation_bracket_span: segregation_bracket_span * UNIT_SCALE,
      segregation_coupling_diameter: segregation_coupling_diameter * UNIT_SCALE,
      segregation_coupling_radius: segregation_coupling_radius * UNIT_SCALE,
      segregation_coupling_height: segregation_coupling_height * UNIT_SCALE,
      decomp_load_cell_offset_z: decomp_load_cell_offset_z * UNIT_SCALE,
      drawer_wall_thickness: drawer_wall_thickness * UNIT_SCALE,
      electronics_bay_housing_width: electronics_bay_housing_width * UNIT_SCALE,
      electronics_bay_housing_height: electronics_bay_housing_height * UNIT_SCALE,
      electronics_bay_housing_depth: electronics_bay_housing_depth * UNIT_SCALE,
      electronics_bay_y_bottom: electronics_bay_y_bottom * UNIT_SCALE,
      food_door_corner_1_x: food_door_corner_1_x * UNIT_SCALE,
      food_door_corner_1_z: food_door_corner_1_z * UNIT_SCALE,
      food_door_corner_2_x: food_door_corner_2_x * UNIT_SCALE,
      food_door_corner_2_z: food_door_corner_2_z * UNIT_SCALE,
      food_door_chord_mid_x: food_door_chord_mid_x * UNIT_SCALE,
      food_door_chord_mid_z: food_door_chord_mid_z * UNIT_SCALE,
      food_door_chord_length: food_door_chord_length * UNIT_SCALE,
      food_door_chord_angle, // Unscaled radians
    },
  };
}
