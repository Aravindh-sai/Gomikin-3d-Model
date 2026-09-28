import { DISSECTION_STAGES } from '../animation/dissectionController.js';
import { WORKFLOW_MODES } from '../animation/workflowController.js';

/**
 * Initializes the comprehensive Gomikin Objective 1 Presentation UI:
 * - Dissection / Exploded presentation animation controls
 * - Three distinct Waste Workflow animation modes (Organic, Inorganic, Leftover Food)
 * - Seamless toggle with baseline envelope verification controls
 *
 * @param {DissectionController} dissectionCtrl
 * @param {WorkflowController} workflowCtrl
 * @param {THREE.PerspectiveCamera} camera
 * @param {OrbitControls} controls
 */
export function initPresentationUI(dissectionCtrl, workflowCtrl, camera, controls) {
  // Styles
  const style = document.createElement('style');
  style.id = 'presentation-ui-styles';
  style.textContent = `
    #presentation-dock {
      position: absolute;
      bottom: 16px;
      left: 16px;
      width: min(840px, calc(100vw - 380px));
      max-width: 95vw;
      background: rgba(10, 15, 24, 0.94);
      border: 1px solid rgba(0, 255, 204, 0.45);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 255, 204, 0.12);
      backdrop-filter: blur(12px);
      border-radius: 12px;
      color: #e2e8f0;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      padding: 14px 20px;
      box-sizing: border-box;
      z-index: 1000;
      user-select: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @media (max-width: 1100px) {
      #presentation-dock {
        left: 50%;
        transform: translateX(-50%);
        width: 95vw;
      }
    }

    .pres-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 8px;
    }
    .pres-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .pres-main-title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #00ffcc;
      text-transform: uppercase;
      margin: 0;
    }
    .pres-badge {
      font-size: 10px;
      background: rgba(0, 255, 204, 0.15);
      border: 1px solid rgba(0, 255, 204, 0.35);
      color: #00ffcc;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .pres-tab-bar {
      display: flex;
      gap: 8px;
    }
    .pres-tab-btn {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #94a3b8;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pres-tab-btn:hover {
      background: rgba(51, 65, 85, 0.9);
      color: #f8fafc;
      border-color: rgba(0, 255, 204, 0.4);
    }
    .pres-tab-btn.active {
      background: rgba(0, 255, 204, 0.18);
      border-color: #00ffcc;
      color: #00ffcc;
      box-shadow: 0 0 12px rgba(0, 255, 204, 0.25);
    }

    .pres-view-body {
      display: none;
    }
    .pres-view-body.active {
      display: block;
    }

    /* Controls bar */
    .pres-controls-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    .pres-btn-primary {
      background: linear-gradient(135deg, #00ffcc, #0284c7);
      border: none;
      color: #041019;
      font-weight: 700;
      padding: 7px 16px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 255, 204, 0.3);
    }
    .pres-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0, 255, 204, 0.45);
    }
    .pres-btn-secondary {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .pres-btn-secondary:hover {
      background: rgba(51, 65, 85, 0.95);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.3);
    }

    /* Scrubber */
    .pres-scrubber-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .pres-slider {
      flex: 1;
      height: 6px;
      -webkit-appearance: none;
      appearance: none;
      background: rgba(30, 41, 59, 0.9);
      border-radius: 3px;
      outline: none;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .pres-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #00ffcc;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(0, 255, 204, 0.8);
      border: 2px solid #090e15;
    }
    .pres-progress-val {
      font-family: monospace;
      font-size: 12px;
      color: #00ffcc;
      width: 44px;
      text-align: right;
    }

    /* Stage buttons grid */
    .pres-stages-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 6px;
      margin-top: 8px;
    }
    .pres-stage-btn {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      padding: 6px 4px;
      border-radius: 5px;
      font-size: 10px;
      font-weight: 500;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pres-stage-btn:hover {
      background: rgba(30, 41, 59, 0.9);
      color: #f1f5f9;
      border-color: rgba(0, 255, 204, 0.3);
    }
    .pres-stage-btn.active {
      background: rgba(0, 255, 204, 0.14);
      border-color: #00ffcc;
      color: #00ffcc;
      font-weight: 700;
    }

    /* Description banner */
    .pres-info-banner {
      margin-top: 10px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(0, 255, 204, 0.2);
      border-left: 3px solid #00ffcc;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 11px;
      color: #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pres-info-title {
      font-weight: 700;
      color: #00ffcc;
      margin-right: 8px;
    }
    .pres-info-desc {
      color: #94a3b8;
    }

    /* Workflow Mode Selector Buttons */
    .wf-mode-selector {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    .wf-mode-btn {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .wf-mode-btn span.wf-icon {
      font-size: 16px;
    }
    .wf-mode-btn span.wf-subtitle {
      font-size: 9px;
      font-weight: normal;
      color: #64748b;
    }
    .wf-mode-btn:hover {
      background: rgba(30, 41, 59, 0.9);
      color: #fff;
    }
    .wf-mode-btn.active.organic {
      background: rgba(34, 197, 94, 0.15);
      border-color: #22c55e;
      color: #4ade80;
      box-shadow: 0 0 16px rgba(34, 197, 94, 0.25);
    }
    .wf-mode-btn.active.organic span.wf-subtitle {
      color: #86efac;
    }
    .wf-mode-btn.active.inorganic {
      background: rgba(6, 182, 212, 0.15);
      border-color: #06b6d4;
      color: #38bdf8;
      box-shadow: 0 0 16px rgba(6, 182, 212, 0.25);
    }
    .wf-mode-btn.active.inorganic span.wf-subtitle {
      color: #7dd3fc;
    }
    .wf-mode-btn.active.leftover {
      background: rgba(245, 158, 11, 0.15);
      border-color: #f59e0b;
      color: #fbbf24;
      box-shadow: 0 0 16px rgba(245, 158, 11, 0.25);
    }
    .wf-mode-btn.active.leftover span.wf-subtitle {
      color: #fde68a;
    }
  `;
  document.head.appendChild(style);

  // Build Container
  const dock = document.createElement('div');
  dock.id = 'presentation-dock';

  dock.innerHTML = `
    <div class="pres-header-row">
      <div class="pres-title-group">
        <h3 class="pres-main-title">GOMIKIN PRESENTATION</h3>
        <span class="pres-badge">OBJECTIVE 1 FINAL</span>
      </div>
      <div class="pres-tab-bar">
        <button class="pres-tab-btn active" id="tab-btn-dissection">
          <span>🔍</span> Dissection View
        </button>
        <button class="pres-tab-btn" id="tab-btn-workflows">
          <span>⚙️</span> Waste Workflows
        </button>
        <button class="pres-tab-btn active" id="tab-btn-baseline" title="Toggle Master Parameter & Inspection Panel">
          <span>📐</span> Master Controls
        </button>
      </div>
    </div>

    <!-- 1. DISSECTION VIEW BODY -->
    <div class="pres-view-body active" id="view-dissection">
      <div class="pres-controls-bar">
        <button class="pres-btn-primary" id="btn-dissection-play">
          <span id="dissection-play-icon">▶</span>
          <span id="dissection-play-label">Play Dissection</span>
        </button>
        <button class="pres-btn-secondary" id="btn-dissection-reset">
          ↺ Reset Assembled
        </button>
        <div class="pres-scrubber-wrapper">
          <input type="range" min="0" max="100" value="0" class="pres-slider" id="dissection-slider">
          <span class="pres-progress-val" id="dissection-val">0%</span>
        </div>
      </div>

      <div class="pres-stages-grid">
        ${DISSECTION_STAGES.map((st, idx) => `
          <button class="pres-stage-btn ${idx === 0 ? 'active' : ''}" data-idx="${idx}" title="${st.name}">
            ${st.name.replace(/^\d+\.\s*/, '')}
          </button>
        `).join('')}
      </div>

      <div class="pres-info-banner">
        <div>
          <span class="pres-info-title" id="dissection-stage-title">1. Fully Assembled</span>
          <span class="pres-info-desc" id="dissection-stage-desc">Complete assembled Gomikin apparatus in baseline configuration.</span>
        </div>
        <span style="font-size: 10px; color: #64748b; font-family: monospace;">STAGE AUTO-TRACK</span>
      </div>
    </div>

    <!-- 2. WASTE WORKFLOWS VIEW BODY -->
    <div class="pres-view-body" id="view-workflows">
      <div class="wf-mode-selector">
        <button class="wf-mode-btn organic active" id="btn-wf-organic" data-mode="${WORKFLOW_MODES.ORGANIC}">
          <span class="wf-icon">🌿</span>
          <span>ORGANIC WASTE</span>
          <span class="wf-subtitle">Cutting → Storage → Decomp Vessel</span>
        </button>
        <button class="wf-mode-btn inorganic" id="btn-wf-inorganic" data-mode="${WORKFLOW_MODES.INORGANIC}">
          <span class="wf-icon">📦</span>
          <span>INORGANIC WASTE</span>
          <span class="wf-subtitle">Detection → 90° Shaft → Extraction</span>
        </button>
        <button class="wf-mode-btn leftover" id="btn-wf-leftover" data-mode="${WORKFLOW_MODES.LEFTOVER_FOOD}">
          <span class="wf-icon">🍲</span>
          <span>LEFTOVER FOOD</span>
          <span class="wf-subtitle">55° Ramp Door → Drainage → Drawer</span>
        </button>
      </div>

      <div class="pres-controls-bar">
        <button class="pres-btn-primary" id="btn-workflow-play">
          <span id="workflow-play-icon">▶</span>
          <span id="workflow-play-label">Play Pathway</span>
        </button>
        <button class="pres-btn-secondary" id="btn-workflow-reset">
          ↺ Reset Workflow
        </button>
        <div class="pres-scrubber-wrapper">
          <input type="range" min="0" max="100" value="0" class="pres-slider" id="workflow-slider">
          <span class="pres-progress-val" id="workflow-val">0%</span>
        </div>
      </div>

      <div class="pres-info-banner">
        <div>
          <span class="pres-info-title" id="workflow-step-title">1. Waste Enters Funnel</span>
          <span class="pres-info-desc" id="workflow-step-desc">Organic waste is introduced into the top receiving funnel.</span>
        </div>
        <span style="font-size: 10px; color: #64748b; font-family: monospace;" id="workflow-step-counter">STEP 1/9</span>
      </div>
    </div>
  `;

  document.body.appendChild(dock);

  // Tab switching logic
  const tabDissection = dock.querySelector('#tab-btn-dissection');
  const tabWorkflows = dock.querySelector('#tab-btn-workflows');
  const tabBaseline = dock.querySelector('#tab-btn-baseline');
  const viewDissection = dock.querySelector('#view-dissection');
  const viewWorkflows = dock.querySelector('#view-workflows');
  const envelopeUIPanel = document.getElementById('envelope-ui-panel');
  let isSidebarVisible = true;

  function setView(viewName) {
    if (viewName === 'baseline') {
      isSidebarVisible = !isSidebarVisible;
      if (envelopeUIPanel) {
        envelopeUIPanel.style.display = isSidebarVisible ? 'block' : 'none';
      }
      tabBaseline.classList.toggle('active', isSidebarVisible);
      return;
    }

    tabDissection.classList.toggle('active', viewName === 'dissection');
    tabWorkflows.classList.toggle('active', viewName === 'workflows');

    viewDissection.classList.toggle('active', viewName === 'dissection');
    viewWorkflows.classList.toggle('active', viewName === 'workflows');

    // DO NOT force hide envelopeUIPanel! Keep it visible according to user preference
    if (envelopeUIPanel) {
      envelopeUIPanel.style.display = isSidebarVisible ? 'block' : 'none';
    }

    if (viewName === 'dissection') {
      workflowCtrl.reset();
    } else if (viewName === 'workflows') {
      dissectionCtrl.reset();
      if (!workflowCtrl.activeMode) {
        workflowCtrl.setMode(WORKFLOW_MODES.ORGANIC);
      }
    }
  }

  tabDissection.onclick = () => setView('dissection');
  tabWorkflows.onclick = () => setView('workflows');
  tabBaseline.onclick = () => setView('baseline');

  // By default, KEEP ALL PREVIOUS OPTIONS VISIBLE
  if (envelopeUIPanel) {
    envelopeUIPanel.style.display = 'block';
  }
  tabBaseline.classList.add('active');

  // ==========================================
  // DISSECTION UI INTERACTION
  // ==========================================
  const btnDissPlay = dock.querySelector('#btn-dissection-play');
  const dissPlayIcon = dock.querySelector('#dissection-play-icon');
  const dissPlayLabel = dock.querySelector('#dissection-play-label');
  const btnDissReset = dock.querySelector('#btn-dissection-reset');
  const dissSlider = dock.querySelector('#dissection-slider');
  const dissVal = dock.querySelector('#dissection-val');
  const dissStageBtns = dock.querySelectorAll('.pres-stage-btn');
  const dissTitle = dock.querySelector('#dissection-stage-title');
  const dissDesc = dock.querySelector('#dissection-stage-desc');

  btnDissPlay.onclick = () => {
    if (dissectionCtrl.isPlaying) {
      dissectionCtrl.pause();
    } else {
      dissectionCtrl.play();
    }
  };

  btnDissReset.onclick = () => {
    dissectionCtrl.reset();
  };

  dissSlider.oninput = (e) => {
    dissectionCtrl.pause();
    const p = parseFloat(e.target.value) / 100.0;
    dissectionCtrl.setProgress(p);
  };

  dissStageBtns.forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.idx, 10);
      dissectionCtrl.setStage(idx);
    };
  });

  dissectionCtrl.onUpdate(({ progress, isPlaying, stage }) => {
    dissSlider.value = Math.round(progress * 100);
    dissVal.textContent = `${Math.round(progress * 100)}%`;

    dissPlayIcon.textContent = isPlaying ? '⏸' : '▶';
    dissPlayLabel.textContent = isPlaying ? 'Pause Dissection' : 'Play Dissection';

    if (stage) {
      dissTitle.textContent = stage.name;
      dissDesc.textContent = stage.description;
      dissStageBtns.forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.idx, 10) === stage.index);
      });
    }
  });

  // ==========================================
  // WORKFLOW UI INTERACTION
  // ==========================================
  const btnWfPlay = dock.querySelector('#btn-workflow-play');
  const wfPlayIcon = dock.querySelector('#workflow-play-icon');
  const wfPlayLabel = dock.querySelector('#workflow-play-label');
  const btnWfReset = dock.querySelector('#btn-workflow-reset');
  const wfSlider = dock.querySelector('#workflow-slider');
  const wfVal = dock.querySelector('#workflow-val');
  const wfTitle = dock.querySelector('#workflow-step-title');
  const wfDesc = dock.querySelector('#workflow-step-desc');
  const wfCounter = dock.querySelector('#workflow-step-counter');
  const modeBtns = dock.querySelectorAll('.wf-mode-btn');

  modeBtns.forEach(btn => {
    btn.onclick = () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      workflowCtrl.setMode(mode);

      // Smooth camera perspective alignment for each mode
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
      modeBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
      });
    }

    if (step) {
      wfTitle.textContent = step.label;
      wfDesc.textContent = step.desc;
      wfCounter.textContent = `STEP ${step.index + 1}/${step.total}`;
    }
  });

  return { dock, setView };
}
