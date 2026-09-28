# GOMIKIN MASTER GEOMETRY

**Document Version:** 1.0  
**Phase:** Phase 1 — Parametric Geometry Definition  
**Target Design:** Alternative Embodiment B (Household Automated Waste Segregation & In-Vessel Processing Apparatus)  
**Authoritative Reference:** `docs/model_blueprint.md` and `docs/design_specs.md`

---

## 1. Coordinate System

The master geometry strictly adheres to the standard Three.js right-handed Cartesian coordinate system defined in `docs/design_specs.md`:

* **Origin $(0, 0, 0)$:** Center of the bottom base plinth at ground contact level (projected vertical centerline of the apparatus cylinder).
* **X-Axis (Transverse / Lateral):** Left $(-X)$ to Right $(+X)$.
* **Y-Axis (Vertical / Elevation):** Upwards $(+Y)$. $Y = 0$ is the floor contact baseline.
* **Z-Axis (Sagittal / Longitudinal):** Back $(-Z)$ to Front $(+Z)$.
* **Front Direction:** $+Z$ vector. The User Interaction Device (OLED display and control buttons), input funnel deposit zone, front-loading leftover food drawer, and lower service extraction drawers face in the $+Z$ direction.

```
                 +Y (Elevation / Vertical Height)
                  |
                  |
                  |_______ +X (Right: Inorganic & Leftover Food Sectors)
                 /
                /
              +Z (Front: User Interface, Funnel Opening, Service Drawers)

  -X = Left (Organic Processing Sector: 180°)
  -Z = Rear (Closed Upper Dome, Airflow Exhaust & Filter Port)
```

---

## CURRENT BASELINE DIMENSIONS

> **CRITICAL PARAMETRIC NOTICE:**  
> These dimensions represent the **current baseline starting parameters** for the Gomikin 3D reconstruction. They are **NOT permanently fixed dimensions** and are explicitly **subject to later engineering revision**.  
> In all CAD scripts, procedural Three.js classes, and mathematical models, these values **MUST remain named parameters/constants** rather than hard-coded geometry, so that altering any baseline dimension will automatically regenerate the model without geometric code refactoring.

### BASELINE / CHANGEABLE (Starting Parameters)

| Parameter Name | Baseline Value | Unit | Status | Description & Engineering Role |
| :--- | :--- | :--- | :--- | :--- |
| **`outer_diameter`** | **500** | mm | **BASELINE / CHANGEABLE** | Nominal outer cylindrical shell diameter. |
| **`overall_height`** | **1020** | mm | **BASELINE / CHANGEABLE** | Total ground-to-top apparatus height envelope ($95 + 825 + 100\text{ mm}$). |
| **`shell_wall_thickness`** | **4** | mm | **BASELINE / CHANGEABLE** | Outer protective shell and main structural wall thickness. |
| **`input_section_height`** | **95** | mm | **BASELINE / CHANGEABLE** | Vertical height of upper input receiving basin and sorting zone ($Y = 925\text{ mm to } 1020\text{ mm}$). |
| **`middle_section_height`** | **825** | mm | **BASELINE / CHANGEABLE** | Vertical height of central processing and storage envelope ($Y = 100\text{ mm to } 925\text{ mm}$). |
| **`leachate_section_height`** | **100** | mm | **BASELINE / CHANGEABLE** | Vertical height of lower base plinth, leachate tray, and ground clearance ($Y = 0\text{ mm to } 100\text{ mm}$). |
| **`organic_cutting_headroom`** | **10** | mm | **BASELINE / CHANGEABLE** | Headroom between cutting mechanism and segregation base ($Y = 915\text{–}925\text{ mm}$). |
| **`organic_cutting_height`** | **25** | mm | **BASELINE / CHANGEABLE** | Vertical height envelope of cutting mechanism (part of Storage Section assembly, NOT a separate chamber) ($Y = 890\text{–}915\text{ mm}$). |
| **`organic_storage_height`** | **270** | mm | **BASELINE / CHANGEABLE** | Vertical height of organic storage and hydrostatic drainage chamber ($Y = 620\text{–}890\text{ mm}$). |
| **`organic_storage_decomposition_gap`** | **250** | mm | **BASELINE / CHANGEABLE** | Vertical clearance gap between storage chamber base and decomposition chamber (increased from 130 to 250 mm for door clearance) ($Y = 370\text{–}620\text{ mm}$). |
| **`organic_decomposition_height`** | **270** | mm | **BASELINE / CHANGEABLE** | Vertical height of organic thermophilic decomposition chamber ($Y = 100\text{–}370\text{ mm}$). |
| **`unresolved_middle_allocation`** | **0** | mm | **BASELINE / CHANGEABLE** | Fully allocated 825 mm middle section ($10 + 25 + 270 + 250 + 270 = 825\text{ mm}$). |
| **`output_drawer_start_from_middle_bottom`** | **380** | mm | **BASELINE / CHANGEABLE** | Vertical offset from bottom of middle section ($Y = 100\text{ mm}$) to output drawer start datum for Inorganic and Leftover Food sectors ($Y = 480\text{ mm}$). |
| **`output_section_start_datum_y`** | **480** | mm | **BASELINE / CHANGEABLE** | Architectural output-section start datum for BOTH 90° sectors ($Y = 480\text{ mm}$). |
| **`funnel_opening_diameter`** | **100** | mm | **BASELINE / CHANGEABLE** | Diameter of lower funnel discharge aperture above rotating base (supports 100 mm to 200 mm). |
| **`rotating_base_elevation_offset`** | **10** | mm | **BASELINE / CHANGEABLE** | Vertical offset above Input/Middle boundary ($Y = 925\text{ mm}$), establishing rotating base datum at $Y = 935\text{ mm}$. |

### DERIVED (Calculated Geometric Relationships)

* **Vertical Architecture Relationship:**
  $$\text{overall\_height} = \text{input\_section\_height} + \text{middle\_section\_height} + \text{leachate\_section\_height}$$
  $$1020\text{ mm} = 95\text{ mm} + 825\text{ mm} + 100\text{ mm}$$
* **Derived Elevations (from Ground $Y = 0$):**
  * Base Datum: $Y = 0\text{ mm}$
  * Leachate Top / Middle Bottom: $Y = 100\text{ mm}$
  * Middle Top / Input Bottom: $Y = 925\text{ mm}$
  * Top Envelope: $Y = 1020\text{ mm}$
  * Rotating Base Reference Datum: $Y_{\text{rotating\_base}} = Y_{\text{input\_bottom}} + \text{rotating\_base\_elevation\_offset} = 925\text{ mm} + 10\text{ mm} = \mathbf{935\text{ mm}}$
* **Organic Middle Section Vertical Allocation ($825\text{ mm}$ Fully Allocated Envelope):**
  $$\text{organic\_cutting\_headroom} + \text{organic\_cutting\_height} + \text{organic\_storage\_height} + \text{organic\_storage\_decomposition\_gap} + \text{organic\_decomposition\_height} = \mathbf{825\text{ mm}}$$
  $$10\text{ mm} + 25\text{ mm} + 270\text{ mm} + 250\text{ mm} + 270\text{ mm} = 825\text{ mm}$$
* **Cutting Headroom ($10\text{ mm}$):**
  $$Y = 915\text{ mm to } 925\text{ mm} \quad (\text{height} = 10\text{ mm})$$
  Provides dedicated clearance headroom between the top of the cutting mechanism ($Y = 915\text{ mm}$) and the base of the segregation mechanism ($Y = 925\text{ mm}$).
* **Organic Storage Section Assembly Envelope (Hierarchy Notice):**
  $$\text{organic\_storage\_assembly\_envelope} = \text{organic\_cutting\_height} + \text{organic\_storage\_height} = 25\text{ mm} + 270\text{ mm} = 295\text{ mm} \quad (Y = 620\text{–}915\text{ mm})$$
  *Structural Hierarchy Rule:* The cutting mechanism belongs structurally to the Storage Section assembly and is **NOT** represented as a separate vertical chamber.
* **Derived Vertical Elevation Datums of Organic Section (from Ground $Y = 0$):**
  * Middle Section Top / Input Boundary: $Y_{\text{middle\_top}} = \text{leachate\_section\_height} + \text{middle\_section\_height} = 100\text{ mm} + 825\text{ mm} = 925\text{ mm}$
  * Cutting Headroom: $Y = 915\text{ mm} \text{ to } 925\text{ mm}$ ($\text{height} = 10\text{ mm}$)
  * Cutting Mechanism Envelope: $Y = 890\text{ mm} \text{ to } 915\text{ mm}$ ($\text{height} = 25\text{ mm}$)
  * Storage Chamber: $Y = 620\text{ mm} \text{ to } 890\text{ mm}$ ($\text{height} = 270\text{ mm}$)
  * Inter-Chamber Gap: $Y = 370\text{ mm} \text{ to } 620\text{ mm}$ ($\text{height} = 250\text{ mm}$) (Increased from 130 to 250 mm for door clearance)
  * Decomposition Chamber: $Y = 100\text{ mm} \text{ to } 370\text{ mm}$ ($\text{height} = 270\text{ mm}$) (Undisturbed)
  * Middle Section Bottom: $Y_{\text{middle\_bottom}} = \text{leachate\_section\_height} = 100\text{ mm}$
* **Internal Divider Dimensions:**
  * `CentralDivider` and `RadialDivider` span the dedicated middle section:
    $$\text{divider\_height} = \text{middle\_section\_height} = \mathbf{825\text{ mm}} \quad (Y = 100\text{ mm to } 925\text{ mm})$$
    The input section ($Y = 925\text{ mm to } 1020\text{ mm}$) remains strictly free of divider walls.
* **Inorganic & Leftover Food Output Section Start Datum:**
  * For both the **Inorganic (90°)** sector and **Leftover Food (90°)** sector, the architectural output-section start datum is established at:
    $$Y_{\text{output\_section\_start}} = Y_{\text{middle\_bottom}} + \text{output\_drawer\_start\_from\_middle\_bottom} = 100\text{ mm} + 380\text{ mm} = \mathbf{480\text{ mm}}$$
  * The output envelopes extend downward toward the middle-section bottom ($Y = 100\text{ mm}$):
    $$\text{output\_envelope\_height} = 480\text{ mm} - 100\text{ mm} = \mathbf{380\text{ mm}}$$
* **Outer Radius ($R_{\text{outer}}$):**
  $$R_{\text{outer}} = \frac{\text{outer\_diameter}}{2} = \frac{500\text{ mm}}{2} = 250\text{ mm}$$
* **Nominal Internal Shell Radius ($R_{\text{inner}}$):**
  $$R_{\text{inner}} = R_{\text{outer}} - \text{shell\_wall\_thickness} = 250\text{ mm} - 4\text{ mm} = 246\text{ mm}$$
* **Sector Architecture Preservation (180° + 90° + 90°):**
  * **Organic Sector:** $\theta_{\text{organic}} = 180°$ (Semi-cylindrical processing volume, radius $R_{\text{inner}}$, height $700\text{ mm}$ middle envelope).
  * **Inorganic Sector:** $\theta_{\text{inorganic}} = 90°$ (Quadrant storage volume, radius $R_{\text{inner}}$, height $700\text{ mm}$ middle envelope).
  * **Leftover Food Sector:** $\theta_{\text{food}} = 90°$ (Quadrant holding volume, radius $R_{\text{inner}}$, height $700\text{ mm}$ middle envelope).

