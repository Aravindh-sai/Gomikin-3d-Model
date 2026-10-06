# Gomikin 3D Project Context

> **Last Updated:** 2026-10-06  
> **Status:** Active Development — Dissection Animation & 33-Component Catalogue System Implemented  
> **Rule Compliance:** Updated after every change to track project context, architecture, and ongoing evolution.

---

## 1. Project Overview

**Gomikin** is an automated household smart waste segregation and in-vessel processing apparatus.  
This web-based interactive 3D prototype provides a high-fidelity, real-time visualization of the Gomikin internal mechanics, component hierarchy, and physical workflows.

### Baseline Design: Alternative Embodiment B
The prototype implements **Alternative Embodiment B** (a practical, cost-effective household iteration of the Gomikin patent):
- **Batch classification:** Intake funnel directs waste to an orientation platform with Edge-AI computer vision and ultrasonic level sensing.
- **Three isolated physical sectors:**
  1. **180° Organic Processing Sector:** High-speed cross-shear cutting collar, 8 mm sizing mesh, dual-layer storage chamber with hydrostatic drainage, synchronized drop doors, and lower thermophilic decomposition chamber with helical agitator.
  2. **90° Inorganic Sector (+X, -Z):** Passive vertical drop shaft into an inorganic collection output drawer.
  3. **90° Leftover Food Sector (+X, +Z):** 55° ramp access door, dual-layer perforated food tray separating solids from liquids, and sloped leachate collection drainage.
- **Base / Leachate Plinth (Y = 0 to 100 mm):** Central leachate drawer receiving drainage from all chambers, removable LiFePO4 battery pack, and caster wheels.

---

## 2. Technology Stack

