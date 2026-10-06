# Gomikin 3D Project Context

> **Last Updated:** 2026-10-06  
> **Status:** Active Development — Modular Dissection Views & Physical Waste Flow Simulation Implemented  
> **Rule Compliance:** Updated after every change to track project context, architecture, and ongoing evolution.

---

## 1. Project Overview

**Gomikin** is an automated household smart waste segregation and in-vessel biological processing apparatus.  
This web-based interactive 3D prototype provides a high-fidelity, real-time visualization of the Gomikin internal mechanics, component hierarchy, modular assemblies, and physical process workflows.

### Baseline Design: Alternative Embodiment B
The prototype implements **Alternative Embodiment B** (a practical, cost-effective household iteration of the Gomikin patent):
- **Batch classification:** Intake funnel directs waste to an orientation platform with Edge-AI computer vision and ultrasonic level sensing.
- **Three isolated physical sectors:**
  1. **180° Organic Processing Sector:** High-speed cross-shear cutting collar, 8 mm sizing mesh, dual-layer storage chamber with hydrostatic drainage, synchronized drop doors, and lower thermophilic decomposition chamber with helical agitator.
  2. **90° Inorganic Sector (+X, +Z):** Passive vertical drop shaft into an inorganic collection output drawer.
  3. **90° Leftover Food Sector (+X, -Z):** 55° ramp access door, dual-layer perforated food tray separating solids from liquids, and sloped leachate collection drainage.
- **Base / Leachate Plinth (Y = 0 to 100 mm):** Central leachate drawer receiving drainage from all chambers, removable LiFePO4 battery pack, and caster wheels.

---

## 2. Technology Stack