### TBD (Undefined Sub-Dimensions & Clearances)

The following internal component dimensions, clearances, and operational details remain strictly **TBD**:
* Drawer dimensions and envelopes (height, depth, clearance, extraction stroke, wall thickness, and volume) for:
  * Manure extraction drawer (lower organic level)
  * Inorganic output drawer (90° sector, starting at datum $Y = 480\text{ mm}$)
  * Leftover food outer carriage and removable strainer basket (90° sector, starting at datum $Y = 480\text{ mm}$)
* Exact angular orientation ($\theta_{\text{sector}}$) of the diameter divider relative to $+Z$.
* Cutting chamber diameter, blade span, hooked blade tip geometry, and mesh aperture sizing.
* Storage door hinge coordinates, panel dimensions, and slope angles.
* Agitator paddle span, shaft diameter, and floor clearance.
* Inorganic drawer extraction vector ($+Z$ vs 45° radial).
* Leachate drawer tray volume, drain slopes, and conduit diameters.
* Base caster wheel diameter, fork height, and mounting circle radius.
* Rotating base peanut profile contour radii, waist width, and lobe thicknesses.
* UID screen bezel depth and mounting bracket angle.

---

### Architectural Clarification: 700 mm Internal-Divider Alignment

> [!NOTE]
> **RESOLVED — Earlier Baseline vs. New Vertical Architecture:**  
> In earlier documentation (`docs/design_specs.md` Line 23), an internal `divider_height` of **700 mm** was recorded.  
> With the updated vertical baseline allocation (`middle_section_height = 700 mm`), the structural sector dividers (`CentralDivider` and `RadialDivider`) span from $Y = 100\text{ mm}$ to $Y = 800\text{ mm}$ ($700\text{ mm}$ height), directly satisfying and aligning with the 700 mm divider specification.

---

## 2. Global Parameters

| Parameter Name | Baseline Value | Unit | Status | Source |
| :--- | :--- | :--- | :--- | :--- |
| **`outer_diameter`** | **500** | mm | **BASELINE / CHANGEABLE** | Baseline Design Parameters (Subject to revision) |
| **`overall_height`** | **1020** | mm | **BASELINE / CHANGEABLE** | Baseline Design Parameters ($95 + 825 + 100$) |
| **`shell_wall_thickness`** | **4** | mm | **BASELINE / CHANGEABLE** | Baseline Design Parameters (Subject to revision) |
| **`input_section_height`** | **95** | mm | **BASELINE / CHANGEABLE** | Preserved Baseline ($Y = 925\text{–}1020\text{ mm}$) |
| **`middle_section_height`** | **825** | mm | **BASELINE / CHANGEABLE** | Updated Baseline ($Y = 100\text{–}925\text{ mm}$) |
| **`leachate_section_height`** | **100** | mm | **BASELINE / CHANGEABLE** | Baseline Design Parameters ($Y = 0\text{–}100\text{ mm}$) |
| **`organic_cutting_headroom`** | **10** | mm | **BASELINE / CHANGEABLE** | Headroom between cutting mechanism and segregation base ($Y = 915\text{–}925\text{ mm}$) |
| **`organic_cutting_height`** | **25** | mm | **BASELINE / CHANGEABLE** | Preserved cutting envelope ($Y = 890\text{–}915\text{ mm}$) |
| **`organic_storage_height`** | **270** | mm | **BASELINE / CHANGEABLE** | Preserved Storage ($220 + 50\text{ mm}$, $Y = 620\text{–}890\text{ mm}$) |
| **`organic_storage_decomposition_gap`** | **250** | mm | **BASELINE / CHANGEABLE** | Increased Gap for door clearance ($Y = 370\text{–}620\text{ mm}$) |
| **`organic_decomposition_height`** | **270** | mm | **BASELINE / CHANGEABLE** | Undisturbed Decomp ($220 + 50\text{ mm}$, $Y = 100\text{–}370\text{ mm}$) |
| **`output_drawer_start_from_middle_bottom`** | **380** | mm | **BASELINE / CHANGEABLE** | Output drawer start datum $Y = 480\text{ mm}$ ($100 + 380\text{ mm}$) |
| **`output_section_start_datum_y`** | **480** | mm | **BASELINE / CHANGEABLE** | Architectural output-section start datum for BOTH 90° sectors |
| **`funnel_opening_diameter`** | **100** | mm | **BASELINE / CHANGEABLE** | Lower funnel opening diameter (supports 100–200 mm) |
| **`rotating_base_elevation_offset`** | **10** | mm | **BASELINE / CHANGEABLE** | Rotating base reference point offset ($Y = 935\text{ mm}$) |
| **`food_top_closure_y`** | **925** | mm | **CONFIRMED BASELINE** | Top closure elevation covering 90° Leftover Food chamber opening ($Y = 925\text{ mm}$) |
| **`food_door_top_y`** | **800** | mm | **CONFIRMED BASELINE** | Upper movable edge elevation of Leftover Food access door ($Y = 800\text{ mm}$) |
| **`food_door_bottom_y`** | **700** | mm | **CONFIRMED BASELINE** | Bottom fixed hinge elevation of Leftover Food access door ($Y = 700\text{ mm}$) |
| **`food_door_height`** | **100** | mm | **CONFIRMED BASELINE** | Height of Leftover Food square access door ($Y = 700\text{–}800\text{ mm}$) |
| **`food_door_arc_padding`** | **10** | mm | **CONFIRMED BASELINE** | Circumferential padding along chamber arc from left/right sector boundaries |
| **`divider_height`** | **825** | mm | **CONFIRMED BASELINE** | Spans middle section ($Y = 100\text{–}925\text{ mm}$) |
| **`sector_orientation`** | TBD | deg | **INFERRED / TBD** | `references/sketches/` (`IMG_20260925_175201`, `175314`, `175331`) |

*Rule:* All numerical baseline values are starting parameters and must be modeled parametrically with named variables. Legacy placeholder values ($800\text{ mm}$ diameter or $1800\text{ mm}$ height) are prohibited.

---

## 3. Sector Architecture

The cylindrical envelope is partitioned into three discrete functional sectors:

* **Organic Sector:** **180°** semi-cylindrical volume.
  * Dedicated to the continuous biological processing train: cutting, drainage storage, thermophilic decomposition, and manure output.
* **Inorganic Sector:** **90°** quadrant sector volume.
  * Dedicated to passive dry inorganic waste accumulation and storage (collective storage in Alternative Embodiment B).
* **Leftover Food Sector:** **90°** quadrant sector volume.
  * Dedicated to cooked, high-moisture food waste holding with dual-layer liquid separation.

### Relationship to Coordinate System & Sector Orientation
* The primary diameter divider wall partitions the cylinder into two 180° halves.
* The secondary radial divider wall splits one 180° half into two 90° quadrants.
* *Status:* The exact angular rotation angle of the diameter divider relative to the $+Z$ axis is **INFERRED / TBD**. It must be treated as a parametric rotation variable ($\theta_{\text{sector}}$) rather than a hardcoded axis.

---

## 4. Vertical Architecture

The vertical stack of the apparatus is arranged sequentially from top to bottom according to the baseline parameters:

```
+Y = 1020 mm (Ground-to-Top Apparatus Height Envelope)
 ┌────────────────────────────────────────────────────────────────────────┐
 │ INPUT & SEGREGATION ASSEMBLY                                           │ Height: 95 mm (BASELINE / CHANGEABLE)
 │ (Top Closure lid, OLED Display, Funnel, Rotating Base, Camera, US Sens)│ Y = 925 mm to 1020 mm
 ├────────────────────────────────────────────────────────────────────────┤
 │ MIDDLE SECTION (Processing, Storage & Output Envelope)                 │ Height: 825 mm (BASELINE / CHANGEABLE)
 │ [Dividers span full middle section: CentralDivider & RadialDivider]    │ Y = 100 mm to 925 mm
 │                                                                        │
 │  ├── ORGANIC 180° SECTOR ALLOCATION (100% Fully Allocated):            │ Total: 825 mm (FULLY ALLOCATED)
 │  │    ├── Cutting Headroom (Clearance to Segregation Base) [H: 10 mm] │ Y = 915 mm to 925 mm
 │  │    ├── Cutting Mechanism Envelope (Storage Hierarchy) [H: 25 mm]   │ Y = 890 mm to 915 mm
 │  │    ├── Storage & Hydrostatic Drainage Chamber         [H: 270 mm] │ Y = 620 mm to 890 mm
 │  │    │   (Storage Assembly Total Envelope = 295 mm)                   │ (Y = 620 mm to 915 mm)
 │  │    ├── Inter-Chamber Gap (Storage to Decomposition)   [H: 250 mm] │ Y = 370 mm to 620 mm
 │  │    └── Thermophilic Decomposition Chamber             [H: 270 mm]  │ Y = 100 mm to 370 mm
 │  │        (Includes Agitator sweep & lower Manure Drawer envelope)     │
 │  │                                                                     │
 │  └── INORGANIC (90°) & LEFTOVER FOOD (90°) OUTPUT ENVELOPES:           │
 │       ├── Upper Storage / Inflow Region                                │ Y = 480 mm to 925 mm
 │       └── Output Envelopes (Inorganic Drawer, Food Outer, Basket)      │ Y = 100 mm to 480 mm (H: 380 mm)
 ├────────────────────────────────────────────────────────────────────────┤
 │ LEACHATE & BASE SECTION (Plinth, Tray & Casters)                       │ Height: 100 mm (BASELINE / CHANGEABLE)
 │ (Lower plinth, sliding leachate collection tray, battery dock)         │ Y = 0 mm to 100 mm
 └────────────────────────────────────────────────────────────────────────┘
Y = 0 mm (Ground Contact Baseline)
```

*Vertical Parametric Relationship:*
$$\text{overall\_height} = \text{input\_section\_height} + \text{middle\_section\_height} + \text{leachate\_section\_height}$$
$$1020\text{ mm} = 95\text{ mm} + 825\text{ mm} + 100\text{ mm}$$

### Middle Section Vertical Allocation Breakdown (Organic 180° Sector)

The $825\text{ mm}$ middle section is 100% utilized by the Organic processing train with dedicated headroom:

| Sub-Allocation Layer | Parameter Name | Height | Elevation Range ($Y$) | Classification | Structural Hierarchy & Architectural Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cutting Headroom** | `organic_cutting_headroom` | **10 mm** | **$Y = 915\text{ mm}$ to $925\text{ mm}$** | **BASELINE / CHANGEABLE** | Clearance headroom between cutting mechanism top and base of segregation mechanism ($Y = 925\text{ mm}$). |
| **Cutting Mechanism** | `organic_cutting_height` | **25 mm** | **$Y = 890\text{ mm}$ to $915\text{ mm}$** | **BASELINE / CHANGEABLE** | Part of Storage Section assembly hierarchy; cut down to 25 mm. |
| **Storage Chamber** | `organic_storage_height` | **270 mm** | **$Y = 620\text{ mm}$ to $890\text{ mm}$** | **BASELINE / CHANGEABLE** | Semi-cylindrical storage vessel ($220 + 50\text{ mm}$); preserved dimensions. |
| **Inter-Chamber Gap** | `organic_storage_decomposition_gap` | **250 mm** | **$Y = 370\text{ mm}$ to $620\text{ mm}$** | **BASELINE / CHANGEABLE** | Free clearance zone between storage doors drop swing and decomposition vessel opening (increased from 130 to 250 mm). |
| **Decomposition Chamber** | `organic_decomposition_height` | **270 mm** | **$Y = 100\text{ mm}$ to $370\text{ mm}$** | **BASELINE / CHANGEABLE** | Semi-cylindrical thermophilic digestion vessel ($220 + 50\text{ mm}$); meets MiddleOutputDatum at $Y = 370\text{ mm}$ (undisturbed). |
| **Total Middle Section** | `middle_section_height` | **825 mm** | **$Y = 100\text{ mm}$ to $925\text{ mm}$** | **BASELINE / CHANGEABLE** | Sum: $10 + 25 + 270 + 250 + 270 = \mathbf{825\text{ mm}}$ (Unused space: $0\text{ mm}$). |

*Key Organic Architectural Invariants:*
* **Storage Assembly Total Envelope:** $\text{organic\_cutting\_height} + \text{organic\_storage\_height} = 25\text{ mm} + 270\text{ mm} = \mathbf{295\text{ mm}}$ ($Y = 620\text{ mm}$ to $915\text{ mm}$).
* **Cutting Mechanism Hierarchy:** The cutting mechanism is structurally part of the Storage Section assembly and must **NOT** be represented as a separate vertical chamber.
* **Vertical Continuity:** The five active Organic layers sum exactly to $825\text{ mm}$; stack sum with input ($95\text{ mm}$) and leachate ($100\text{ mm}$) equals $1020\text{ mm}$.

### Non-Organic Output Section Datum ($Y = 480\text{ mm}$)

For both the **Inorganic (90°)** sector and the **Leftover Food (90°)** sector:
* **Datum Definition:** The architectural output section start elevation datum is located at:
  $$\text{output\_section\_start\_datum\_y} = \mathbf{480\text{ mm}} \quad (\text{BASELINE / CHANGEABLE})$$
  $$\text{output\_drawer\_start\_from\_middle\_bottom} = \mathbf{380\text{ mm}} \quad (\text{BASELINE / CHANGEABLE})$$
* **Derived Elevations:**
  * Measured from Middle Section Bottom ($Y = 100\text{ mm}$):
    $$Y_{\text{output\_section\_start}} = 100\text{ mm} + 380\text{ mm} = \mathbf{480\text{ mm}}$$
  * Output Envelopes Vertical Span:
    $$Y = 100\text{ mm} \text{ to } 480\text{ mm} \quad (\text{height} = 380\text{ mm})$$

---

## 4B. Input + Segregation Assembly Architecture

The Input & Segregation Assembly occupies the uppermost vertical region of the apparatus:
$$Y = 925\text{ mm to } 1020\text{ mm} \quad (\text{height} = 95\text{ mm})$$

### Structural Hierarchy
```
GomikinEnvelope
└── InputSegregationAssembly
    ├── TopClosure
    ├── Display (UserInteractionDisplay)
    ├── Funnel
    ├── RotatingBase (RotatingBaseAssembly -> AxisPivot_1 -> AxisPivot_2 -> RotatingBase)
    ├── Camera (InputCamera)
    └── UltrasonicSensor (InputUltrasonicSensor)
```

### Component Geometric Specifications

1. **`TopClosure` (Rear Hood & Fascia):**
   - **Form Factor:** Semi-cylindrical rear closure ($Z \le 0$) derived from outer envelope ($R_{\text{outer}} = 250\text{ mm}$, $R_{\text{inner}} = 246\text{ mm}$).
   - **Selected Design:** Option 1 from sketch `IMG_20260925_175015.jpg` (closed rear $180^\circ$ half within 500 mm envelope; front $180^\circ$ half remains open for funnel waste deposition).
   - **Covering:** Rear cylindrical wall and semi-circular top lid disc strictly covering the rear half ($Z \le 0$).
   - **Front Fascia:** Slim transverse mounting rail along $X$-axis at $Z = 0$, spanning $Y = 880\text{ mm}$ to $Y = 900\text{ mm}$ (height: $20\text{ mm}$). Does NOT extend downward into the input chamber, leaving $Y = 805\text{ to }880\text{ mm}$ completely unobstructed.
   - **Mounting Role:** Houses the sensor bay (`InputCamera` left, `InputUltrasonicSensor` right) on its underside and the user interaction display on the rear hood.

2. **`UserInteractionDisplay`:**
   - **Object Name:** `UserInteractionDisplay` (sub-components: `UserInteractionDisplay_Pedestal` -> `UserInteractionDisplay_Pedestal_Foot`, `UserInteractionDisplay_Pedestal_Riser`, and `UserInteractionDisplay_Head` -> `UserInteractionDisplay_Bezel`, `UserInteractionDisplay_Screen`, `UserInteractionDisplay_ScreenBorder`).
   - **Form Factor:** Compact rectangular OLED/touchscreen module with casing bezel and dedicated mounting pedestal bracket.
   - **Placement:** Physically mounted ON TOP OF the closed rear semicircular lid (`TopClosure_TopLid`) on its exterior surface at the midpoint of the rear semicircular arc ($X = 0$, $Z \approx -177\text{ mm}$, base flange at $Y = 900\text{ mm}$).
   - **Attachment Structure:** Integrated mounting bracket attached directly to the top surface of `TopClosure_TopLid`. Base flange rests flat on the lid surface with zero gap (no float) and zero deep penetration (no submersion). Upright riser securely connects base flange to the display head.
   - **Orientation:** Tilted upward and forward $25^\circ$ toward $+Z$ front (screen normal: $(0, +0.423, +0.906)$) for ergonomic visibility to a person standing in front of the bin.
   - **Dimensions:** Baseline $72 \times 38 \times 8\text{ mm}$ bezel, $63.4 \times 26.9\text{ mm}$ active screen panel, total assembly height above lid: $36\text{ mm}$.
   - **`userData` Flags:** `externally_mounted: true`, `physically_attached: true`, `rear_arc_midpoint: true`, `user_facing: true`, `within_input_envelope: true`.
   - **Status:** CONFIRMED LOCATION / BASELINE PARAMETERS.

3. **`Funnel`:**
   - **Form Factor:** Truncated conical chute converging from the top rim ($Y = 900\text{ mm}$) to the rotating base platform.
   - **Top Opening:** Enclosed within cylindrical shell inner radius $R_{\text{inner}} = 246\text{ mm}$ (front half open to receive waste).
   - **Bottom Opening:** Centered at $(0, 0)$ sector divider intersection at $Y = 820\text{ mm}$.
   - **Diameter:** Parametrically governed by `funnel_opening_diameter = 100 mm` (changeable to 200 mm without structural redesign).

4. **`RotatingBase` (Two-Axis Rotating Platform):**
   - **Reference Elevation:** $Y = 815\text{ mm}$ ($10\text{ mm}$ above the Input/Middle boundary at $Y = 805\text{ mm}$).
   - **Alignment:** Strictly centered at $(0, 0)$, where `CentralDivider` and `RadialDivider` intersect.
   - **Form Factor:** Contoured "peanut" or "dumbbell" plate from sketch `IMG_20260925_175139.jpg`.
   - **Pivot Hierarchy:**
     ```
     RotatingBaseAssembly (at 0, 815 mm, 0)
     └── AxisPivot_1 (Yaw rotation around vertical Y-axis to select sector)
         └── AxisPivot_2 (Pitch/tilt rotation around horizontal axis to discharge waste)
             └── RotatingBase (Physical contoured platform plate)
     ```
   - **Kinematic Role:** Platform (NOT a flap) providing 2-DOF rotation: directional sector aiming (180° Organic, 90° Inorganic, 90° Leftover Food) and gravitational tipping.

5. **`InputCamera` & `InputUltrasonicSensor`:**
   - **Mounting:** Mounted underneath `TopClosure` dividing crossbeam ($Y \approx 885\text{ mm}$, $Z \approx -10\text{ mm}$) based on sketch `IMG_20260925_175102.jpg`.
   - **`InputCamera`:** Mounted on the left side ($-X$), angled downward toward $(0, 815\text{ mm}, 0)$ for optical waste classification.
   - **`InputUltrasonicSensor`:** Mounted on the right side ($+X$), dual-barrel transducer oriented downward toward $(0, 815\text{ mm}, 0)$ for level/proximity detection.

6. **Label Visibility System:**
   - Global toggle (`SHOW LABELS` / `HIDE LABELS`) controlling text sprite visibility across the entire model without hiding geometry, reference planes, dividers, or sensors.

---

## 5. Organic Section

### Geometry Hierarchy
```
OrganicSector (180° Semi-Cylindrical Volume, Middle Section: Y = 100 mm to 925 mm)
 ├── CuttingHeadroom (Height: 10 mm, Y = 915 mm to 925 mm) [Clearance to segregation mechanism base]
 ├── OrganicStorageAssembly (Total Envelope: 295 mm, Y = 620 mm to 915 mm)
 │    ├── OrganicCuttingMechanism (Height: 25 mm, Y = 890 mm to 915 mm) [Part of Storage Section hierarchy, NOT a separate chamber]
 │    ├── OrganicStorageChamber (Height: 270 mm, Y = 620 mm to 890 mm)
 │    ├── OrganicStorageFan (Exhaust fan & carbon filter at Y = 770 mm)
 │    └── OrganicStorageDoorMechanism (Center-hinged double-doors, mandated 4 mm door thickness, Y = 620 mm)
 ├── InterChamberGap (Height: 250 mm, Y = 370 mm to 620 mm)
 ├── DecompositionChamber (Height: 270 mm, Y = 100 mm to 370 mm)
 │    ├── Agitator (Vertical shaft with pitched mixing arms)
 │    └── SensorProbes (Core temperature, moisture, load cell)
 └── ManureDrawer (Lower extraction, height/elevation TBD within lower allocation)
```

### Component Geometry Specifications

