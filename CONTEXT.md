# Gomikin 3D Project Context

> **Last Updated:** 2026-10-14  
> **Status:** Active Development — Phase 1: Animation State & View Transition Reliability Complete  
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
│   ├── viewTransitionCoordinator.js # Authoritative central coordinator for view transitions & camera
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
  - `[ ⚡ 33-Part Dissection ]` — Triggers the 7-modular-cluster exploded catalogue with pod headers and canvas navigation
  - `[ 🔄 Simulate Flow ]` — Opens the bottom flow playback dock with ghosted housing

---

## 8. Dissection Navigation, Modular Clustering & Transition Enhancements

### 1. Canvas Panning & Navigation
- **Left-Click Drag:** Dragging on empty canvas space pans the 3D catalogue smoothly (`panGridCamera`). Clicks (<6px) on individual parts still open Detail View.
- **Right-Click Drag & MMB:** Right-click dragging pans canvas (or orbits with `Shift`/`Alt`). Middle Mouse Button also pans.
- **Visual Cursors:** Dynamic `grab` over canvas background, `grabbing` while dragging, and `pointer` over clickable badges and components.
- **Touch Support:** 1-finger drag pans canvas, 2-finger pinch zooms.

### 2. Modular / Category-Based Spatial Grouping & Generous Canvas Layout
- All 33 components are arranged across an expansive, uncongested canvas organized into **7 distinct Modular Pods**:
  - **Tier 1 — Input & Intake Pod** (7 parts, Cyan `#00ffcc`, $Y = +5.50\text{ m}$, Header $Y = +6.80\text{ m}$, span $X \in [-7.80 \to +7.80\text{ m}]$)
  - **Tier 2 — Organic Preprocessing & Cutting Pod** (6 parts, Sky Blue `#38bdf8`, $Y = +2.00\text{ m}$, Header $Y = +3.30\text{ m}$, span $X \in [-6.75 \to +6.75\text{ m}]$)
  - **Tier 3 — Organic Storage & Drainage Pod** (Dedicated Row, 3 parts, Purple `#a855f7`, $Y = -1.50\text{ m}$, Header $Y = -0.20\text{ m}$, span $X \in [-4.00 \to +4.00\text{ m}]$)
  - **Tier 4 — Decomposition & Agitation Pod** (6 parts, Green `#22c55e`, $Y = -5.00\text{ m}$, Header $Y = -3.70\text{ m}$, span $X \in [-6.75 \to +6.75\text{ m}]$)
  - **Tier 5 — Inorganic Recyclables & Cooked Food Pods** ($Y = -8.50\text{ m}$, Headers $Y = -7.20\text{ m}$):
    - Left: Inorganic Recyclables (3 parts, Cyan `#06b6d4`, $X \in [-7.60 \to -2.80\text{ m}]$)
    - Right: Cooked Food (2 parts, Amber `#f59e0b`, $X \in [+3.80 \to +6.60\text{ m}]$)
    - Separated by an expansive $6.6\text{ m}$ horizontal gulf
  - **Tier 6 — Chassis, Power & Air Handling Pod** (6 parts, Pink `#ec4899`, $Y = -12.00\text{ m}$, Header $Y = -10.70\text{ m}$, span $X \in [-6.75 \to +6.75\text{ m}]$)
- **Illuminated Module Pod Header Banners:** Each pod displays an interactive header banner with icon, module name, and part count. Clicking a pod banner glides the camera directly to center on that cluster.
- **Expansive Tier Separation:** $>3.5\text{ m}$ vertical clearance between tiers guarantees zero clutter, overlap, or congestion.

### 3. Dissection-Only Component Scaling & Initial Framing
- **Target Visual Diameter Scaled to $1.05\text{ m}$:** In Dissection mode, components are scaled up by $>2.5\times$ (`catalogueScaleMultiplier = clamp(1.05 / maxDim, 0.85, 95.0)`), presenting large, bold, highly readable CAD geometry.
- **Strict View Isolation:** The scale multiplier is evaluated solely during the Dissection catalogue phase ($p \ge 0.55$). Full Model, Modular Views, and Physical Flow Simulation retain 100% native CAD dimensions and scales.
- **Badge Clearance:** Component badge offsets are set to $0.75\text{ m}$ below component centers, keeping label cards comfortably separated from enlarged meshes.
- **Initial Camera Perspective:** Initial framing centers on the upper pods ($Y = 3.75\text{ m}$, $Z \approx 12.0\text{ m}$), allowing the user to naturally pan and scroll the canvas downward to explore all modules without squeezing everything onto one congested screen.

