# GOMIKIN 3D MODEL BLUEPRINT: ALTERNATIVE EMBODIMENT B

**Document Version:** 2.0 (Blueprint Validation Pass)  
**Design Baseline:** Alternative Embodiment B (Household Automated Waste Segregation & In-Vessel Processing Apparatus)  
**Validation Purpose:** Rigorous design classification, component cataloging, and geometry lock status prior to geometry code generation.  
**Dimensional Authority:** `docs/design_specs.md` governs confirmed dimensions; sketches and feature documents provide topological and functional reference.

---

## CLASSIFICATION SYSTEM
Every design feature, dimension, and component in this blueprint is strictly categorized into exactly one of the following four classifications:

1. **CONFIRMED DIMENSION:** An authoritative numerical value explicitly specified in `docs/design_specs.md`. Must be implemented exactly.
2. **CONFIRMED GEOMETRY:** A physical topology, arrangement, or mechanical configuration unambiguously established by the patent, engineering documents, and sketches.
3. **REFERENCE GEOMETRY:** An illustrative form, profile curve, or aesthetic detail shown in sketches that communicates design intent but is not dimensionally or kinematically finalized.
4. **ENGINEERING PARAMETER — TBD:** A numerical dimension, thickness, clearance, angle, or tolerance that is not defined in any authoritative reference and must not be guessed.

---

## A. OVERALL STRUCTURE

### 1. Overall Coordinate System
* **Classification:** **CONFIRMED GEOMETRY**
* **Origin $(0, 0, 0)$:** Center of the bottom base plate at ground contact level (projected vertical axis of the cylindrical housing).
* **X-Axis (Transverse / Lateral):** Left $(-X)$ to Right $(+X)$.
* **Y-Axis (Vertical / Elevation):** Upwards $(+Y)$. $Y = 0$ is the floor baseline.
* **Z-Axis (Sagittal / Longitudinal):** Back $(-Z)$ to Front $(+Z)$.
* **Front Facing Direction:** $+Z$ vector. The User Interaction Device (OLED/buttons), front leftover food drawer, input funnel access, and lower extraction drawers face towards $+Z$.

```
                 +Y (Height)
                  |
                  |
                  |_______ +X (Right / Inorganic & Food)
                 /
                /
              +Z (Front / User Interface & Funnel Opening)
  (-X: Left / Organic Chamber)
  (-Z: Rear / Closed Upper Dome & Exhaust Port)
```

---

### 2. Main External Housing Architecture
The outer architecture consists of an upright modular, dispatchable cylindrical enclosure structured into three primary vertical sections:
1. **Top Collar & Input Head:**
   * **Classification:** **CONFIRMED DIMENSION** (Vertical Height: **95 mm**, $Y = 925\text{ mm}$ to $Y = 1020\text{ mm}$) & **CONFIRMED GEOMETRY** (Top Closure & Segregation Assembly).
   * Contains the top closed rear hood lid with OLED interaction display, front open input aperture, converging receiving funnel, baseline sensor array (dual-barrel ultrasonic & optical camera), and 2-axis rotating platform base.
   * **Divider Isolation:** The entire 95 mm input section ($Y = 925\text{–}1020\text{ mm}$) remains strictly free of sector divider walls.
2. **Main Cylindrical Body:**
   * **Classification:** **CONFIRMED DIMENSION** (Divider Height: **825 mm**, spanning $Y = 100\text{ mm} \to 925\text{ mm}$) & **CONFIRMED GEOMETRY** (Segmented cylindrical housing).
   * Upright cylindrical shell enclosing internal functional chambers.
   * Split into distinct chambers by structural bulkheads and thermally/acoustically insulated outer layers.
   * Dividers terminate strictly at $Y = 925\text{ mm}$ (the Input/Middle boundary).
   * Houses the shared chimney-effect ventilation path and central activated carbon filtration matrix.
3. **Bottom Base Assembly:**
   * **Classification:** **CONFIRMED GEOMETRY** (Plinth structure with 4 caster wheels and sliding tray).
   * Cylindrical lower plinth housing the sliding leachate drawer, battery dock with modular power cartridge, and mounting structure for four bottom caster wheels.

---

### 3. Spatial Allocation & Internal Dividers
The cylindrical body volume is partitioned using a combination of vertical diameter and radial dividers:

* **Primary Vertical Divider (Diameter Wall):**
  * **Classification:** **CONFIRMED DIMENSION** (Height: **825 mm**, spanning $Y = 100\text{ mm} \to 925\text{ mm}$) & **CONFIRMED GEOMETRY** (180° / 180° diameter split).
  * Terminates exactly at $Y = 925\text{ mm}$ (Input/Middle boundary), leaving the upper input bay unobstructed.
  * Spans the full internal diameter along the $Z$-axis, dividing the cylinder into two 180° halves.
  * **Organic Side (Half Cylinder - 180°):** Dedicated entirely to the continuous biological processing train (Pre-processing/Cutting $\rightarrow$ Drainage Storage $\rightarrow$ In-Vessel Decomposition $\rightarrow$ Manure Output).
* **Secondary Vertical Divider (Radial Wall):**
  * **Classification:** **CONFIRMED GEOMETRY** (90° radial sector partition, spanning $Y = 100\text{ mm} \to 925\text{ mm}$, terminating at $Y = 925\text{ mm}$).
  * Extends from the central vertical axis outward to the outer shell, partitioning the remaining 180° half into two distinct 90° quadrant sectors:
    1. **Inorganic Storage Sector (90° Quadrant):** A full-height vertical shaft acting as passive dry waste accumulation storage (Embodiment B: single collective bin, no multi-partition dividers).
    2. **Leftover Food Sector (90° Quadrant):** Independent front-loading vertical sector containing the dual-layer perforated food tray, sloped liquid collection base, and drainage interface.
