export function initUI() {
  const uiContainer = document.createElement('div');
  uiContainer.id = 'gomikin-ui';
  document.body.appendChild(uiContainer);

  const style = document.createElement('style');
  style.textContent = `
    #gomikin-ui {
      position: absolute;
      top: 0;
      left: 0;
      width: 320px;
      height: 100vh;
      background: rgba(10, 15, 20, 0.85);
      border-right: 1px solid rgba(0, 255, 204, 0.3);
      color: #e0e0e0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 20px;
      box-sizing: border-box;
      overflow-y: auto;
      z-index: 100;
      backdrop-filter: blur(4px);
    }
    .ui-header {
      margin-bottom: 24px;
      border-bottom: 1px solid rgba(0, 255, 204, 0.3);
      padding-bottom: 12px;
    }
    .ui-title {
      font-size: 24px;
      font-weight: 700;
      color: #00ffcc;
      margin: 0 0 4px 0;
      letter-spacing: 2px;
    }
    .ui-subtitle {
      font-size: 10px;
      color: #88aa99;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .ui-section {
      margin-bottom: 24px;
    }
    .ui-section-title {
      font-size: 12px;
      color: #88aa99;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 10px 0;
    }
    .ui-btn {
      display: block;
      width: 100%;
      background: rgba(20, 30, 40, 0.8);
      border: 1px solid rgba(0, 255, 204, 0.2);
      color: #00ffcc;
      padding: 8px 12px;
      margin-bottom: 6px;
      font-size: 12px;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .ui-btn:hover {
      background: rgba(0, 255, 204, 0.1);
      border-color: rgba(0, 255, 204, 0.5);
    }
    .ui-btn.active {
      background: rgba(0, 255, 204, 0.2);
      border-color: #00ffcc;
      color: #fff;
    }
    
    .status-panel {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(0, 255, 204, 0.2);
      padding: 12px;
      margin-bottom: 20px;
    }
    .status-item {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 6px;
      color: #aaaaaa;
    }
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #444;
      display: inline-block;
      margin-right: 6px;
    }
    .status-indicator.active {
      background: #00ffcc;
      box-shadow: 0 0 5px #00ffcc;
    }
    .oled-display {
      background: #050505;
      border: 1px solid #333;
      padding: 10px;
      text-align: center;
      font-family: monospace;
      color: #00ffcc;
      font-weight: bold;
      font-size: 14px;
      letter-spacing: 1px;
      min-height: 20px;
    }
  `;
  document.head.appendChild(style);

  uiContainer.innerHTML = `
    <div class="ui-header">
      <h1 class="ui-title">GOMIKIN</h1>
      <p class="ui-subtitle">SMART WASTE PROCESSING SYSTEM</p>
    </div>

    <div class="status-panel">
      <div class="ui-section-title" style="margin-bottom: 12px;">SYSTEM STATUS</div>
      <div class="status-item"><span><span class="status-indicator active" id="ind-ready"></span>READY</span></div>
      <div style="height: 8px;"></div>
      <div class="status-item"><span><span class="status-indicator" id="ind-classification"></span>Classification</span></div>
      <div class="status-item"><span><span class="status-indicator" id="ind-cutting"></span>Cutting</span></div>
      <div class="status-item"><span><span class="status-indicator" id="ind-agitation"></span>Agitation</span></div>
      <div class="status-item"><span><span class="status-indicator" id="ind-heating"></span>Heating</span></div>
      <div class="status-item"><span><span class="status-indicator" id="ind-exhaust"></span>Exhaust</span></div>
      <div class="status-item"><span><span class="status-indicator" id="ind-leachate"></span>Leachate</span></div>
    </div>

    <div class="ui-section">
      <div class="ui-section-title">OLED STATUS</div>
      <div class="oled-display" id="oled-text">SYSTEM READY</div>
    </div>

    <div class="ui-section">
      <div class="ui-section-title">CAMERA VIEWS</div>
      <button class="ui-btn" id="btn-cam-exterior">EXTERIOR VIEW</button>
      <button class="ui-btn" id="btn-cam-cutaway">CUTAWAY VIEW</button>
      <button class="ui-btn" id="btn-cam-top">TOP PROCESSING</button>
      <button class="ui-btn" id="btn-cam-bottom">BOTTOM OUTPUT</button>
    </div>

    <div class="ui-section">
      <div class="ui-section-title">SYSTEM VIEW</div>
      <button class="ui-btn" id="btn-reset" style="color: #ffaaaa; border-color: rgba(255, 100, 100, 0.3);">RESET</button>
    </div>

    <div class="ui-section">
      <div class="ui-section-title">PROCESS DEMOS</div>
      <button class="ui-btn" id="btn-organic">▶ ORGANIC PROCESS</button>
      <button class="ui-btn" id="btn-inorganic">▶ INORGANIC SORTING</button>
      <button class="ui-btn" id="btn-leachate">▶ LEACHATE FLOW</button>
    </div>

    <div class="ui-section">
      <div class="ui-section-title">MECHANISMS</div>
      <button class="ui-btn" id="btn-mech-cutting">CUTTING</button>
      <button class="ui-btn" id="btn-mech-agitator">AGITATOR</button>
      <button class="ui-btn" id="btn-mech-fan">FAN</button>
      <button class="ui-btn" id="btn-mech-heating">HEATING</button>
      <button class="ui-btn" id="btn-mech-doors">DOORS</button>
      <button class="ui-btn" id="btn-mech-tray">LEACHATE TRAY</button>
    </div>
  `;

  // Attach event listeners
  const getBtn = (id) => document.getElementById(id);

  getBtn('btn-cam-exterior').onclick = () => {
    if (window.demoController) window.demoController.showExteriorView();
  };
  getBtn('btn-cam-cutaway').onclick = () => {
    if (window.demoController) window.demoController.showCutawayView();
  };
  getBtn('btn-cam-top').onclick = () => {
    if (window.demoController) window.demoController.showTopProcessingView();
  };
  getBtn('btn-cam-bottom').onclick = () => {
    if (window.demoController) window.demoController.showBottomOutputView();
  };
  
  getBtn('btn-reset').onclick = () => {
    if (window.demoController) window.demoController.resetSimulation();
  };

  getBtn('btn-organic').onclick = () => {
    if (window.demoController) window.demoController.startOrganicProcessingDemo();
  };
  getBtn('btn-inorganic').onclick = () => {
    if (window.demoController) window.demoController.startInorganicProcessingDemo();
  };
  getBtn('btn-leachate').onclick = () => {
    if (window.demoController) window.demoController.startLeachateDemo();
  };

  getBtn('btn-mech-cutting').onclick = () => {
    if (!window.demoController) return;
    if (window.demoController.state.cuttingRunning) window.demoController.stopCuttingDemo();
    else window.demoController.startCuttingDemo();
  };
  
  getBtn('btn-mech-agitator').onclick = () => {
    if (!window.demoController) return;
    if (window.demoController.state.agitatorRunning) window.demoController.stopAgitator();
    else window.demoController.startAgitator();
  };

  getBtn('btn-mech-fan').onclick = () => {
    if (!window.demoController) return;
    if (window.demoController.state.fanRunning) window.demoController.stopFan();
    else window.demoController.startFan();
  };

  getBtn('btn-mech-heating').onclick = () => {
    if (!window.demoController) return;
    if (window.demoController.state.heatingActive) window.demoController.deactivateHeating();
    else window.demoController.activateHeating();
  };

  getBtn('btn-mech-doors').onclick = () => {
    if (!window.demoController) return;
    if (window.demoController.state.doorsOpening) window.demoController.closeStorageDoors();
    else window.demoController.openStorageDoors();
  };

  getBtn('btn-mech-tray').onclick = () => {
    if (!window.demoController) return;
    if (window.demoController.state.trayVisible) window.demoController.hideLeachateTray();
    else window.demoController.showLeachateTray();
  };

  // State polling loop
  setInterval(() => {
    if (!window.demoController) return;
    const state = window.demoController.state;
    
    // Update Indicators
    const updateInd = (id, active) => {
      const el = document.getElementById(id);
      if (el) {
        if (active) el.classList.add('active');
        else el.classList.remove('active');
      }
    };

    updateInd('ind-classification', state.sortingState === 'CLASSIFYING' || state.inorgProcState === 'CLASSIFICATION');
    updateInd('ind-cutting', state.cuttingRunning);
    updateInd('ind-agitation', state.agitatorRunning);
    updateInd('ind-heating', state.heatingActive);
    updateInd('ind-exhaust', state.fanRunning);
    updateInd('ind-leachate', state.leachateState !== 'IDLE');

    // Update Buttons Active State
    const updateBtn = (id, active) => {
      const el = document.getElementById(id);
      if (el) {
        if (active) el.classList.add('active');
        else el.classList.remove('active');
      }
    };

    updateBtn('btn-cam-exterior', !state.cutawayVisible && state.cameraTargetPos && state.cameraTargetPos.y === 1.2);
    updateBtn('btn-cam-cutaway', state.cutawayVisible && state.cameraTargetPos && state.cameraTargetPos.y === 1.2);
    updateBtn('btn-cam-top', state.cutawayVisible && state.cameraTargetPos && state.cameraTargetPos.y === 2.5);
    updateBtn('btn-cam-bottom', state.cutawayVisible && state.cameraTargetPos && state.cameraTargetPos.y === 0.5);
    
    updateBtn('btn-mech-cutting', state.cuttingRunning);
    updateBtn('btn-mech-agitator', state.agitatorRunning);
    updateBtn('btn-mech-fan', state.fanRunning);
    updateBtn('btn-mech-heating', state.heatingActive);
    updateBtn('btn-mech-doors', state.doorsOpening);
    updateBtn('btn-mech-tray', state.trayVisible);

    // Update OLED Status
    const oledEl = document.getElementById('oled-text');
    if (oledEl) {
      oledEl.innerText = state.oledText || 'SYSTEM READY';
    }
  }, 100);
}