### 4. Efficient 3D Part Inspection & Rotation
- **Viewport Centering Alignment:** When entering Detail View, the selected component is centered dynamically to match the active camera focal target (`(camera.position.x, camera.position.y - 0.20, 0.0)`), perfectly and symmetrically framed between the top header card (`top: 76px`) and bottom CAD dock (`bottom: 24px`) regardless of where the user panned on the canvas.
- **Adaptive Detail Scaling:** Target visual diameter increased to $3.5\text{ m}$ (`clamp(3.5 / maxDim, 1.2, 280.0)`), presenting an imposing, clear inspection model filling ~35-40% of the viewport.
- **Direct Left-Click Drag Orbit:** In Component Detail View, Left-Click Drag immediately rotates the inspected 3D component in 360° (yaw and pitch) with smooth inertia (zero GPU overhead).
- **Auto-Rotate Toggle:** An interactive button on the detail CAD control bar toggles continuous hands-free 360° product rotation (`this.targetOrbit.x += deltaTime * 0.7`).
- **Right-Click / MMB:** Pans the component; scroll wheel zooms.
- **Non-destructive Return:** Exiting Detail View restores visibility and smoothly returns the component to its modular pod slot without resetting or snapping the user's panned camera position.
- **Clean Layout:** The detail header sits at `top: 76px` beneath the navigation bar, and the bottom Dissect button is hidden during Detail mode.

### 5. Seamless Mode Transitions
- **Instant State Handoff:** When leaving Dissection mode, `dissectionAnimationController.reset(true, false)` is called immediately, preventing the 8.5-second rewind loop from clashing with incoming mode animations.
- **Label Teardown:** The 33-badge overlay is instantly hidden (`display = 'none'`) during transitions.
- **Transform Preservation:** `moduleViewController.restoreAllComponents()` cleanly restores baseline position, rotation, and scale.
- **Camera Gliding:** Camera transitions between modes use smooth cubic easing without jarring cuts or snapping.

---

## 9. Phase 1: Animation State & View Transition Reliability Architecture

Implemented in October 2026 to ensure the Gomikin visual pitch demonstration tool never enters a corrupted, inconsistent, or partially animated state regardless of operator view switching or flow scrubbing.

### 1. ViewTransitionCoordinator (`src/animation/viewTransitionCoordinator.js`)
- **Authoritative High-Level View Ownership:** Controls transitions between `FULL` (`'full'`), `MODULES` (`'modules'`), `DISSECTION` (`'dissection'`), and `FLOW` (`'flow'`).
- **Universal Baseline Restoration:** Before entering any new view, `componentRegistry.restoreBaselineTransforms()` and `moduleViewController.restoreAllComponents()` strictly return all 33 components to their exact CAD assembled positions, rotations, scales, visibilities (`true`), and original materials.
- **Unified Camera Glide Engine:** Centralizes camera interpolation across all view switches using cubic ease-out (`1 - (1 - t)^3`). Supersedes in-progress transitions cleanly, preventing competing camera updates and eliminating target drift.
- **Active Controller Gating:** The render loop in `src/main.js` dispatches frame updates (`update(deltaTime)`) solely to the controller owning the active view. Inactive view controllers are prevented from modifying transforms or camera state in the background.

### 2. Deterministic Flow Kinematics (`src/animation/physicalFlowController.js`)
- **Pure Function of Progress:** Mechanical poses for moving components (`rotating_base`, `cutting_blades`, `door_mechanism_left`, `door_mechanism_right`, `agitator`, `leftover_food_closur`) are evaluated purely from normalized timeline progress $p \in [0.0, 1.0]$ and CAD baseline transforms.
- **Instant Pose Resets:** Every frame begins by executing `resetMechanicalPoses()` before applying mode-specific rotations.
- **Bidirectional Scrubbing & Mode Isolation:** Scrubbing backward or jumping across time steps produces the exact pose for that progress point. Switching between Organic, Inorganic, and Leftover Food modes completely eliminates transform leakage from prior modes.

