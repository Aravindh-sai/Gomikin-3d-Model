import { GOMIKIN_MODULES, getModuleById } from '../components/moduleRegistry.js';
import { FLOW_MODES } from '../animation/physicalFlowController.js';

/**
 * ModularControlBar
 * Mounts a sleek, modern glassmorphism navigation bar and context-sensitive
 * control cards for Module Views and Physical Waste Flow Simulation.
 */
export function initModularControlBar({
  moduleViewController,
  physicalFlowController,
  dissectionAnimationController
}) {
  if (document.getElementById('gomikin-modular-nav')) {
    document.getElementById('gomikin-modular-nav').remove();
  }

  // 1. Inject Styles
  const styleId = 'gomikin-modular-ui-styles';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    /* Top Floating Glassmorphism Navigation Dock */
    #gomikin-modular-nav {
      position: fixed;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(10, 15, 24, 0.88);
      border: 1px solid rgba(0, 255, 204, 0.28);
      border-radius: 40px;
      padding: 6px 10px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65), 0 0 20px rgba(0, 255, 204, 0.12);
      z-index: 1000;
      user-select: none;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    }

    .nav-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: transparent;
      border: 1px solid transparent;
      color: #94a3b8;
      padding: 8px 16px;
      border-radius: 30px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
    }

    .nav-tab-btn:hover {
      color: #e2e8f0;
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .nav-tab-btn.active {
      color: #050b14;
      background: linear-gradient(135deg, #00ffcc 0%, #00b4d8 100%);
      border-color: #00ffcc;
      box-shadow: 0 0 16px rgba(0, 255, 204, 0.45);
    }

    /* Sub-bar for Module Selector */
    #gomikin-modules-subbar {
      position: fixed;
      top: 74px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(10, 15, 24, 0.82);
      border: 1px solid rgba(0, 255, 204, 0.2);
      border-radius: 30px;
      padding: 5px 8px;
      backdrop-filter: blur(12px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      z-index: 999;
      overflow-x: auto;
      max-width: 90vw;
      transition: all 0.3s ease;
    }

    .mod-pill-btn {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .mod-pill-btn:hover {
      background: rgba(0, 255, 204, 0.12);
      border-color: rgba(0, 255, 204, 0.4);
      color: #00ffcc;
    }

    .mod-pill-btn.active {
      background: rgba(0, 255, 204, 0.22);
      border-color: #00ffcc;
      color: #00ffcc;
      font-weight: 600;
      box-shadow: 0 0 10px rgba(0, 255, 204, 0.3);
    }

    /* Left Module Info & Action Card */
    #gomikin-module-card {
      position: fixed;
      top: 130px;
      left: 24px;
      width: 320px;
      background: rgba(10, 15, 24, 0.92);
      border: 1px solid rgba(0, 255, 204, 0.3);
      border-radius: 14px;
      padding: 18px;
      backdrop-filter: blur(16px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
      z-index: 990;
      color: #f1f5f9;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      transition: all 0.3s ease;
    }

    .mod-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 10px;
    }

    .mod-card-icon {
      font-size: 24px;
      background: rgba(0, 255, 204, 0.15);
      border-radius: 10px;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mod-card-title {
      font-size: 15px;
      font-weight: 700;
      color: #00ffcc;
      line-height: 1.2;
    }

    .mod-card-desc {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 14px;
    }

    .mod-comp-list {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 14px;
      max-height: 140px;
      overflow-y: auto;
    }

    .mod-comp-pill {
      display: inline-block;
      background: rgba(0, 255, 204, 0.1);
      border: 1px solid rgba(0, 255, 204, 0.2);
      color: #e2e8f0;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 4px;
      margin: 2px;
    }

    .mod-card-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .btn-action {
      background: rgba(0, 255, 204, 0.15);
      border: 1px solid rgba(0, 255, 204, 0.4);
      color: #00ffcc;
      padding: 9px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .btn-action:hover {
      background: rgba(0, 255, 204, 0.3);
      box-shadow: 0 0 14px rgba(0, 255, 204, 0.35);
      color: #ffffff;
    }

    .btn-action.secondary {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
    }

    .btn-action.secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #f8fafc;
    }

    /* Bottom Flow Simulation Control Console */
    #gomikin-flow-console {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      width: 620px;
      max-width: 92vw;
      background: rgba(10, 15, 24, 0.94);
      border: 1px solid rgba(0, 255, 204, 0.35);
      border-radius: 16px;
      padding: 16px 20px;
      backdrop-filter: blur(20px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 255, 204, 0.15);
      z-index: 1000;
      color: #f1f5f9;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      user-select: none;
    }

    .flow-mode-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 10px;
    }

    .flow-mode-btn {
      flex: 1;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .flow-mode-btn:hover {
      color: #e2e8f0;
      border-color: rgba(255, 255, 255, 0.2);
    }

    .flow-mode-btn.active.organic {
      background: rgba(34, 197, 94, 0.2);
      border-color: #22c55e;
      color: #4ade80;
    }

    .flow-mode-btn.active.inorganic {
      background: rgba(6, 182, 212, 0.2);
      border-color: #06b6d4;
      color: #38bdf8;
    }

    .flow-mode-btn.active.leftover {
      background: rgba(245, 158, 11, 0.2);
      border-color: #f59e0b;
      color: #fbbf24;
    }

    .flow-step-callout {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(0, 255, 204, 0.2);
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 12px;
    }

    .flow-step-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #00ffcc;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .flow-step-title {
      font-size: 13px;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 2px;
    }

    .flow-step-desc {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.4;
    }

    .flow-controls-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-circle {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00ffcc 0%, #00b4d8 100%);
      border: none;
      color: #050b14;
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 0 14px rgba(0, 255, 204, 0.45);
      transition: transform 0.15s ease;
      flex-shrink: 0;
    }

    .btn-circle:hover {
      transform: scale(1.06);
    }

    .btn-icon-sm {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      font-size: 12px;
    }

    .btn-icon-sm:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    .flow-scrubber {
      flex: 1;
      -webkit-appearance: none;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.15);
      outline: none;
      cursor: pointer;
    }

    .flow-scrubber::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #00ffcc;
      box-shadow: 0 0 10px #00ffcc;
      cursor: pointer;
    }

    .speed-btn {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
    }
  `;

  // 2. Build Top Navigation
  const navEl = document.createElement('div');
  navEl.id = 'gomikin-modular-nav';
  navEl.innerHTML = `
    <button class="nav-tab-btn active" id="tab-full-model">
      <span>🏛️</span> Full Model
    </button>
    <button class="nav-tab-btn" id="tab-module-views">
      <span>📦</span> Modular Views
    </button>
    <button class="nav-tab-btn" id="tab-dissection">
      <span>⚡</span> 33-Part Dissection
    </button>
    <button class="nav-tab-btn" id="tab-flow-sim">
      <span>🔄</span> Simulate Flow
    </button>
  `;
  document.body.appendChild(navEl);

  // 3. Build Module Selector Sub-bar
  const subbarEl = document.createElement('div');
  subbarEl.id = 'gomikin-modules-subbar';
  subbarEl.style.display = 'none';

  let subbarHTML = `
    <button class="mod-pill-btn active" data-mod="all">
      <span>🏛️</span> Complete Assembly
    </button>
  `;

  GOMIKIN_MODULES.forEach(mod => {
    subbarHTML += `
      <button class="mod-pill-btn" data-mod="${mod.id}">
        <span>${mod.icon}</span> ${mod.shortName}
      </button>
    `;
  });
  subbarEl.innerHTML = subbarHTML;
  document.body.appendChild(subbarEl);

  // 4. Build Left Module Info Card
  const cardEl = document.createElement('div');
  cardEl.id = 'gomikin-module-card';
  cardEl.style.display = 'none';
  cardEl.innerHTML = `
    <div class="mod-card-header">
      <div class="mod-card-icon" id="mc-icon">📦</div>
      <div>
        <div class="mod-card-title" id="mc-title">Module Title</div>
        <div style="font-size: 11px; color: #64748b;" id="mc-count">0 components</div>
      </div>
    </div>
    <div class="mod-card-desc" id="mc-desc">Module functional description.</div>
    <div class="mod-comp-list" id="mc-comps"></div>
    <div class="mod-card-actions">
      <button class="btn-action" id="btn-explode-module">
        <span>💥</span> Explode Module
      </button>
      <button class="btn-action secondary" id="btn-toggle-ghost">
        <span>👻</span> Toggle Ghost Housing
      </button>
      <button class="btn-action secondary" id="btn-reset-module">
        <span>↺</span> Back to Full Model
      </button>
    </div>
  `;
  document.body.appendChild(cardEl);

  // 5. Build Flow Simulation Console
  const flowConsole = document.createElement('div');
  flowConsole.id = 'gomikin-flow-console';
  flowConsole.style.display = 'none';
  flowConsole.innerHTML = `
    <div class="flow-mode-tabs">
      <button class="flow-mode-btn active organic" data-flow="ORGANIC">
        <span>🌿</span> Organic Flow
      </button>
      <button class="flow-mode-btn" data-flow="INORGANIC">
        <span>🥫</span> Inorganic Flow
      </button>
      <button class="flow-mode-btn" data-flow="LEFTOVER_FOOD">
        <span>🍲</span> Leftover Food
      </button>
    </div>

    <div class="flow-step-callout">
      <div class="flow-step-badge" id="flow-badge">STEP 1 OF 8</div>
      <div class="flow-step-title" id="flow-title">1. Waste Deposit</div>
      <div class="flow-step-desc" id="flow-desc">Waste is introduced into the receiving funnel.</div>
    </div>

    <div class="flow-controls-row">
      <button class="btn-circle" id="flow-btn-play">▶</button>
      <button class="btn-icon-sm" id="flow-btn-prev" title="Previous Step">⏮</button>
      <input type="range" class="flow-scrubber" id="flow-slider" min="0" max="100" value="0" />
      <button class="btn-icon-sm" id="flow-btn-next" title="Next Step">⏭</button>
      <button class="speed-btn" id="flow-btn-speed">1x</button>
      <button class="btn-icon-sm" id="flow-btn-reset" title="Reset Flow">↺</button>
    </div>
  `;
  document.body.appendChild(flowConsole);

  // --- Active Nav Tab State ---
  let activeTab = 'full'; // 'full' | 'modules' | 'dissection' | 'flow'

  function setTab(tab) {
    activeTab = tab;

    // Update nav tab buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
    if (tab === 'full') document.getElementById('tab-full-model').classList.add('active');
    if (tab === 'modules') document.getElementById('tab-module-views').classList.add('active');
    if (tab === 'dissection') document.getElementById('tab-dissection').classList.add('active');
    if (tab === 'flow') document.getElementById('tab-flow-sim').classList.add('active');

    // Toggle bottom dissection button visibility based on active tab
    const dissectBtn = document.getElementById('btn-dissect-gomikin');
    if (dissectBtn) {
      dissectBtn.style.display = (tab === 'full' || tab === 'dissection') ? 'block' : 'none';
    }

    // Handle view transitions
    if (tab === 'full') {
      subbarEl.style.display = 'none';
      cardEl.style.display = 'none';
      flowConsole.style.display = 'none';
      physicalFlowController.reset();
      moduleViewController.selectModule('all');
      // If full dissection was exploded, reset smoothly
      if (dissectionAnimationController && dissectionAnimationController.state() === 'EXPLODED') {
        dissectionAnimationController.reset(false);
      }
    } else if (tab === 'modules') {
      subbarEl.style.display = 'flex';
      flowConsole.style.display = 'none';
      physicalFlowController.reset();
      if (dissectionAnimationController && dissectionAnimationController.state() === 'EXPLODED') {
        dissectionAnimationController.reset(false);
      }
      if (moduleViewController.activeModuleId === 'all') {
        moduleViewController.selectModule('input');
      } else {
        updateModuleCard(moduleViewController.activeModuleId);
      }
    } else if (tab === 'dissection') {
      subbarEl.style.display = 'none';
      cardEl.style.display = 'none';
      flowConsole.style.display = 'none';
      physicalFlowController.reset();
      moduleViewController.selectModule('all');
      if (dissectionAnimationController) {
        dissectionAnimationController.play(1.0);
      }
    } else if (tab === 'flow') {
      subbarEl.style.display = 'none';
      cardEl.style.display = 'none';
      flowConsole.style.display = 'block';
      // In flow simulation, ghost the outer housing so you can see inside!
      moduleViewController.selectModule('all');
      const housing = moduleViewController.registry.get('Main_Housing');
      if (housing) housing.material = moduleViewController.ghostMaterial;

      moduleViewController.animateCameraTo(
        new THREE.Vector3(-0.75, 1.05, 0.95),
        new THREE.Vector3(-0.06, 0.55, 0)
      );

      physicalFlowController.play();
    }
  }

  function updateModuleCard(moduleId) {
    if (moduleId === 'all') {
      cardEl.style.display = 'none';
      return;
    }

    const mod = getModuleById(moduleId);
    if (!mod) return;

    cardEl.style.display = 'block';
    document.getElementById('mc-icon').textContent = mod.icon;
    document.getElementById('mc-title').textContent = mod.name;
    document.getElementById('mc-count').textContent = `${mod.components.length} components`;
    document.getElementById('mc-desc').textContent = mod.description;

    const listEl = document.getElementById('mc-comps');
    listEl.innerHTML = '';
    mod.components.forEach(c => {
      const pill = document.createElement('span');
      pill.className = 'mod-comp-pill';
      pill.textContent = c.replace(/_/g, ' ');
      listEl.appendChild(pill);
    });

    const explodeBtn = document.getElementById('btn-explode-module');
    if (moduleViewController.isModuleDissected) {
      explodeBtn.innerHTML = `<span>↺</span> Reassemble Module`;
    } else {
      explodeBtn.innerHTML = `<span>💥</span> Explode Module`;
    }
  }

  // Bind Top Nav Tabs
  document.getElementById('tab-full-model').addEventListener('click', () => setTab('full'));
  document.getElementById('tab-module-views').addEventListener('click', () => setTab('modules'));
  document.getElementById('tab-dissection').addEventListener('click', () => setTab('dissection'));
  document.getElementById('tab-flow-sim').addEventListener('click', () => setTab('flow'));

  // Bind Module Subbar Pills
  subbarEl.querySelectorAll('.mod-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modId = btn.getAttribute('data-mod');
      subbarEl.querySelectorAll('.mod-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      moduleViewController.selectModule(modId);
      updateModuleCard(modId);
    });
  });

  // Bind Module Card Actions
  document.getElementById('btn-explode-module').addEventListener('click', () => {
    moduleViewController.toggleModuleDissection();
    const explodeBtn = document.getElementById('btn-explode-module');
    if (moduleViewController.isModuleDissected) {
      explodeBtn.innerHTML = `<span>↺</span> Reassemble Module`;
    } else {
      explodeBtn.innerHTML = `<span>💥</span> Explode Module`;
    }
  });

  document.getElementById('btn-toggle-ghost').addEventListener('click', () => {
    moduleViewController.toggleGhostMode();
  });

  document.getElementById('btn-reset-module').addEventListener('click', () => {
    setTab('full');
  });

  // Bind Flow Mode Tabs
  flowConsole.querySelectorAll('.flow-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-flow');
      flowConsole.querySelectorAll('.flow-mode-btn').forEach(b => {
        b.className = 'flow-mode-btn';
      });
      btn.classList.add('active', mode.toLowerCase().replace('_', ''));
      physicalFlowController.setMode(mode);
      physicalFlowController.play();
    });
  });

  // Bind Flow Playback Controls
  const playBtn = document.getElementById('flow-btn-play');
  playBtn.addEventListener('click', () => {
    physicalFlowController.togglePlay();
  });

  const scrubber = document.getElementById('flow-slider');
  scrubber.addEventListener('input', (e) => {
    physicalFlowController.pause();
    physicalFlowController.setProgress(e.target.value / 100);
  });

  document.getElementById('flow-btn-prev').addEventListener('click', () => {
    physicalFlowController.prevStep();
  });

  document.getElementById('flow-btn-next').addEventListener('click', () => {
    physicalFlowController.nextStep();
  });

  document.getElementById('flow-btn-reset').addEventListener('click', () => {
    physicalFlowController.reset();
  });

  const speedBtn = document.getElementById('flow-btn-speed');
  speedBtn.addEventListener('click', () => {
    if (physicalFlowController.speed === 1.0) {
      physicalFlowController.speed = 2.0;
      speedBtn.textContent = '2x';
    } else {
      physicalFlowController.speed = 1.0;
      speedBtn.textContent = '1x';
    }
  });

  // Subscribe to Flow updates to update UI in real-time
  physicalFlowController.subscribe(({ progress, isPlaying, step }) => {
    playBtn.textContent = isPlaying ? '⏸' : '▶';
    scrubber.value = Math.round(progress * 100);

    if (step && step.count > 0) {
      document.getElementById('flow-badge').textContent = `STEP ${step.index} OF ${step.count}`;
      document.getElementById('flow-title').textContent = step.title;
      document.getElementById('flow-desc').textContent = step.desc;
    }
  });

  // Subscribe to Module updates
  moduleViewController.subscribe(({ activeModuleId }) => {
    subbarEl.querySelectorAll('.mod-pill-btn').forEach(btn => {
      if (btn.getAttribute('data-mod') === activeModuleId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    updateModuleCard(activeModuleId);
  });
}