* **Horizontal Structural Floors / Shelves:**
  * **Cutting-to-Storage Interface:** Collar mounting ring supporting the horizontal sizing mesh. (*Classification: CONFIRMED GEOMETRY*)
  * **Storage-to-Decomposition Interface:** Structural perimeter ledge and central spine supporting the center-hinged double drop doors and upper drainage screen. (*Classification: CONFIRMED GEOMETRY*)
  * **Decomposition Chamber Floor:** Lower bulkhead supporting the agitator motor mount, load cell assembly, and providing clearance for the manure output drawer. (*Classification: CONFIRMED GEOMETRY*)
  * **Plinth Sub-Floor:** Separates internal chambers from the bottom leachate drainage channel and caster wheel plate. (*Classification: CONFIRMED GEOMETRY*)

---

## B. COMPONENT HIERARCHY (ALTERNATIVE EMBODIMENT B)

```
Gomikin (Root)
├── 1. Main Housing & Chassis
│   ├── 1.1 Base Assembly
│   │   ├── Base Plinth Frame
│   │   ├── Caster Wheel Assemblies (x4)
│   │   ├── Power Cartridge Receiving Dock
│   │   ├── Removable Power Cartridge (LiFePO4 battery pack casing)
│   │   └── Passive Lower Intake Vents
│   ├── 1.2 Main Cylindrical Shell
│   │   ├── Outer Shell Body (Modular/dispatchable sleeve)
│   │   ├── Primary Vertical Divider (Diameter Wall, 700 mm)
│   │   ├── Secondary Vertical Divider (Radial Wall, 90° sector divider)
│   │   ├── Insulating Layer (Thermal & acoustic lining)
│   │   └── Exhaust & Filtration Subsystem
│   │       ├── Active Exhaust Fan
│   │       └── Activated Carbon Filtration Matrix
│   └── 1.3 Top Cap Assembly
│       ├── Outer Collar Rim
│       ├── Rear Closed Dome Cover
│       └── User Interaction Device (UID)
│           ├── Enclosure Bezel
│           ├── High-Contrast OLED Display
│           ├── Audio Transducer (Buzzer/Chime orifice)
│           └── Physical Control Buttons (x3) & Status LEDs
│
├── 2. Input & Segregation Module (Height: 200 mm)
│   ├── 2.1 Input Receiving Funnel (Conical hopper with bottom throat)
│   ├── 2.2 Sensor Mounting Bridge / Crossbeam
│   ├── 2.3 Baseline Sensor Array
│   │   ├── Ultrasonic Distance Transceiver (Dual-transducer module)
│   │   └── Optical Image Capture Device (Camera module with lens)
│   ├── 2.4 Control & Edge-AI Module Enclosure
│   └── 2.5 Dynamic Segregation Mechanism
│       ├── Sorting Flap (Contoured peanut/plate)
│       ├── Flap Hinge / Pivot Shaft
│       └── Servo Motor & Actuation Linkage
│
├── 3. Organic Processing Section (180° Semi-Cylindrical Column)
│   ├── 3.1 Pre-Processing / Cutting Section
│   │   ├── Cutting Chamber Enclosure (Circular cylindrical insert)
│   │   ├── Top-Mounted High-Torque Cutting Motor
│   │   ├── Downward-Facing Rotary Drive Shaft
│   │   ├── Aerodynamic Pitched Shear Blades (4-arm cross rotor with hook tips)
│   │   ├── Horizontal Perforated Sizing Mesh (Screen disk)
│   │   └── Electrical Current Sensing Module (Jam sensor)
│   ├── 3.2 Storage & Hydrostatic Drainage Section
│   │   ├── Storage Chamber Shell (Semi-cylindrical upper holding volume)
│   │   ├── Perforated Drainage Screen (Horizontal filtration mesh)
│   │   ├── Center-Hinged Dynamic Base Assembly
│   │   │   ├── Central Support Spine & Dual Hinge Rods
│   │   │   ├── Left Sloped Solid Door Panel
│   │   │   ├── Right Sloped Solid Door Panel
│   │   │   └── Door Retraction Actuator & Linkage
│   │   ├── Electromechanical Vibration Actuator
│   │   └── Leachate Collection Drain Hole & Basin Channel
│   ├── 3.3 Thermophilic Decomposition Section
│   │   ├── Decomposition Vessel (Semi-cylindrical digestion volume)
│   │   ├── Agitation Mechanism
│   │   │   ├── Bottom-Mounted Agitation DC Motor
│   │   │   ├── Vertical Agitation Shaft
│   │   │   └── Mixing Paddles / Agitation Arms (Blunt pitched sweeps)
│   │   ├── Sensor Array
│   │   │   ├── Mass-Sensing Load Cell
│   │   │   ├── Core Temperature Sensor Probe
│   │   │   └── Moisture Sensor Probe
│   │   └── Aeration Passages (Linked to negative-pressure chimney exhaust)
│   └── 3.4 Manure Output Section
│       ├── Manure Receiver Chamber
│       └── Semicircular Manure Output Drawer (Sliding drawer with front handle)
│
├── 4. Inorganic Storage Section (90° Quadrant Sector)
│   ├── 4.1 Inorganic Shaft Enclosure (90° vertical quadrant volume)
│   ├── 4.2 Deflector Chute
│   └── 4.3 Inorganic Storage Drawer / Bin (Sliding 90° quadrant bin with handle)
│
├── 5. Leftover Food Section - Embodiment B (90° Quadrant Sector)
│   ├── 5.1 Leftover Food Top Closure (90° planar closure cap at Y = 925 mm)
│   ├── 5.2 Leftover Food Access Door / Ramp
│   │   ├── Fixed Bottom Hinge Pivot Node (Y = 700 mm)
│   │   ├── Curved Access Door Panel (Y = 700–800 mm, H = 100 mm, 10 mm arc padding)
│   │   └── Fixed Hinge Axis Datum Marker
│   ├── 5.3 Leftover Food Outer Drawer Envelope (Sliding carriage, Y = 100–480 mm)
│   │   ├── Pull Handle
│   │   └── Pneumatic Perimeter Odor Seal
│   ├── 5.4 Dual-Layer Nested Strainer Subsystem
│   │   ├── Removable Bucket-Style Perforated Inner Tray (Y = 125–475 mm)
│   │   └── Lower Liquid Drainage Collection Sump (25 mm clearance)
│   └── 5.5 Food Leachate Drainage Interface
│
└── 6. Leachate Collection Subsystem
    ├── 6.1 Organic Drainage Pipe (Vertical channel from storage drain)
    ├── 6.2 Food Drainage Pipe (Vertical channel from leftover food drain)
    ├── 6.3 Lower Leachate Sump Channel
    └── 6.4 Removable Leachate Collection Drawer / Tray (Low-profile sliding tray)
```