| Component | Geometry Type | Dimensions | Position ($X,Y,Z$) | Orientation | Status | Motion Axis | Pivot Location | Collision Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`CuttingHeadroom`** | Open clearance headroom volume | Semi-cylindrical, **Height: 10 mm** | Top organic middle sector (**$Y$: 915 mm to 925 mm**) | 180° sector alignment | **BASELINE / CHANGEABLE** (Height = 10 mm) | None | None | No (Clearance envelope) |
| **`CuttingMechanism`** | Circular cylindrical assembly insert (Part of Storage Section hierarchy; NOT a separate chamber) | Dia: 200 mm, **Height: 25 mm** | Upper organic sector (**$Y$: 890 mm to 915 mm**) | Upside-down (Motor at top, blades below) | **BASELINE / CHANGEABLE** (Height = 25 mm) | None | None | Yes (Static compound cylinder) |
| **`StorageChamber`** | Hollow semi-cylindrical vessel | Radius: 245 mm, **Height: 270 mm** | Mid-upper organic sector (**$Y$: 620 mm to 890 mm**) | 180° sector alignment | **BASELINE / CHANGEABLE** (Height = 270 mm) | None | None | Yes (Static semi-cylinder walls) |
| **`OrganicStorageFan`** | Square axial fan + cylindrical carbon filter canister | Size: 70x70x20 mm, Filter: Ø65x18 mm | Shell wall, $Y = 770\text{ mm}$ ($X \approx -218\text{ mm}, Z = 0$) | Radial exhaust facing outer wall | **CONFIRMED TOPOLOGY / BASELINE TBD** | Rotary ($\omega_{\text{fan}}$, static currently) | Fan motor axis | Yes (Static housing) |
| **`OrganicStorageDoorMechanism`** | Center-hinged double drop doors + parallel perforated drainage screen | **Door Thickness: EXACTLY 4 mm**, Screen: 2 mm | Base of storage chamber (**$Y = 620\text{ mm}$**) | Center spine along $Z=0$, flaps slope $3^\circ$ | **CONFIRMED ARCHITECTURE / MANDATED 4 mm** | Downward swing (static currently) | Spine hinges ($Z$-aligned) | Yes (Dynamic contact panels) |
| **`InterChamberGap`** | Clearance zone between storage base and decomposition top | **Height: 250 mm** | Intermediate organic sector (**$Y$: 370 mm to 620 mm**) | 180° sector alignment | **BASELINE / CHANGEABLE** (Height = 250 mm) | None | None | No (Clearance envelope) |
| **`DecompositionChamber`** | Hollow semi-cylindrical vessel | Radius: 245 mm, **Height: 270 mm** (terminates at $Y = 370\text{ mm}$) | Lower organic sector (**$Y$: 100 mm to 370 mm**) | 180° sector alignment | **BASELINE / CHANGEABLE** (Height = 270 mm) | None | None | Yes (Static semi-cylinder walls) |
| **`OrganicDecompositionAgitator`** | Vertical shaft with pitched mixing arms and upward perimeter sweeps | Shaft Ø16x140 mm, Span: Ø180 mm, Pitch: 20°, Uprights: 40 mm | Floor of decomposition chamber ($X = -124\text{ mm}, Z = 0, Y = 100\text{ mm}$) | Vertical drive axis | **BASELINE / CHANGEABLE** (Rotational) | Vertical ($Y$-axis) | Bottom chamber floor center $(X = -124, Z = 0)$ | Yes (Dynamic mixing sweep) |
| **`ManureDrawer`** | Hollow semi-cylindrical sliding bin | Radius: TBD, Height: TBD, Wall: TBD | Lowest organic level ($Y$: TBD within decomposition/base allocation) | 180° sector alignment with front handle | Moving (Linear slide) | Horizontal ($+Z$) | Base slide rails | Yes (Dynamic sliding container) |

---

## 6. Inorganic Section

### Geometry Hierarchy
```
InorganicSector (90° Quadrant Sector Volume, Middle Section: Y = 100 mm to 700 mm)
 ├── InorganicShaft (Upper accumulation volume, Y = 320 mm to 700 mm)
 └── InorganicDrawer (Output drawer starting at Y = 320 mm datum)
```

### Architecture & Extraction Specification
* **Shaft Form:** Full-height 90° quadrant vertical shaft extending through the $600\text{ mm}$ middle envelope (reference: $700\text{ mm}$ earlier divider baseline).
* **Function:** Passive accumulation and holding of dry recyclable/inorganic waste (Alternative Embodiment B: single collective storage compartment, without multi-partition sub-dividers).
* **Output Drawer Start Datum:**
  * **Parameter:** `output_drawer_start_from_middle_bottom` = **220 mm (BASELINE / CHANGEABLE)**.
  * **Start Elevation Datum:** $Y_{\text{output\_drawer\_datum}} = 100\text{ mm} + 220\text{ mm} = \mathbf{320\text{ mm}}$ (or $600\text{ mm} - 220\text{ mm} = 380\text{ mm}$ below the top of the middle section at $Y = 700\text{ mm}$).
  * **Scope Restriction:** This parameter defines the output drawer **START ELEVATION ONLY**. Drawer height, drawer depth, drawer clearance, extraction distance, drawer wall thickness, and drawer volume remain strictly **TBD**.
* **InorganicDrawer:**
  * **Geometry:** 90° quadrant prism matching the sector boundary with external shell curved face and pull handle.
  * **Start Elevation Datum:** $Y = 320\text{ mm}$ (**BASELINE / CHANGEABLE**).
  * **Dimensions:** Radius = TBD, Height = TBD, Depth = TBD, Wall Thickness = TBD, Clearance = TBD.
  * **Extraction Direction:** **TBD** (sketches depict a front/side pullout, but whether extraction is along the $+Z$ axis or along the 45° radial sector centerline is not defined in source material).

---

## 7. Leftover Food Section (90° Sector Refinement)

### Geometry Hierarchy
```
LeftoverFoodSection (90° Quadrant Sector: +X, +Z, Y = 100 mm to 925 mm)
 ├── LeftoverFoodTopClosure (Horizontal 90° arc planar sector cap at Y = 925 mm)
 ├── LeftoverFoodAccessDoor_Hinge (Fixed bottom rotational hinge pivot node at Y = 700 mm)
 │   ├── LeftoverFoodAccessDoor (Curved cylindrical access door / ramp, Y = 700–800 mm, H = 100 mm, 10 mm arc padding)
 │   └── LeftoverFoodAccessDoor_HingeAxis (Bottom pivot axis datum marker along cylindrical arc at Y = 700 mm)
 ├── LeftoverFoodOuterDrawerEnvelope (Sliding Carriage, output drawer start datum Y = 480 mm, Y = 100–480 mm)
 └── RemovableStrainerBasketEnvelope (Nested perforated inner tray, Y = 125–475 mm)
```

### Architecture & Structural Refinements Specification

* **Task 1 — Leftover Food Top Closure (`LeftoverFoodTopClosure`):**
  * **Elevation Datum:** Exactly $Y = 925\text{ mm}$ (matches `y_input_boundary` / top of middle section dividers).
  * **Angular Span:** Exactly **90°** ($\theta = 0$ to $\frac{\pi}{2}$ radians in $+X, +Z$ quadrant).
  * **Radius:** Conforms strictly to internal chamber radius $R_{\text{inner}} = 246\text{ mm}$.
  * **Functional Role:** Hermetically closes the entire 90° arc at the top of the Leftover Food chamber. Prevents waste deposited into the upper input receiving bay/segregation funnel from falling vertically into the leftover food sector. Cooked leftover food bypasses the top AI funnel entirely and enters exclusively via the dedicated front access door.
  * **Boundary Integrity:** Strictly confined to the Leftover Food sector. Does NOT cross into the 180° Organic sector ($X < 0$) or the 90° Inorganic sector ($Z < 0$).

* **Task 2 — Leftover Food Access Door / Ramp (`LeftoverFoodAccessDoor` & `LeftoverFoodAccessDoor_Hinge`):**
  * **Vertical Envelope:**
    * Door top movable edge: $Y = 800\text{ mm}$.
    * Door bottom edge / fixed hinge: $Y = 700\text{ mm}$.
    * Door height: $100\text{ mm}$ ($Y = 700\text{ mm to } 800\text{ mm}$).
  * **Fixed Hinge Axis Node (`LeftoverFoodAccessDoor_Hinge`):**
    * Established at bottom edge: $Y = 700\text{ mm}$.
    * Kinematic constraint: Bottom edge remains permanently fixed at $Y = 700\text{ mm}$ as the rotational hinge axis.
    * Movable edge: The upper edge at $Y = 800\text{ mm}$ is configured to rotate/open outward and downward during subsequent animation/actuation phases.
    * Base-Model State: Modeled in its static, closed position with full hierarchical pivot parenting.
  * **Chamber Arc Padding (Width Specification):**
    * **Padding Value:** Exactly **10 mm** padding along the chamber arc on BOTH left and right ends.
    * **Arc Interpretation:** Strictly evaluated as a linear distance along the cylindrical circumference arc ($s = R \cdot \theta$), NOT as a radial offset or Cartesian coordinate displacement.
    * **Angular Padding Calculation:**
      $$\Delta \theta = \frac{\text{food\_door\_arc\_padding}}{R_{\text{inner}}} = \frac{10\text{ mm}}{246\text{ mm}} \approx 0.0406504\text{ rad} \approx 2.3291^\circ$$
    * **Active Angular Span:**
      $$\theta_{\text{start}} = \Delta \theta \approx 2.3291^\circ$$
      $$\theta_{\text{end}} = \frac{\pi}{2} - \Delta \theta \approx 87.6709^\circ$$
      $$\theta_{\text{span}} = \frac{\pi}{2} - 2\Delta \theta \approx 85.3418^\circ \quad (s_{\text{door}} \approx 366.42\text{ mm})$$
    * **Boundary Preservation:** The door remains strictly inside the 90° Leftover Food sector, leaving an exact 10 mm arc clearance gap from both the $+Z$ CentralDivider face and the $+X$ RadialDivider face.

* **Dual-Layer Liquid Separation Output Section (Alternative Embodiment B):**
  * **Output Drawer Start Datum:** $Y_{\text{output\_section\_start}} = \mathbf{480\text{ mm}}$.
  * **OuterDrawer Carriage:** Spans $Y = 100\text{ mm to } 480\text{ mm}$ ($H = 380\text{ mm}$).
  * **RemovableStrainerBasket:** Spans $Y = 125\text{ mm to } 475\text{ mm}$ ($H = 350\text{ mm}$), nested with 8 mm wall inset and 25 mm lower liquid drainage collection sump.

---

## 8. Cutting Assembly (Organic Cutting Mechanism)

### Structural Hierarchy
```
GomikinEnvelope
└── OrganicChambers
    └── OrganicStorageAssembly (Total Envelope: 295 mm, Y = 620 mm to 915 mm)
        ├── OrganicCuttingMechanism (Vertical Allocation: 25 mm, Y = 890 mm to 915 mm)
        │   ├── CuttingAssemblySupport (Circular Collar, Motor Mount Crossbeams & Struts)
        │   ├── CuttingMotor (Top-mounted upside-down electric induction motor)
        │   ├── CuttingShaft (Downward-facing vertical rotary drive shaft)
        │   ├── CuttingBlades (4-blade aerodynamic shear rotor with suction pitch & hooked tips)
        │   └── CuttingSizingScreen (Horizontal perforated sizing mesh disk & sector flange)
        └── OrganicStorageChamber (Height: 270 mm, Y = 620 mm to 890 mm)
```