### 3. CAD Assembly Loading Experience (`src/main.js`)
- **Live Glassmorphism Loading HUD:** Displays real-time download progress (percentage bar and badge) during USDZ network retrieval.
- **Network Resilience:** Gracefully catches network failures and provides visible error messaging with a one-click "Retry Load" action.

### 4. Headless Playwright Verification (`scratch/verify_phase1_interruption.cjs`)
Automated regression suite verified against Edge/Chromium channels:
- **Test A (Rapid View Switching):** Dissection halfway → Modules → Cutting pill → Flow → Full Model. Result: 100% baseline match across all 33 components, camera posDiff = 0.000.
- **Test B (Flow Interruption):** Organic mid-cut (blades spinning at 30.4 rad) → Inorganic → scrub backward → Leftover Food → reset → Full Model. Result: zero rotation leakage, pristine baseline restored.
- **Test C (Scrubbing Determinism):** Poses evaluated at $p = 70\%$ match identically when reached forward vs scrubbed backward from $20\%$.
- **Test D (Camera Interruptions):** Rapid multi-target camera changes converge strictly to destination coordinates with zero drift.
- **Test E (Repeated Reset Cycles):** 4 back-to-back full-playback cycles across all 3 waste flows yield zero cumulative transform drift.
- **Test F (Loading State):** Verified presence of loading HUD and clean transition into interactive view once USDZ is indexed.

---

## 10. Phase 1.1: Post-Implementation Verification Audit & Results

Completed on 2026-10-14 before starting mechanical refinement.

### 1. Verification Suites Executed
- **Suite 1: `scratch/verify_phase1_1.cjs`:**
  - **Scenario 1 (Module View → Dissection → Flow → Full Model):** PASSED. Zero transform drift across all 33 components, controls enabled, camera posDiff = 0.000.
  - **Scenario 2 (Dissection → Component Detail → Flow → Full Model):** PASSED. Isolated component inspection mode cleanly dismantled, Detail UI overlay hidden, all 33 parts restored to visible, housing ghosted in Flow, housing material restored to original in Full Model.
  - **Scenario 3 (Organic 42% → Inorganic → Leftover Food → Reset):** PASSED. Mid-action blades rotation (30.45 rad), platform tilt (0.15 rad), and door swing (-0.77 rad) reset cleanly with zero transform leakage.
  - **Scenario 4 (Active Flow Playback → Tab Switch → Return to Flow):** PASSED. Flow controller cleanly paused on yield, particles hidden, playback resumed upon return without state corruption.
  - **Scenario 5 (Rapid Interrupted Camera Glides):** PASSED. 6 rapid back-to-back tab clicks while camera glides were active converged smoothly to Full Model framing without oscillation.
  - **Scenario 6 (3 Multi-Mode Reset & Replay Cycles):** PASSED. 3 full cycles across Dissection, Module Explosion, and Flow Simulation verified with zero transform degradation.
- **Suite 2: `scratch/verify_loading_failure.cjs`:**
  - Network abort on USDZ download displayed the glassmorphism error card (`Load Error`, Retry button).
  - Navigation dock and simulation controls were inhibited while model was unavailable.
  - Clicking "Retry Load" resumed download, loaded USDZ, initialized coordinator, mounted controls, and dismissed loading overlay.

### 2. Defect Identified & Fixed
- **Favicon 404 Console Error:** Missing `<link rel="icon">` in `index.html` triggered an implicit `/favicon.ico` 404 error from Vite dev server. Fixed by adding an inline SVG favicon tag with the 🏛️ icon to `index.html`. Browser console errors dropped from 1 to 0.

### 3. Exit Decision: PASS
Phase 1 (Animation State & View Transition Reliability) is verified correct, complete, and fully safe for live founder-led startup pitches.
## 11. Phase 2.0: Mechanical Relationship Audit & Leftover-Food Subsystem Clarification