---

## C. COMPONENT GEOMETRY & VALIDATION SPECIFICATION

The following table explicitly defines every major component with all required parameters and validation classifications:

| Component | Geometry | Dimensions | Dimension Status | Movement | Axis | Pivot | Collision Required | Reference Source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Main Cylindrical Shell** | Hollow open-ended cylinder | Height: TBD, Dia: TBD, Wall: TBD | **ENGINEERING PARAMETER — TBD** | Fixed / None | None | None | Yes (Static compound hollow cylinder) | `IMG_20260925_175015`, `Version 1 doc` (Line 82) |
| **Primary Vertical Divider** | Planar rectangular bulkhead | Height: **825 mm**, Width: TBD, Thickness: TBD | **CONFIRMED DIMENSION** (Height: 825 mm, $Y = 100\text{–}925\text{ mm}$) | Fixed / None | None | None | Yes (Static planar box) | `docs/design_specs.md` (Line 23), `IMG_20260925_175039` |
| **Secondary Vertical Divider** | Planar radial bulkhead (90° split) | Height: **825 mm**, Width: TBD, Thickness: TBD | **CONFIRMED DIMENSION** (Height: 825 mm, $Y = 100\text{–}925\text{ mm}$) | Fixed / None | None | None | Yes (Static planar box) | `IMG_20260925_175039`, `IMG_20260925_175314`, `175331` |
| **Top Collar Rim** | Open cylindrical ring / Input Section | Height: **95 mm**, Outer Dia: TBD, Thickness: TBD | **CONFIRMED DIMENSION** (Height: 95 mm, $Y = 925\text{–}1020\text{ mm}$) | Fixed / None | None | None | Yes (Static hollow ring) | `docs/design_specs.md` (Line 20), `IMG_20260925_175015` |
| **Rear Dome Cover** | Curved half-dome cap shell | Height: TBD, Radius: TBD, Thickness: TBD | **ENGINEERING PARAMETER — TBD** | Fixed / None | None | None | Yes (Static convex hull) | `IMG_20260925_175015` (Options 1 & 2) |
| **User Interaction Device (UID)** | Rectangular bezel with OLED display & 3 buttons | Width: TBD, Height: TBD, Depth: TBD | **ENGINEERING PARAMETER — TBD** | Fixed / None | None | None | No (Visual UI mesh) | `IMG_20260925_175015`, `Version 1 doc` (Line 77) |
| **Base Plinth Frame** | Low stepped hollow cylinder | Height: TBD, Dia: TBD, Wall: TBD | **ENGINEERING PARAMETER — TBD** | Fixed / None | None | None | Yes (Static stepped cylinder) | `IMG_20260925_175015`, `175039` |
| **Caster Assemblies (x4)** | Swivel fork bracket + cylindrical wheel disk | Wheel Dia: TBD, Fork Height: TBD, Offset Radius: TBD | **ENGINEERING PARAMETER — TBD** | Swivel + Rolling | Vertical swivel ($Y$) + Horizontal rolling | Swivel kingpin + Wheel axle | Yes (Compound cylinder + box) | `IMG_20260925_175015`, `175039` (Bottom view) |
| **Removable Power Cartridge** | Polymeric casing enclosure with handle | Form: 16-cell (4S4P) pack, Length/Width/Height: TBD | **ENGINEERING PARAMETER — TBD** | Linear translation (Removable) | Horizontal ($+Z$) | Base receiving dock slide rails | Yes (Rigid bounding box) | `Version 1 doc` (Lines 129–130) |
| **Input Receiving Funnel** | Hollow inverted truncated conical hopper | Height: within 95 mm section, Top Dia: TBD, Throat Dia: TBD | **CONFIRMED GEOMETRY** (Dimensions TBD) | Fixed / None | None | None | Yes (Static compound conical trimesh) | `docs/design_specs.md` (Line 20), `IMG_20260925_175102` |
| **Sensor Crossbeam** | Horizontal structural beam | Length: TBD, Width: TBD, Thickness: TBD | **ENGINEERING PARAMETER — TBD** | Fixed / None | None | None | Yes (Static box) | `IMG_20260925_175102` (Bottom view) |
| **Ultrasonic Distance Sensor** | Dual-barrel sensor housing | Width: TBD, Height: TBD, Barrel Dia: TBD | **ENGINEERING PARAMETER — TBD** | Fixed / None | None | None | No (Sensor raycast trigger) | `IMG_20260925_175102`, `Version 1 doc` (Line 4) |
| **Optical Camera Module** | Enclosure box with downward-facing lens | Width: TBD, Height: TBD, Lens Dia: TBD | **ENGINEERING PARAMETER — TBD** | Fixed / None | None | None | No (Sensor frustum trigger) | `IMG_20260925_175102`, `Version 1 doc` (Line 4) |
| **Sorting Flap** | Contoured planar/peanut plate | Length: TBD, Width: TBD, Thickness: TBD | **REFERENCE GEOMETRY** (Dimensions TBD) | Angular tilt / 2-axis rotation | Horizontal tilt axis (or 2-axis) | Bottom neck of funnel throat | Yes (Dynamic box / convex hull CCD) | `IMG_20260925_175139`, `Version 1 doc` (Line 4, 10) |
| **Cutting Headroom** | Open clearance headroom volume | Height: **10 mm**, Span: 180° semi-cylinder | **BASELINE / CHANGEABLE** ($Y = 915\text{–}925\text{ mm}$) | Fixed / None | None | None | No (Clearance envelope) | Master Geometry Section 4 |
| **Cutting Chamber Collar** | Circular hollow cylinder inside semi-cylinder | Diameter: **200 mm**, Height: **25 mm**, Thickness: **3 mm** | **BASELINE / CHANGEABLE** ($Y = 890\text{–}915\text{ mm}$) | Fixed / None | None | None | Yes (Static hollow cylinder) | `IMG_20260925_175201`, `175220` |
| **Cutting Motor** | Cylindrical motor body mounted upside down | Diameter: **50 mm**, Height: **35 mm** ($Y = 915\text{–}950\text{ mm}$) | **BASELINE / CHANGEABLE** (Mounted on collar crossbeam) | Fixed / None | None | None | Yes (Static cylinder) | `IMG_20260925_175201`, `Version 1 doc` (Line 18) |
| **Downward Cutting Shaft** | Vertical solid cylindrical rod | Diameter: **12 mm**, Length: **21 mm** ($Y = 894\text{–}915\text{ mm}$) | **BASELINE / CHANGEABLE** (Vertical drive shaft) | High-speed continuous rotation | Vertical ($Y$-axis) | Motor output journal | Yes (Capsule / cylinder) | `IMG_20260925_175220`, `Version 1 doc` (Line 18) |
| **Pitched Shear Blades** | 4-arm cross with aerodynamic pitch & hooked tips | Span: **180 mm**, Width: **14 mm**, Pitch: **22°**, Hook: **15 mm** | **BASELINE / CHANGEABLE** ($Y = 894\text{ mm}$) | High-speed continuous rotation | Vertical ($Y$-axis, with shaft) | Shaft center hub | Yes (Dynamic compound boxes) | `IMG_20260925_175201`, `Version 1 doc` (Line 18, 21) |
| **Sizing Mesh Screen** | Circular perforated screen disk + sector flange | Diameter: **200 mm**, Thickness: **2 mm**, Aperture: **8 mm** | **BASELINE / CHANGEABLE** ($Y = 890\text{ mm}$) | Fixed / None | None | None | Yes (Static filter plane) | `IMG_20260925_175201`, `175220` |
| **Storage Chamber Shell** | Semi-cylindrical upper holding vessel (180°) | Height: **270 mm** ($220 + 50\text{ mm}$), Radius: TBD, Wall: TBD | **BASELINE / CHANGEABLE** ($Y = 620\text{–}890\text{ mm}$) | Fixed / None | None | None | Yes (Static compound semi-cylinder) | `IMG_20260925_175201`, `175220`, `175238` |
| **Drainage Screen** | Semi-circular perforated screen plate | Thickness: **2 mm**, Clearance Gap: **5 mm** | **CONFIRMED GEOMETRY** ($Y = 629\text{–}631\text{ mm}$) | Fixed / Parallel above solid doors | None | None | Yes (Static filter plane) | `IMG_20260925_175220`, `Version 1 doc` (Line 32) |
| **Central Support Spine** | Structural longitudinal bar along center of base | Width: **16 mm**, Height: **14 mm**, Length: **243 mm** | **CONFIRMED GEOMETRY** ($Y = 620\text{ mm}$, $Z = 0$) | Fixed / Center structural spine | None | None | Yes (Static beam) | `IMG_20260925_175220`, `Version 1 doc` (Line 32) |
| **Storage Left Door Panel** | Sloped solid drop door flap (+Z quadrant) | **Thickness: EXACTLY 4 mm**, Slope: **3°**, Radius: **243 mm** | **CONFIRMED ARCHITECTURE / MANDATED 4 mm** ($Y = 620\text{ mm}$) | Angular downward swing | Horizontal longitudinal spine hinge | Left edge of central support spine | Yes (Dynamic box) | `IMG_20260925_175220`, `Version 1 doc` (Line 32, 37) |
| **Storage Right Door Panel**| Sloped solid drop door flap (-Z quadrant) | **Thickness: EXACTLY 4 mm**, Slope: **3°**, Radius: **243 mm** | **CONFIRMED ARCHITECTURE / MANDATED 4 mm** ($Y = 620\text{ mm}$) | Angular downward swing | Horizontal longitudinal spine hinge | Right edge of central support spine | Yes (Dynamic box) | `IMG_20260925_175220`, `Version 1 doc` (Line 32, 37) |
| **Leachate Drain Port** | Cylindrical collar & drainage orifice fitting | Diameter: **18 mm**, Height: **16 mm** | **DEFERRED COMPONENT** (Removed from baseline, to be added later) | Fixed / Central collection point | None | None | No (Deferred) | `IMG_20260925_175220`, `Version 1 doc` (Line 32, 34) |
| **Vibration Actuator** | Electro-mechanical eccentric / linear vibrator motor | Length: **35 mm**, Diameter: **20 mm** | **CONFIRMED COMPONENT / HIDDEN** (Under-spine location obstructs door swing) | Fixed / Clamped to central spine underside | None | None | No (Hidden) | `Version 1 doc` (Line 32, 35, 37) |
| **Exhaust Fan & Carbon Filter**| Square axial fan + cylindrical activated carbon canister | Fan: **70x70x20 mm**, Filter: **Ø65x18 mm**, Elevation: **Y = 770 mm** | **CONFIRMED TOPOLOGY / BASELINE TBD** | Rotary ($\omega_{\text{fan}}$, static currently) | Fan motor axis | Fan hub center | Yes (Static box / cylinder) | `IMG_20260925_175220`, `175238`, `Version 1 doc` (Line 32, 36) |
| **Agitator Mechanism** | Floor mount, vertical shaft, hub, dual pitched blades + tips | Mount: **Ø55x20 mm**, Shaft: **Ø16x140 mm**, Span: **180 mm** | **CONFIRMED ARCHITECTURE / BASELINE TBD** ($Y = 100\text{–}240\text{ mm}$) | Low-speed continuous rotation | Vertical $Y$-axis | Center of decomposition chamber floor | Yes (Dynamic compound rotor) | `IMG_20260925_175238`, `Version 1 doc` (Lines 65–70) |
| **Decomposition Load Cell** | Mass-sensing load cell puck & mounting flange | Diameter: **50 mm**, Height: **10 mm** | **CONFIRMED COMPONENT / HIDDEN** (Beneath decomposition floor at $Y = 95\text{ mm}$) | Fixed / Weight reaction base | None | Under floor journal boss | No (Hidden) | `Version 1 doc` (Lines 48, 50–52, 65, 68) |
| **Decomposition Temperature Sensor** | Core biomass stainless steel needle probe | Probe Length: **50 mm**, Diameter: **4 mm** | **CONFIRMED COMPONENT / HIDDEN** (Chamber floor at $Z = 135\text{ mm}$) | Fixed / Vertical immersion into biomass | None | Chamber floor | No (Hidden) | `Version 1 doc` (Lines 48, 50, 65, 125, 134) |
| **Decomposition Moisture Sensor** | Capacitive / dielectric dual-prong probe | Prong Length: **35 mm**, Spacing: **10 mm** | **CONFIRMED COMPONENT / HIDDEN** (Chamber floor at $Z = -135\text{ mm}$) | Fixed / Vertical immersion into biomass | None | Chamber floor | No (Hidden) | `Version 1 doc` (Lines 48, 65, 125) |