### Configuration & Kinematics
* **Structural Hierarchy & Vertical Envelope:** The cutting mechanism is vertically allocated a height envelope of **25 mm** (`organic_cutting_height = 25 mm`, **BASELINE / CHANGEABLE**), occupying $Y = 890\text{ mm} \text{ to } 915\text{ mm}$. Structurally, it belongs to the `OrganicStorageAssembly` hierarchy (total storage assembly envelope $= 295\text{ mm}$: $25\text{ mm}$ cutter $+ 270\text{ mm}$ storage chamber) and is **NOT** a separate vertical chamber.
* **Configuration:** Upside-down / top-mounted configuration to isolate the motor and electrical components from gravitational moisture ingress (`Version 1 feature specific document.txt` line 18).
* **Enclosure & Alignment:** Circular cylindrical collar nested within the 180° semi-cylindrical organic sector (centered at $X = -124\text{ mm}$, $Z = 0$, inscribed symmetrically between central divider face and outer shell inner wall). Outer sector flange plate spans the remaining 180° sector at $Y = 890\text{ mm}$ to ensure waste cannot bypass the sizing collar into the storage chamber.
* **Rotational Axis:** Vertical $Y$-axis.
* **Blade Geometry:** Exactly 4 orthogonal blade arms with aerodynamic suction pitch ($22^\circ$) and tangential hooked tips in the rotation direction (`references/sketches/IMG_20260925_175201.jpg`), generating negative pneumatic pressure pulling lightweight organic matter downward.
* **Screen Placement:** Horizontal perforated sizing mesh fixed securely immediately below the rotational path of the blades at $Y = 890\text{ mm}$, with a 2 mm blade-to-screen clearance.
* **Baseline Parameters (Named TBD / Changeable):**
  * `cutting_collar_diameter`: **200 mm** (Radius = 100 mm, Wall thickness = 3 mm, Height = 25 mm, $Y = 890\text{–}915\text{ mm}$)
  * `cutting_motor_diameter`: **50 mm**, `cutting_motor_height`: **35 mm** ($Y = 915\text{–}950\text{ mm}$, mounted above cutting zone on crossbeam bridge)
  * `cutting_shaft_diameter`: **12 mm**, `cutting_shaft_length`: **21 mm** ($Y = 894\text{–}915\text{ mm}$)
  * `cutting_rotor_span`: **180 mm** (Blade tip-to-tip span; leaves 10 mm radial tip clearance to collar)
  * `cutting_blade_width`: **14 mm**, `cutting_blade_thickness`: **3 mm**
  * `cutting_blade_pitch_deg`: **22°** (Suction pitch angle)
  * `cutting_hook_length`: **15 mm** (Tangential hooked tip)
  * `cutting_screen_aperture`: **8 mm**, `cutting_screen_thickness`: **2 mm** ($Y = 890\text{ mm}$)
  * `cutting_blade_screen_clearance`: **2 mm** (Blades at $Y = 894\text{ mm}$)
  * `cutting_center_x`: **-124 mm**, `cutting_center_z`: **0 mm**

---

## 9. Storage Doors (`OrganicStorageDoorMechanism`)

### Configuration & Kinematics
* **Architecture:** Dynamic base assembly featuring two independent door panels (`StorageDoorLeft` and `StorageDoorRight`) supporting waste during hydrostatic drainage and opening downward for batch transfer into the decomposition chamber.
* **Object Identity:** Modeled as **two independent objects** (`StorageDoorLeft` and `StorageDoorRight`) with separate geometries and transform nodes. Do NOT merge the two doors into a single mesh.
* **Door Leaf Thickness:** **EXACTLY 4 mm** (Mandated design specification; enforced by parametric validation).
* **Pivot & Axis:**
  * `StorageDoorLeft`: Independent pivot along longitudinal spine hinge.
  * `StorageDoorRight`: Independent pivot along longitudinal spine hinge.
  * **Hinge Locations:** Along a central support spine at the baseline of the storage section ($Y = 620\text{ mm}$, along $Z = 0$).
* **Movement:** Downward rotational swing ($0°$ closed $\rightarrow$ negative rotation open) and symmetrical return (un-animated static structural baseline for current phase).
* **Perforated Drainage Screen:** Affixed parallel to and directly above solid doors with a $5\text{ mm}$ hydrostatic clearance gap (`door_drainage_screen_gap`), screen thickness $2\text{ mm}$ (`door_drainage_screen_thickness`).
* **Drainage Gradient:** Solid doors feature a calculated $3^\circ$ downward slope toward the central spine and leachate drain hole.
* **Leachate Drain Port:** Removed from current baseline per design directive; will be created in a subsequent phase.
* **Vibration Actuator (`VibrationActuator`):** Modeled per specification ($\varnothing 20\text{ mm} \times 35\text{ mm}$ cylinder + clamp bracket), but set to **hidden** (`visible = false`) because mounting directly underneath the central spine obstructs the downward opening and closing rotational swing of the 4 mm double doors. Relocation will be refined in kinematics phase.
* **Parametric Dimensions:**
  * `door_thickness`: **4 mm** (MANDATED EXACTLY 4 mm)
  * `door_clearance`: **2 mm**
  * `door_slope_angle_deg`: **3°**
  * `door_central_spine_width`: **16 mm**, `door_central_spine_height`: **14 mm**
  * `door_hinge_barrel_diameter`: **8 mm**, `door_hinge_pin_diameter`: **4 mm**
  * `door_drainage_screen_thickness`: **2 mm**, `door_drainage_screen_gap`: **5 mm**
  * `door_vibrator_length`: **35 mm**, `door_vibrator_diameter`: **20 mm** (Hidden)

---

## 9B. Organic Storage Fan & Odor Mitigation Subsystem (`OrganicStorageFan`)

### Configuration & Placement
* **Architecture:** Active exhaust fan and activated carbon filtration matrix mounted on the curved outer shell wall of the 180° Organic sector.
* **Role:** Odor mitigation via continuous/intermittent negative pneumatic pressure, drawing air from the storage chamber and neutralizing VOCs through the carbon matrix prior to atmospheric venting.
* **Vertical Elevation:** Centered at $Y = 770\text{ mm}$ (within $Y = 620\text{–}890\text{ mm}$ storage chamber, below cutting collar).
* **Orientation:** Radial exhaust facing outward through shell wall.
* **Sub-Components:**
  * `FanCasing`: Square axial fan housing ($70 \times 70 \times 20\text{ mm}$) with inner circular bore shroud ($\varnothing 62\text{ mm}$) and 4 corner bolt bosses.
  * `FanRotor`: Central hub ($\varnothing 24\text{ mm}$) with aerodynamic nose cone and 5 pitched impeller aerofoil blades (static structural baseline).
  * `FanCarbonFilter`: Cylindrical filtration canister ($\varnothing 65\text{ mm}$, depth $18\text{ mm}$) containing activated carbon granules on exhaust side.
  * `FanProtectiveGrille`: Concentric wire finger guard over intake aperture facing chamber interior.
* **Parametric Dimensions:**
  * `organic_fan_size`: **70 mm**
  * `organic_fan_depth`: **20 mm**
  * `organic_fan_bore_diameter`: **62 mm**
  * `organic_fan_hub_diameter`: **24 mm**
  * `organic_fan_blade_count`: **5**
  * `organic_fan_filter_diameter`: **65 mm**
  * `organic_fan_filter_depth`: **18 mm**
  * `organic_fan_elevation`: **770 mm**

---

## 10. Agitator (`OrganicDecompositionAgitator`)

### Geometry Hierarchy
```
OrganicDecompositionChamber
└── OrganicDecompositionAgitator
    ├── AgitatorMount (Floor-mounted bearing housing & motor journal boss)
    ├── AgitatorVerticalShaft (Central precision vertical drive shaft)
    ├── AgitatorHub (Central clamp sleeve collar)
    ├── AgitatorMixingPaddles (Dual opposed mixing arms)
    │   ├── AgitatorArm_Primary (Horizontal pitched mixing blade + upward tip sweep)
    │   └── AgitatorArm_Secondary (Horizontal pitched mixing blade + upward tip sweep)
    └── Agitator_Badge (Engineering callout text sprite)
```

### Configuration & Kinematics
* **Authoritative Reference:** `references/sketches/IMG_20260925_175238.jpg` & `references/documentation/Version 1 feature specific document.txt` (Lines 65–70).
* **Role:** Automated rotating agitation mechanism driven by a current-sensing DC motor to oxygenate the organic mass, provide initial thorough homogenization mixing, and execute an anti-jam reverse rotation clearing sequence.
* **Rotational Axis:** Vertical $Y$-axis.
* **Pivot:** Centered symmetrically within the 180° Organic sector at $(X = -124\text{ mm}, Z = 0)$ directly on the chamber floor at $Y = 100\text{ mm}$ (`y_decomp_bottom`).
* **Paddle Geometry:** Blunt, pitched paddle arms designed specifically for mixing, oxygenation, and homogenization (distinct from cutting blades). Features dual opposed arms ($180^\circ$ apart) with:
  * Horizontal blades with $20^\circ$ aeration pitch angle around the radial arm axis.
  * Upward-turned vertical perimeter sweep paddles ($40\text{ mm}$ height) at the distal tips, exactly matching the reference sketch `IMG_20260925_175238.jpg`.
* **Wall & Floor Clearances:**
  * Radial tip sweep clearance: $32\text{ mm}$ clearance to central divider and outer shell inner wall ($\text{span} = 180\text{ mm}$, radius $= 90\text{ mm} < 122\text{ mm}$).
  * Floor clearance: $15\text{ mm}$ bottom clearance above chamber floor to prevent friction and binding.
* **Baseline Parameters (Named TBD / Changeable):**
  * `agitator_mount_diameter`: **55 mm** (Flange rim: Ø68.75 mm)
  * `agitator_mount_height`: **20 mm** ($Y = 100\text{–}120\text{ mm}$)
  * `agitator_shaft_diameter`: **16 mm**
  * `agitator_shaft_height`: **140 mm** ($Y = 100\text{–}240\text{ mm}$)
  * `agitator_hub_diameter`: **36 mm**, `agitator_hub_height`: **28 mm**
  * `agitator_floor_clearance`: **15 mm** ($Y = 115\text{ mm}$)
  * `agitator_paddle_span`: **180 mm** (Tip-to-tip diameter span)
  * `agitator_paddle_width`: **24 mm**, `agitator_paddle_thickness`: **4 mm**
  * `agitator_paddle_pitch_deg`: **20°**
  * `agitator_tip_upright_height`: **40 mm**, `agitator_tip_upright_width`: **20 mm**
  * `agitator_center_x`: **-124 mm**, `agitator_center_z`: **0 mm**

---

## 10B. Organic Decomposition Sensory Feedback Array (`DecompositionSensorArray`)

### Geometry Hierarchy
```
OrganicDecompositionChamber
└── DecompositionSensorArray (Hidden by default; inspectable via UI)
    ├── DecompositionLoadCell (Mass reduction, tare zeroing, batch detection)
    ├── DecompositionTemperatureSensor (Core thermophilic / maturity thermowell)
    └── DecompositionMoistureSensor (Capacitive dielectric core moisture prongs)
```

