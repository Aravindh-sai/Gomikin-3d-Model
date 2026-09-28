import { GOMIKIN_MODULES } from '../interaction/inspectionController.js';
import { WORKFLOW_MODES } from '../animation/workflowController.js';
import { GOMIKIN_BASELINE_PARAMS } from '../utils/parameters.js';

/**
 * Initializes the unified single Right-Side Inspection Panel for Gomikin.
 * Consolidates all model inspection, component listings, shell modes,
 * kinematics, and waste workflows into a single professional engineering console.
 *
 * @param {THREE.Group} envelope
 * @param {InspectionController} inspectionCtrl
 * @param {WorkflowController} workflowCtrl
 * @param {THREE.PerspectiveCamera} camera
 * @param {OrbitControls} controls
 */
export function initUnifiedInspectionUI(envelope, inspectionCtrl, workflowCtrl, camera, controls) {
  // 1. Remove any legacy or scattered floating elements
  const oldDock = document.getElementById('presentation-dock');
  if (oldDock) oldDock.remove();
  const oldEnvPanel = document.getElementById('envelope-ui-panel');
  if (oldEnvPanel) oldEnvPanel.remove();
  const legacyUI = document.getElementById('gomikin-ui');
  if (legacyUI) legacyUI.style.display = 'none';
  const legacyToggleBtn = document.getElementById('ui-toggle-btn');
  if (legacyToggleBtn) legacyToggleBtn.style.display = 'none';

  // 2. Inject CSS Styles
  const style = document.createElement('style');
  style.id = 'unified-inspection-styles';
  style.textContent = `
    #gomikin-right-panel {
      position: absolute;
      top: 15px;
      right: 15px;
      width: 375px;
      max-width: calc(100vw - 30px);
      max-height: calc(100vh - 30px);
      background: rgba(10, 15, 24, 0.94);
      border: 1px solid rgba(0, 255, 204, 0.4);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), inset 0 0 20px rgba(0, 255, 204, 0.05);
      backdrop-filter: blur(12px);
      border-radius: 10px;
      color: #e2e8f0;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      padding: 16px 18px;
      box-sizing: border-box;
      overflow-y: auto;
      overflow-x: hidden;
      z-index: 1000;
      font-size: 12px;
      user-select: none;
    }
    #gomikin-right-panel::-webkit-scrollbar { width: 5px; }
    #gomikin-right-panel::-webkit-scrollbar-thumb { background: rgba(0, 255, 204, 0.35); border-radius: 3px; }

    /* Header */
    .insp-header {
      border-bottom: 1px solid rgba(0, 255, 204, 0.25);
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .insp-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .insp-main-title {
      font-size: 14px;
      font-weight: 700;
      color: #00ffcc;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin: 0;
    }
    .insp-badge {
      font-size: 9px;
      background: rgba(0, 255, 204, 0.15);
      border: 1px solid rgba(0, 255, 204, 0.35);
      color: #00ffcc;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    /* Tabs */
    .insp-tab-bar {
      display: flex;
      gap: 6px;
      background: rgba(15, 23, 42, 0.8);
      padding: 3px;
      border-radius: 7px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .insp-tab-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 6px 4px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s ease;
    }
    .insp-tab-btn:hover {
      color: #fff;
      background: rgba(51, 65, 85, 0.6);
    }
    .insp-tab-btn.active {
      background: rgba(0, 255, 204, 0.18);
      color: #00ffcc;
      box-shadow: 0 0 10px rgba(0, 255, 204, 0.2);
    }

    /* Tab Content Bodies */
    .insp-view-body {
      display: none;
    }
    .insp-view-body.active {
      display: block;
    }

    /* Sections */
    .insp-section {
      margin-bottom: 16px;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 12px;
    }
    .insp-section-title {
      font-size: 11px;
      font-weight: 700;
      color: #7dd3fc;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Module Selector Grid */
    .insp-module-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .insp-mod-btn {
      background: rgba(20, 30, 48, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 8px 6px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .insp-mod-btn:hover {
      background: rgba(51, 65, 85, 0.9);
      color: #fff;
      border-color: rgba(0, 255, 204, 0.4);
    }
    .insp-mod-btn.active {
      background: rgba(0, 255, 204, 0.18);
      border-color: #00ffcc;
      color: #00ffcc;
      box-shadow: 0 0 10px rgba(0, 255, 204, 0.25);
    }

    /* Component List Container */
    .insp-comp-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 240px;
      overflow-y: auto;
      padding-right: 4px;
      margin-top: 8px;
    }
    .insp-comp-list::-webkit-scrollbar { width: 4px; }
    .insp-comp-list::-webkit-scrollbar-thumb { background: rgba(0, 255, 204, 0.3); border-radius: 2px; }

    .insp-comp-item {
      background: rgba(20, 30, 48, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-left: 3px solid #00ffcc;
      padding: 8px 10px;
      border-radius: 5px;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .insp-comp-item:hover {
      background: rgba(30, 45, 70, 0.9);
      border-color: rgba(0, 255, 204, 0.5);
      border-left-width: 4px;
      transform: translateX(2px);
    }
    .insp-comp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 3px;
    }
    .insp-comp-name {
      font-weight: 700;
      color: #f8fafc;
      font-size: 11px;
    }
    .insp-comp-elevation {
      font-family: monospace;
      font-size: 9.5px;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid rgba(56, 189, 248, 0.25);
    }
    .insp-comp-role {
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.4;
    }

    /* Generic Buttons & Grids */
    .insp-btn-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 5px;
    }
    .insp-btn {
      background: rgba(20, 30, 48, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      padding: 6px 4px;
      border-radius: 5px;
      font-size: 10.5px;
      font-weight: 500;
      text-align: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .insp-btn:hover {
      background: rgba(51, 65, 85, 0.9);
      color: #fff;
    }
    .insp-btn.active {
      background: rgba(0, 255, 204, 0.2);
      border-color: #00ffcc;
      color: #00ffcc;
    }

    /* Slider Container */
    .insp-slider-container {
      margin-bottom: 10px;
    }
    .insp-slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      font-size: 11px;
    }
    .insp-slider-val {
      font-family: monospace;
      font-weight: 700;
      color: #00ffcc;
      background: #090e15;
      padding: 1px 6px;
      border-radius: 3px;
      border: 1px solid rgba(0, 255, 204, 0.3);
    }
    .insp-range-slider {
      width: 100%;
      height: 5px;
      -webkit-appearance: none;
      appearance: none;
      background: #090e15;
      border-radius: 3px;
      outline: none;
      border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
    }
    .insp-range-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #00ffcc;
      cursor: pointer;
      box-shadow: 0 0 8px rgba(0, 255, 204, 0.8);
      border: 2px solid #090e15;
    }

    /* Workflows Styles */
    .insp-wf-selector {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }
    .insp-wf-btn {
      padding: 10px 12px;
      border-radius: 6px;
      background: rgba(20, 30, 48, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      cursor: pointer;
      font-size: 11px;
      font-weight: 700;
      text-align: left;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s ease;
    }
    .insp-wf-btn:hover {
      background: rgba(51, 65, 85, 0.9);
      color: #fff;
    }
    .insp-wf-btn.active.organic {
      background: rgba(34, 197, 94, 0.18);
      border-color: #22c55e;
      color: #4ade80;
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.25);
    }
    .insp-wf-btn.active.inorganic {
      background: rgba(6, 182, 212, 0.18);
      border-color: #06b6d4;
      color: #38bdf8;
      box-shadow: 0 0 12px rgba(6, 182, 212, 0.25);
    }
    .insp-wf-btn.active.leftover {
      background: rgba(245, 158, 11, 0.18);
      border-color: #f59e0b;
      color: #fbbf24;
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.25);
    }
    .insp-wf-info {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(0, 255, 204, 0.25);
      border-left: 3px solid #00ffcc;
      border-radius: 6px;
      padding: 10px 12px;
      margin-top: 10px;
    }
  `;
  document.head.appendChild(style);

  // 3. Build Panel HTML
  const panel = document.createElement('div');
  panel.id = 'gomikin-right-panel';

  panel.innerHTML = `
    <div class="insp-header">
      <div class="insp-title-row">
        <h2 class="insp-main-title">GOMIKIN INSPECTION</h2>
        <span class="insp-badge">OBJECTIVE 1 FINAL</span>
      </div>
      <div class="insp-tab-bar">
        <button class="insp-tab-btn active" id="tab-btn-modules">🔍 Modules & Parts</button>
        <button class="insp-tab-btn" id="tab-btn-workflows">⚙️ Waste Workflows</button>
        <button class="insp-tab-btn" id="tab-btn-specs">📐 Specs & Datums</button>
      </div>
    </div>

    <!-- TAB 1: MODULE INSPECTION -->
    <div class="insp-view-body active" id="view-modules">
      <!-- View Modes -->
      <div class="insp-section">
        <div class="insp-section-title"><span>👁️</span> Model Appearance & Labels</div>
        <div class="insp-btn-grid" style="margin-bottom:8px;">
          <button class="insp-btn active" id="btn-shell-translucent">Translucent</button>
          <button class="insp-btn" id="btn-shell-solid">Solid Shell</button>
          <button class="insp-btn" id="btn-shell-wire">Wireframe</button>
          <button class="insp-btn" id="btn-shell-hidden">Hide Shell</button>
        </div>
        <button class="insp-btn active" id="btn-toggle-labels" style="width:100%; border-color:#00ffcc; color:#00ffcc; padding:7px 0;">
          🏷️ 3D CALLOUT LABELS: ON
        </button>
      </div>

      <!-- Module Selection -->
      <div class="insp-section">
        <div class="insp-section-title"><span>📂</span> Select Section to Inspect</div>
        <div class="insp-module-grid">
          ${GOMIKIN_MODULES.map((mod, idx) => `
            <button class="insp-mod-btn ${idx === 0 ? 'active' : ''}" data-mod-id="${mod.id}" title="${mod.name}">
              <span>${mod.icon}</span>
              <span style="overflow:hidden; text-overflow:ellipsis;">${mod.name.replace(/\s*\(.*\)/, '')}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Components In Selected Module -->
      <div class="insp-section">
        <div class="insp-section-title" style="justify-content:space-between;">
          <span id="lbl-selected-mod-title"><span>📦</span> Components in Module</span>
          <span id="lbl-comp-count" style="font-size:10px; color:#38bdf8; font-family:monospace;">9 PARTS</span>
        </div>
        <div id="lbl-selected-mod-desc" style="font-size:10.5px; color:#94a3b8; margin-bottom:8px; line-height:1.4;">
          Complete assembled Gomikin architecture displaying all structural, segregation, and processing modules.
        </div>
        <div class="insp-comp-list" id="comp-list-container">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- Drawer & Door Kinematic Controls -->
      <div class="insp-section">
        <div class="insp-section-title"><span>🕹️</span> Mechanism Kinematics (Test)</div>
        
        <!-- Door Slider -->
        <div class="insp-slider-container">
          <div class="insp-slider-header">
            <span style="color:#fbbf24; font-weight:600;">Leftover Food Access Door:</span>
            <span class="insp-slider-val" id="val-door-angle">0°</span>
          </div>
          <input type="range" min="0" max="90" value="0" class="insp-range-slider" id="slider-door-angle">
          <div style="display:flex; gap:4px; margin-top:4px;">
            <button class="insp-btn" style="flex:1;" data-act-door="0">0° Closed</button>
            <button class="insp-btn" style="flex:1;" data-act-door="55">55° Ramp</button>
            <button class="insp-btn" style="flex:1;" data-act-door="90">90° Max</button>
          </div>
        </div>

        <!-- Decomp Drawer Slider -->
        <div class="insp-slider-container">
          <div class="insp-slider-header">
            <span style="color:#f59e0b; font-weight:600;">Decomposition Drawer (-X):</span>
            <span class="insp-slider-val" id="val-decomp-ext">0 mm</span>
          </div>
          <input type="range" min="0" max="300" step="5" value="0" class="insp-range-slider" id="slider-decomp-ext">
          <div style="display:flex; gap:4px; margin-top:4px;">
            <button class="insp-btn" style="flex:1;" data-act-decomp="0">0 mm</button>
            <button class="insp-btn" style="flex:1;" data-act-decomp="150">150 mm</button>
            <button class="insp-btn" style="flex:1;" data-act-decomp="300">300 mm</button>
          </div>
        </div>

        <!-- Inorganic Drawer Slider -->
        <div class="insp-slider-container">
          <div class="insp-slider-header">
            <span style="color:#38bdf8; font-weight:600;">Inorganic Drawer (+X):</span>
            <span class="insp-slider-val" id="val-inorg-ext">0 mm</span>
          </div>
          <input type="range" min="0" max="300" step="5" value="0" class="insp-range-slider" id="slider-inorg-ext">
          <div style="display:flex; gap:4px; margin-top:4px;">
            <button class="insp-btn" style="flex:1;" data-act-inorg="0">0 mm</button>
            <button class="insp-btn" style="flex:1;" data-act-inorg="150">150 mm</button>
            <button class="insp-btn" style="flex:1;" data-act-inorg="300">300 mm</button>
          </div>
        </div>

        <!-- Leftover Drawer Slider -->
        <div class="insp-slider-container" style="margin-bottom:0;">
          <div class="insp-slider-header">
            <span style="color:#fbbf24; font-weight:600;">Leftover Food Drawer (+Z):</span>
            <span class="insp-slider-val" id="val-food-ext">0 mm</span>
          </div>
          <input type="range" min="0" max="300" step="5" value="0" class="insp-range-slider" id="slider-food-ext">
          <div style="display:flex; gap:4px; margin-top:4px;">
            <button class="insp-btn" style="flex:1;" data-act-food="0">0 mm</button>
            <button class="insp-btn" style="flex:1;" data-act-food="150">150 mm</button>
            <button class="insp-btn" style="flex:1;" data-act-food="300">300 mm</button>
          </div>
        </div>
      </div>

      <!-- Camera Presets -->
      <div class="insp-section">
        <div class="insp-section-title"><span>🎥</span> Camera Presets</div>
        <div class="insp-btn-grid">
          <button class="insp-btn" id="cam-preset-iso">Isometric</button>
          <button class="insp-btn" id="cam-preset-top">Top View</button>
          <button class="insp-btn" id="cam-preset-front">Front (+Z)</button>
          <button class="insp-btn" id="cam-preset-side">Side (-X)</button>
        </div>
      </div>
    </div>

    <!-- TAB 2: WASTE WORKFLOWS -->
    <div class="insp-view-body" id="view-workflows">
      <div class="insp-section">
        <div class="insp-section-title"><span>🔄</span> Select Pathway</div>
        <div class="insp-wf-selector">
          <button class="insp-wf-btn organic active" id="btn-wf-org" data-mode="${WORKFLOW_MODES.ORGANIC}">
            <span>🌿 ORGANIC WASTE</span>
            <span style="font-size:9px; color:#86efac;">Cutting → Storage → Decomp</span>
          </button>
          <button class="insp-wf-btn inorganic" id="btn-wf-inorg" data-mode="${WORKFLOW_MODES.INORGANIC}">
            <span>📦 INORGANIC WASTE</span>
            <span style="font-size:9px; color:#7dd3fc;">Edge-AI → 90° Shaft → Drawer</span>
          </button>
          <button class="insp-wf-btn leftover" id="btn-wf-leftover" data-mode="${WORKFLOW_MODES.LEFTOVER_FOOD}">
            <span>🍲 LEFTOVER FOOD</span>
            <span style="font-size:9px; color:#fde68a;">55° Ramp Door → Sump → Drawer</span>
          </button>
        </div>

        <div style="display:flex; gap:6px; margin-bottom:12px;">
          <button class="insp-btn active" id="btn-wf-play" style="flex:2; padding:8px 0; font-weight:700;">
            <span id="wf-play-icon">▶</span> <span id="wf-play-label">Play Pathway</span>
          </button>
          <button class="insp-btn" id="btn-wf-reset" style="flex:1; padding:8px 0;">
            ↺ Reset
          </button>
        </div>

        <div class="insp-slider-container">
          <div class="insp-slider-header">
            <span style="color:#94a3b8;">Workflow Progress:</span>
            <span class="insp-slider-val" id="wf-progress-val">0%</span>
          </div>
          <input type="range" min="0" max="100" value="0" class="insp-range-slider" id="wf-progress-slider">
        </div>

        <div class="insp-wf-info">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:#00ffcc; font-weight:700; font-size:11px;" id="wf-step-title">1. Waste Enters Funnel</span>
            <span style="font-size:9.5px; color:#64748b; font-family:monospace;" id="wf-step-counter">STEP 1/9</span>
          </div>
          <div style="color:#cbd5e1; font-size:10.5px; line-height:1.4;" id="wf-step-desc">
            Organic waste is introduced into the top receiving funnel.
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: SPECS & DATUMS -->
    <div class="insp-view-body" id="view-specs">
      <!-- Validation -->
      <div class="insp-section">
        <div class="insp-section-title"><span>📐</span> Vertical Stack Validation</div>
        <div style="background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.35); color:#4ade80; padding:8px; border-radius:5px; font-family:monospace; font-size:11px;">
          ✓ STACK RELATIONSHIP VALID<br>
          95 + 825 + 100 = 1020 mm
        </div>
      </div>

      <!-- Sector Breakdown -->
      <div class="insp-section">
        <div class="insp-section-title"><span>🍰</span> Sector Architecture</div>
        <div style="display:flex; flex-direction:column; gap:4px; font-family:monospace; font-size:10.5px;">
          <div style="display:flex; justify-content:space-between;"><span style="color:#00ffcc;">• Organic Sector:</span><span>180° (Half)</span></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:#38bdf8;">• Inorganic Sector:</span><span>90° (Quadrant)</span></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:#fbbf24;">• Leftover Food:</span><span>90° (Quadrant)</span></div>
          <div style="display:flex; justify-content:space-between; border-top:1px dashed rgba(255,255,255,0.1); padding-top:4px;"><span style="color:#7dd3fc;">• Total Geometry:</span><span style="color:#4ade80;">360° (VALID ✓)</span></div>
        </div>
      </div>

      <!-- Derived Planes -->
      <div class="insp-section">
        <div class="insp-section-title"><span>📏</span> Vertical Reference Planes</div>
        <div style="display:flex; flex-direction:column; gap:4px; font-family:monospace; font-size:10.5px;">
          <div style="display:flex; justify-content:space-between;"><span style="color:#38bdf8;">• Top Datum:</span><span>Y = 1020 mm</span></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:#f59e0b;">• Base Datum:</span><span>Y = 935 mm</span></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:#00ffcc;">• Input/Middle:</span><span>Y = 925 mm</span></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:#cbd5e1;">• Storage Bottom:</span><span>Y = 620 mm</span></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:#c084fc;">• Output Datum:</span><span>Y = 370 mm</span></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:#ffaa00;">• Middle/Plinth:</span><span>Y = 100 mm</span></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:#7da5b5;">• Base Floor:</span><span>Y = 0 mm</span></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // ==========================================
  // TAB NAVIGATION
  // ==========================================
  const tabModules = panel.querySelector('#tab-btn-modules');
  const tabWorkflows = panel.querySelector('#tab-btn-workflows');
  const tabSpecs = panel.querySelector('#tab-btn-specs');
  const viewModules = panel.querySelector('#view-modules');
  const viewWorkflows = panel.querySelector('#view-workflows');
  const viewSpecs = panel.querySelector('#view-specs');

  function setTab(tabName) {
    tabModules.classList.toggle('active', tabName === 'modules');
    tabWorkflows.classList.toggle('active', tabName === 'workflows');
    tabSpecs.classList.toggle('active', tabName === 'specs');

    viewModules.classList.toggle('active', tabName === 'modules');
    viewWorkflows.classList.toggle('active', tabName === 'workflows');
    viewSpecs.classList.toggle('active', tabName === 'specs');

    if (tabName === 'modules') {
      workflowCtrl.reset();
    } else if (tabName === 'workflows') {
      inspectionCtrl.selectModule('all');
      if (!workflowCtrl.activeMode) {
        workflowCtrl.setMode(WORKFLOW_MODES.ORGANIC);
      }
    }
  }

  tabModules.onclick = () => setTab('modules');
  tabWorkflows.onclick = () => setTab('workflows');
  tabSpecs.onclick = () => setTab('specs');

  // ==========================================
  // VIEW & SHELL MODES
  // ==========================================
  const btnTranslucent = panel.querySelector('#btn-shell-translucent');
  const btnSolid = panel.querySelector('#btn-shell-solid');
  const btnWire = panel.querySelector('#btn-shell-wire');
  const btnHidden = panel.querySelector('#btn-shell-hidden');
  const shellBtns = [btnTranslucent, btnSolid, btnWire, btnHidden];

  function setShellMode(mode) {
    shellBtns.forEach(b => b.classList.remove('active'));
    if (mode === 'translucent') {
      btnTranslucent.classList.add('active');
      envelope.setShellTranslucent();
    } else if (mode === 'solid') {
      btnSolid.classList.add('active');
      envelope.setShellSolid();
    } else if (mode === 'wireframe') {
      btnWire.classList.add('active');
      envelope.setShellWireframe();
    } else if (mode === 'hidden') {
      btnHidden.classList.add('active');
      envelope.setShellHidden();
    }
  }

  btnTranslucent.onclick = () => setShellMode('translucent');
  btnSolid.onclick = () => setShellMode('solid');
  btnWire.onclick = () => setShellMode('wireframe');
  btnHidden.onclick = () => setShellMode('hidden');

  // 3D Callout Labels Toggle
  const btnToggleLabels = panel.querySelector('#btn-toggle-labels');
  let labelsActive = true;
  btnToggleLabels.onclick = () => {
    labelsActive = !labelsActive;
    envelope.setLabelsVisible(labelsActive);
    btnToggleLabels.classList.toggle('active', labelsActive);
    btnToggleLabels.innerHTML = labelsActive ? '🏷️ 3D CALLOUT LABELS: ON' : '🏷️ 3D CALLOUT LABELS: OFF';
    btnToggleLabels.style.borderColor = labelsActive ? '#00ffcc' : '#64748b';
    btnToggleLabels.style.color = labelsActive ? '#00ffcc' : '#94a3b8';
  };

  // ==========================================
  // MODULE SELECTION & COMPONENT LIST
  // ==========================================
  const modBtns = panel.querySelectorAll('.insp-mod-btn');
  const lblModTitle = panel.querySelector('#lbl-selected-mod-title');
  const lblCompCount = panel.querySelector('#lbl-comp-count');
  const lblModDesc = panel.querySelector('#lbl-selected-mod-desc');
  const compListContainer = panel.querySelector('#comp-list-container');

  function renderComponentsList(mod) {
    lblModTitle.innerHTML = `<span>${mod.icon}</span> ${mod.name}`;
    lblCompCount.textContent = `${mod.components.length} PARTS`;
    lblModDesc.textContent = `${mod.description} [${mod.elevation} • ${mod.sector}]`;

    compListContainer.innerHTML = mod.components.map(comp => `
      <div class="insp-comp-item" data-comp-node="${comp.node || ''}" title="Click to highlight component">
        <div class="insp-comp-header">
          <span class="insp-comp-name">${comp.name}</span>
          <span class="insp-comp-elevation">${comp.elevation}</span>
        </div>
        <div class="insp-comp-role">${comp.role}</div>
      </div>
    `).join('');

    // Attach click-to-highlight on individual components
    compListContainer.querySelectorAll('.insp-comp-item').forEach(item => {
      item.onclick = () => {
        const nodeName = item.dataset.compNode;
        if (nodeName) {
          inspectionCtrl.highlightComponent(nodeName);
          item.style.borderLeftColor = '#38bdf8';
          setTimeout(() => { item.style.borderLeftColor = '#00ffcc'; }, 1000);
        }
      };
    });
  }

  modBtns.forEach(btn => {
    btn.onclick = () => {
      modBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const modId = btn.dataset.modId;
      inspectionCtrl.selectModule(modId);
    };
  });

  inspectionCtrl.onUpdate((mod) => {
    renderComponentsList(mod);
    modBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.modId === mod.id);
    });
  });

  // Initial render of default module (Full Apparatus)
  renderComponentsList(GOMIKIN_MODULES[0]);

  // ==========================================
  // MECHANISM KINEMATICS SLIDERS
  // ==========================================
  // 1. Leftover Food Door
  const sliderDoor = panel.querySelector('#slider-door-angle');
  const valDoor = panel.querySelector('#val-door-angle');
  function updateDoor(deg) {
    const val = Math.max(0, Math.min(90, Math.round(deg)));
    if (sliderDoor) sliderDoor.value = val;
    if (valDoor) valDoor.textContent = `${val}°`;
    if (envelope.setLeftoverFoodDoorAngle) envelope.setLeftoverFoodDoorAngle(val);
  }
  sliderDoor.oninput = (e) => updateDoor(parseFloat(e.target.value));
  panel.querySelectorAll('button[data-act-door]').forEach(btn => {
    btn.onclick = () => updateDoor(parseFloat(btn.dataset.actDoor));
  });

  // 2. Decomposition Drawer
  const sliderDecomp = panel.querySelector('#slider-decomp-ext');
  const valDecomp = panel.querySelector('#val-decomp-ext');
  function updateDecomp(mm) {
    const val = Math.max(0, Math.min(300, Math.round(mm)));
    if (sliderDecomp) sliderDecomp.value = val;
    if (valDecomp) valDecomp.textContent = `${val} mm`;
    if (envelope.setDecompositionDrawerExtraction) envelope.setDecompositionDrawerExtraction(val);
  }
  sliderDecomp.oninput = (e) => updateDecomp(parseFloat(e.target.value));
  panel.querySelectorAll('button[data-act-decomp]').forEach(btn => {
    btn.onclick = () => updateDecomp(parseFloat(btn.dataset.actDecomp));
  });

  // 3. Inorganic Drawer
  const sliderInorg = panel.querySelector('#slider-inorg-ext');
  const valInorg = panel.querySelector('#val-inorg-ext');
  function updateInorg(mm) {
    const val = Math.max(0, Math.min(300, Math.round(mm)));
    if (sliderInorg) sliderInorg.value = val;
    if (valInorg) valInorg.textContent = `${val} mm`;
    if (envelope.setInorganicDrawerExtraction) envelope.setInorganicDrawerExtraction(val);
  }
  sliderInorg.oninput = (e) => updateInorg(parseFloat(e.target.value));
  panel.querySelectorAll('button[data-act-inorg]').forEach(btn => {
    btn.onclick = () => updateInorg(parseFloat(btn.dataset.actInorg));
  });

  // 4. Leftover Food Drawer
  const sliderFood = panel.querySelector('#slider-food-ext');
  const valFood = panel.querySelector('#val-food-ext');
  function updateFood(mm) {
    const val = Math.max(0, Math.min(300, Math.round(mm)));
    if (sliderFood) sliderFood.value = val;
    if (valFood) valFood.textContent = `${val} mm`;
    if (envelope.setLeftoverFoodDrawerExtraction) envelope.setLeftoverFoodDrawerExtraction(val);
  }
  sliderFood.oninput = (e) => updateFood(parseFloat(e.target.value));
  panel.querySelectorAll('button[data-act-food]').forEach(btn => {
    btn.onclick = () => updateFood(parseFloat(btn.dataset.actFood));
  });

  // ==========================================
  // CAMERA PRESETS
  // ==========================================
  panel.querySelector('#cam-preset-iso').onclick = () => {
    camera.position.set(0.95, 1.15, 1.55);
    controls.target.set(0, 0.51, 0);
    controls.update();
  };
  panel.querySelector('#cam-preset-top').onclick = () => {
    camera.position.set(0.01, 2.2, 0);
    controls.target.set(0, 0.51, 0);
    controls.update();
  };
  panel.querySelector('#cam-preset-front').onclick = () => {
    camera.position.set(0, 0.51, 2.1);
    controls.target.set(0, 0.51, 0);
    controls.update();
  };
  panel.querySelector('#cam-preset-side').onclick = () => {
    camera.position.set(-2.1, 0.51, 0);
    controls.target.set(0, 0.51, 0);
    controls.update();
  };

  // ==========================================
  // WASTE WORKFLOWS TAB INTERACTION
  // ==========================================
  const wfOrgBtn = panel.querySelector('#btn-wf-org');
  const wfInorgBtn = panel.querySelector('#btn-wf-inorg');
  const wfLeftoverBtn = panel.querySelector('#btn-wf-leftover');
  const wfBtns = [wfOrgBtn, wfInorgBtn, wfLeftoverBtn];

  const btnWfPlay = panel.querySelector('#btn-wf-play');
  const wfPlayIcon = panel.querySelector('#wf-play-icon');
  const wfPlayLabel = panel.querySelector('#wf-play-label');
  const btnWfReset = panel.querySelector('#btn-wf-reset');
  const wfSlider = panel.querySelector('#wf-progress-slider');
  const wfVal = panel.querySelector('#wf-progress-val');
  const wfTitle = panel.querySelector('#wf-step-title');
  const wfCounter = panel.querySelector('#wf-step-counter');
  const wfDesc = panel.querySelector('#wf-step-desc');

  wfBtns.forEach(btn => {
    btn.onclick = () => {
      wfBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      workflowCtrl.setMode(mode);

      if (mode === WORKFLOW_MODES.ORGANIC) {
        camera.position.set(-0.75, 0.95, 1.15);
        controls.target.set(-0.10, 0.50, 0);
      } else if (mode === WORKFLOW_MODES.INORGANIC) {
        camera.position.set(0.95, 0.85, -0.65);
        controls.target.set(0.12, 0.50, -0.12);
      } else if (mode === WORKFLOW_MODES.LEFTOVER_FOOD) {
        camera.position.set(0.65, 0.90, 0.95);
        controls.target.set(0.12, 0.55, 0.12);
      }
      controls.update();
    };
  });

  btnWfPlay.onclick = () => {
    if (workflowCtrl.isPlaying) {
      workflowCtrl.pause();
    } else {
      workflowCtrl.play();
    }
  };

  btnWfReset.onclick = () => {
    workflowCtrl.reset();
  };

  wfSlider.oninput = (e) => {
    workflowCtrl.pause();
    const p = parseFloat(e.target.value) / 100.0;
    workflowCtrl.setProgress(p);
  };

  workflowCtrl.onUpdate(({ mode, progress, isPlaying, step }) => {
    wfSlider.value = Math.round(progress * 100);
    wfVal.textContent = `${Math.round(progress * 100)}%`;

    wfPlayIcon.textContent = isPlaying ? '⏸' : '▶';
    wfPlayLabel.textContent = isPlaying ? 'Pause Pathway' : 'Play Pathway';

    if (mode) {
      wfBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    }

    if (step) {
      wfTitle.textContent = step.label;
      wfDesc.textContent = step.desc;
      wfCounter.textContent = `STEP ${step.index + 1}/${step.total}`;
    }
  });

  return { panel, setTab };
}