Completed in October 2026. Comprehensive read-only audit of CAD bounding volumes, component hierarchies, kinematic pivot offsets, chamber clearances, and verified design intent.

### 1. Root Kinematic Defect: Fusion 360 Baked Coordinate Offsets
In the Fusion 360 USDZ export, all 33 component meshes share a local origin at $(0, 0, 0)$ with vertex geometry baked at global physical coordinates. Applying direct `.rotation` to these mesh nodes causes components to swing around global $(0, 0, 0)$ rather than their true physical pivot axes:
- **`cutting_blades` (Hub at $[-0.1200, 0.8601, -0.0022]\text{ m}$):** Direct rotation causes a $120\text{ mm}$ orbital arc, displacing the blade hub by **$169.7\text{ mm}$** out of its cutting collar at $90^\circ$.
- **`agitator` (Hub at $[-0.1192, 0.1461, -0.0304]\text{ m}$):** Direct rotation causes an orbital translation of **$173.9\text{ mm}$** through the chamber walls at $90^\circ$.
- **`door_mechanism_left` & `door_mechanism_right` (Hinges at $Z = 0, Y \approx 0.650\text{ m}$):** Direct rotation around local $Y$ flings doors outward into space by **$507.0\text{ mm}$** and **$505.6\text{ mm}$**.
- **`rotating_base` (Center at $[0, 0.945, 0]\text{ m}$):** Direct rotation around local $X$ causes a **$407.1\text{ mm}$** lateral translation instead of tilting on its mounting gimbal.
- **`leftover_food_closur`:** Direct rotation causes an **$863.1\text{ mm}$** displacement behind the machine.

*Remediation Path (Phase 2.1):* Introduce an animation pivot wrapper or parent pivot anchor transform to rotate meshes around their physical centroids and hinge lines.

### 2. Physical Interferences & Sensor Clearances
- **Decomposition Vessel Floor:** `agitator` sweep envelope ($Y \in [0.121, 0.171]\text{ m}$) physically intersects floor telemetry sensors protruding into the vessel: `load_cell` ($1.5\text{ mm}$ protrusion), `temperature_sensor` ($5.7\text{ mm}$ protrusion), and `moisture_sensor` ($4.3\text{ mm}$ protrusion).

### 3. Leftover-Food Subsystem Audit & Confirmed Design Intent
- **Confirmed Design Intent:**
  - Leftover-food intake uses a side-mounted, bottom-hinged access door opening outward and downward away from the machine.
  - Existing component `leftover_food_closur` is a fixed horizontal top cap at $Y \in [0.925, 0.928]\text{ m}$ ($246 \times 3 \times 246\text{ mm}$) sealing the quadrant ceiling and must remain static.
  - Do not repurpose the top cap as the side door.
- **Existing vs Missing CAD Geometry:**
  - The side access door panel, housing cutout aperture, hinge pins, and mounting brackets do **NOT exist** in the 33-part Fusion 360 USDZ asset.
  - Component `Main_Housing` is an unbroken cylindrical shell ($OD = 500\text{ mm}$, $Y \in [0.100, 0.925]\text{ m}$) with no side aperture.
- **Procedural Reference Implementation Found:**
  - `src/components/envelope.js` contains a complete reference implementation (`LeftoverFoodAccessDoor`, `LeftoverFoodDoorHinge_Central`, `LeftoverFoodDoorHinge_Radial`, `LeftoverFoodDoor_Pivot`) utilizing a straight horizontal chord hinge line at $Y = 700\text{ mm}$ and a $100\text{ mm}$ tall curved door panel ($Y = 700\text{--}800\text{ mm}$).
- **Clearance Verification:**
  - Door aperture at $Y = 700\text{--}800\text{ mm}$ maintains $+125\text{ mm}$ vertical clearance below static top cap `leftover_food_closur` ($Y = 925\text{ mm}$) and $+316\text{ mm}$ vertical clearance above drawer `leftover_food_outpu_section` ($Y = 384\text{ mm}$).
  - Bottom-hinged outward/downward opening creates an ergonomic chute for cooked food while maintaining clearance from internal dividers and chassis.