### Configuration & Placement
* **Authoritative Reference:** `references/documentation/Version 1 feature specific document.txt` (Lines 48, 50-52, 65, 68, 125, 134).
* **Visibility State:** Hidden by specification (`visible = false` by default; togglable in UI via `chk-decomp-sensors` or `envelope.setDecompositionSensorsVisible()`).
* **Sub-Components:**
  1. **`DecompositionLoadCell` (Mass-Sensing Load Cell):**
     * **Location:** Positioned directly beneath the decomposition chamber floor at the central reaction hub datum ($X = -124\text{ mm}, Z = 0$, $Y = 95\text{ mm}$).
     * **Form Factor:** Precision shear-beam / puck body ($\varnothing 50\text{ mm} \times 10\text{ mm}$) with central load button contacting chamber underside and perimeter mounting ring.
     * **Role:** Monitors aerobic mass reduction plateau, registers empty-state tare zeroing for batch transfer hardware interlock, and detects secondary mass increase upon manual carbon buffer (coco peat) and microbial inoculation additions.
  2. **`DecompositionTemperatureSensor` (Core Biomass Temperature Probe):**
     * **Location:** Chamber floor mounting fitting at $(X = -124\text{ mm}, Y = 100\text{ mm}, Z = 135\text{ mm})$, safely clear of the $90\text{ mm}$ agitator arm sweep radius.
     * **Form Factor:** Hexagonal floor mounting gland with vertical stainless steel needle thermowell probe ($\varnothing 4\text{ mm} \times 50\text{ mm}$ height) projecting directly into the biomass core.
     * **Role:** Continuous evaluation of thermophilic spike vs. ambient stabilization to confirm compost biological maturity.
  3. **`DecompositionMoistureSensor` (Dielectric / Capacitive Moisture Probe):**
     * **Location:** Chamber floor mounting block at $(X = -124\text{ mm}, Y = 100\text{ mm}, Z = -135\text{ mm})$, safely clear of the $90\text{ mm}$ agitator arm sweep radius.
     * **Form Factor:** Sealed potting enclosure ($22 \times 8 \times 16\text{ mm}$) with dual parallel stainless capacitive sensing prongs ($\varnothing 2.5\text{ mm} \times 35\text{ mm}$ height, $10\text{ mm}$ spacing) with gold interface tips.
     * **Role:** Continuous tracking of biomass water percentage to verify adequate moisture for microbial respiration.
* **Parametric Dimensions:**
  * `decomp_load_cell_diameter`: **50 mm**, `decomp_load_cell_height`: **10 mm**
  * `decomp_temp_sensor_probe_length`: **50 mm**, `decomp_temp_sensor_probe_diameter`: **4 mm**
  * `decomp_moisture_sensor_length`: **35 mm**, `decomp_moisture_sensor_prong_spacing`: **10 mm**

---

## 11. Service Components

Each of the following service components must be defined as an **independent, separate object** capable of autonomous translation/removal:

1. **`ManureDrawer`:** Semicircular sliding drawer at the base of the organic decomposition sector for cured compost extraction.
2. **`InorganicDrawer`:** 90° quadrant sliding bin for emptying accumulated dry inorganic waste.
3. **`LeftoverFoodDrawer`:** 90° quadrant sliding carriage for front-loading cooked food and emptying dried food residues.
4. **`StrainerBasket`:** Removable perforated bucket strainer nested inside `LeftoverFoodDrawer` for clean, bag-free manual waste extraction.
5. **`LeachateDrawer`:** Low-profile sliding collection tray at the lowest base level collecting drained liquid runoff from organic and food drainage pipes.

*Rule:* Each drawer must have its own coordinate frame, handle geometry, sliding rail alignment, and independent collision body.

---

## 12. External Structure

The external structure comprises the protective housing, user interface, and mobility chassis:

1. **`MainShell`:** Upright cylindrical outer sleeve with cutouts for drawer faces, ventilation intake slots, and service interfaces. Dimensions = **TBD**.
2. **`TopCap`:** Upper assembly comprising the outer collar rim, rear closed dome cover, and User Interaction Device (UID) bezel with OLED screen and buttons. Dimensions = **TBD**.
3. **`InputSection`:** Funnel receiving basin and sensor mounting bridge. Height = **200 mm (CONFIRMED)**. Outer diameter and throat diameter = **TBD**.
4. **`BasePlinth`:** Lower cylindrical plinth housing the leachate drawer rails, battery cartridge dock, and caster mounting plate. Height = **TBD**.
5. **`CasterAssembly`:** Four symmetrically spaced caster wheel assemblies (forks and wheels) on the base plate underside. Wheel diameter, fork height, and mounting circle radius = **TBD**.

---

## 13. Parametric Dependency Rules

All future 3D geometry generation must obey the following parametric rules rather than hardcoded absolute coordinates:

1. **Outer Diameter & Wall Thickness Dependency:**
   $$R_{\text{outer}} = \frac{\text{outer\_diameter}}{2} = 250\text{ mm (Baseline)}$$
   $$R_{\text{inner}} = R_{\text{outer}} - \text{shell\_wall\_thickness} = 250\text{ mm} - 4\text{ mm} = 246\text{ mm (Baseline)}$$
   All internal bulkheads, radial dividers, and curved shell panels must derive their outer boundaries directly from $R_{\text{inner}}$.
2. **Vertical Stack Elevation Dependency:**
   $$\text{overall\_height} = \text{input\_section\_height} + \text{middle\_section\_height} + \text{leachate\_section\_height}$$
   All vertical coordinates ($Y$) must be calculated parametrically from the baseline section datums:
   $$Y_{\text{leachate\_top}} = \text{leachate\_section\_height} = 100\text{ mm}$$
   $$Y_{\text{middle\_top}} = Y_{\text{leachate\_top}} + \text{middle\_section\_height} = 700\text{ mm}$$
   $$Y_{\text{input\_top}} = Y_{\text{middle\_top}} + \text{input\_section\_height} = 900\text{ mm}$$
3. **Organic Middle Section Allocation Dependency & Validation:**
   The $600\text{ mm}$ middle section of the Organic sector must satisfy the exact vertical summation:
   $$\text{organic\_cutting\_height} + \text{organic\_storage\_height} + \text{organic\_storage\_decomposition\_gap} + \text{organic\_decomposition\_height} = \text{middle\_section\_height}$$
   $$30\text{ mm} + 220\text{ mm} + 130\text{ mm} + 220\text{ mm} = 600\text{ mm}$$
4. **Storage Section Assembly Envelope & Hierarchy Rule:**
   $$\text{organic\_storage\_assembly\_envelope} = \text{organic\_cutting\_height} + \text{organic\_storage\_height} = 30\text{ mm} + 220\text{ mm} = 250\text{ mm}$$
   *Structural Hierarchy Rule:* The cutting mechanism belongs structurally to the Storage Section assembly hierarchy and must **NOT** be represented as a separate vertical chamber.
5. **Derived Vertical Elevations Sequence (Organic Middle Section):**
   All internal elevations ($Y$) are derived strictly from the baseline parameters:
   * Middle Section Top: $Y_{\text{middle\_top}} = Y_{\text{leachate\_top}} + \text{middle\_section\_height} = 700\text{ mm}$
   * Cutting Mechanism: $Y \in [Y_{\text{middle\_top}} - \text{organic\_cutting\_height}, Y_{\text{middle\_top}}] = [670\text{ mm}, 700\text{ mm}]$ (Height = $30\text{ mm}$)
   * Storage Chamber: $Y \in [Y_{\text{storage\_bottom}}, Y_{\text{cutting\_bottom}}] = [450\text{ mm}, 670\text{ mm}]$ (Height = $220\text{ mm}$, where $Y_{\text{storage\_bottom}} = 670 - 220 = 450\text{ mm}$)
   * Storage Doors: Drop door pivot interface at base of storage chamber ($Y \approx 450\text{ mm}$)
   * Inter-Chamber Gap: $Y \in [Y_{\text{gap\_bottom}}, Y_{\text{storage\_bottom}}] = [320\text{ mm}, 450\text{ mm}]$ (Height = $130\text{ mm}$, where $Y_{\text{gap\_bottom}} = 450 - 130 = 320\text{ mm}$)
   * Decomposition Chamber: $Y \in [Y_{\text{middle\_bottom}}, Y_{\text{gap\_bottom}}] = [100\text{ mm}, 320\text{ mm}]$ (Height = $220\text{ mm}$, where $Y_{\text{decomp\_bottom}} = Y_{\text{middle\_bottom}} = 100\text{ mm}$)
   * Middle Section Bottom: $Y_{\text{middle\_bottom}} = Y_{\text{leachate\_top}} = 100\text{ mm}$
6. **Inorganic & Leftover Food Output Drawer Start Datum Dependency & Validation:**
   For both the Inorganic (90°) and Leftover Food (90°) sectors, the output drawer start datum is parametrically derived as:
   $$Y_{\text{output\_drawer\_datum}} = Y_{\text{middle\_bottom}} + \text{output\_drawer\_start\_from\_middle\_bottom} = 100\text{ mm} + 220\text{ mm} = \mathbf{320\text{ mm}}$$
   Equivalent top-referenced derivation ($380\text{ mm}$ below top of middle section):
   $$Y_{\text{output\_drawer\_datum}} = Y_{\text{middle\_top}} - (\text{middle\_section\_height} - \text{output\_drawer\_start\_from\_middle\_bottom}) = 700\text{ mm} - 380\text{ mm} = \mathbf{320\text{ mm}}$$
   Validation constraint:
   $$\text{output\_drawer\_start\_from\_middle\_bottom} \le \text{middle\_section\_height}$$
   *Scope Limitation:* This defines start elevation datum ONLY. Drawer height, drawer depth, drawer clearance, extraction distance, drawer wall thickness, and drawer volume remain strictly **TBD**.
7. **Chamber Envelope Confinement:**
   All internal components (cutting assembly, storage doors, agitator, drawers) must remain strictly within their respective 180° or 90° sector boundaries:
   $$\text{Component Bound} \subset \text{Sector Volume}$$
8. **Divider Alignment:**
   The primary vertical divider must align with the sector diameter plane, and the secondary vertical divider must align with the 90° radial plane. Dividers span the middle section height ($600\text{ mm}$ baseline; $700\text{ mm}$ reference if extending into leachate plinth).
9. **Kinematic Clearance Envelope:**
   Every moving component must maintain a non-zero clearance ($\delta_{\text{clearance}} > 0$) relative to adjacent static walls:
   * Cutting rotor tip clearance: $R_{\text{rotor}} < R_{\text{cutting\_collar}}$
   * Storage door swing arc: must rotate downward through its full angular travel without penetrating the decomposition vessel or divider walls.
   * Agitator paddle sweep: $R_{\text{paddle}} < R_{\text{decomposition\_chamber}}$
   * Drawer slide tracks: must translate along their extraction vector without intersecting adjacent drawers or housing rims.
10. **Fluid Continuity:**
    Storage drainage floor slope and leftover food outer container slope must gravitationally align with their respective vertical leachate conduits leading into the lower leachate drawer.
11. **Mandatory Parametric Regeneration & TBD Conversion Rule:**
    No numerical coordinates or elevations may be hard-coded. Any change to baseline parameters must automatically regenerate all internal boundary planes.  
    *Crucial Constraint:* **No geometry-generation agent may silently convert a TBD parameter into a guessed numerical value.**

---

## 14. Simulation Requirements

The following 12 components must eventually have independent local coordinate frames (transforms) to support kinematic animation, physics simulation, and sensor raycasting:

| Component Name | Transform Type Required | DOF | Operational Parameter |
| :--- | :--- | :--- | :--- |
| **`SortingFlap`** | Revolute (Rotation) | 1-DOF | Angular tilt angle ($\theta_x$ or $\theta_z$) routing waste to chambers |
| **`CuttingRotor`** | Continuous Revolute | 1-DOF | High-speed continuous rotation around $Y$-axis ($\omega_y$) |
| **`StorageDoorLeft`** | Revolute (Hinge) | 1-DOF | Angular swing around $Z$-axis ($\theta_z \in [0°, -70°]$) |
| **`StorageDoorRight`** | Revolute (Hinge) | 1-DOF | Angular swing around $Z$-axis ($\theta_z \in [0°, 70°]$) |
| **`Agitator`** | Continuous / Stepped Revolute | 1-DOF | Low-speed bi-directional rotation around $Y$-axis ($\omega_y$) |
| **`ManureDrawer`** | Prismatic (Slider) | 1-DOF | Linear translation along $+Z$ ($d_z \ge 0$) |
| **`InorganicDrawer`** | Prismatic (Slider) | 1-DOF | Linear translation along extraction vector ($d_{\text{extract}} \ge 0$) |
| **`LeftoverFoodDrawer`** | Prismatic (Slider) | 1-DOF | Linear translation along $+Z$ ($d_z \ge 0$) |
| **`StrainerBasket`** | Prismatic (Vertical Lift) | 1-DOF | Linear vertical translation along $+Y$ ($d_y \ge 0$) |
| **`LeachateDrawer`** | Prismatic (Slider) | 1-DOF | Linear translation along $+Z$ ($d_z \ge 0$) |
| **`ExhaustFan`** | Continuous Revolute | 1-DOF | Continuous high-speed rotation around fan axis ($\omega_{\text{fan}}$) |
| **`CasterAssemblies` (x4)** | Dual Revolute (Swivel + Roll) | 2-DOF each | Vertical swivel ($\theta_y$) + Horizontal wheel roll ($\theta_{\text{axle}}$) |

---

## 15. Manufacturing & 3D-Printing Requirements

For eventual additive manufacturing (3D printing) and physical CAD generation:

1. **Manifold Solids:** Every component must be designed as a watertight, closed manifold solid. No zero-thickness surfaces, open edges, or self-intersecting shells.
2. **Component Modularity:** Every moving part, drawer, door leaf, blade rotor, and removable tray must be modeled as an independent printable entity.
3. **Draft Angles & Overhangs:** Internal sloped floors (drainage doors, food outer container) should consider printable overhang angles.
4. **Parameters Remaining TBD:**
   * Minimum wall thickness: **TBD**
   * Functional slide/hinge clearances ($\delta_{\text{clearance}}$): **TBD**
   * Fastener interfaces, snaps, and assembly bosses: **TBD**
   * Infill and print orientation allowances: **TBD**

---

## 16. Parameter Status Breakdown

### BASELINE / CHANGEABLE (Starting Design Parameters, Subject to Later Revision)
1. `outer_diameter` = **500 mm** (Nominal outer cylindrical shell diameter).
2. `overall_height` = **1020 mm** (Total apparatus height envelope).
3. `shell_wall_thickness` = **4 mm** (Outer shell wall thickness).
4. `input_section_height` = **95 mm** (Upper segregation funnel section: $Y = 925\text{ mm}$ to $1020\text{ mm}$).
5. `middle_section_height` = **825 mm** (Central processing & storage envelope: $Y = 100\text{ mm}$ to $925\text{ mm}$).
6. `leachate_section_height` = **100 mm** (Lower plinth, leachate drawer, caster clearance: $Y = 0\text{ mm}$ to $100\text{ mm}$).
7. `organic_cutting_headroom` = **10 mm** (Clearance headroom between cutting mechanism top and segregation base: $Y = 915\text{ mm}$ to $925\text{ mm}$).
8. `organic_cutting_height` = **25 mm** (Vertical height envelope of cutting mechanism; part of Storage Section assembly hierarchy: $Y = 890\text{ mm}$ to $915\text{ mm}$).
9. `organic_storage_height` = **270 mm** (Vertical height of organic storage and hydrostatic drainage chamber: $Y = 620\text{ mm}$ to $890\text{ mm}$).
10. `organic_storage_decomposition_gap` = **250 mm** (Vertical clearance gap between storage chamber base and decomposition chamber: $Y = 370\text{ mm}$ to $620\text{ mm}$).
11. `organic_decomposition_height` = **270 mm** (Vertical height of organic thermophilic decomposition vessel: $Y = 100\text{ mm}$ to $370\text{ mm}$).
12. `output_drawer_start_from_middle_bottom` = **380 mm** (Vertical offset from middle bottom establishing output drawer start datum at $Y = 480\text{ mm}$ for Inorganic and Leftover Food sectors).
13. `output_section_start_datum_y` = **480 mm** (Architectural output-section start datum for BOTH 90° sectors).
14. `funnel_opening_diameter` = **100 mm** (Lower funnel discharge opening diameter, supporting 100 mm to 200 mm).
15. `rotating_base_elevation_offset` = **10 mm** (Vertical offset above Input/Middle boundary, placing rotating base at $Y = 935\text{ mm}$).
16. `divider_height` = **825 mm** (Structural sector dividers spanning full middle section $Y = 100\text{ mm}$ to $925\text{ mm}$).

### LOCKED (Explicitly Confirmed Architectural Relationships)
1. Coordinate system: $X$ lateral, $Y$ vertical, $Z$ longitudinal, $+Z$ front-facing.
2. Cylindrical housing form factor.
3. Sector division: 180° Organic, 90° Inorganic, 90° Leftover Food.
4. Vertical stack relationship: $\text{overall\_height} = \text{input\_section\_height} + \text{middle\_section\_height} + \text{leachate\_section\_height}$ ($95 + 825 + 100 = 1020\text{ mm}$).
5. Organic middle section allocation relationship: $\text{organic\_cutting\_headroom} + \text{organic\_cutting\_height} + \text{organic\_storage\_height} + \text{organic\_storage\_decomposition_gap} + \text{organic\_decomposition\_height} = \text{middle\_section\_height}$ ($10 + 25 + 270 + 250 + 270 = 825\text{ mm}$).
6. Storage assembly hierarchy: cutting mechanism belongs structurally to the Storage Section assembly hierarchy (total assembly envelope $= 295\text{ mm}$); **NOT** a separate vertical chamber.
7. Output drawer start datum constraint: $\text{output\_drawer\_start\_from\_middle\_bottom} \le \text{middle\_section\_height}$ ($Y = 480\text{ mm}$).
8. Upside-down top-mounted cutting motor with downward vertical shaft.
9. 4-blade shear rotor with hooked tips sweeping above sizing screen.
10. Center-hinged double drop doors opening downward from central support.
11. Dual-layer leftover food architecture (outer carriage + removable inner strainer bucket).
12. Symmetrical 4-wheel caster mobility assembly on base plate.
13. Alternative Embodiment B feature scope (manual microbe/water addition, single collective inorganic storage; NO automated dispensers, NO water spray nozzle, NO 3-way partitioned inorganic sorter).

### INFERRED (Geometry Inferred from Sketches & Descriptions)
1. Rotational orientation of sector boundaries ($\theta_{\text{sector}}$) relative to $+Z$.
2. Circular cutting collar nested inside 180° semi-cylindrical sector.
3. Contoured / peanut profile of the input sorting flap.
4. Top cap division (50% closed rear dome with display, 50% open front funnel basin).
5. Semicircular manure extraction drawer at the bottom of the organic sector.
6. 90° quadrant sliding bin for inorganic waste.
7. 90° quadrant front-loading carriage for leftover food.
8. Low-profile sliding leachate collection tray at bottom plinth.

### TBD (Requires Engineering / Design Confirmation)
1. Drawer envelope dimensions and operational clearances (height, depth, wall thickness, sliding clearance, extraction travel, volume) for:
   * Manure extraction drawer (lower organic level; envelope within or below decomposition chamber)
   * Inorganic output drawer (90° sector; starting at datum $Y = 320\text{ mm}$)
   * Leftover food outer carriage (90° sector; starting at datum $Y = 320\text{ mm}$)
   * Removable strainer basket (nested inside food outer carriage)
2. Cutting chamber diameter and sizing mesh diameter.
3. Cutting mesh thickness and hole aperture size.
4. Blade span, chord, thickness, hook dimensions, and shear pitch angle.
5. Blade-to-mesh vertical clearance.
6. Storage door dimensions, hinge pin coordinates, and closed slope angle.
7. Decomposition agitator shaft diameter, paddle span, chord, and floor clearance.
8. Inorganic drawer extraction vector ($+Z$ vs 45° radial).
9. Leachate drain pipe diameters, slope angles, and tray volume.
10. Caster wheel diameter, bracket height, and mounting circle radius.
11. Top cap curvature radius and dome profile.
12. Mechanical slide guide and hinge pin clearances.

---

## 17. Geometry Generation Rule

> **CRITICAL ARCHITECTURAL RULE:**  
> **"No geometry-generation agent may silently convert a TBD parameter into a guessed numerical value."**

---

## 18. Phase 3 Approved Architectural Decisions Implementation

### 18.1 Decision A — Removable Decomposition Chamber & Load Cells
* **Removable Vessel:** The decomposition chamber itself ($Y = 100\text{–}370\text{ mm}$, 180° semi-cylindrical vessel) is the removable drawer/vessel.
* **Agitator Coupling:** When the decomposition drawer is pulled out (linear extraction along $-X$), the complete decomposition vessel and the agitator assembly (shaft and paddles) attached to it travel together.
* **Stationary Drive Motor:** The decomposition drive motor remains permanently stationary below the apparatus in the base plinth ($Y = 0\text{–}100\text{ mm}$).
* **Quick-Release Coupling:** A schematic vertical quick-release coupling interface separates the upper vessel-mounted agitator shaft ($Y = 88\text{–}100\text{ mm}$) from the stationary motor shaft ($Y = 76\text{–}88\text{ mm}$).
* **Load-Cell Architecture:** The load cells are positioned *underneath* the removable decomposition chamber via dual lateral support pads ($Z = \pm 90\text{ mm}$, $Y = 95\text{ mm}$) resting on the plinth structure.
  * Measures total mass: $\text{Mass}_{\text{measured}} = \text{Mass}_{\text{vessel}} + \text{Mass}_{\text{contents}}$.
  * Tare baseline: empty vessel mass.
  * Agitator Clearance: The dual lateral support configuration provides $> 75\text{ mm}$ clearance around the central agitator shaft and motor coupling ($Z = 0$), ensuring zero mechanical interference and enabling unimpeded drawer extraction.
* **Extraction & Guidance:** Ergonomic front-facing curved pull handle (`DecompositionVessel_Handle`) mounted on the outer shell face. Stationary slide guide rails (`DecompositionDrawer_SlideRunner_1` & `_2`) attached to the stationary chassis at $Z = \pm 120\text{ mm}$ ($Y = 100\text{–}105\text{ mm}$), spanning $X = -4\text{ mm}$ to $X = -210\text{ mm}$ (length $206\text{ mm}$). Zero external protrusion beyond the cylindrical shell when closed ($R_{\text{max}} = 243.4\text{ mm} < 246\text{ mm}$ inner shell), maintaining continuous guidance throughout extraction.