---

## D. MOVING COMPONENTS CATALOG

| Component Name | Movement Type | Rotation / Translation Axis | Approximate Pivot / Track Location | Functional Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Sorting Flap** | Angular rotation / tilt | Horizontal transverse axis | Directly below input funnel discharge throat | Route waste to Organic (180°) or Inorganic (90°) chamber |
| **Cutting Rotor Assembly** | Continuous high-speed rotation | Vertical $Y$-axis | Center of top-mounted cutting motor in collar | Sizing shear and aerodynamic downward suction of organic waste |
| **Storage Left Door Panel** | Angular downward swing | Horizontal $Z$-axis | Along left side of central support spine | Hydrostatic drainage support; drops waste batch into decomposition chamber |
| **Storage Right Door Panel** | Angular downward swing | Horizontal $Z$-axis | Along right side of central support spine | Symmetrical downward drop matching left door |
| **Agitation Rotor Assembly** | Low-speed continuous / periodic rotation | Vertical $Y$-axis | Center of bottom decomposition chamber floor | Oxygenation, homogenization, de-compacting decomposing mass |
| **Manure Output Drawer** | Linear translation | Horizontal longitudinal ($+Z$) | Floor rails of decomposition section | User manual extraction of finished organic compost/manure |
| **Inorganic Output Drawer** | Linear translation | Horizontal longitudinal / radial ($+Z$) | Base guide rails of inorganic section | User manual removal of accumulated inorganic waste |
| **Leftover Food Inlet Carriage** | Linear translation (sliding drawer) | Horizontal longitudinal ($+Z$) | Upper rails of leftover food quadrant | Front-loading access for cooked food waste, bypassing top funnel |
| **Leftover Food Inner Strainer** | Linear translation (vertical lift) | Vertical elevation ($+Y$) | Nested inside leftover food outer carriage | Removable bucket-style extraction for clean, bag-free disposal |
| **Leftover Food Output Drawer**| Linear translation | Horizontal longitudinal / radial ($+Z$) | Base guide rails of leftover food quadrant | Manual emptying of dried food solids |
| **Leachate Collection Drawer** | Linear translation | Horizontal longitudinal ($+Z$) | Lowest slot in base plinth | Manual extraction and emptying of collected liquid runoff |
| **Exhaust Fan Rotor** | Continuous high-speed rotation | Fan motor drive axis | Upper rear exhaust plenum | Negative-pressure airflow for chimney aeration and odor venting |
| **Caster Wheel Swivels (x4)** | Angular rotation (swivel) | Vertical axis through fork mount | Four corners / quadrants of base underside | 360° directional steering for apparatus mobility |
| **Caster Wheel Rollers (x4)** | Continuous rolling rotation | Horizontal wheel axle | Center of each caster wheel | Ground rolling motion |

