# Gomikin 3D Project Context

> **Last Updated:** 2026-10-15  
> **Status:** Active Development — Phase 1 Complete, Gravitas Engineering Skill Configured  
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
- **Engineering Reliability Runtime:** [Gravitas](https://github.com/udaysharmadev/Gravitas) agent skill configured in `.agents/skills/gravitas/` for scoped reconnaissance, evidence-backed verification, and failure recovery.

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

---

## 12. Developer Tooling & Agent Skills

### Gravitas Skill Integration
- **Source:** [`udaysharmadev/Gravitas`](https://github.com/udaysharmadev/Gravitas)
- **Installation Path:** [`.agents/skills/gravitas/`](file:///c:/Projects/Gomikin-3d-Model/.agents/skills/gravitas/)
- **Configuration Command:** `npx skills add udaysharmadev/Gravitas --skill gravitas --agent antigravity --yes`
- **Capabilities & Workflow:** Model-agnostic reliability runtime enforcing scoped reconnaissance, adaptive planning, evidence-backed verification, requirement tracking, failure recovery, and budget-aware delegation during engineering changes.

---

## 13. Resilient CAD Model Loading, Vercel Streaming & Offline Caching Architecture

Implemented in October 2026 to support high-performance local testing alongside low-latency, disruption-tolerant Vercel cloud deployment for the 268.6 MB (`268,571,020 bytes`) Fusion 360 USDZ model.

### 1. Dual-Source Strategy & Seamless Silent Fallback (`src/utils/resilientModelLoader.js`)
- **Primary Source:** Local archive path `/Gomikin/gomikin_disection.usdz` (relative to web root in `public/`).
- **Cloud Fallback Source:** Vercel Blob URL `https://eqvmxwue8iejzeky.public.blob.vercel-storage.com/gomikin_disection.usdz`.
- **Silent Pre-flight Probing:**
  - Probes local candidate with a lightweight range/HEAD check (`Range: bytes=0-0`, 6s timeout).
  - Explicitly filters out false HTTP 200 responses caused by Vite / Vercel SPA 404 rewriting (`Content-Type: text/html` or payload `< 50 MB`).
  - If local asset is absent (typical in Vercel Git deployments where 268 MB binary files exceed repository limits), loader **automatically and silently switches to Vercel Cloud Storage without raising any error box to the user**.
- **Source Overrides:** Supports developer URL query parameters:
  - `?source=local` — Forces local archive.
  - `?source=vercel` / `?source=remote` — Forces Vercel Blob cloud stream.
  - `?nocache=1` — Bypasses browser IndexedDB cache to force clean network download.

### 2. Disruption-Tolerant Resumable Chunked Range Download Engine
- **Chunked HTTP Range Streaming:** Downloads the 268 MB archive in discrete 16 MB chunks (`16,777,216 bytes`, 17 chunks total).
- **Interruption Recovery & Exponential Backoff:**
  - Each chunk is protected by a 35-second stall detection controller.
  - If a network drop, timeout, or packet loss occurs midway (e.g. at Chunk 9 / 144 MB), previously downloaded chunks are preserved in memory.
  - Automatically retries the failed chunk with exponential backoff (`min(1000 * 2^attempt, 6000) + jitter`) up to 5 attempts.
  - Telemetry informs the user: `"Connection interrupted. Resuming at 144.0 MB (Attempt 1/5)..."`.
  - Seamlessly resumes byte-exact transfer from where it was interrupted rather than discarding progress and restarting from 0 MB.

### 3. Persistent Client-Side Caching (IndexedDB Blob Storage)
- **Database:** `GomikinModelCache` (Store: `models`, Key: `gomikin_disection_usdz_v1`).
- **Disk-Backed Blob Serialization:** Stores the complete 268 MB archive as a native `Blob` directly in browser IndexedDB, avoiding large V8 heap duplications.
- **Sub-Second Instant Reload:** Subsequent visits or browser page refreshes load directly from local IndexedDB cache in <1 second (verified ~880 ms), eliminating network bandwidth and eliminating cloud storage transfer costs.

### 4. Glassmorphism HUD Telemetry & Parsing Transition (`src/main.js`)
- **Source Pill Badge:** Visually indicates active source with illuminated glassmorphism badges:
  - `📁 Local CAD Archive` (`#00ffcc`)
  - `☁️ Vercel Cloud Storage` (`#38bdf8`)
  - `⚡ Instant Browser Cache` (`#a855f7`)
- **Live Diagnostics:** Displays real-time download progress (`144.0 MB / 268.6 MB (54%)`), rolling transfer speed (`14.2 MB/s`), and calculated ETA (`ETA: 8s`).
- **Decompression Shimmer:** Upon download completion, updates status to `"Decompressing USDZ archive & assembling 3D CAD meshes..."` with an animated pulsing shimmer bar while Three.js `USDLoader.parse()` extracts the 33 CAD meshes.
- **Graceful Failure UI:** If all network retries fail, displays `#loading-error-box` with explicit `"Retry Load"` and `"Force Cloud"` recovery buttons.

### 5. Automated Verification Suites (`scratch/`)
- `scratch/verify_resilient_loader.cjs`:
  - **Test 1 (Local 404 Fallback):** PASSED. Local `/Gomikin/...` intercepted with 404 HTML; zero error boxes raised; automatically streamed all 17 chunks from Vercel Cloud Storage in 22.3s (~12.8 MB/s); all 33 CAD meshes indexed.
  - **Test 2 (IndexedDB Cache Hit):** PASSED. Second page load served instantly from IndexedDB cache with 0 network requests.
  - **Test 3 (CAD Component Completeness):** PASSED. All 33 expected Fusion 360 meshes verified active in `ComponentRegistry`.
- `scratch/test_interruption_recovery.cjs`:
  - **Interruption Simulation:** PASSED. Intentionally aborted Chunk 3 (`bytes=67108864-100663295`); loader caught `Failed to fetch`, backed off, retried Chunk 3 without losing Chunks 1-2, and assembled all 268,571,020 bytes.
- `scratch/verify_loading_failure.cjs`:
  - **Exhaustive Outage & Retry Recovery:** PASSED. Outage triggers HUD error state without mounting scene controls; clicking Retry cleanly recovers and initializes coordinator.
- `scratch/verify_phase1_1.cjs` & `scratch/verify_phase1_interruption.cjs`:
  - **Full Regression Verification:** PASSED. All 6 scenarios (rapid view sequences, detail inspection, bidirectional flow scrubbing, camera convergence, multi-cycle reset) passed with 0 errors and zero transform drift across all 33 components.



---

## 14. Phase 3.0: Virtual Curved Side-Opening Door Assembly (No CAD Rebuild)

Implemented in October 2026. Delivers a high-fidelity, visual-only curved side-opening door for the Leftover-Food compartment without modifying the underlying 268 MB Fusion 360 USDZ CAD archive or changing compartment volume ratios.

### 1. Architectural Geometry & Sector Boundaries (`src/components/virtualDoorAssembly.js`)
- **Cylindrical Conformation:** Outer radius $R = 250\text{ mm}$ ($OD = 500\text{ mm}$), matching `Main_Housing` exterior profile.
- **Elevation Envelope:** Sits in the middle elevation between lower drawer `leftover_food_outpu_section` ($Y = 0.384\text{ m}$) and static ceiling cap `leftover_food_closur` ($Y = 0.925\text{ m}$).
  - Bottom elevation: $Y_{\text{bottom}} = 0.388\text{ m}$ (4 mm clearance above drawer).
  - Top elevation: $Y_{\text{top}} = 0.921\text{ m}$ (4 mm clearance below top cap).
  - Vertical height: $H = 533\text{ mm}$.
- **Sector Boundaries (Leftover Food 90° Quadrant: $+X, -Z$):**
  - Spans $\theta \in [\pi/2, \pi]$ ($90^\circ$).
  - Boundary 1 (Radial edge): $(X = R, Z = 0)$ near `Rightside_Divider`.
  - Boundary 2 (Bulkhead edge): $(X = 0, Z = -R)$ near `central_divider`.
- **Hinge Pivot & Kinematic Axis:**
  - Dedicated vertical hinge line positioned on the RIGHT edge when viewed from outside facing the door ($X = 0, Z = -R$).
  - Dedicated `VirtualDoor_HingePivot` group anchored at $(0, Y_{\text{center}}, -R)$.
  - Direct assignment `pivotGroup.rotation.y = -degToRad(angle)` eliminates cumulative rotational drift.
  - Door swings outward to the LEFT away from housing from $0^\circ$ (closed, flush with cylinder) up to $120^\circ$ (wide open).

### 2. Housing Aperture Management (`setupHousingAperture`)
- Utilizes Three.js local clipping planes (`renderer.localClippingEnabled = true`) with `clipIntersection = true` on `Main_Housing.material`.
- 4 bounding planes ($X > 0$, $Z < 0$, $Y > 0.388$, $Y < 0.921$) discard fragments strictly within the doorway box.
- Preserves 100% of the original CAD `Main_Housing` mesh without seams, discoloration, or model duplication.
- Supported by a subtle aperture casing frame (`VirtualDoor_ApertureFrame`) and realistic grounded hinge pins (`VirtualDoor_HingeHardware`).

### 3. Subsystem Integration & Kinematic Fix
- **Physical Waste Flow Simulation (`src/animation/physicalFlowController.js`):**
  - Fixed kinematic defect: `leftover_food_closur` (the ceiling cap) now stays 100% static at baseline.
  - In Leftover Food flow playback, `VirtualDoorAssembly` dynamically pivots open $0^\circ \to 55^\circ$ during deposit $[0.0 \to 0.25]$, holds open $[0.25 \to 0.55]$, and smoothly closes flush $[0.55 \to 0.75]$.
- **View Transition Coordinator (`src/animation/viewTransitionCoordinator.js`):**
  - In Dissection Mode: Door assembly is safely hidden and clipping planes removed from `Main_Housing` to display pristine exploded tiers.
  - In Full Model & Modular Views: Door assembly is restored visible and flush at $0.000^\circ$.
- **UI Interaction (`src/ui/modularControlBar.js`):**
  - Added interactive top-bar toggle `[ 🚪 Door: Closed (0°) ]` and module card action `[ 🚪 Open Food Door (120°) ]`.

### 4. Verification Suite (`scratch/verify_virtual_door.cjs`)
- Verified against headless Microsoft Edge:
  - **Test 1 (Closed & Flush):** Hinge fixed at $(0, y, -0.250)$, angle = $0.000^\circ$, verified flush with outer radius.
  - **Test 2 (Open 60°):** Rotated to $-1.047\text{ rad}$, free edge swung outward to left.
  - **Test 3 (Fully Open 120°):** Rotated to $-2.094\text{ rad}$, maximum opening angle.
  - **Test 4 (Exposed Compartment):** Verified aperture clipping and interior component visibility (`Rightside_Divider`, `central_divider`, drawer top).
  - **Test 5 (Repeated Cycles):** 5 rapid cycles yielded zero cumulative drift, returning to exact $0.000^\circ$ closed pose.
  - **Test 6 (View Transitions):** Clean handoff across Dissection, Full Model, and Modular Views with zero state corruption.
  - **Test 7 (Flow Kinematics):** Virtual door synchronized with flow timeline ($44^\circ$ at $p=0.20$, $0^\circ$ at $p=0.90$), top cap static.
- **VERDICT: PASS (7/7 tests passed).**

---

## 15. Leftover-Food Door Direction & Manual Intake Flow Correction (October 2026)

### 1. Root Cause & Kinematic Correction (`src/components/virtualDoorAssembly.js`)
- **Previous Defect:** In the initial virtual door implementation, `pivotGroup.rotation.y = -rad` applied clockwise Euler rotation around $+Y$. Because the pivot is grounded at $(0, y_{\text{center}}, -R)$ and the free latch edge starts at $(R, y_{\text{center}}, 0)$, clockwise rotation drove the panel inward towards the cylinder core ($r_{\text{mid}} = 0.129\text{ m} < 0.250\text{ m}$).
- **Kinematic Solution:** Corrected Euler rotation sign to positive counter-clockwise rotation (`rotation.y = +rad`):
  - At $0.0^\circ$: Free edge at $(+0.250, 0.655, 0.000)\text{ m}$ ($r = 0.250\text{ m}$, flush with housing).
  - At $60.0^\circ$: Free edge at $(+0.342, 0.655, -0.342)\text{ m}$ ($r = 0.483\text{ m} > 0.250\text{ m}$).
  - At $120.0^\circ$: Free edge at $(+0.092, 0.655, -0.592)\text{ m}$ ($r = 0.599\text{ m} \gg 0.250\text{ m}$).
  - Minimum radial distance across all vertices remains $\ge 0.250\text{ m}$ throughout the entire arc.
- **Ergonomic Handle:** Positioned at $(R + 0.008, 0, R)$ with standoffs connecting cleanly to the outer door face.

### 2. UI Streamlining (`src/ui/modularControlBar.js`)
- Completely removed the standalone `#tab-toggle-door` from the floating top navigation bar and `#btn-card-door-toggle` from the module card.
- The 4 canonical navigation tabs (`Full Model`, `Modular Views`, `33-Part Dissection`, `Simulate Flow`) remain intact without visual clutter.
- The virtual door operates exclusively within **Simulate Flow** when the operator selects **Leftover Food**.

### 3. Manual Waste Intake Flow Sequence (`src/animation/physicalFlowController.js`)
Eliminated legacy automated top-funnel/chute animations; leftover food is manual intake only:
- **Step 1 — Open Access Door ($p \in [0.00, 0.25]$):** Operator swings the curved door $0^\circ \to 120^\circ$ outward to the left, exposing the compartment. Food scraps remain hidden outside.
- **Step 2 — Manual Food Deposit ($p \in [0.25, 0.50]$):** Door remains fully open at $120^\circ$. A colorful cluster of cooked food scraps (`LeftoverFood_ScrapsGroup`: rice grains, broccoli florets, diced carrot, bread crust, protein morsel) enters through the open side aperture from outside $(0.42, 0.70, -0.32)$ through doorway $(0.26, 0.58, -0.20)$ to rest on the compartment shelf $(0.12, 0.42, -0.12)$ via quadratic Bezier interpolation.
- **Step 3 — Close Access Door ($p \in [0.50, 0.75]$):** Door swings back from $120^\circ \to 0^\circ$ flush with the cylinder. Food scraps stay stationary inside at $(0.12, 0.42, -0.12)$.
- **Step 4 — Leftover Food Stored ($p \in [0.75, 1.00]$):** Door remains sealed flush at $0^\circ$. Deposited food rests safely in the isolated $25\%$ quadrant.

### 4. View & Camera Coordination (`src/animation/viewTransitionCoordinator.js`)
- Added `FLOW_LEFTOVER` camera preset $(1.05, 0.85, -1.05)$ targeting $(0.05, 0.55, -0.05)$, smoothly framing the entire machine and Leftover Food door quadrant.
- During Leftover Food flow, `Main_Housing` retains solid brushed metallic finish with aperture clipping enabled; for Organic/Inorganic flows, `Main_Housing` dynamically switches to `ghostMaterial` for interior visibility.

### 5. Automated Verification & Test Results
- Ran `scratch/run_full_verification.cjs` via headless Microsoft Edge Playwright suite:
  - Standalone button removal: PASSED (0 occurrences in DOM).
  - Radial outward clearance: PASSED ($r \ge 0.250\text{ m}$ everywhere).
  - 3x Rapid cycle & reset: PASSED ($0.000^\circ$ residual drift).
  - Mode transition isolation: PASSED (Organic/Inorganic/Full Model states clean).
  - Production build: PASSED (`npm run build` in $1.29\text{s}$, 0 errors).


---

## 16. Phase B — Gomikin Global Design System & Branding Implementation (November 2026)

### 1. Brand Asset Verification & Selection
- **Asset Directory:** `public/assets/`
- **Inspected Assets:**
  - `Gomikin-logo.png` (1254x1254, transparent PNG): Official standalone folded ribbon 'G' emblem in dark graphite and warm champagne/gold.
  - `Gomikin-logo-with-text.png` (1254x1254, transparent PNG): Emblem stacked over "GOMIKIN" wordmark and "TURNING WASTE INTO VALUE" tagline.
  - `Gomikin-text-white.png` & `Gomikin-text-black.png` (2172x724): Horizontal wordmark variants.
  - `Gomikin-text-with-tagline-white.png` & `Gomikin-text-with-tagline-black.png` (2172x724 / 2156x729): Horizontal wordmark with tagline.
- **Selection for Loading HUD & Brand Identity:** `public/assets/Gomikin-logo.png` applied with `object-fit: contain` and zero distortion, recolouring, or cropping.

### 2. Centralized Design Tokens (`src/style.css`)
- **Official Gomikin Palette:**
  - `--gomikin-ivory: #F2EFE6` (Crisp light text, primary typography, highlights)
  - `--gomikin-graphite: #343B36` (Primary dark surface tones, architectural borders)
  - `--gomikin-champagne: #B99A63` (Premium accent, active tabs, interactive highlights, progress indicators)
  - `--gomikin-sage: #A5AA91` (Secondary technical labels, subtle borders, engineering badges)
  - `--gomikin-sand: #D8C7A5` (Neutral tertiary details, parameter readouts, muted typography)
- **Surfaces & Overlays:**
  - Base viewport: `#0A0D0B`
  - Base surfaces: `#171B18`, `#232925`, `#2E3631`
  - Translucent glassmorphism: `rgba(52, 59, 54, 0.78)` and `rgba(35, 41, 37, 0.90)`
- **Interaction & Typography Tokens:**
  - Defined active/hover/inactive interaction states, 7-step spacing scale (`--gomikin-space-*`), 6 border radius levels (`--gomikin-radius-*`), restrained drop shadows (`--gomikin-shadow-*`), and cubic-bezier transition curves (`--gomikin-transition-*`).
  - Typography scale (`--gomikin-font-*`) from Display headings ($28\text{px}$) down to technical badges ($10\text{px}$).

### 3. Loading Screen Overhaul (`src/main.js`)
- Replaced emoji and legacy cyan/blue theme with the official Gomikin folded-G emblem and typography.
- Styled source badges, transfer readouts, error states, and retry buttons with the new design tokens.
- Preserved 100% of the functional loading lifecycle: archive download, progress tracking, decompression, speed calculation, and cloud fallback.

### 4. Verification Suite (`scratch/verify_phase_b.cjs`)
- **Build Status:** Passed clean compilation (`npm run build` in $1.38\text{s}$, 0 errors).
- **Headless Edge Verification:**
  - Loading HUD render: Verified brand emblem, tagline, and token colors.
  - Model loading: 268 MB CAD archive decompressed and loaded cleanly.
  - Tab interactions: All 4 navigation tabs (`Full Model`, `Modular Views`, `33-Part Dissection`, `Simulate Flow`) verified functional without state regression.
  - Console Errors: 0 errors recorded throughout execution.

---

## 17. Phase C — Complete Landing Page Redesign & Decoupled On-Demand 3D Architecture (November 2026)

### 1. Architectural Decoupling & Immediate Page Render
- **Decoupled Startup:** The website no longer blocks on the 268 MB CAD archive. All HTML, CSS, header, hero copy, technical metrics, and supporting feature sections render instantly on initial load ($0\text{ms}$ network waiting time).
- **Elimination of Full-Screen Blocking HUD:** The old full-screen downloading HUD overlay was removed from global DOM. All loading telemetry and progress indicators now live strictly inside the product canvas card (`#gomikin-canvas-wrapper`).
- **State Machine Architecture:**
  - **State 1 & 2 (Idle / Invitation):** Shows an invitation inside the canvas (`#canvas-idle-overlay`) with the folded-G emblem, technical overview, and an interactive "Explore 3D" button. The entire canvas area is clickable.
  - **State 3 (Model Download):** Initiated on user demand via `#btn-canvas-explore` or `#btn-hero-explore`. Displays `#canvas-loading-overlay` inside the canvas with a clean horizontal progress bar (Champagne fill on Graphite track).
    - **Strict Telemetry Compliance:** Absolutely NO numerical download statistics other than the percentage ($0\to 100\%$) are displayed. All MB, speed, and size indicators are omitted.
  - **State 4 (Model Initialization):** Transition status displays "Preparing 3D experience..." with a pulsing Champagne gradient while Three.js USDLoader parses meshes and constructs the scene graph.
  - **State 5 (Model Ready):** Smoothly fades out the loading overlay, enables OrbitControls, displays active status indicator dot, and mounts the 4 canonical view mode controls inside the canvas container.
  - **State 6 (Error & Retry):** Displays `#canvas-error-overlay` on network interruption with "Retry Load" and "Force Cloud" fallback actions, without forcing page reloads or breaking the rest of the website.

### 2. Semantic Landing Page Structure (`index.html` & `src/style.css`)
- **Header:** Sticky translucent header with official Gomikin logo and wordmark, navigation links (`Product`, `Technology`, `How It Works`, `About`), and "Inquire" action.
- **Hero Section:** Two-column desktop layout (stacks on tablet/mobile):
  - Left Column: Category kicker (`AUTONOMOUS BIO-RECOVERY APPARATUS`), headline ("Waste isn't the end. It's the beginning."), supporting product description, dual CTAs ("Explore 3D CAD Prototype" & "Technical Specifications ↓"), and 4-metric parameter grid ($500\text{ mm}$, $1020\text{ mm}$, $33\text{ Parts}$, $3\text{ Sectors}$).
  - Right Column: Interactive product canvas card (`#gomikin-canvas-wrapper`) with studio charcoal background, canvas header bar with status dot, viewport badge, and fullscreen toggle.
- **Supporting Feature Sections:**
  1. **Intelligent Segregation (`#technology`):** Optical AI Vision Module, Dual-Axis Sorting Base, and Acoustic/Load Telemetry.
  2. **Engineered Processing (`#how-it-works`):** Rotary Cross-Shear Cutters, $8\text{ mm}$ Precision Sizing Mesh, and Hydrostatic Liquid Drainage.
  3. **Value Recovery (`#about`):** Dual-Helix Agitator, Closed-Loop Environmental Telemetry, and Negative-Pressure Carbon Filtration.
- **Deployment Card & Footer:** High-contrast inquiry card and brand footer with copyright and patent architecture notes.

### 3. Canvas Viewport Integration & Responsive Fullscreen
- Three.js WebGL renderer automatically queries and observes `#gomikin-canvas-wrapper` dimensions via `ResizeObserver`, ensuring pixel-crisp rendering at container bounds.
- Added responsive `#btn-canvas-fullscreen` toggle: expands `#gomikin-canvas-wrapper` into an immersive fullscreen viewport with escape key handler and clean resize event synchronization.
- Connected all existing controllers (`moduleViewController`, `dissectionAnimationSystem`, `componentDetailController`, `physicalFlowController`, `viewCoordinator`) directly into `#gomikin-canvas-wrapper` so all 4 existing views (`Full Model`, `Modular Views`, `33-Part Dissection`, `Simulate Flow`) function with zero regressions.

### 4. Verification Suite Results (`scratch/verify_phase_c.cjs` & `scratch/test_phase_c_error_retry.cjs`)
- **Build Status:** Passed clean compilation (`npm run build` in $1.59\text{s}$, 0 errors).
- **Playwright Automated Verification:**
  - State 1 & 2 immediate render verified (0 full-screen blocking HUD, 0 premature CAD fetch).
  - State 3 on-demand download verified (in-canvas progress bar active, strictly percentage only, zero MB/speed leakage).
  - State 5 model ready verified (`usdModel` added, OrbitControls enabled, canvas header active).
  - All 4 view modes verified: `Full Model` active, `Modular Views` subbar active, `33-Part Dissection` active, `Simulate Flow` console active.
  - Fullscreen toggle and exit verified.
  - Error simulation and non-reloading retry verified.
  - Console Errors: 0 errors recorded.


---

## 18. Phase C.1 — Landing Page Refinement & 3D Launch Experience (November 2026)

### 1. Architectural Motivation & Scope
Phase C.1 simplifies and elevates the landing page into a clean, single-viewport product presentation while introducing background CAD model pre-loading and seamless fullscreen 3D launching:
- **Single Desktop Viewport ($100\text{vh}$ Fit):** Eliminated all page scrolling on desktop viewports (`1440\times 900`, `1920\times 1080`). All clutter—including multi-item navigation bars, redundant metric grids ($500\text{ mm}, 1020\text{ mm}$), bottom feature cards, and deep footers—has been removed.
- **Brand Asset Fidelity:** Integrated the official text wordmark asset (`public/assets/Gomikin-text-black.png`, $2172\times 724\text{px}$) with natural aspect ratio constraints ($28\text{px}$ height, `object-fit: contain`) rather than HTML text recreation.
- **Minimalist Header:** Preserves only the official Gomikin text logo on the left and a single pill-shaped dark Graphite `#343B36` "Contact Us" button (`mailto:info@gomikin.com`) on the right.
- **Background CAD Model Pre-Loading:**
  - Starts pre-fetching the 268 MB CAD model immediately on page load in the background via `ResilientModelLoader`.
  - The landing page remains completely calm, clean, and interactive with ZERO download overlays, speeds, or MB indicators.
  - IndexedDB cache ensures instantaneous load on repeat visits without redundant network usage.
- **Fullscreen 3D Launch Transition:**
  - Clicking "Explore 3D Prototype" or the canvas preview card triggers an immediate fullscreen transition.
  - If the model is already ready (or cached), the 3D model and OrbitControls appear instantly with zero delay.
  - If background download is still in progress, a fullscreen overlay displays the current progress strictly as a percentage with the word **"Loading"** (never "Downloading"), and absolutely no numerical MB or speed indicators.
  - On USDLoader parse completion, the overlay fades out and reveals the 3D model.
  - Supports both the `Escape` key and an explicit "Exit Fullscreen" toggle to return to the single desktop viewport while preserving the loaded 3D scene in memory.
- **Refined Canvas CAD Invitation UI:**
  - Styled with subtle CAD grid background, thin Champagne accent border (`rgba(185, 154, 99, 0.35)`), official Gomikin emblem (`public/assets/Gomikin-logo.png`), header title "Explore the Engineering", description "Inspect the mechanical architecture and internal processing system.", and primary button "Launch 3D Experience".
- **Minimal Initialization Skeleton:**
  - Light skeleton overlay (`#gomikin-init-screen`) dismisses within milliseconds on initial DOM paint without blocking.

### 2. Files Modified & Updated
1. [`index.html`](file:///c:/Projects/Gomikin-3d-Model/index.html):
   - Refactored header to text logo and pill "Contact Us" button.
   - Refactored hero section to single desktop viewport layout without specs grid or secondary links.
   - Simplified canvas card with refined "Explore the Engineering" preview.
   - Configured fullscreen loading overlay (percentage only, word "Loading").
   - Added minimal initialization skeleton screen.
   - Removed feature sections, contact card, and heavy footer.
2. [`src/style.css`](file:///c:/Projects/Gomikin-3d-Model/src/style.css):
   - Enforced single desktop viewport layout rules (`@media (min-width: 1025px) { height: 100vh; overflow: hidden; }`).
   - Added minimalist header and pill contact button styles.
   - Added CAD preview idle card with thin Champagne border and subtle grid.
   - Added fullscreen studio layout and loading track styles.
   - Cleaned up obsolete feature section and heavy footer styles.
3. [`src/main.js`](file:///c:/Projects/Gomikin-3d-Model/src/main.js):
   - Implemented `modelState` state machine (`idle`, `loading`, `parsing`, `ready`, `error`).
   - Initiated non-blocking background loading (`startBackgroundLoad`) immediately on bootstrap.
   - Configured `enterFullscreen3D` and `exitFullscreen3D` handlers with `Escape` key binding.
   - Synchronized fullscreen loading overlay telemetry (percentage only, word "Loading", never "Downloading").
   - Preserved all 3D controllers (`moduleViewController`, `dissectionAnimationSystem`, `physicalFlowController`, `viewCoordinator`, `virtualDoorAssembly`).

### 3. Automated Verification Evidence (`scratch/verify_phase_c1.cjs`)
- **Compilation Check:** `npm run build` succeeded in $1.73\text{s}$ with 0 errors.
- **Single Desktop Viewport:** Validated `scrollHeight === clientHeight` ($900\text{px} / 900\text{px}$) with `overflow: hidden` on desktop.
- **Header Asset:** Validated `Gomikin-text-black.png` and pill "Contact Us" button.
- **Background Loading:** Confirmed background download initiates without landing page UI interruption.
- **Fullscreen Launch:** Confirmed canvas expands to `100vw \times 100vh` on Explore trigger. Loading overlay strictly displays `Loading... XX%` (no "Downloading", no MB metrics).
- **Sub-System Navigation:** Validated all 4 canonical view modes (`Full Model`, `Modular Views`, `33-Part Dissection`, `Simulate Flow`) inside fullscreen.
- **Escape & Exit:** Confirmed pressing `Escape` or clicking `Exit Fullscreen` smoothly returns to single-viewport landing page with model kept resident in memory.
- **Re-Entry:** Confirmed re-entering fullscreen immediately shows the ready 3D model without reloading.
- **Browser Console Errors:** 0 severe errors detected.


---

## 19. Phase C.2 — Static Product Preview & Cinematic Fullscreen Expansion (November 2026)

### 1. Architectural Scope & Problem Resolutions
Phase C.2 addresses key visual and interaction refinements requested after initial landing page implementation:
1. **Canvas Pre-Launch Isolation (Highest Priority):**
   - **Problem Solved:** Previously, the Three.js model and `#gomikin-modular-nav` toolbar were rendering in the background and competing with the preview card, creating visual clutter and looking like an already-opened CAD tool.
   - **Resolution:** Three.js `#app-canvas` is strictly hidden (`display: none`) and OrbitControls disabled before launch. All four navigation tabs, dissection buttons, and simulation controls are completely hidden (`display: none !important`) until fullscreen 3D mode is active.
2. **Static Product Preview (Figma Artboard Direction):**
   - Implemented a dedicated `#static-product-preview` within the viewport container:
     - Minimalist top header bar: `GOMIKIN / PRODUCT EXPERIENCE` and subtle `INTERACTIVE 3D` pill badge.
     - Center: Stylized cylindrical Gomikin product illustration (`public/assets/gomikin-cylinder-preview.png`) resting on an elliptical shadow and perspective floor grid.
     - Floating bottom invitation card:
       - Title: *"Explore the Gomikin 3D Model"*
       - Description: *"Explore the mechanical architecture and internal processing system."*
       - Sub-label: *"Interactive engineering environment"*
       - Button: *"Launch 3D Experience ↗"* with Champagne gradient.
     - The entire preview area is clickable to launch the 3D experience.
3. **Cinematic Fullscreen Expansion Animation:**
   - Replaced the abrupt fullscreen jump with a 700 ms shared-element FLIP expansion animation.
   - Captures viewport `getBoundingClientRect()` and inserts an invisible placeholder in the document flow to prevent layout shift.
   - Animates from card coordinates to `100vw \times 100vh` at `top: 0, left: 0`, while border-radius smoothly transitions from `18px` to `0px`.
   - Fades out surrounding landing page header, hero content, and footer during the transition.
   - Smooth ease-in-out curve (`cubic-bezier(0.16, 1, 0.3, 1)`).
   - Reverse animation on Escape / Exit Fullscreen smoothly collapses the viewport back to its original card dimensions and restores the static preview while keeping the 3D model resident in memory.
   - Fully respects `prefers-reduced-motion`.
4. **Hero Content & Typography Refinement:**
   - Scaled headline to restrained, confident proportions (`clamp(28px, 3.4vw, 44px)`).
   - Formatted first line in Graphite (`#343B36`) and second line in Champagne (`#B99A63`).
   - Refined description: *"Meet Gomikin — an intelligent waste management system designed to transform everyday waste into something valuable."*
   - Preserves single desktop viewport fit (`100vh`, zero scrolling).
5. **Unified Logo Lockup:**
   - Placed official folded-G emblem (`public/assets/Gomikin-logo.png`, $32\text{px}$) and dark wordmark (`public/assets/Gomikin-text-black.png`, $22\text{px}$) side by side in the upper-left header with a balanced $12\text{px}$ gap.
   - Preserved original aspect ratios with zero manual text typing or cropping.
6. **Restrained Skeleton Initialization Screen:**
   - Fullscreen Graphite background (`#171B18`) with small emblem, white wordmark (`Gomikin-text-white.png`), subtle Champagne sliding bar indicator, and *"Initializing Gomikin"* label.
   - Dismisses smoothly within $100\text{ms}$ on initial paint.

### 2. Files Modified & Updated
1. [`index.html`](file:///c:/Projects/Gomikin-3d-Model/index.html):
   - Added unified emblem + wordmark brand lockup in header.
   - Added restrained skeleton initialization overlay.
   - Refined hero headline typography and description wording.
   - Built pre-launch static product preview with header, floor grid, cylinder illustration, and invitation card.
   - Separated fullscreen studio header bar from pre-launch state.
2. [`src/style.css`](file:///c:/Projects/Gomikin-3d-Model/src/style.css):
   - Added unified header brand styles.
   - Added restrained initialization skeleton styles.
   - Enforced single desktop viewport layout rules.
   - Added `.static-preview-container`, floor grid, cylinder shadow, and invitation card styles.
   - Enforced strict CSS boundaries: `#gomikin-modular-nav` and controls are `display: none !important` outside fullscreen.
   - Added cinematic transition classes (`.cinematic-transitioning`, `.in-fullscreen-cad`).
   - Added `prefers-reduced-motion` fallbacks.
3. [`src/main.js`](file:///c:/Projects/Gomikin-3d-Model/src/main.js):
   - Implemented `launchCinematicFullscreen()` and `exitCinematicFullscreen()` with FLIP layout capture and placeholder management.
   - Bound launch triggers: `#btn-hero-explore`, `#btn-canvas-explore`, and `#static-product-preview`.
   - Bound exit triggers: `#btn-canvas-fullscreen` and `Escape` key.
   - Ensured Three.js canvas remains hidden on landing page and only renders in fullscreen mode.
   - Preserved all 3D controllers and background loading mechanics.
4. [`public/assets/gomikin-cylinder-preview.png`](file:///c:/Projects/Gomikin-3d-Model/public/assets/gomikin-cylinder-preview.png):
   - Extracted and refined cylinder artwork from Figma reference with transparent edge blending.

### 3. Automated Verification Evidence (`scratch/verify_phase_c2.cjs`)
- **Build Status:** `npm run build` succeeded in $1.58\text{s}$, 0 errors.
- **Pre-Launch Isolation:** Three.js canvas visible pre-launch = `false`, `#gomikin-modular-nav` visible pre-launch = `null` (strictly hidden).
- **Static Preview Verification:** Card title, description, label, badge, and header all verified against Figma artboard.
- **Cinematic Expansion Animation:** Validated transition in motion, expanding to `100vw \times 100vh` with border-radius easing.
- **Fullscreen Model Ready:** Three.js canvas and modular nav displayed once ready in fullscreen.
- **All 4 Sub-System Modes:** Verified `Full Model`, `Modular Views`, `33-Part Dissection`, `Simulate Flow`.
- **Reverse Exit Animation:** Validated smooth collapse via Escape back to original card dimensions, restoring static preview and hiding 3D canvas.
- **Instant Re-Launch:** Confirmed re-entering fullscreen immediately displays ready 3D model without re-downloading.
- **Mobile Responsive Check:** Validated at $390\times 844\text{px}$.
- **Severe Console Errors:** 0 errors recorded.

---

## 21. Phase C.2 Clutter Fix: Pure Figma Vector Preview & Dissect Button Neutralization

### 1. Root Cause Analysis
1. **Dissect Button Leakage:**
   - In `src/animation/dissectionAnimationSystem.js`, when background CAD loading completed, `initDissectionAnimationSystem` dynamically injected a floating button `#btn-dissect-gomikin` (`⚡ DISSECT GOMIKIN`) with `.btn-dissect-primary { position: absolute; bottom: 24px; left: 50%; z-index: 1500; display: flex; }` directly into `#gomikin-canvas-wrapper`.
   - Additionally, in `src/ui/modularControlBar.js`, initializing tab `'full'` set `dissectBtn.style.display = 'block'` without checking if the canvas wrapper was in `fullscreen-mode`.
   - Consequently, as soon as background CAD loading completed, the cyan neon button appeared overlapping the bottom invitation card on the landing page before the user ever clicked launch.
2. **Double / Overlapping Preview Cards:**
   - The previously cropped raster image `public/assets/gomikin-cylinder-preview.png` retained the top header of the invitation card from the Figma screenshot.
   - When the HTML invitation card was positioned over it, the burnt-in card text peered through, causing a cluttered "double card" appearance.

### 2. Implementation Details
1. **Figma Vector Assets & Styling from `vite.config.zip` / SVG:**
   - Extracted clean vector SVGs from the Figma project export:
     - `public/assets/preview-ground-shadow.svg` (Shadow ellipse: `#080A09` at 0.8 opacity)
     - `public/assets/preview-product-top.svg` (Top ellipse: `#A3A89C`)
     - `public/assets/preview-product-base.svg` (Base ellipse: `#4D544D`)
   - Replaced raster cylinder with pure vector DOM composition matching Figma Make (`.preview-product-body`, `.preview-top-rim`, `.preview-door-outer`, `.preview-door-panel`, `.preview-door-hinge`).
   - Replaced old card with exact Figma launch panel:
     - Container: `#252b27`, border-radius 14px, Champagne border accent.
     - Title: *"Explore the Gomikin 3D model"* (`#f2efe6`, 16px semibold).
     - Description: *"Load the interactive experience when you're ready."* (`#a5aa91`, 12px regular).
     - Launch button: *"Launch 3D ↗"* (`#b99a63`, `#343b36`, 27px radius pill).
   - Removed `public/assets/gomikin-cylinder-preview.png` entirely, completely eliminating overlapping card artifacts.
2. **Triple-Layer Dissect Button & 3D Control Suppression:**
   - **CSS Boundary (`src/style.css`):**
     Added strict rules ensuring `#btn-dissect-gomikin`, `.btn-dissect-primary`, `#gomikin-modular-nav`, `#gomikin-sub-nav`, `#gomikin-flow-console`, `#gomikin-part-card` are `display: none !important; visibility: hidden !important; pointer-events: none !important;` whenever `body:not(.in-fullscreen-cad)` or `.canvas-wrapper:not(.fullscreen-mode)`.
   - **System Controller Initialization (`src/animation/dissectionAnimationSystem.js`):**
     `createPrimaryDissectButton` and `updateButtonState` check for `.fullscreen-mode` and enforce `btn.style.display = 'none'` when pre-launch.
   - **Modular Tab Coordinator (`src/ui/modularControlBar.js`):**
     Guarded tab-switch visibility so `dissectBtn` is only shown when `isFullscreen === true`.
   - **Transition Handlers (`src/main.js`):**
     Both `launchCinematicFullscreen()` and `exitCinematicFullscreen()` explicitly manage `#btn-dissect-gomikin` and 3D sub-bars.

### 3. Verification & Evidence (`scratch/verify_phase_c2_fixes.cjs`)
- **Initial Landing Page:** `#btn-dissect-gomikin` visible: `false`, static preview visible: `true`.
- **Post Background Load Landing Page:** Model load completes in background (~$3.5\text{s}$), `#btn-dissect-gomikin` computed style: `{ display: 'none', visibility: 'hidden', visible: false }`. Zero clutter.
- **Clean Vector Rendering:** Single invitation card, pristine floor grid, vector cylinder body, and bottom meta (`MODEL LOADS ON DEMAND · 268 MB`).
- **Launch 3D:** Seamlessly expands to fullscreen 3D environment, Three.js model and studio controls displayed.
- **Exit Fullscreen:** Restores clean static preview without any leaking 3D controls or buttons.
- **Responsive Check:** Verified on Tablet ($1024\times 768\text{px}$) and Mobile ($390\times 844\text{px}$).
- **Console Errors:** 0 errors.