### 18.2 Decision B — Inorganic Output Drawer
* **Air-Fryer Style Drawer:** The entire inorganic storage container ($Y = 100\text{–}480\text{ mm}$, 90° quadrant) is a removable physical drawer (`InorganicDrawer`).
* **Linear Extraction:** Simple linear outward extraction along the $+X$ vector through its intended external opening. Collision checking confirms full clearance through the extraction stroke.
* **Hardware Representation & Stationary Slide Rails:** Equipped with a front-facing pull handle (`InorganicDrawer_Handle`). Linear slide rails are mounted to the stationary chassis (`InorganicSection`) at the base datum ($Y = 100\text{–}106\text{ mm}$):
  * Rail 1 ($Z = -30\text{ mm}$): Spans $X = +4\text{ mm}$ to $X = +240\text{ mm}$ (length $236\text{ mm}$, $R_{\text{max}} = 242.7\text{ mm} < 246\text{ mm}$).
  * Rail 2 ($Z = -120\text{ mm}$): Spans $X = +4\text{ mm}$ to $X = +210\text{ mm}$ (length $206\text{ mm}$, $R_{\text{max}} = 244.9\text{ mm} < 246\text{ mm}$).
  * Zero external overhang when closed, with continuous positive engagement throughout the complete extraction stroke.

### 18.3 Decision C — Upper Electronics Bay
* **Location:** Positioned in the previously unused upper volume directly above the Leftover Food top closure ($Y = 925\text{ mm}$, $+X, +Z$ quadrant, spanning $Y = 928\text{–}968\text{ mm}$).
* **Enclosure:** Bounded translucent protective housing (`ElectronicsBay`) resting on the closure plate.
* **Main Control Unit (MCU):** Arduino controller board (`ElectronicsBay_MCU`) and associated wiring harness representation.
* **Power Management System:** Power box (`ElectronicsBay_BatteryBox`) enclosing 16 LiFePO4 cells configured in a 4S4P arrangement.
* **Clearance Verification:**
  * Clearance to central funnel cone: $> 28\text{ mm}$ (funnel radius $R_f = 60.5\text{ mm}$ at $Y = 945\text{ mm}$; bay inner radius $R_{\text{bay}} = 88.8\text{ mm}$).
  * Clearance to outer shell: $> 14\text{ mm}$ (bay outer radius $R = 232\text{ mm}$; shell inner radius $R = 246\text{ mm}$).
  * Strictly avoids input funnel, moving segregation flap, dividers, and outer shell.

### 18.4 Leftover Food Access Door Hinge (Phase 3B Approved)
* **Straight Chord Axis:** Replaces hypothetical curved spatial axis with two physical hinge brackets mounted to existing vertical divider walls:
  * Central Divider Hinge: Point A $(X = 10\text{ mm}, Y = 700\text{ mm}, Z = 245.8\text{ mm})$.
  * Radial Divider Hinge: Point B $(X = 245.8\text{ mm}, Y = 700\text{ mm}, Z = 10\text{ mm})$.
  * Straight Chord Rod: $\varnothing 6\text{ mm} \times 333.5\text{ mm}$ connecting Point A to Point B.
* **Kinematics:** Rigid-body rotational node (`LeftoverFoodAccessDoor_Hinge`) centered at chord midpoint $(127.9\text{ mm}, 700\text{ mm}, 127.9\text{ mm})$ rotated $45^\circ$ around $Y$. Rotation around local $X$ swings the door outward and downward, forming an ergonomic loading ramp.
* **Padding:** Preserves exactly $10\text{ mm}$ circumferential clearance padding on both radial boundaries.

### 18.5 Storage Double-Door Kinematic Assembly (Phase 3C Approved)
* **Synchronized Kinematic Assembly:** `StorageSynchronizedDoorsAssembly` with local origins precisely aligned on the horizontal hinge rods at $(X = 0, Y = 624\text{ mm}, Z = \pm 8\text{ mm})$.
* **Linkage Attachments:** Generic linkage lugs (`StorageDoorLeft_LinkageLug` and `StorageDoorRight_LinkageLug`) added for synchronous downward discharge.
* **Clearance:** Downward door swing fully clears within the $250\text{ mm}$ open inter-chamber gap ($Y = 370\text{–}620\text{ mm}$).

### 18.6 Leftover Food Physical Output Drawer (Decision 6 Approved)
* **Physical Container:** Converted from envelope into physical drawer (`LeftoverFoodDrawer`) spanning $Y = 100\text{–}480\text{ mm}$ with front pull handle and linear extraction along $+Z$.
* **Stationary Slide Rails:** Linear slide rails are mounted to the stationary chassis (`LeftoverFoodSection`) at the base datum ($Y = 100\text{–}106\text{ mm}$):
  * Rail 1 ($X = +30\text{ mm}$): Spans $Z = +4\text{ mm}$ to $Z = +240\text{ mm}$ (length $236\text{ mm}$, $R_{\text{max}} = 242.7\text{ mm} < 246\text{ mm}$).
  * Rail 2 ($X = +120\text{ mm}$): Spans $Z = +4\text{ mm}$ to $Z = +210\text{ mm}$ (length $206\text{ mm}$, $R_{\text{max}} = 244.9\text{ mm} < 246\text{ mm}$).
  * Zero external overhang when closed, with continuous positive engagement throughout the complete extraction stroke.
* **Strainer Basket Status:** Advanced nested strainer basket hidden (`visible = false`) pending future drainage/strainer architectural decisions.

### 18.7 Deferred Mechanical Decisions Notice
* **TEMPERATURE/MOISTURE SENSOR REMOVABLE-VESSEL INTERFACE — DEFERRED ARCHITECTURAL DECISION:**  
  Preserved conceptual function and metadata. Final mechanical mounting architecture and wiring interface across the removable drawer boundary are explicitly deferred to a dedicated future interface resolution.

### 18.8 Segregation Base Support Assembly (Phase 3 Approved Mechanical Embodiment)
* **Structural Support Point:** The rotating segregation platform is supported directly using the intersection of the `CentralDivider` (180° plane) and `RadialDivider` (90° plane) at $(X = 0, Z = 0, Y = 925\text{ mm})$. This divider intersection serves as the PRIMARY STRUCTURAL SUPPORT POINT.
* **Component Architecture:**
  1. **Rigid Support Housing Body (`SegregationSupportHub`):** Cylindrical bearing carrier ($\varnothing 38\text{ mm} \times 6\text{ mm}$, spanning $Y = 925\text{–}931\text{ mm}$) seated squarely on the top rims of the Central and Radial Dividers. Provides $1.0\text{ mm}$ physical running clearance below the rotating platform bottom ($Y = 932\text{ mm}$).
  2. **Dual Precision Bearing Arrangement:**
     * `SegregationSpindleBearing_Upper`: Upper thrust/radial bearing ($\text{OD} = 19\text{ mm}, \text{ID} = 8\text{ mm}$, height $2.5\text{ mm}$, center $Y = 929.75\text{ mm}$). Carries axial impact loads from descending waste and upper radial forces.
     * `SegregationSpindleBearing_Lower`: Lower radial bearing ($\text{OD} = 19\text{ mm}, \text{ID} = 8\text{ mm}$, height $2.5\text{ mm}$, center $Y = 926.25\text{ mm}$). Dual-bearing span ($3.5\text{ mm}$) constrains the vertical spindle and eliminates angular wobble.
  3. **Structural Divider Saddle Brackets:**
     * `SegregationDividerMount_Central`: Saddle bracket ($Z = \pm 20\text{ mm}$, span $40\text{ mm}$, height $8\text{ mm}$ dropping to $Y = 917\text{ mm}$) clamping Central Divider ($X \in [-2, +2]\text{ mm}$) with socket-head clamping bolts.
     * `SegregationDividerMount_Radial`: Saddle bracket ($X = 0\text{ to } 20\text{ mm}$, span $20\text{ mm}$, height $8\text{ mm}$ dropping to $Y = 917\text{ mm}$) clamping Radial Divider ($Z \in [-2, +2]\text{ mm}$) with clamping bolt.
  4. **Segregation Drive Motor (`SegregationDriveMotor`):**
     * Compact stepper motor cylinder ($\varnothing 28\text{ mm} \times 20\text{ mm}$, spanning $Y = 901\text{–}921\text{ mm}$) positioned directly below the platform and housing, coaxial with the vertical yaw axis $[0, 1, 0]$ at $(0, 0)$.
     * Rigid motor mounting flange collar (`SegregationDriveMotor_Flange`, $\varnothing 35\text{ mm} \times 3\text{ mm}$, $Y = 921\text{–}924\text{ mm}$) rigidly suspending the motor stator from the housing base.
     * Output drive shaft ($\varnothing 5\text{ mm} \times 6\text{ mm}$, $Y = 921\text{–}927\text{ mm}$).
  5. **Motor-to-Spindle Coupling (`SegregationMotorShaftCoupling`):**
     * Precision collar coupling ($\varnothing 14\text{ mm} \times 6\text{ mm}$, $Y = 920\text{–}926\text{ mm}$) mechanically linking the motor output shaft to the vertical spindle.
  6. **Kinematics & Platform Arrangement:**
     * `RotatingBaseAssembly`: Centered at $(0, 935\text{ mm}, 0)$.
     * `AxisPivot_1` (Yaw): Revolute around vertical $Y$-axis $[0, 1, 0]$. Houses `AxisPivot_1_Spindle` ($\varnothing 8\text{ mm} \times 14\text{ mm}$, $Y = 921\text{–}935\text{ mm}$) supported by dual bearings and connected to the motor coupling.
     * `AxisPivot_2` (Pitch/Tilt): Revolute around horizontal transverse trunnion axis (`AxisPivot_2_Trunnion`) along local $X$.
     * `RotatingBase`: Contoured peanut/dumbbell platform plate ($85 \times 70/50 \times 4\text{ mm}$) centered at $Y = 935\text{ mm}$.
* **Electronics Isolation:** The Main Control Unit (Arduino MCU) and Power Management System (16-cell LiFePO4 battery box) are strictly NOT placed inside this support assembly; they remain located in the Upper Electronics Bay above the closed Leftover Food section.
* **Structural Load Path:**
  $$\text{Platform} \to \text{Gimbal Trunnion} \to \text{Yaw Spindle} \to \text{Dual Bearings} \to \text{Support Hub} \to \text{Divider Saddle Brackets} \to \text{Central \& Radial Divider Walls} \to \text{Outer Structural Shell}$$
* **Clearance Verification:**
  * Annular waste drop aperture: $31.0\text{ mm}$ radial clearance between funnel throat ($\varnothing 100\text{ mm}$, $R = 50\text{ mm}$) and support hub ($\varnothing 38\text{ mm}$, $R = 19\text{ mm}$).
  * Funnel bottom rim to platform top: $2.0\text{ mm}$ vertical clearance ($940.0\text{ mm} - 938.0\text{ mm}$).
  * Running clearance under platform: $1.0\text{ mm}$ gap between platform bottom ($932.0\text{ mm}$) and hub top ($931.0\text{ mm}$).
  * Clearance to Cutting Collar: $> 10\text{ mm}$ transverse clearance in Organic sector.
  * Clearance to outer shell: $> 227\text{ mm}$.