---

## E. DESIGN DECISIONS REQUIRING CONFIRMATION

The following 20 specific items cannot currently be determined confidently from the supplied references without making unconfirmed engineering assumptions. Each item is strictly classified as **confirmed by reference**, **inferred from sketch**, or **not defined**:

1. **Overall Outer Diameter:**
   * **Status:** **NOT DEFINED**
   * *Analysis:* The legacy value ($0.8\text{ m}$) in `src/utils/constants.js` is an unverified placeholder. No numerical outer diameter is present in `docs/design_specs.md` or patent documentation.
2. **Overall Height:**
   * **Status:** **NOT DEFINED**
   * *Analysis:* The legacy value ($1.8\text{ m}$) in `src/utils/constants.js` is an unverified placeholder. Only the input section ($200\text{ mm}$) and divider ($700\text{ mm}$) are confirmed.
3. **Shell Wall Thickness:**
   * **Status:** **NOT DEFINED**
   * *Analysis:* Neither single-wall nor double-wall thermal insulation thickness is specified numerically anywhere in the references.
4. **Exact Heights of Each Internal Chamber:**
   * **Status:** **NOT DEFINED**
   * *Analysis:* While the total divider height is confirmed at $700\text{ mm}$, the exact vertical split between Cutting collar, Storage chamber, Decomposition chamber, and Manure output drawer is not defined.
