import { GOMIKIN_BASELINE_PARAMS, validateParameters } from '../utils/parameters.js';

/**
 * Initializes the Envelope Verification UI panel.
 *
 * @param {THREE.Group} envelope - The GomikinEnvelope instance
 * @param {THREE.PerspectiveCamera} camera - Scene camera
 * @param {OrbitControls} controls - OrbitControls
 */
export function initEnvelopeUI(envelope, camera, controls) {
  const panel = document.createElement('div');
  panel.id = 'envelope-ui-panel';

  const style = document.createElement('style');
  style.textContent = `
    #envelope-ui-panel {
      position: absolute;
      top: 15px;
      right: 15px;
      width: 340px;
      max-height: 94vh;
      background: rgba(10, 15, 24, 0.92);
      border: 1px solid rgba(0, 255, 204, 0.4);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 0 16px rgba(0, 255, 204, 0.05);
      backdrop-filter: blur(8px);
      border-radius: 6px;
      color: #d8e4e8;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      padding: 16px;
      box-sizing: border-box;
      overflow-y: auto;
      z-index: 1000;
      font-size: 12px;
    }
    #envelope-ui-panel::-webkit-scrollbar { width: 5px; }
    #envelope-ui-panel::-webkit-scrollbar-thumb { background: rgba(0, 255, 204, 0.3); border-radius: 3px; }

    .env-header {
      border-bottom: 1px solid rgba(0, 255, 204, 0.3);
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .env-title {
      font-size: 16px;
      font-weight: 700;
      color: #00ffcc;
      letter-spacing: 1.5px;
      margin: 0 0 2px 0;
      text-transform: uppercase;
    }
    .env-badge {
      display: inline-block;
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 3px;
      background: rgba(0, 255, 204, 0.15);
      color: #00ffcc;
      border: 1px solid rgba(0, 255, 204, 0.3);
      letter-spacing: 0.5px;
    }
    .env-section {
      margin-bottom: 16px;
    }
    .env-section-title {
      font-size: 11px;
      font-weight: 600;
      color: #7da5b5;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .env-param-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      background: rgba(20, 30, 45, 0.5);
      padding: 6px 8px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .env-param-label {
      color: #b0c4ce;
      font-family: monospace;
      font-size: 11px;
    }
    .env-param-input {
      width: 75px;
      background: #090e15;
      border: 1px solid rgba(0, 255, 204, 0.3);
      color: #00ffcc;
      padding: 4px 6px;
      font-family: monospace;
      font-size: 12px;
      text-align: right;
      border-radius: 3px;
    }
    .env-param-input:focus {
      outline: none;
      border-color: #00ffcc;
      box-shadow: 0 0 6px rgba(0, 255, 204, 0.4);
    }
    .env-validation-box {
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 14px;
      font-family: monospace;
      font-size: 11px;
      line-height: 1.4;
    }
    .env-validation-valid {
      background: rgba(0, 255, 136, 0.1);
      border: 1px solid rgba(0, 255, 136, 0.4);
      color: #2efa9d;
    }
    .env-validation-invalid {
      background: rgba(255, 68, 68, 0.15);
      border: 1px solid rgba(255, 68, 68, 0.5);
      color: #ff6666;
    }
    .env-btn-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 10px;
    }
    .env-btn {
      background: rgba(20, 35, 50, 0.85);
      border: 1px solid rgba(0, 255, 204, 0.25);
      color: #9fe2d4;
      padding: 7px 10px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      cursor: pointer;
      border-radius: 3px;
      transition: all 0.15s ease;
    }
    .env-btn:hover {
      background: rgba(0, 255, 204, 0.2);
      border-color: #00ffcc;
      color: #fff;
    }
    .env-btn.active {
      background: rgba(0, 255, 204, 0.25);
      border-color: #00ffcc;
      color: #00ffcc;
      box-shadow: 0 0 8px rgba(0, 255, 204, 0.3);
    }
    .env-toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .env-checkbox-label {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #b0c4ce;
    }
    .env-slider-container {
      margin-top: 8px;
      background: rgba(20, 30, 45, 0.65);
      padding: 8px 10px;
      border-radius: 4px;
      border: 1px solid rgba(245, 158, 11, 0.35);
      box-shadow: inset 0 0 8px rgba(245, 158, 11, 0.05);
    }
    .env-slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-size: 11px;
      font-family: monospace;
    }
    .env-slider-label {
      color: #fbbf24;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .env-slider-val {
      color: #00ffcc;
      font-weight: bold;
      background: #090e15;
      padding: 2px 7px;
      border-radius: 3px;
      border: 1px solid rgba(0, 255, 204, 0.4);
      min-width: 32px;
      text-align: right;
    }
    .env-range-slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #090e15;
      outline: none;
      -webkit-appearance: none;
      accent-color: #f59e0b;
      cursor: pointer;
      border: 1px solid rgba(0, 255, 204, 0.2);
    }
    .env-range-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #00ffcc;
      cursor: pointer;
      box-shadow: 0 0 8px rgba(0, 255, 204, 0.7);
      border: 1px solid #ffffff;
    }
    .env-preset-btns {
      display: flex;
      gap: 3px;
      margin-top: 6px;
      flex-wrap: wrap;
    }
    .env-preset-btn {
      flex: 1 1 calc(25% - 3px);
      background: rgba(30, 45, 65, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #94a3b8;
      font-size: 9.5px;
      padding: 4px 2px;
      border-radius: 3px;
      cursor: pointer;
      font-family: monospace;
      text-align: center;
      transition: all 0.15s ease;
    }
    .env-preset-btn:hover {
      background: rgba(0, 255, 204, 0.25);
      color: #00ffcc;
      border-color: rgba(0, 255, 204, 0.5);
    }
    .env-preset-btn.active {
      background: rgba(245, 158, 11, 0.25);
      color: #fbbf24;
      border-color: #f59e0b;
    }
  `;
  document.head.appendChild(style);

  // Form HTML
  panel.innerHTML = `
    <div class="env-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <div class="env-title">Gomikin Envelope</div>
        <span class="env-badge">PHASE 3 • MASTER CONTROLS</span>
      </div>
      <button id="btn-env-collapse" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:#00ffcc; border-radius:4px; padding:3px 8px; font-size:11px; cursor:pointer;" title="Minimize / Expand Panel">_</button>
    </div>

    <div id="env-panel-body">

    <!-- Global Engineering Labels Visibility Control -->
    <div class="env-section">
      <div class="env-section-title">Label Visibility System</div>
      <button id="btn-toggle-labels" class="env-btn active" style="width:100%; border-color:#00ffcc; color:#00ffcc; font-size:11px; padding:8px 0; margin-bottom:6px;">
        🏷️ LABELS: SHOW (ACTIVE)
      </button>
    </div>

    <!-- Live Validation Box -->
    <div id="env-val-box" class="env-validation-box env-validation-valid">
      ✓ STACK RELATIONSHIP VALID<br>
      95 + 825 + 100 = 1020 mm
    </div>

    <!-- Baseline Parameters Form -->
    <div class="env-section">
      <div class="env-section-title">Baseline Parameters (mm)</div>
      
      <div class="env-param-row">
        <span class="env-param-label">outer_diameter:</span>
        <input type="number" id="inp-diameter" class="env-param-input" value="500" step="10" min="100" max="2000">
      </div>
      
      <div class="env-param-row">
        <span class="env-param-label">shell_wall_thickness:</span>
        <input type="number" id="inp-thickness" class="env-param-input" value="4" step="1" min="1" max="50">
      </div>

      <div class="env-param-row">
        <span class="env-param-label">overall_height:</span>
        <input type="number" id="inp-overall-h" class="env-param-input" value="1020" step="10" min="200" max="3000">
      </div>

      <div class="env-param-row">
        <span class="env-param-label">input_section_height:</span>
        <input type="number" id="inp-input-h" class="env-param-input" value="95" step="5" min="50" max="1500">
      </div>

      <div class="env-param-row">
        <span class="env-param-label">middle_section_height:</span>
        <input type="number" id="inp-middle-h" class="env-param-input" value="825" step="5" min="100" max="2500">
      </div>

      <div class="env-param-row">
        <span class="env-param-label">leachate_section_height:</span>
        <input type="number" id="inp-leachate-h" class="env-param-input" value="100" step="10" min="20" max="1000">
      </div>

      <div class="env-param-row">
        <span class="env-param-label">funnel_opening_dia:</span>
        <input type="number" id="inp-funnel-dia" class="env-param-input" value="100" step="10" min="50" max="240">
      </div>

      <div class="env-param-row">
        <span class="env-param-label">sector_orientation_deg:</span>
        <input type="number" id="inp-sector-deg" class="env-param-input" value="0" step="5" min="0" max="360">
      </div>

      <div style="display:flex; gap:6px; margin-top:8px;">
        <button id="btn-apply-params" class="env-btn" style="flex:1; border-color:#00ffcc; color:#00ffcc;">APPLY PARAMS</button>
        <button id="btn-reset-params" class="env-btn" style="flex:1; color:#ffaa77; border-color:rgba(255,170,119,0.3);">RESET BASELINE</button>
      </div>
    </div>

    <!-- Input + Segregation Assembly Section -->
    <div class="env-section">
      <div class="env-section-title">Input + Segregation Assembly (Y = 925–1020 mm)</div>
      <div style="background: rgba(15, 25, 38, 0.6); padding: 8px 10px; border-radius: 4px; border: 1px solid rgba(0, 255, 204, 0.15); font-family: monospace; font-size: 11px; line-height: 1.6;">
        <div style="display:flex; justify-content:space-between;"><span style="color:#38bdf8;">• Top Closure:</span><span id="lbl-input-closure" style="color:#fff;">Y = 925–1020 (Rear Hood)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#00ffcc;">• User Display:</span><span id="lbl-input-display" style="color:#fff;">OLED Console (Tilted 25°)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#00ffcc;">• Central Funnel:</span><span id="lbl-input-funnel" style="color:#fff;">Ø100 mm (Y = 940–1020)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#f59e0b;">• Rotating Base:</span><span id="lbl-input-base" style="color:#fff;">Y = 935 mm (2-Axis Platform)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#38bdf8;">• Optical Camera:</span><span id="lbl-input-camera" style="color:#fff;">Under Crossbeam (Left -X)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#a855f7;">• Ultrasonic Sensor:</span><span id="lbl-input-us" style="color:#fff;">Dual-Barrel (Right +X)</span></div>
      </div>
    </div>

    <!-- Sector Architecture Section (Phase 2A) -->
    <div class="env-section">
      <div class="env-section-title">Sector Architecture (Phase 2A)</div>
      <div style="background: rgba(15, 25, 38, 0.6); padding: 8px 10px; border-radius: 4px; border: 1px solid rgba(0, 255, 204, 0.15); font-family: monospace; font-size: 11px; line-height: 1.6;">
        <div style="display:flex; justify-content:space-between;"><span style="color:#00ffcc;">• Organic Sector:</span><span>180° (Half)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#38bdf8;">• Inorganic Sector:</span><span>90° (Quadrant)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#f59e0b;">• Leftover Food:</span><span>90° (Quadrant)</span></div>
        <div style="display:flex; justify-content:space-between; border-top:1px dashed rgba(255,255,255,0.1); margin-top:4px; padding-top:2px;">
          <span style="color:#7da5b5;">• Total Span:</span><span style="color:#2efa9d;">360° (VALID ✓)</span>
        </div>
      </div>
    </div>

    <!-- Derived Reference Planes Readout -->
    <div class="env-section">
      <div class="env-section-title">Vertical Reference Planes (Derived)</div>
      <div style="background: rgba(15, 25, 38, 0.6); padding: 8px 10px; border-radius: 4px; border: 1px solid rgba(0, 255, 204, 0.15); font-family: monospace; font-size: 11px; line-height: 1.6;">
        <div style="display:flex; justify-content:space-between;"><span style="color:#38bdf8;">• Top Plane:</span><span id="lbl-plane-top" style="color:#fff;">Y = 1020 mm</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#f59e0b;">• Rotating Base Datum:</span><span id="lbl-plane-base-datum" style="color:#fff;">Y = 935 mm</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#00ffcc;">• Input/Middle:</span><span id="lbl-plane-input" style="color:#fff;">Y = 925 mm</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#c084fc;">• Output Datum:</span><span id="lbl-plane-datum" style="color:#fff;">Y = 370 mm</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#ffaa00;">• Middle/Leachate:</span><span id="lbl-plane-leachate" style="color:#fff;">Y = 100 mm</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#7da5b5;">• Base Plane:</span><span id="lbl-plane-base" style="color:#fff;">Y = 0 mm</span></div>
      </div>
    </div>

    <!-- Organic Section Architecture (Phase 2B Envelopes) -->
    <div class="env-section">
      <div class="env-section-title">Organic Section Envelopes (180°)</div>
      <div style="background: rgba(15, 25, 38, 0.6); padding: 8px 10px; border-radius: 4px; border: 1px solid rgba(0, 255, 204, 0.15); font-family: monospace; font-size: 11px; line-height: 1.6;">
        <div style="display:flex; justify-content:space-between;"><span style="color:#a78bfa;">• Headroom:</span><span id="lbl-org-headroom" style="color:#c4b5fd;">Y = 915–925 (10 mm)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">• Cutting Alloc:</span><span id="lbl-org-cutting" style="color:#cbd5e1;">Y = 890–915 (25 mm)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#38bdf8;">• Exhaust Fan (VOC):</span><span id="lbl-org-fan" style="color:#7dd3fc;">Y = 770 mm (Airflow)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#34d399;">• Storage Chamber:</span><span id="lbl-org-storage" style="color:#fff;">Y = 620–890 (270 mm)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#10b981;">• Base Doors:</span><span id="lbl-org-doors" style="color:#6ee7b7;">Y = 620 mm (4 mm Flaps)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#c084fc;">• Open Gap:</span><span id="lbl-org-gap" style="color:#fff;">Y = 370–620 (250 mm)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#fbbf24;">• Decomp Chamber:</span><span id="lbl-org-decomp" style="color:#fff;">Y = 100–370 (270 mm)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#f59e0b;">• Agitator Sweep:</span><span id="lbl-org-agitator" style="color:#fde68a;">Y = 100 mm (Shaft & Paddles)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#38bdf8;">• Sensors (Base):</span><span id="lbl-org-sensors" style="color:#7dd3fc;">Load/Temp/Moisture</span></div>
      </div>
    </div>

    <!-- Non-Organic Output Envelopes (Phase 2C Envelopes) -->
    <div class="env-section">
      <div class="env-section-title">Non-Organic Output Envelopes (90° + 90°)</div>
      <div style="background: rgba(15, 25, 38, 0.6); padding: 8px 10px; border-radius: 4px; border: 1px solid rgba(0, 255, 204, 0.15); font-family: monospace; font-size: 11px; line-height: 1.6;">
        <div style="display:flex; justify-content:space-between;"><span style="color:#38bdf8;">• Inorganic Drawer:</span><span id="lbl-inorg-drawer" style="color:#fff;">Y = 100–480 (380 mm)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#f59e0b;">• Food Outer Drawer:</span><span id="lbl-food-outer" style="color:#fff;">Y = 100–480 (380 mm)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#eab308;">• Nested Strainer:</span><span id="lbl-food-basket" style="color:#fff;">Y = 125–475 (350 mm)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#7da5b5;">• Drainage Sump:</span><span id="lbl-food-sump" style="color:#2efa9d;">25 mm clearance</span></div>
      </div>
    </div>

    <!-- Leftover Food Sector Refinements (90°) -->
    <div class="env-section">
      <div class="env-section-title">Leftover Food Refinements (90°)</div>
      <div style="background: rgba(15, 25, 38, 0.6); padding: 8px 10px; border-radius: 4px; border: 1px solid rgba(245, 158, 11, 0.25); font-family: monospace; font-size: 11px; line-height: 1.6;">
        <div style="display:flex; justify-content:space-between;"><span style="color:#f59e0b;">• Top Closure:</span><span id="lbl-food-top-closure" style="color:#fff;">Y = 925 mm (90° Arc)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#fbbf24;">• Access Door:</span><span id="lbl-food-access-door" style="color:#fff;">Y = 700–800 (100 mm)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#22d3ee;">• Fixed Hinge:</span><span id="lbl-food-hinge" style="color:#7dd3fc;">Y = 700 mm (Bottom)</span></div>
        <div style="display:flex; justify-content:space-between;"><span style="color:#7da5b5;">• Arc Padding:</span><span id="lbl-food-padding" style="color:#2efa9d;">10 mm Left & Right</span></div>
      </div>

      <!-- Phase 3B: Leftover Food Door Kinematic Control -->
      <div class="env-slider-container">
        <div class="env-slider-header">
          <span class="env-slider-label">Leftover Food Door:</span>
          <span class="env-slider-val" id="val-food-door-angle">0°</span>
        </div>
        <input type="range" id="slider-food-door-angle" class="env-range-slider" min="0" max="90" step="1" value="0">
        <div class="env-preset-btns">
          <button class="env-preset-btn active" data-angle="0">0° Closed</button>
          <button class="env-preset-btn" data-angle="15">15°</button>
          <button class="env-preset-btn" data-angle="30">30°</button>
          <button class="env-preset-btn" data-angle="45">45°</button>
          <button class="env-preset-btn" data-angle="55">55° Ramp</button>
          <button class="env-preset-btn" data-angle="70">70°</button>
          <button class="env-preset-btn" data-angle="90">90° Max</button>
        </div>
      </div>
    </div>

    <!-- Phase 3 Output Drawer Kinematic Controls -->
    <div class="env-section">
      <div class="env-section-title">Output Drawer Kinematics</div>
      
      <!-- Decomposition Drawer Slider -->
      <div class="env-slider-container" style="margin-bottom:10px;">
        <div class="env-slider-header">
          <span class="env-slider-label" style="color:#fbbf24;">Decomp Drawer (-X):</span>
          <span class="env-slider-val" id="val-decomp-drawer-ext">0 mm</span>
        </div>
        <input type="range" id="slider-decomp-drawer-ext" class="env-range-slider" min="0" max="300" step="5" value="0">
        <div class="env-preset-btns">
          <button class="env-preset-btn active" data-drawer="decomp" data-ext="0">0 mm</button>
          <button class="env-preset-btn" data-drawer="decomp" data-ext="100">100 mm</button>
          <button class="env-preset-btn" data-drawer="decomp" data-ext="200">200 mm</button>
          <button class="env-preset-btn" data-drawer="decomp" data-ext="300">300 mm</button>
        </div>
      </div>

      <!-- Inorganic Drawer Slider -->
      <div class="env-slider-container" style="margin-bottom:10px;">
        <div class="env-slider-header">
          <span class="env-slider-label" style="color:#38bdf8;">Inorganic Drawer (+X):</span>
          <span class="env-slider-val" id="val-inorg-drawer-ext">0 mm</span>
        </div>
        <input type="range" id="slider-inorg-drawer-ext" class="env-range-slider" min="0" max="300" step="5" value="0">
        <div class="env-preset-btns">
          <button class="env-preset-btn active" data-drawer="inorg" data-ext="0">0 mm</button>
          <button class="env-preset-btn" data-drawer="inorg" data-ext="100">100 mm</button>
          <button class="env-preset-btn" data-drawer="inorg" data-ext="200">200 mm</button>
          <button class="env-preset-btn" data-drawer="inorg" data-ext="300">300 mm</button>
        </div>
      </div>

      <!-- Leftover Food Drawer Slider -->
      <div class="env-slider-container">
        <div class="env-slider-header">
          <span class="env-slider-label" style="color:#f59e0b;">Leftover Food Drawer (+Z):</span>
          <span class="env-slider-val" id="val-food-drawer-ext">0 mm</span>
        </div>
        <input type="range" id="slider-food-drawer-ext" class="env-range-slider" min="0" max="300" step="5" value="0">
        <div class="env-preset-btns">
          <button class="env-preset-btn active" data-drawer="food" data-ext="0">0 mm</button>
          <button class="env-preset-btn" data-drawer="food" data-ext="100">100 mm</button>
          <button class="env-preset-btn" data-drawer="food" data-ext="200">200 mm</button>
          <button class="env-preset-btn" data-drawer="food" data-ext="300">300 mm</button>
        </div>
      </div>
    </div>

    <!-- Hollow Shell Verification Modes -->
    <div class="env-section">
      <div class="env-section-title">Hollow Shell Modes</div>
      <div class="env-btn-grid">
        <button class="env-btn active" id="btn-shell-translucent">Translucent</button>
        <button class="env-btn" id="btn-shell-solid">Solid Shell</button>
        <button class="env-btn" id="btn-shell-wire">Wireframe</button>
        <button class="env-btn" id="btn-shell-hidden">Hide Shell</button>
      </div>
    </div>

    <!-- Reference Geometry & Markers Toggles -->
    <div class="env-section">
      <div class="env-section-title">Geometry Toggles</div>
      <div class="env-toggle-row">
        <label class="env-checkbox-label">
          <input type="checkbox" id="chk-engineering-labels" checked> Engineering Labels (Callouts)
        </label>
      </div>
      <div class="env-toggle-row">
        <label class="env-checkbox-label">
          <input type="checkbox" id="chk-input-assembly" checked> Input & Segregation Assembly
        </label>
      </div>
      <div class="env-toggle-row">
        <label class="env-checkbox-label">
          <input type="checkbox" id="chk-organic-chambers" checked> Organic Chamber Envelopes
        </label>
      </div>
      <div class="env-toggle-row">
        <label class="env-checkbox-label">
          <input type="checkbox" id="chk-decomp-agitator" checked> Decomposition Agitator (180°)
        </label>
      </div>
      <div class="env-toggle-row">
        <label class="env-checkbox-label">
          <input type="checkbox" id="chk-decomp-sensors"> Decomposition Sensors (Hidden by default)
        </label>
      </div>
      <div class="env-toggle-row">
        <label class="env-checkbox-label">
          <input type="checkbox" id="chk-inorganic-section" checked> Inorganic Output Drawer (90°)
        </label>
      </div>
      <div class="env-toggle-row">
        <label class="env-checkbox-label">
          <input type="checkbox" id="chk-food-section" checked> Leftover Food Drawer & Basket (90°)
        </label>
      </div>
      <div class="env-toggle-row">
        <label class="env-checkbox-label">
          <input type="checkbox" id="chk-food-access-door" checked> Leftover Food Access Door (Y = 700–800)
        </label>
      </div>
      <div class="env-toggle-row">
        <label class="env-checkbox-label">
          <input type="checkbox" id="chk-food-top-closure" checked> Leftover Food Top Closure (Y = 805)
        </label>
      </div>
      <div class="env-toggle-row">
        <label class="env-checkbox-label">
          <input type="checkbox" id="chk-structural" checked> Sector Dividers (180° / 90° / 90°)
        </label>
      </div>
      <div class="env-toggle-row">
        <label class="env-checkbox-label">
          <input type="checkbox" id="chk-ref-geom" checked> Reference Planes & Axis
        </label>
      </div>
      <div class="env-toggle-row">
        <label class="env-checkbox-label">
          <input type="checkbox" id="chk-output-datum" checked> Middle Output Datum (Y = 320 mm)
        </label>
      </div>
      <div class="env-toggle-row">
        <label class="env-checkbox-label">
          <input type="checkbox" id="chk-region-markers" checked> Vertical Region Markers
        </label>
      </div>
    </div>

    <!-- Camera Inspection Presets -->
    <div class="env-section">
      <div class="env-section-title">Camera Presets</div>
      <div class="env-btn-grid">
        <button class="env-btn" id="cam-iso">Isometric</button>
        <button class="env-btn" id="cam-decomp">Decomp (180°)</button>
        <button class="env-btn" id="cam-input">Input Bay</button>
        <button class="env-btn" id="cam-top">Top (Hollow)</button>
        <button class="env-btn" id="cam-front">Front (+Z)</button>
        <button class="env-btn" id="cam-food-door">Food (90°)</button>
        <button class="env-btn" id="cam-regions">Left (Regions)</button>
      </div>
    </div>
    </div><!-- /env-panel-body -->
  `;

  document.body.appendChild(panel);

  // Wire up event listeners
  const valBox = document.getElementById('env-val-box');
  const inpDia = document.getElementById('inp-diameter');
  const inpThk = document.getElementById('inp-thickness');
  const inpH = document.getElementById('inp-overall-h');
  const inpIn = document.getElementById('inp-input-h');
  const inpMid = document.getElementById('inp-middle-h');
  const inpLea = document.getElementById('inp-leachate-h');
  const inpFunnelDia = document.getElementById('inp-funnel-dia');
  const inpSectorDeg = document.getElementById('inp-sector-deg');

  function checkValidationLive() {
    const inputH = parseFloat(inpIn.value) || 0;
    const middleH = parseFloat(inpMid.value) || 0;
    const leachateH = parseFloat(inpLea.value) || 0;
    const totalH = parseFloat(inpH.value) || 0;
    const sum = inputH + middleH + leachateH;

    if (Math.abs(sum - totalH) < 0.001) {
      valBox.className = 'env-validation-box env-validation-valid';
      valBox.innerHTML = `✓ STACK RELATIONSHIP VALID<br>${inputH} + ${middleH} + ${leachateH} = ${totalH} mm`;
      return true;
    } else {
      valBox.className = 'env-validation-box env-validation-invalid';
      valBox.innerHTML = `✗ RELATIONSHIP MISMATCH<br>${inputH} + ${middleH} + ${leachateH} = ${sum} mm (Expected: ${totalH} mm)`;
      return false;
    }
  }

  [inpIn, inpMid, inpLea, inpH].forEach(el => el.addEventListener('input', checkValidationLive));

  inpSectorDeg.addEventListener('input', (e) => {
    const deg = parseFloat(e.target.value) || 0;
    envelope.setSectorOrientation(deg);
  });

  function updatePlaneLabels(derived) {
    if (!derived || !derived.mm) return;
    const elTop = document.getElementById('lbl-plane-top');
    const elBaseDatum = document.getElementById('lbl-plane-base-datum');
    const elIn = document.getElementById('lbl-plane-input');
    const elDatum = document.getElementById('lbl-plane-datum');
    const elLea = document.getElementById('lbl-plane-leachate');
    const elBase = document.getElementById('lbl-plane-base');
    if (elTop) elTop.textContent = `Y = ${derived.mm.y_top} mm`;
    if (elBaseDatum) elBaseDatum.textContent = `Y = ${derived.mm.y_rotating_base} mm`;
    if (elIn) elIn.textContent = `Y = ${derived.mm.y_input_boundary} mm`;
    if (elDatum) elDatum.textContent = `Y = ${derived.mm.y_middle_output_datum} mm`;
    if (elLea) elLea.textContent = `Y = ${derived.mm.y_leachate_boundary} mm`;
    if (elBase) elBase.textContent = `Y = ${derived.mm.y_ground} mm`;

    const elOrgHeadroom = document.getElementById('lbl-org-headroom');
    const elOrgCut = document.getElementById('lbl-org-cutting');
    const elOrgFan = document.getElementById('lbl-org-fan');
    const elOrgStore = document.getElementById('lbl-org-storage');
    const elOrgDoors = document.getElementById('lbl-org-doors');
    const elOrgGap = document.getElementById('lbl-org-gap');
    const elOrgDecomp = document.getElementById('lbl-org-decomp');
    if (elOrgHeadroom && derived.mm.y_cutting_headroom_bottom !== undefined) {
      elOrgHeadroom.textContent = `Y = ${derived.mm.y_cutting_headroom_bottom}–${derived.mm.y_cutting_headroom_top} (${derived.mm.cutting_headroom_height} mm)`;
    }
    if (elOrgCut) elOrgCut.textContent = `Y = ${derived.mm.y_cutting_bottom}–${derived.mm.y_cutting_top} (${derived.mm.cutting_height} mm)`;
    if (elOrgFan && derived.mm.organic_fan_elevation !== undefined) {
      elOrgFan.textContent = `Y = ${derived.mm.organic_fan_elevation} mm (Airflow)`;
    }
    if (elOrgStore) elOrgStore.textContent = `Y = ${derived.mm.y_storage_bottom}–${derived.mm.y_storage_top} (${derived.mm.storage_height} mm)`;
    if (elOrgDoors && derived.mm.door_thickness !== undefined) {
      elOrgDoors.textContent = `Y = ${derived.mm.y_storage_bottom} mm (${derived.mm.door_thickness} mm Flaps)`;
    }
    if (elOrgGap) elOrgGap.textContent = `Y = ${derived.mm.y_gap_bottom}–${derived.mm.y_gap_top} (${derived.mm.gap_height} mm)`;
    if (elOrgDecomp) elOrgDecomp.textContent = `Y = ${derived.mm.y_decomp_bottom}–${derived.mm.y_decomp_top} (${derived.mm.decomp_height} mm)`;
    const elOrgAgitator = document.getElementById('lbl-org-agitator');
    if (elOrgAgitator && derived.mm.agitator_paddle_span !== undefined) {
      elOrgAgitator.textContent = `Y = ${derived.mm.y_decomp_bottom} mm (Ø${derived.mm.agitator_paddle_span} mm Sweeps)`;
    }

    const elInorg = document.getElementById('lbl-inorg-drawer');
    const elFoodOuter = document.getElementById('lbl-food-outer');
    const elFoodBasket = document.getElementById('lbl-food-basket');
    const elFoodSump = document.getElementById('lbl-food-sump');
    if (elInorg) elInorg.textContent = `Y = ${derived.mm.y_non_organic_output_bottom}–${derived.mm.y_non_organic_output_top} (${derived.mm.non_organic_output_height} mm)`;
    if (elFoodOuter) elFoodOuter.textContent = `Y = ${derived.mm.y_non_organic_output_bottom}–${derived.mm.y_non_organic_output_top} (${derived.mm.non_organic_output_height} mm)`;
    if (elFoodBasket) elFoodBasket.textContent = `Y = ${derived.mm.y_strainer_basket_bottom}–${derived.mm.y_strainer_basket_top} (${derived.mm.strainer_basket_height} mm)`;
    if (elFoodSump) elFoodSump.textContent = `${derived.mm.strainer_basket_drainage_sump_height} mm clearance`;

    const elClosure = document.getElementById('lbl-input-closure');
    const elFunnel = document.getElementById('lbl-input-funnel');
    const elBasePlatform = document.getElementById('lbl-input-base');
    if (elClosure) elClosure.textContent = `Y = ${derived.mm.y_input_boundary}–${derived.mm.y_top} (Rear Hood)`;
    if (elFunnel) elFunnel.textContent = `Ø${derived.mm.funnel_opening_diameter} mm (Y = ${derived.mm.funnel_bottom_y}–${derived.mm.funnel_top_y})`;
    if (elBasePlatform) elBasePlatform.textContent = `Y = ${derived.mm.y_rotating_base} mm (2-Axis Platform)`;

    const elFoodTopClosure = document.getElementById('lbl-food-top-closure');
    const elFoodAccessDoor = document.getElementById('lbl-food-access-door');
    const elFoodHinge = document.getElementById('lbl-food-hinge');
    const elFoodPadding = document.getElementById('lbl-food-padding');
    if (elFoodTopClosure) elFoodTopClosure.textContent = `Y = ${derived.mm.y_input_boundary} mm (90° Arc)`;
    if (elFoodAccessDoor) elFoodAccessDoor.textContent = `Y = ${derived.mm.food_door_bottom_y}–${derived.mm.food_door_top_y} (${derived.mm.food_door_height} mm)`;
    if (elFoodHinge) elFoodHinge.textContent = `Y = ${derived.mm.food_door_bottom_y} mm (Bottom)`;
    if (elFoodPadding) elFoodPadding.textContent = `${derived.mm.food_door_arc_padding} mm Left & Right`;
  }

  document.getElementById('btn-apply-params').onclick = () => {
    const params = {
      outer_diameter: parseFloat(inpDia.value),
      shell_wall_thickness: parseFloat(inpThk.value),
      overall_height: parseFloat(inpH.value),
      input_section_height: parseFloat(inpIn.value),
      middle_section_height: parseFloat(inpMid.value),
      leachate_section_height: parseFloat(inpLea.value),
      funnel_opening_diameter: parseFloat(inpFunnelDia.value) || 100,
      sector_orientation_deg: parseFloat(inpSectorDeg.value) || 0,
    };

    try {
      const updated = envelope.updateParameters(params);
      checkValidationLive();
      updatePlaneLabels(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  document.getElementById('btn-reset-params').onclick = () => {
    inpDia.value = GOMIKIN_BASELINE_PARAMS.outer_diameter;
    inpThk.value = GOMIKIN_BASELINE_PARAMS.shell_wall_thickness;
    inpH.value = GOMIKIN_BASELINE_PARAMS.overall_height;
    inpIn.value = GOMIKIN_BASELINE_PARAMS.input_section_height;
    inpMid.value = GOMIKIN_BASELINE_PARAMS.middle_section_height;
    inpLea.value = GOMIKIN_BASELINE_PARAMS.leachate_section_height;
    inpFunnelDia.value = GOMIKIN_BASELINE_PARAMS.funnel_opening_diameter;
    inpSectorDeg.value = GOMIKIN_BASELINE_PARAMS.sector_orientation_deg;
    const resetDerived = envelope.updateParameters(GOMIKIN_BASELINE_PARAMS);
    checkValidationLive();
    updatePlaneLabels(resetDerived);
    if (typeof updateDoorAngle === 'function') {
      updateDoorAngle(0);
    }
  };

  // Global Engineering Labels Toggle
  const btnToggleLabels = document.getElementById('btn-toggle-labels');
  const chkLabels = document.getElementById('chk-engineering-labels');

  function updateLabelToggleState(visible) {
    envelope.setLabelsVisible(visible);
    if (chkLabels) chkLabels.checked = visible;
    if (btnToggleLabels) {
      if (visible) {
        btnToggleLabels.classList.add('active');
        btnToggleLabels.innerHTML = '🏷️ LABELS: SHOW (ACTIVE)';
        btnToggleLabels.style.borderColor = '#00ffcc';
        btnToggleLabels.style.color = '#00ffcc';
      } else {
        btnToggleLabels.classList.remove('active');
        btnToggleLabels.innerHTML = '🏷️ LABELS: HIDDEN';
        btnToggleLabels.style.borderColor = '#64748b';
        btnToggleLabels.style.color = '#94a3b8';
      }
    }
  }

  if (btnToggleLabels) {
    btnToggleLabels.onclick = () => {
      const newState = !envelope.isLabelsVisible();
      updateLabelToggleState(newState);
    };
  }

  if (chkLabels) {
    chkLabels.onchange = (e) => {
      updateLabelToggleState(e.target.checked);
    };
  }

  // Input & Segregation Assembly toggle
  const chkInputAssembly = document.getElementById('chk-input-assembly');
  if (chkInputAssembly) {
    chkInputAssembly.onchange = (e) => {
      envelope.setInputAssemblyVisible(e.target.checked);
    };
  }

  // Organic Chambers toggle
  const chkOrganic = document.getElementById('chk-organic-chambers');
  if (chkOrganic) {
    chkOrganic.onchange = (e) => {
      envelope.setOrganicChambersVisible(e.target.checked);
    };
  }

  // Decomposition Agitator toggle
  const chkDecompAgitator = document.getElementById('chk-decomp-agitator');
  if (chkDecompAgitator) {
    chkDecompAgitator.onchange = (e) => {
      envelope.setDecompositionAgitatorVisible(e.target.checked);
    };
  }

  // Decomposition Sensory Feedback Array toggle (Hidden by default)
  const chkDecompSensors = document.getElementById('chk-decomp-sensors');
  if (chkDecompSensors) {
    chkDecompSensors.checked = envelope.isDecompositionSensorsVisible ? envelope.isDecompositionSensorsVisible() : false;
    chkDecompSensors.onchange = (e) => {
      if (envelope.setDecompositionSensorsVisible) {
        envelope.setDecompositionSensorsVisible(e.target.checked);
      }
    };
  }

  // Inorganic Section toggle
  const chkInorganic = document.getElementById('chk-inorganic-section');
  if (chkInorganic) {
    chkInorganic.onchange = (e) => {
      envelope.setInorganicSectionVisible(e.target.checked);
    };
  }

  // Leftover Food Section toggle
  const chkFood = document.getElementById('chk-food-section');
  if (chkFood) {
    chkFood.onchange = (e) => {
      envelope.setLeftoverFoodSectionVisible(e.target.checked);
    };
  }

  // Leftover Food Access Door toggle
  const chkFoodDoor = document.getElementById('chk-food-access-door');
  if (chkFoodDoor) {
    chkFoodDoor.onchange = (e) => {
      envelope.setLeftoverFoodDoorVisible(e.target.checked);
    };
  }

  // Phase 3B: Leftover Food Access Door Kinematic Slider & Preset Controls
  const sliderFoodDoor = document.getElementById('slider-food-door-angle');
  const valFoodDoor = document.getElementById('val-food-door-angle');
  const presetDoorBtns = panel.querySelectorAll('.env-preset-btn[data-angle]');

  function updateDoorAngle(angleDeg) {
    const deg = Math.max(0, Math.min(90, Math.round(angleDeg)));
    if (sliderFoodDoor) sliderFoodDoor.value = deg;
    if (valFoodDoor) valFoodDoor.textContent = `${deg}°`;
    presetDoorBtns.forEach(btn => {
      const bDeg = parseFloat(btn.dataset.angle);
      if (Math.abs(bDeg - deg) < 0.5) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    if (envelope.setLeftoverFoodDoorAngle) {
      envelope.setLeftoverFoodDoorAngle(deg);
    }
  }

  if (sliderFoodDoor) {
    sliderFoodDoor.oninput = (e) => {
      updateDoorAngle(parseFloat(e.target.value) || 0);
    };
  }

  presetDoorBtns.forEach(btn => {
    btn.onclick = () => {
      updateDoorAngle(parseFloat(btn.dataset.angle) || 0);
    };
  });

  // Phase 3 Output Drawer Kinematic Sliders & Presets
  const sliderDecomp = document.getElementById('slider-decomp-drawer-ext');
  const valDecomp = document.getElementById('val-decomp-drawer-ext');
  if (sliderDecomp && envelope.setDecompositionDrawerExtraction) {
    sliderDecomp.oninput = (e) => {
      const val = parseFloat(e.target.value);
      envelope.setDecompositionDrawerExtraction(val);
      if (valDecomp) valDecomp.textContent = `${val} mm`;
    };
  }

  const sliderInorg = document.getElementById('slider-inorg-drawer-ext');
  const valInorg = document.getElementById('val-inorg-drawer-ext');
  if (sliderInorg && envelope.setInorganicDrawerExtraction) {
    sliderInorg.oninput = (e) => {
      const val = parseFloat(e.target.value);
      envelope.setInorganicDrawerExtraction(val);
      if (valInorg) valInorg.textContent = `${val} mm`;
    };
  }

  const sliderFoodDrawer = document.getElementById('slider-food-drawer-ext');
  const valFoodDrawer = document.getElementById('val-food-drawer-ext');
  if (sliderFoodDrawer && envelope.setLeftoverFoodDrawerExtraction) {
    sliderFoodDrawer.oninput = (e) => {
      const val = parseFloat(e.target.value);
      envelope.setLeftoverFoodDrawerExtraction(val);
      if (valFoodDrawer) valFoodDrawer.textContent = `${val} mm`;
    };
  }

  // Drawer Preset Buttons
  panel.querySelectorAll('button[data-drawer]').forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.drawer;
      const ext = parseFloat(btn.dataset.ext);
      if (type === 'decomp') {
        envelope.setDecompositionDrawerExtraction(ext);
        if (sliderDecomp) sliderDecomp.value = ext;
        if (valDecomp) valDecomp.textContent = `${ext} mm`;
      } else if (type === 'inorg') {
        envelope.setInorganicDrawerExtraction(ext);
        if (sliderInorg) sliderInorg.value = ext;
        if (valInorg) valInorg.textContent = `${ext} mm`;
      } else if (type === 'food') {
        envelope.setLeftoverFoodDrawerExtraction(ext);
        if (sliderFoodDrawer) sliderFoodDrawer.value = ext;
        if (valFoodDrawer) valFoodDrawer.textContent = `${ext} mm`;
      }
      panel.querySelectorAll(`button[data-drawer="${type}"]`).forEach(b => b.classList.toggle('active', b === btn));
    };
  });

  // Panel Collapse / Expand Button
  const btnEnvCollapse = document.getElementById('btn-env-collapse');
  const envBody = document.getElementById('env-panel-body');
  if (btnEnvCollapse && envBody) {
    let collapsed = false;
    btnEnvCollapse.onclick = () => {
      collapsed = !collapsed;
      envBody.style.display = collapsed ? 'none' : 'block';
      btnEnvCollapse.textContent = collapsed ? '▢' : '_';
      btnEnvCollapse.title = collapsed ? 'Expand Panel' : 'Minimize Panel';
    };
  }

  // Leftover Food Top Closure toggle
  const chkFoodTopClosure = document.getElementById('chk-food-top-closure');
  if (chkFoodTopClosure) {
    chkFoodTopClosure.onchange = (e) => {
      envelope.setLeftoverFoodTopClosureVisible(e.target.checked);
    };
  }

  // Structural Architecture toggle
  const chkStructural = document.getElementById('chk-structural');
  if (chkStructural) {
    chkStructural.onchange = (e) => {
      envelope.setStructuralArchitectureVisible(e.target.checked);
    };
  }

  // Middle Output Datum toggle
  const chkOutputDatum = document.getElementById('chk-output-datum');
  if (chkOutputDatum) {
    chkOutputDatum.onchange = (e) => {
      envelope.setMiddleOutputDatumVisible(e.target.checked);
    };
  }

  // Shell modes
  const modeBtns = {
    translucent: document.getElementById('btn-shell-translucent'),
    solid: document.getElementById('btn-shell-solid'),
    wire: document.getElementById('btn-shell-wire'),
    hidden: document.getElementById('btn-shell-hidden'),
  };

  function setModeActive(activeKey) {
    Object.keys(modeBtns).forEach(k => modeBtns[k].classList.remove('active'));
    if (modeBtns[activeKey]) modeBtns[activeKey].classList.add('active');
  }

  modeBtns.translucent.onclick = () => { envelope.setShellMode('translucent'); setModeActive('translucent'); };
  modeBtns.solid.onclick = () => { envelope.setShellMode('solid'); setModeActive('solid'); };
  modeBtns.wire.onclick = () => { envelope.setShellMode('wireframe'); setModeActive('wire'); };
  modeBtns.hidden.onclick = () => { envelope.setShellMode('hidden'); setModeActive('hidden'); };

  // Toggles
  document.getElementById('chk-ref-geom').onchange = (e) => {
    envelope.setReferenceGeometryVisible(e.target.checked);
  };
  document.getElementById('chk-region-markers').onchange = (e) => {
    envelope.setRegionMarkersVisible(e.target.checked);
  };

  // Camera presets
  document.getElementById('cam-iso').onclick = () => {
    camera.up.set(0, 1, 0);
    camera.position.set(0.9, 1.1, 1.4);
    controls.target.set(0, 0.45, 0);
    controls.update();
  };
  const camDecomp = document.getElementById('cam-decomp');
  if (camDecomp) {
    camDecomp.onclick = () => {
      // Focus directly into 180° Organic Decomposition Chamber (-X side, Y = 100-370 mm)
      camera.up.set(0, 1, 0);
      camera.position.set(-0.55, 0.40, 0.45);
      controls.target.set(-0.124, 0.235, 0);
      controls.update();
    };
  }
  document.getElementById('cam-input').onclick = () => {
    // Focus directly into top input bay
    camera.up.set(0, 1, 0);
    camera.position.set(0.2, 1.25, 0.6);
    controls.target.set(0, 0.85, 0);
    controls.update();
  };
  document.getElementById('cam-top').onclick = () => {
    // Look straight down: -Z (Rear closed hood + display) at top, +Z (Front open funnel) at bottom
    camera.up.set(0, 0, -1);
    camera.position.set(0, 1.8, 0.0001);
    controls.target.set(0, 0.45, 0);
    controls.update();
  };
  document.getElementById('cam-front').onclick = () => {
    camera.up.set(0, 1, 0);
    camera.position.set(0, 0.45, 1.6);
    controls.target.set(0, 0.45, 0);
    controls.update();
  };
  const camFoodDoor = document.getElementById('cam-food-door');
  if (camFoodDoor) {
    camFoodDoor.onclick = () => {
      // Focus directly onto +X, +Z Leftover Food Access Door (Y = 700–800 mm)
      camera.up.set(0, 1, 0);
      camera.position.set(0.55, 0.90, 0.55);
      controls.target.set(0.12, 0.75, 0.12);
      controls.update();
    };
  }
  document.getElementById('cam-regions').onclick = () => {
    // View from -X side where region markers are placed
    camera.up.set(0, 1, 0);
    camera.position.set(-1.6, 0.45, 0);
    controls.target.set(0, 0.45, 0);
    controls.update();
  };
}
