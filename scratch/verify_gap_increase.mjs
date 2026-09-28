import { getDerivedGeometry, GOMIKIN_BASELINE_PARAMS } from '../src/utils/parameters.js';

console.log('Testing GOMIKIN_BASELINE_PARAMS:');
console.log('overall_height:', GOMIKIN_BASELINE_PARAMS.overall_height);
console.log('middle_section_height:', GOMIKIN_BASELINE_PARAMS.middle_section_height);
console.log('organic_storage_decomposition_gap:', GOMIKIN_BASELINE_PARAMS.organic_storage_decomposition_gap);
console.log('organic_storage_height:', GOMIKIN_BASELINE_PARAMS.organic_storage_height);
console.log('organic_decomposition_height:', GOMIKIN_BASELINE_PARAMS.organic_decomposition_height);
console.log('organic_cutting_height:', GOMIKIN_BASELINE_PARAMS.organic_cutting_height);
console.log('organic_cutting_headroom:', GOMIKIN_BASELINE_PARAMS.organic_cutting_headroom);

const derived = getDerivedGeometry();
console.log('\n--- DERIVED ELEVATIONS (MM) ---');
console.log('Ground Datum (Y=0):', derived.mm.y_ground);
console.log('Leachate Boundary (Y=100):', derived.mm.y_leachate_boundary);
console.log('Decomp Bottom:', derived.mm.y_decomp_bottom, 'Decomp Top:', derived.mm.y_decomp_top, 'Height:', derived.mm.decomp_height);
console.log('Middle Output Datum:', derived.mm.y_middle_output_datum);
console.log('Gap Bottom:', derived.mm.y_gap_bottom, 'Gap Top:', derived.mm.y_gap_top, 'Height:', derived.mm.gap_height);
console.log('Storage Bottom:', derived.mm.y_storage_bottom, 'Storage Top:', derived.mm.y_storage_top, 'Height:', derived.mm.storage_height);
console.log('Storage Fan Elevation:', derived.mm.organic_fan_elevation);
console.log('Storage Door Base:', derived.mm.storage_bottom, 'Door Thickness:', derived.mm.door_thickness);
console.log('Cutting Bottom:', derived.mm.y_cutting_bottom, 'Cutting Top:', derived.mm.y_cutting_top, 'Height:', derived.mm.cutting_height);
console.log('Cutting Headroom Bottom:', derived.mm.y_cutting_headroom_bottom, 'Top:', derived.mm.y_cutting_headroom_top, 'Height:', derived.mm.cutting_headroom_height);
console.log('Middle Top / Input Boundary:', derived.mm.y_input_boundary);
console.log('Middle Section Height:', derived.mm.middle_section_height);
console.log('Divider Height:', derived.mm.divider_height, 'Bottom:', derived.mm.divider_y_bottom, 'Top:', derived.mm.divider_y_top);
console.log('Rotating Base Datum:', derived.mm.y_rotating_base);
console.log('Funnel Bottom:', derived.mm.funnel_bottom_y, 'Top:', derived.mm.funnel_top_y, 'Height:', derived.mm.funnel_height);
console.log('Top Plane:', derived.mm.y_top);
console.log('Overall Height:', derived.mm.overall_height);

console.log('\n--- NON-ORGANIC SECTORS ---');
console.log('Non-organic Output Top:', derived.mm.y_non_organic_output_top, 'Bottom:', derived.mm.y_non_organic_output_bottom, 'Height:', derived.mm.non_organic_output_height);
console.log('Leftover Food Top Closure Y:', derived.mm.food_top_closure_y);
console.log('Leftover Food Door Bottom:', derived.mm.food_door_bottom_y, 'Top:', derived.mm.food_door_top_y, 'Height:', derived.mm.food_door_height);
console.log('Leftover Food Arc Padding:', derived.mm.food_door_arc_padding);

console.log('\n--- STACK VERIFICATION ---');
const vSum = derived.mm.input_section_height + derived.mm.middle_section_height + derived.mm.leachate_section_height;
console.log(`${derived.mm.input_section_height} + ${derived.mm.middle_section_height} + ${derived.mm.leachate_section_height} = ${vSum} mm (matches overall_height: ${vSum === derived.mm.overall_height})`);

const orgSum = derived.mm.cutting_headroom_height + derived.mm.cutting_height + derived.mm.storage_height + derived.mm.gap_height + derived.mm.decomp_height;
console.log(`${derived.mm.cutting_headroom_height} + ${derived.mm.cutting_height} + ${derived.mm.storage_height} + ${derived.mm.gap_height} + ${derived.mm.decomp_height} = ${orgSum} mm (matches middle_section_height: ${orgSum === derived.mm.middle_section_height})`);