5. **Exact Radial Boundaries Between the 180°, 90°, and 90° Sectors:**
   * **Status:** **INFERRED FROM SKETCH**
   * *Analysis:* Sketches `IMG_20260925_175201`, `175314`, and `175331` clearly depict a 180° semi-circle and two equal quadrant sectors. However, the exact angular rotation of the partition planes relative to the $+Z$ axis (e.g., whether the diameter divider runs exactly along $Z$ or $X$) is inferred from sketches and not defined dimensionally.
6. **Cutting Chamber Diameter:**
   * **Status:** **NOT DEFINED**
   * *Analysis:* Sketch `IMG_20260925_175201` explicitly notes: *"Cutting mechanism is circular instead of semi cylindrical"*. However, the diameter of this circular cylinder and its mounting offset inside the 180° semi-cylinder are not defined.
7. **Cutting Mesh Diameter and Thickness:**
   * **Status:** **NOT DEFINED**
   * *Analysis:* Circular perforated disk topology is confirmed, but mesh disk diameter, thickness, and perforation aperture diameter/spacing are not defined.
8. **Blade Dimensions (Span, Chord, Thickness, Hook Angle):**
   * **Status:** **INFERRED FROM SKETCH**
   * *Analysis:* 4-arm cross configuration with hooked aerodynamic tips is confirmed from sketch `IMG_20260925_175201` and `Version 1 doc` (Line 18). Numerical blade length, chord width, blade thickness, shear pitch angle, and hook geometry are not defined.
9. **Storage Chamber Dimensions (Height, Volume):**
   * **Status:** **NOT DEFINED**
   * *Analysis:* Semicylindrical volume is confirmed by sketches `IMG_20260925_175220` and `175238`. Exact vertical height and holding capacity in liters are not defined.
10. **Double-Door Hinge Positions (Offset from Centerline, Panel Slope Angle):**
    * **Status:** **INFERRED FROM SKETCH**
    * *Analysis:* Center-hinged double doors opening downward from a central support spine are confirmed by sketch `IMG_20260925_175220` and `Version 1 doc` (Line 32). Exact hinge axis centerline offset, door leaf length, and closed slope V-angle are not defined.
11. **Decomposition Chamber Dimensions (Vertical Height, Volume):**
    * **Status:** **NOT DEFINED**
    * *Analysis:* Semicylindrical lower vessel is confirmed by sketches `IMG_20260925_175238` and `175252`. Exact vertical height, volume, and wall clearance are not defined.
12. **Agitator Dimensions and Clearance (Paddle Length, Shaft Diameter, Floor Clearance):**
    * **Status:** **INFERRED FROM SKETCH / BASELINE PARAMETERS CONFIRMED**
    * *Analysis:* Central vertical shaft driving rotating mixing paddles near the chamber floor is confirmed by sketch `IMG_20260925_175238` and `Version 1 doc` (Lines 65–70). Modeled with baseline parameters: shaft Ø16x140 mm, paddle sweep span Ø180 mm with 20° pitch, 40 mm upward perimeter sweep uprights, 15 mm floor clearance, and 32 mm perimeter clearance centered at $X = -124\text{ mm}, Z = 0$.
13. **Manure Drawer Dimensions (Height, Width, Depth, Wall Thickness):**
    * **Status:** **INFERRED FROM SKETCH**
    * *Analysis:* Semicircular sliding drawer at the bottom of the organic half is confirmed by sketch `IMG_20260925_175252`. Height, sliding guide clearance, and internal capacity are not defined.
14. **Inorganic Drawer Geometry and Extraction Direction:**
    * **Status:** **INFERRED FROM SKETCH**
    * *Analysis:* 90° quadrant sliding bin is confirmed by sketch `IMG_20260925_175314`. Exact sliding extraction direction (whether straight $+Z$ or angled along its 45° radial sector centerline) and dimensions are not defined.
15. **Leftover-Food Drawer Geometry and Extraction Direction:**
    * **Status:** **INFERRED FROM SKETCH**
    * *Analysis:* Flush front-loading sliding drawer is confirmed by sketch `IMG_20260925_175331` and `Version 1 doc` (Line 114). Exact sliding vector ($+Z$ vs angled) and dimensions are not defined.
16. **Strainer Basket Dimensions (Height, Wall Thickness, Perforation Size):**
    * **Status:** **NOT DEFINED**
    * *Analysis:* Removable bucket-style perforated inner tray with bucket handle is confirmed by `alternative_embodiment_b.md` (Line 10) and `Version 1 doc` (Line 95). Numerical dimensions, hole diameter, hole spacing, and clearance inside the outer carriage are not defined.
17. **Leachate Section Geometry (Sump Depth, Slope Angle, Pipe Diameters, Drawer Size):**
    * **Status:** **NOT DEFINED**
    * *Analysis:* Sloped drainage basin, outlet pipes, and bottom sliding leachate tray are confirmed by sketches `IMG_20260925_175015`, `175039`, `175220` and `Version 1 doc` (Line 79). Conduit pipe diameters, drainage floor slope angles, and tray capacity are not defined.