- **Core:** Vanilla JavaScript (ES Modules), HTML5, Vanilla CSS (dark industrial theme).
- **3D Graphics Engine:** [Three.js](https://threejs.org/) (`^0.186.0`) with `USDLoader` and `OrbitControls`.
- **Bundler / Dev Server:** [Vite](https://vitejs.dev/) (`^8.3.0`).
- **Testing & Headless Verification:** [Playwright](https://playwright.dev/) (`^1.63.0`) for end-to-end visual tests and transform verifications in `scratch/`.

---

## 3. Coordinate System & Master Geometric Dimensions

Authoritative reference: [`docs/design_specs.md`](file:///c:/Projects/Gomikin-3d-Model/docs/design_specs.md) and [`docs/master_geometry.md`](file:///c:/Projects/Gomikin-3d-Model/docs/master_geometry.md).

- **Coordinate System:** Standard Three.js Right-Handed Cartesian
  - **Origin $(0, 0, 0)$:** Ground contact center at bottom plinth base.
  - **$+X$:** Right (Inorganic and Leftover Food sectors).
  - **$-X$:** Left (Organic Processing sector).
  - **$+Y$:** Vertical Elevation (Upwards).
  - **$+Z$:** Front facing standing user (User OLED display, leftover food drawer, service drawers).
  - **$-Z$:** Rear (Dome hood, exhaust chimney, and activated carbon filter).

### Master Dimensions
| Parameter | Value | Elevation Range | Description |
|---|---|---|---|
| **Outer Diameter** | 500 mm | — | Cylindrical shell nominal OD |
| **Overall Height** | 1020 mm | $Y = 0 \to 1020\text{ mm}$ | Total vertical apparatus envelope |
| **Top Input Section** | 95 mm | $Y = 925 \to 1020\text{ mm}$ | Funnel, 2-axis base, camera, ultrasonic, OLED |
| **Middle Section** | 825 mm | $Y = 100 \to 925\text{ mm}$ | Internal functional chambers & dividers |
| **Leachate Plinth** | 100 mm | $Y = 0 \to 100\text{ mm}$ | Drainage drawer, battery cartridge, caster wheels |
| **Dividers** | 825 mm | $Y = 100 \to 925\text{ mm}$ | Central (180°) & Radial (90°) walls terminate at $Y = 925\text{ mm}$ |
| **Organic Cutting Collar** | 25 mm | $Y = 890 \to 915\text{ mm}$ | 10 mm headroom above ($Y = 915 \to 925\text{ mm}$) |
| **Organic Storage Chamber** | 270 mm | $Y = 620 \to 890\text{ mm}$ | Storage & drainage plate |
| **Inter-chamber Clearance Gap** | 250 mm | $Y = 370 \to 620\text{ mm}$ | Drop door swinging clearance |
| **Decomposition Chamber** | 270 mm | $Y = 100 \to 370\text{ mm}$ | Thermophilic curing vessel & agitator |
| **Output Drawer Start Datum** | 380 mm | $Y = 480\text{ mm}$ | Common architectural datum for non-organic drawers |

---

## 4. Dual-Model Architecture & Codebase Structure

The project incorporates two complementary representations:

```
src/
├── main.js                          # Application bootstrap & render loop
├── scene/
│   ├── scene.js                     # Three.js WebGLRenderer, dark studio background, ground grid
│   ├── camera.js                    # Perspective camera & OrbitControls initialization
│   └── lighting.js                  # 3-point key/fill/rim studio lighting
├── components/
│   ├── componentRegistry.js         # Indexes 33 CAD meshes from Fusion 360 USDZ assembly
│   ├── envelope.js                  # Complete procedural Three.js reconstruction (5300+ LOC)
│   └── housing.js                   # Legacy procedural housing group
├── animation/
│   ├── dissectionAnimationSystem.js # Master state machine for 3-phase dissection & catalogue
│   ├── dissectionChoreography.js    # 7-row layout math, 3D exploded vectors & presentation angles
│   ├── componentDetailController.js # Single-component CAD inspection mode (MMB/Shift+MMB/Wheel)
│   ├── componentFocusController.js  # Focus & camera framing controller
│   └── workflowController.js        # Automated process sequence simulation (Organic/Inorganic/Food)
├── interaction/
│   ├── inspectionController.js      # Module-by-module static inspection presets
│   └── demoController.js            # Legacy continuous mechanism driver
├── ui/
│   ├── demoUI.js                    # Legacy floating HUD dashboard
│   ├── presentationUI.js            # Presentation mode dock
│   ├── envelopeUI.js                # Envelope parameter controls
│   └── unifiedInspectionUI.js       # Right-side unified engineering console
└── utils/
    ├── parameters.js                # Single source of truth for baseline parameters
    └── constants.js                 # Global constants & units
```

### Representation 1: Procedural Parametric Envelope (`envelope.js`)
- Dynamically derives all 30+ physical components from `parameters.js`.
- Capable of resizing, cutaway shell toggling, and simulating mechanical motion.
- Preserved intact; can be toggled via `gomikinEnvelope.visible`.

### Representation 2: Fusion 360 USDZ Model (`gomikin_disection.usdz`)
- Loaded via `USDLoader` into `Fusion360_USDZ_Model`.
- Parsed by `buildComponentRegistry()`, registering **33 unique component meshes**:
  1. `Funnel`
  2. `Main_Housing`
  3. `Rightside_Divider`
  4. `central_divider`
  5. `storage_chamber`
  6. `decompostion_chamber`
  7. `leachate_section`
  8. `inorganic_output_chamber`
  9. `leftover_food_outpu_section`
  10. `door_mechanism_left`
  11. `door_mechanism_right`
  12. `cutting_blades`
  13. `cutting_motor`
  14. `cutting_mesh`
  15. `circular_frame`
  16. `agitator`
  17. `exhaust_fan`
  18. `carbon_filter`
  19. `servo`
  20. `battery_pack`
  21. `control_unit`
  22. `camera_module`
  23. `ultrasonic_sensor`
  24. `temperature_sensor`
  25. `moisture_sensor`
  26. `load_cell`
  27. `motor_support`
  28. `cutting_motor_support`
  29. `top_closuer`
  30. `leftover_food_closur`
  31. `bottom_of_decomposition_section`
  32: `rotating_base`
  33: `display`

---

## 5. Dissection Animation & 3D Catalogue System

The core interactive feature of the latest version is the **Gomikin Dissection Animation System**:

### 1. State Machine
```
[ASSEMBLED]  ──(Click "DISSECT GOMIKIN")──>  [DISSECTION (Phase 1 & 2)]  ──>  [EXPLODED (Phase 3 Catalogue Grid)]
     ▲                                                                                    │
     └──────────────────────────(Click "RESET GOMIKIN")───────────────────────────────────┘
```
- **Phase 1: 3D Explosion ($0.0 \to 0.35$ progress):** Components move outward radially along mechanical disassembly vectors; the cylindrical housing pulls back to reveal internal assemblies.
- **Phase 2: Transition & Reorientation ($0.35 \to 0.70$ progress):** Components smoothly transition from exploded positions towards their assigned catalogue coordinates and presentation angles.
- **Phase 3: 7-Row Catalogue Grid ($0.70 \to 1.0$ progress):** Components lock into an organized isometric 7-row layout with zero overlap, and 33 HTML badges project onto screen space.

### 2. 7-Row Catalogue Layout
1. **Row 1 ($Y = 2.85\text{ m}$):** Input & Sensing (Funnel, Display, Camera, Ultrasonic, Load Cell)
2. **Row 2 ($Y = 1.95\text{ m}$):** Filtration & Monitoring (Temp Sensor, Moisture Sensor, Circular Frame, Mesh, Blades)
3. **Row 3 ($Y = 1.05\text{ m}$):** Cutting Drive & Agitation (Cutting Motor, Motor Supports, Agitator, Decomposition Base)
4. **Row 4 ($Y = 0.15\text{ m}$):** Organic Processing (Storage Chamber, Decomposition Chamber, Left/Right Drop Doors)
5. **Row 5 ($Y = -0.75\text{ m}$):** Segregation & Output (Central Divider, Right Divider, Inorganic Chamber, Food Output)
6. **Row 6 ($Y = -1.65\text{ m}$):** Air & Power (Food Closure, Top Closure, Exhaust Fan, Carbon Filter, Control Unit)
7. **Row 7 ($Y = -2.55\text{ m}$):** Structure & Motion (Battery Pack, Servo, Rotating Base, Main Housing, Leachate Base)

### 3. Component Detail Inspection Mode (`componentDetailController.js`)
- **Direct Selection:** Left-click on any component in the catalogue grid isolates it, smoothly hides all other 32 components, and centers the part.
- **CAD Viewport Controls:**
  - **In Catalogue Grid:** Mouse Wheel = Zoom Camera, Middle Mouse Button (MMB) = Pan Camera, Shift + MMB = Orbit Camera. Left click reserved exclusively for component selection.
  - **In Component Detail Mode:** Mouse Wheel = Zoom Component, MMB = Pan Component, Shift + MMB = Orbit Component.
- **HUD & Return:** Clicking the selected component or the floating "← BACK TO CATALOGUE" button returns smoothly to the full catalogue without losing state.
- **Complete Reversibility:** Clicking "RESET GOMIKIN" resets all 33 components back to their exact original CAD positions and rotations ($0.000\text{ mm}$ mismatch tolerance).

---

## 6. How to Run & Verify

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in a browser.

2. **Build Production Assets:**
   ```bash
   npm run build
   ```

3. **Verification Scripts (Playwright):**
   - `scratch/verify_interactive_dissection.cjs`: Tests forward dissection, catalogue layout, badges, and reset restoration.
   - `scratch/verify_detail_refinement.cjs`: Tests CAD controls, component detail mode isolation, and HUD interaction.
   - `scratch/verify_all_refinements.cjs`: Full end-to-end regression pass.