- **Core:** Vanilla JavaScript (ES Modules), HTML5, Vanilla CSS (dark industrial theme).
- **3D Graphics Engine:** [Three.js](https://threejs.org/) (`^0.186.0`) with `USDLoader` and `OrbitControls`.
- **Bundler / Dev Server:** [Vite](https://vitejs.dev/) (`^8.3.0`).
- **Testing & Headless Verification:** [Playwright](https://playwright.dev/) (`^1.63.0`) using local Chromium/Edge channels for visual UI and transform regression passes in `scratch/`.

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

## 4. Codebase Structure

```
src/
├── main.js                          # Application bootstrap & render loop
├── scene/
│   ├── scene.js                     # Three.js WebGLRenderer, dark studio background, ground grid
│   ├── camera.js                    # Perspective camera & OrbitControls initialization
│   └── lighting.js                  # 3-point key/fill/rim studio lighting
├── components/
│   ├── componentRegistry.js         # Indexes 33 CAD meshes from Fusion 360 USDZ assembly
│   ├── moduleRegistry.js            # Groups 33 components into 7 functional sub-assemblies
│   ├── envelope.js                  # Complete procedural Three.js reconstruction (5300+ LOC)
│   └── housing.js                   # Legacy procedural housing group
├── animation/
│   ├── moduleViewController.js      # Functional module isolation, ghosting, sub-assembly explosion
│   ├── physicalFlowController.js    # 3D waste object motion paths, particle fragmentation & kinematics
│   ├── dissectionAnimationSystem.js # Master state machine for 3-phase full dissection & catalogue
│   ├── dissectionChoreography.js    # 7-row layout math, 3D exploded vectors & presentation angles
│   ├── componentDetailController.js # Single-component CAD inspection mode (MMB/Shift+MMB/Wheel)
│   ├── componentFocusController.js  # Focus & camera framing controller
│   └── workflowController.js        # Automated process sequence simulation (Organic/Inorganic/Food)
├── interaction/
│   ├── inspectionController.js      # Module-by-module static inspection presets
│   └── demoController.js            # Legacy continuous mechanism driver
├── ui/
│   ├── modularControlBar.js         # Modern glassmorphism top navigation bar & flow playback dock
│   ├── demoUI.js                    # Legacy floating HUD dashboard
│   ├── presentationUI.js            # Presentation mode dock
│   ├── envelopeUI.js                # Envelope parameter controls
│   └── unifiedInspectionUI.js       # Right-side unified engineering console
└── utils/
    ├── parameters.js                # Single source of truth for baseline parameters
    └── constants.js                 # Global constants & units
```

---

## 5. Functional Engineering Modules (`moduleRegistry.js` & `moduleViewController.js`)

All 33 physical components are mapped into **7 functional sub-assembly modules**:

1. **Input & Intake Module (`input`):**
   - Components: `Funnel`, `rotating_base`, `display`, `camera_module`, `ultrasonic_sensor`, `servo`, `top_closuer`.
   - Focus: Receiving funnel, 2-axis orientable sorting platform, optical Edge-AI camera, acoustic depth sensor, status display.
2. **Organic Preprocessing & Cutting Module (`cutting`):**
   - Components: `cutting_motor`, `cutting_motor_support`, `motor_support`, `circular_frame`, `cutting_blades`, `cutting_mesh`.
   - Focus: High-speed drive motor, cross mounting braces, rotary shear cutting blades, 8 mm sizing mesh.
3. **Organic Storage & Drainage Module (`storage`):**
   - Components: `storage_chamber`, `door_mechanism_left`, `door_mechanism_right`.
   - Focus: 180° storage volume with hydrostatic drainage and synchronized drop doors.
4. **Decomposition & Agitation Module (`decomposition`):**
   - Components: `decompostion_chamber`, `agitator`, `bottom_of_decomposition_section`, `load_cell`, `temperature_sensor`, `moisture_sensor`.
   - Focus: Thermophilic digestion vessel, dual-helix mixing agitator, load cell, temperature & moisture telemetry.
5. **Inorganic Storage & Segregation Module (`inorganic`):**
   - Components: `inorganic_output_chamber`, `Rightside_Divider`, `central_divider`.
   - Focus: Dry recyclables vertical drop shaft, internal divider bulkheads, extraction drawer.
6. **Leftover Cooked Food Module (`leftover_food`):**
   - Components: `leftover_food_outpu_section`, `leftover_food_closur`.
   - Focus: 55° ramp access door, quadrant chamber, dual-layer perforated drainage tray.
7. **Chassis, Power & Air Handling Module (`chassis_power`):**
   - Components: `Main_Housing`, `leachate_section`, `battery_pack`, `control_unit`, `exhaust_fan`, `carbon_filter`.
   - Focus: Main cylindrical enclosure, leachate drainage plinth, LiFePO4 battery pack, master MCU, negative-pressure carbon filter.

### Modular View Capabilities:
- **Module Isolation:** Automatically centers and frames the camera onto the selected module; non-module components can be hidden or rendered as translucent ghost silhouettes ("Toggle Ghost Housing").
- **Sub-assembly Dissection ("Explode Module"):** Explodes only the components within that module outward along their mechanical disassembly axes with smooth cubic interpolation.
- **Coordinate Conversion:** Automatically converts world space meter offsets into Fusion 360 USDZ local coordinates ($X_{\text{local}} = X_{\text{world}} \times 1000$, $Y_{\text{local}} = -Z_{\text{world}} \times 1000$, $Z_{\text{local}} = Y_{\text{world}} \times 1000$).

---

## 6. Physical Waste Object Flow Simulation (`physicalFlowController.js`)

Simulates the physical trajectory of waste materials interacting with active CAD mechanisms:

1. **Organic Waste Journey:**
   - Funnel deposit ($Y = 1.06\text{ m} \to 0.945\text{ m}$)
   - Optical camera & ultrasonic scan cone flash
   - 2-axis rotating base tilts $30^\circ$ toward organic sector ($-X$)
   - Falls into cutting collar $\rightarrow$ `cutting_blades` spin at high speed ($\approx 25\text{ rad/s}$) $\rightarrow$ waste particle fragments into tumbling shredded pieces
   - Passes through sizing mesh into `storage_chamber`
   - Hydrostatic drainage: amber liquid droplets trickle downward through the center drain tube into `leachate_section`
   - `door_mechanism_left` and `door_mechanism_right` swing open $45^\circ \rightarrow$ batch drops into `decompostion_chamber`
   - `agitator` rotates, blending biomass with microbes
2. **Inorganic Recyclables Journey:**
   - Funnel deposit $\rightarrow$ classification scan $\rightarrow$ platform tilts toward 90° inorganic quadrant ($+X, +Z$) $\rightarrow$ clean vertical drop into lower collection drawer.
3. **Leftover Cooked Food Journey:**
   - `leftover_food_closur` door swings open $55^\circ$ ramp $\rightarrow$ cooked food slides in $\rightarrow$ door returns flush $\rightarrow$ moisture trickles down to leachate plinth.

### Playback Controls:
- Play / Pause, Timeline Scrubber (0% to 100%), Step-by-Step Navigation, 1x/2x Speed Toggle, and Live Step Callout Badges.

---

## 7. Glassmorphism Top Navigation Bar (`modularControlBar.js`)

- **Tabs:**
  - `[ 🏛️ Full Model ]` — Complete assembled appliance
  - `[ 📦 Modular Views ]` — Sub-bar to choose between the 7 functional sub-assemblies with exploded inspection
  - `[ ⚡ 33-Part Dissection ]` — Triggers the full 7-row exploded catalogue grid
  - `[ 🔄 Simulate Flow ]` — Opens the bottom flow playback dock with ghosted housing