18. **Wheel / Caster Dimensions and Offsets (Diameter, Height, Bolt Circle Radius):**
    * **Status:** **INFERRED FROM SKETCH**
    * *Analysis:* 4 caster wheels arranged symmetrically under the circular base plate are confirmed by sketch `IMG_20260925_175039` (Bottom view). Caster wheel diameter, bracket height, and mounting circle radius are not defined.
19. **Top Cap / Dome Geometry (Dome Height, Curvature Radius, Display Angle):**
    * **Status:** **INFERRED FROM SKETCH**
    * *Analysis:* Rounded top lid with display on rear half and funnel on front half is confirmed by sketch `IMG_20260925_175015` (Options 1 & 2). Curvature profile (spherical vs elliptical), dome rise height, and display angle are not defined.
20. **External Shell Thickness:**
    * **Status:** **NOT DEFINED**
    * *Analysis:* Sheet metal / polymeric shell gauge and thickness are not defined.

---

## F. GEOMETRY LOCK STATUS

To prevent the upcoming 3D geometry modeling phase from inventing missing parameters, all physical elements are divided into three operational lock tiers:

### 1. LOCKED (Authoritative & Fully Constrained)
These elements have fully confirmed values or unambiguous topological boundaries that must be built without deviation:
* **Input Section Vertical Height:** **`95 mm`** (`docs/design_specs.md`)
* **Internal Divider Vertical Height:** **`825 mm`** (`docs/design_specs.md`)
* **Cylindrical Housing Topology:** Upright circular cylindrical modular envelope
* **Coordinate System & Orientation:** $Y$ vertical, $+Z$ front facing
* **Organic Chamber Volumetric Sector:** 180° semi-cylindrical column
* **Inorganic Chamber Volumetric Sector:** 90° quadrant vertical shaft
* **Leftover Food Chamber Volumetric Sector:** 90° quadrant vertical shaft
* **Top Head Partitioning:** 50% closed rear dome with display; 50% open front recessed funnel basin
* **Cutting Mechanism Motor Topology:** Upside-down top-mounted motor driving downward vertical shaft
* **Cutting Rotor Blade Topology:** 4-blade aerodynamic shear rotor with hooked tips sweeping above horizontal screen
* **Storage Door Mechanism Topology:** Center-hinged double doors with central support spine swinging downward
* **Leftover Food Subsystem Topology:** Dual-layer structure (outer containment carriage + removable inner perforated bucket strainer)
* **Base Mobility Topology:** 4 symmetrically placed caster wheels on the underside of base plate
* **Embodiment B Simplifications:** Single collective inorganic storage bin; manual microbe/water addition; NO automated water sprinkler, NO automated microbe dispenser, NO automated carbon auger, NO 3-way partitioned inorganic divider.

### 2. PARTIALLY LOCKED (Topology Confirmed, Dimensions Pending TBD Confirmation)
These components have confirmed structural shapes and kinematic relationships, but their exact dimensions, thicknesses, and clearances must reference provisional parametric variables rather than hardcoded assumptions:
* **Input Receiving Funnel:** Conical hopper shape locked; slope angle and throat diameter TBD.
* **Sorting Flap:** Contoured plate locked; length, pivot pin offset, and tilt angle TBD.
* **Cutting Chamber Collar:** Circular cylinder nested inside 180° semi-cylinder locked; collar diameter and height TBD.
* **Sizing Mesh Disk:** Circular perforated screen locked; disk diameter, thickness, and hole aperture TBD.
* **Storage Drainage Screen:** Semicircular perforated screen locked; mesh dimensions and hole aperture TBD.
* **Storage Double-Door Panels:** Symmetrical drop flaps with synchronized kinematic assembly aligned to physical hinge rods at $(0, 624\text{ mm}, \pm 8\text{ mm})$; linkage attachment lugs included.
* **Decomposition Chamber & Agitator:** Removable drawer/vessel ($Y = 100\text{–}370\text{ mm}$) traveling with agitator assembly; stationary drive motor in plinth ($Y = 0\text{–}100\text{ mm}$); quick-release coupling interface at base; dual lateral load-cell support pads at $Z = \pm 90\text{ mm}$ under the chamber.
* **Inorganic Output Drawer:** 90° air-fryer style removable container drawer ($Y = 100\text{–}480\text{ mm}$) with front pull handle and linear extraction along $+X$.
* **Leftover Food Output Drawer:** 90° removable physical container drawer ($Y = 100\text{–}480\text{ mm}$) with front pull handle and linear extraction along $+Z$; nested strainer basket hidden pending future drainage decisions.
* **Leftover Food Access Door:** Upper loading ramp ($Y = 700\text{–}800\text{ mm}$) with straight horizontal chord hinge connecting two supported divider wall brackets (Point A: $10, 700, 245.8\text{ mm}$; Point B: $245.8, 700, 10\text{ mm}$) and $10\text{ mm}$ side padding.
* **Electronics Bay:** Upper unused region above leftover food closure ($Y = 928\text{–}968\text{ mm}$) housing Arduino MCU and 4S4P LiFePO4 battery box.
* **Segregation Platform Support:** Rigid structural support hub ($\varnothing 38\text{ mm} \times 6\text{ mm}$, $Y = 925\text{–}931\text{ mm}$) at central/radial divider intersection $(0, 0, 925\text{ mm})$ with dual precision bearings, divider saddle clamping brackets, drive motor ($\varnothing 28\text{ mm} \times 20\text{ mm}$, $Y = 901\text{–}921\text{ mm}$) directly below platform coaxial with yaw axis, and precision shaft coupling. Leaves $1.0\text{ mm}$ physical running clearance beneath platform.
* **Leachate Collection Drawer:** Low-profile sliding tray locked; drawer height, length, width, and guide clearances TBD.
* **User Interaction Device Bezel:** Physically mounted ON TOP OF the closed rear semicircular lid (`TopClosure_TopLid`) via an integrated pedestal bracket; tilted $25^\circ$ upward toward $+Z$ front for ergonomic standing user view; baseline: $72 \times 38 \times 8\text{ mm}$ bezel ($63.4 \times 26.9\text{ mm}$ screen).

---

## E. PHASE 3 APPROVED ARCHITECTURAL IMPLEMENTATIONS

1. **Removable Decomposition Vessel & Agitator Assembly:**
   * Chamber is itself the removable drawer/vessel.
   * Agitator assembly remains attached to vessel and travels out with it along $-X$.
   * Decomposition drive motor remains stationary below in plinth ($Y = 0\text{–}100\text{ mm}$).
   * Schematic quick-release mechanical coupling disconnects agitator shaft from stationary motor.
   * Load cells located under removable vessel via dual lateral support pads ($Z = \pm 90\text{ mm}$, $Y = 95\text{ mm}$), measuring vessel + contents, establishing empty vessel as tare baseline. Load cells clear agitator central shaft ($> 75\text{ mm}$) and do not impede drawer extraction.
   * Stationary slide guide rails at $Z = \pm 120\text{ mm}$ ($X \in [-210, -4]\text{ mm}$, length $206\text{ mm}$), terminating $4.7\text{ mm}$ inside the shell when closed with zero external overhang.
2. **Inorganic Air-Fryer Pull-Out Drawer:**
   * Physical container body ($Y = 100\text{–}480\text{ mm}$, 90° quadrant).
   * Linear outward extraction along $+X$ vector through intended external opening.
   * Front-facing handle and stationary slide rails on chassis: Rail 1 at $Z = -30\text{ mm}$ ($X \in [4, 240]\text{ mm}$, length $236\text{ mm}$); Rail 2 at $Z = -120\text{ mm}$ ($X \in [4, 210]\text{ mm}$, length $206\text{ mm}$). Zero external overhang when closed.
3. **Leftover Food Subsystem:**
   * Physical container drawer ($Y = 100\text{–}480\text{ mm}$) sliding along $+Z$ with front pull handle.
   * Stationary slide rails on chassis: Rail 1 at $X = +30\text{ mm}$ ($Z \in [4, 240]\text{ mm}$, length $236\text{ mm}$); Rail 2 at $X = +120\text{ mm}$ ($Z \in [4, 210]\text{ mm}$, length $206\text{ mm}$). Zero external overhang when closed.
   * Upper access door ($Y = 700\text{–}800\text{ mm}$) rotating outward/downward around straight horizontal chord hinge supported at lower corners by divider walls, preserving $10\text{ mm}$ side padding.
   * Strainer basket hidden pending future drainage decisions.
4. **Upper Electronics Bay:**
   * Bounded protective housing in upper unused region above leftover food top closure ($Y = 928\text{–}968\text{ mm}$).
   * Houses Arduino MCU board and 16 LiFePO4 cells in 4S4P battery box.
   * Clears central funnel cone ($> 28\text{ mm}$) and outer shell ($> 14\text{ mm}$).
5. **Structural Segregation Base Support Assembly:**
   * Primary structural mounting directly at the Central Divider (180°) and Radial Divider (90°) intersection $(0, 0, 925\text{ mm})$.
   * Rigid cylindrical housing body `SegregationSupportHub` ($\varnothing 38\text{ mm} \times 6\text{ mm}$, $Y = 925\text{–}931\text{ mm}$) seated on divider rims, maintaining $1.0\text{ mm}$ running clearance below rotating platform bottom ($Y = 932\text{ mm}$).
   * Dual precision spindle bearings: Upper thrust/radial ($Y = 929.75\text{ mm}$) and Lower radial ($Y = 926.25\text{ mm}$) providing $3.5\text{ mm}$ bearing span constraining the $\varnothing 8\text{ mm}$ spindle against impact and wobble.
   * Structural saddle clamping brackets (`SegregationDividerMount_Central` and `_Radial`) dropping $8\text{ mm}$ down divider walls ($Y = 917\text{–}925\text{ mm}$) secured with clamping bolts.
   * Segregation drive stepper motor `SegregationDriveMotor` ($\varnothing 28\text{ mm} \times 20\text{ mm}$, $Y = 901\text{–}921\text{ mm}$) suspended below housing by mounting flange `SegregationDriveMotor_Flange` ($\varnothing 35\text{ mm} \times 3\text{ mm}$), coaxial with yaw axis $[0, 1, 0]$.
   * Precision shaft coupling `SegregationMotorShaftCoupling` ($\varnothing 14\text{ mm} \times 6\text{ mm}$, $Y = 920\text{–}926\text{ mm}$) coupling motor shaft to vertical spindle.
   * Arduino MCU and LiFePO4 battery arrangement are strictly isolated in Upper Electronics Bay, NOT in segregation support assembly.
   * Complete structural load path grounded through divider intersection into chassis/shell.
6. **Storage Synchronized Double Doors:**
   * Kinematic groups centered on physical hinge rods with linkage lugs for synchronized downward drop into $250\text{ mm}$ clearance gap.
7. **Deferred Architectural Interface:**
   * **TEMPERATURE/MOISTURE SENSOR REMOVABLE-VESSEL INTERFACE — DEFERRED ARCHITECTURAL DECISION:**  
     Conceptual function preserved. Final mechanical mounting architecture and wiring interface across the removable drawer boundary are deferred to future architectural resolution.

