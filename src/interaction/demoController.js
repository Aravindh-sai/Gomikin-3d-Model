import * as THREE from 'three';

export class DemoController {
  constructor(gomikinModel, camera, controls) {
    this.model = gomikinModel;
    this.camera = camera;
    this.controls = controls;
    this.components = {};
    
    // Cache references to all important movable/toggleable parts
    this.cacheComponents();

    // Internal state tracking
    this.state = {
      cutawayVisible: false,
      cuttingRunning: false,
      agitatorRunning: false,
      fanRunning: false,
      heatingActive: false,
      trayVisible: false,
      doorsOpening: false,
      doorOpenProgress: 0, // 0 = closed, 1 = open
      trayOpenProgress: 0, // 0 = hidden, 1 = shown
      
      // Sorting demo state
      sortingState: 'IDLE', // IDLE, MOVING_TO_CLASSIFIER, CLASSIFYING, POSITIONING_FLAP, ROUTING, RETURNING_FLAP
      sortingTimer: 0,
      
      // Organic processing demo state
      orgProcState: 'IDLE', // IDLE, FEEDING, CUTTING, SIZING, STORAGE, OPENING_DOORS, DROPPING, DECOMPOSITION, COMPLETE
      orgProcTimer: 0,
      
      // Inorganic demo state
      inorgProcState: 'IDLE', // IDLE, FEEDING, CLASSIFICATION, ROUTING, SEGREGATED_STORAGE, COMPLETE
      inorgProcTimer: 0,
      
      // Leachate demo state
      leachateState: 'IDLE', // IDLE, ORGANIC_DRAINAGE, ORGANIC_PIPE_FLOW, FOOD_DRAINAGE, FOOD_PIPE_FLOW, COLLECTION, COMPLETE
      leachateTimer: 0,
    };

    // Store original states for restoration
    this.originalStates = {
      leftDoorRotationZ: this.components.LeftDoor ? this.components.LeftDoor.rotation.z : 0,
      rightDoorRotationZ: this.components.RightDoor ? this.components.RightDoor.rotation.z : 0,
      trayPositionZ: this.components.LeachateTray ? this.components.LeachateTray.position.z : 0,
      flapRotationZ: this.components.SortingFlap ? this.components.SortingFlap.rotation.z : Math.PI / 4,
    };
    
    // Store materials for the heating element to manipulate emissive property
    this.heatingMaterials = [];
    if (this.components.HeatingElement) {
      this.components.HeatingElement.traverse((child) => {
        if (child.isMesh && child.material) {
          // Clone the material so we don't inadvertently modify a shared material
          child.material = child.material.clone();
          this.heatingMaterials.push(child.material);
        }
      });
    }

    this.demoWasteGroup = null;
    this.sortingWasteType = null;
    this.sortingFlapTarget = null;
    
    this.orgWasteGroup = null;
    this.orgWasteMaterial = null;
    
    this.inorgWasteGroup = null;
    this.liquidParticles = [];
    
    // Camera animation state
    this.cameraTargetPos = new THREE.Vector3();
    this.cameraTargetLook = new THREE.Vector3();
    this.cameraIsAnimating = false;
    
    // Set initial OLED state
    this.clearOLED();
  }

  cacheComponents() {
    // Traverse or directly fetch known names from the model hierarchy
    const namesToCache = [
      'Housing',
      'MainShell',
      'InsulatingLayer',
      'SegregationMechanism',
      'SortingFlap',
      'CuttingMechanism',
      'CuttingBlades',
      'DoorMechanism',
      'LeftDoor',
      'RightDoor',
      'RotatingMechanism',
      'Fan',
      'FanRotor',
      'HeatingElement',
      'LeachateTray',
      'OLEDDisplay',
      'JamDetector',
    ];

    namesToCache.forEach((name) => {
      const obj = this.model.getObjectByName(name);
      if (obj) {
        this.components[name] = obj;
      } else {
        console.warn(`[DemoController] Warning: Could not find component '${name}' in the model hierarchy.`);
      }
    });
  }

  // --- OLED Display Controls ---

  setOLEDText(text) {
    this.state.oledText = text;
    
    if (!this.components.OLEDDisplay) return;

    if (!this.oledCanvas) {
      this.oledCanvas = document.createElement('canvas');
      this.oledCanvas.width = 256;
      this.oledCanvas.height = 128;
      this.oledContext = this.oledCanvas.getContext('2d');
      this.oledTexture = new THREE.CanvasTexture(this.oledCanvas);
      
      const mat = this.components.OLEDDisplay.material.clone();
      mat.map = this.oledTexture;
      mat.emissiveMap = this.oledTexture;
      mat.emissive.setHex(0xffffff);
      mat.emissiveIntensity = 0.8;
      this.components.OLEDDisplay.material = mat;
    }

    const ctx = this.oledContext;
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 256, 128);
    
    if (text) {
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#00ffcc'; // Cyberpunk cyan for high-tech look
      ctx.fillText(text, 128, 64);
    }
    
    this.oledTexture.needsUpdate = true;
  }

  clearOLED() {
    this.setOLEDText('');
  }

  // --- View Controls ---

  showExteriorView() {
    this.setCutaway(false);
    this.cameraTargetPos.set(0, 1.2, 3.8);
    this.cameraTargetLook.set(0, 0.8, 0);
    this.cameraIsAnimating = true;
    console.log('[DemoController] Camera: Exterior View');
  }

  showCutawayView() {
    this.setCutaway(true);
    this.cameraTargetPos.set(0, 1.2, 3.8);
    this.cameraTargetLook.set(0, 0.8, 0);
    this.cameraIsAnimating = true;
    console.log('[DemoController] Camera: Cutaway View');
  }

  showTopProcessingView() {
    this.setCutaway(true);
    this.cameraTargetPos.set(0, 2.5, 1.8);
    this.cameraTargetLook.set(0, 1.2, 0);
    this.cameraIsAnimating = true;
    console.log('[DemoController] Camera: Top Processing View');
  }

  showBottomOutputView() {
    this.setCutaway(true);
    this.cameraTargetPos.set(0, 0.5, 2.5);
    this.cameraTargetLook.set(0, 0.2, 0);
    this.cameraIsAnimating = true;
    console.log('[DemoController] Camera: Bottom Output View');
  }

  toggleCutaway() {
    this.setCutaway(!this.state.cutawayVisible);
  }

  setCutaway(visible) {
    this.state.cutawayVisible = visible;
    if (this.components.MainShell) {
      this.components.MainShell.visible = !visible; // If cutaway is visible, shell is hidden
    }
    if (this.components.InsulatingLayer) {
      this.components.InsulatingLayer.visible = !visible;
    }
    console.log(`[DemoController] Cutaway set to: ${visible}`);
  }

  resetView() {
    this.setCutaway(false);
    console.log('[DemoController] View reset.');
  }

  // --- Animation Controls ---

  startSortingDemo() {
    this.resetSortingDemo();
    
    // Pick waste type (random)
    this.sortingWasteType = Math.random() > 0.5 ? 'ORGANIC' : 'INORGANIC';
    
    // Create lightweight waste object
    this.demoWasteGroup = new THREE.Group();
    let wasteMesh;
    if (this.sortingWasteType === 'ORGANIC') {
      wasteMesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.04), 
        new THREE.MeshStandardMaterial({ color: 0x55aa22, roughness: 0.9 })
      );
    } else {
      wasteMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.06), 
        new THREE.MeshStandardMaterial({ color: 0x2255aa, metalness: 0.5, roughness: 0.3 })
      );
    }
    this.demoWasteGroup.add(wasteMesh);
    
    // Initial position (Top of funnel)
    this.demoWasteGroup.position.set(0, 1.8, 0);
    this.model.add(this.demoWasteGroup);
    
    this.state.sortingState = 'MOVING_TO_CLASSIFIER';
    this.state.sortingTimer = 0;
    
    this.setOLEDText('WASTE DETECTED');
    console.log(`[DemoController] Starting sorting demo. Type: ${this.sortingWasteType}`);
  }

  resetSortingDemo() {
    this.state.sortingState = 'IDLE';
    if (this.demoWasteGroup) {
      this.model.remove(this.demoWasteGroup);
      this.demoWasteGroup = null;
    }
    if (this.components.SortingFlap) {
      this.components.SortingFlap.rotation.z = this.originalStates.flapRotationZ;
    }
    this.clearOLED();
  }

  startOrganicProcessingDemo() {
    this.resetOrganicProcessingDemo();
    this.resetSortingDemo(); // Ensure no overlap
    this.setCutaway(true); // Automatically show internals for this demo
    
    // Create one clearly identifiable organic waste object
    this.orgWasteGroup = new THREE.Group();
    const geo = new THREE.DodecahedronGeometry(0.04);
    this.orgWasteMaterial = new THREE.MeshStandardMaterial({ color: 0x55aa22, roughness: 0.9 });
    const mesh = new THREE.Mesh(geo, this.orgWasteMaterial);
    this.orgWasteGroup.add(mesh);
    
    // Initial position (Funnel classification region)
    this.orgWasteGroup.position.set(0, 1.65, 0);
    this.model.add(this.orgWasteGroup);
    
    this.state.orgProcState = 'FEEDING';
    this.state.orgProcTimer = 0;
    
    this.setOLEDText('ORGANIC DETECTED');
    console.log('[DemoController] Starting organic processing demo.');
  }

  stopOrganicProcessingDemo() {
    this.resetOrganicProcessingDemo();
    console.log('[DemoController] Stopping organic processing demo.');
  }

  resetOrganicProcessingDemo() {
    this.state.orgProcState = 'IDLE';
    this.state.orgProcTimer = 0;
    if (this.orgWasteGroup) {
      this.model.remove(this.orgWasteGroup);
      this.orgWasteGroup = null;
    }
    this.orgWasteMaterial = null;
  }

  // --- Inorganic Output Demo Methods ---

  startInorganicProcessingDemo() {
    this.resetInorganicProcessingDemo();
    this.resetSortingDemo();
    this.setCutaway(true);
    
    this.inorgWasteGroup = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.06), 
      new THREE.MeshStandardMaterial({ color: 0x2255aa, metalness: 0.5, roughness: 0.3 })
    );
    this.inorgWasteGroup.add(mesh);
    this.inorgWasteGroup.position.set(0, 1.8, 0);
    this.model.add(this.inorgWasteGroup);
    
    this.state.inorgProcState = 'FEEDING';
    this.state.inorgProcTimer = 0;
    
    this.setOLEDText('WASTE DETECTED');
    console.log('[DemoController] Starting inorganic processing demo.');
  }

  stopInorganicProcessingDemo() {
    this.resetInorganicProcessingDemo();
    console.log('[DemoController] Stopping inorganic processing demo.');
  }

  resetInorganicProcessingDemo() {
    this.state.inorgProcState = 'IDLE';
    this.state.inorgProcTimer = 0;
    if (this.inorgWasteGroup) {
      this.model.remove(this.inorgWasteGroup);
      this.inorgWasteGroup = null;
    }
    if (this.components.SortingFlap) {
      this.components.SortingFlap.rotation.z = this.originalStates.flapRotationZ;
    }
  }

  // --- Leachate Demo Methods ---

  startLeachateDemo() {
    this.resetLeachateDemo();
    this.setCutaway(true);
    
    this.state.leachateState = 'ORGANIC_DRAINAGE';
    this.state.leachateTimer = 0;
    this.setOLEDText('DRAINING LIQUID');
    console.log('[DemoController] Starting leachate demo.');
  }

  stopLeachateDemo() {
    this.resetLeachateDemo();
    console.log('[DemoController] Stopping leachate demo.');
  }

  resetLeachateDemo() {
    this.state.leachateState = 'IDLE';
    this.state.leachateTimer = 0;
    this.liquidParticles.forEach(p => this.model.remove(p));
    this.liquidParticles = [];
    this.hideLeachateTray();
  }

  startCuttingDemo() {
    this.state.cuttingRunning = true;
    console.log('[DemoController] Starting cutting mechanism...');
  }

  stopCuttingDemo() {
    this.state.cuttingRunning = false;
    console.log('[DemoController] Stopping cutting mechanism.');
  }

  openStorageDoors() {
    this.state.doorsOpening = true;
    console.log('[DemoController] Opening storage doors...');
  }

  closeStorageDoors() {
    this.state.doorsOpening = false;
    console.log('[DemoController] Closing storage doors...');
  }

  startAgitator() {
    this.state.agitatorRunning = true;
    console.log('[DemoController] Starting agitator...');
  }

  stopAgitator() {
    this.state.agitatorRunning = false;
    console.log('[DemoController] Stopping agitator.');
  }

  startFan() {
    this.state.fanRunning = true;
    console.log('[DemoController] Starting exhaust fan...');
  }

  stopFan() {
    this.state.fanRunning = false;
    console.log('[DemoController] Stopping exhaust fan.');
  }

  activateHeating() {
    this.state.heatingActive = true;
    console.log('[DemoController] Activating heating element...');
    this.heatingMaterials.forEach(mat => {
      mat.emissive.setHex(0xff4411);
      mat.emissiveIntensity = 0.8;
    });
  }

  deactivateHeating() {
    this.state.heatingActive = false;
    console.log('[DemoController] Deactivating heating element.');
    this.heatingMaterials.forEach(mat => {
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
    });
  }

  showLeachateTray() {
    this.state.trayVisible = true;
    console.log('[DemoController] Pulling out leachate tray...');
  }

  hideLeachateTray() {
    this.state.trayVisible = false;
    console.log('[DemoController] Hiding leachate tray...');
  }

  resetSimulation() {
    this.resetSortingDemo();
    this.resetOrganicProcessingDemo();
    this.resetInorganicProcessingDemo();
    this.resetLeachateDemo();
    this.stopCuttingDemo();
    this.stopAgitator();
    this.stopFan();
    this.deactivateHeating();
    this.closeStorageDoors();
    this.hideLeachateTray();
    this.setCutaway(false);
    console.log('[DemoController] Simulation reset to default state.');
  }

  // --- Sorting Animation State Machine ---
  
  updateSortingDemo(deltaTime) {
    const fallSpeed = 0.5; // units per second
    
    switch (this.state.sortingState) {
      case 'MOVING_TO_CLASSIFIER':
        this.demoWasteGroup.position.y -= fallSpeed * deltaTime;
        if (this.demoWasteGroup.position.y <= 1.65) {
          this.demoWasteGroup.position.y = 1.65;
          this.state.sortingState = 'CLASSIFYING';
          this.state.sortingTimer = 0;
          this.setOLEDText('SCANNING...');
        }
        break;
        
      case 'CLASSIFYING':
        this.state.sortingTimer += deltaTime;
        if (this.state.sortingTimer > 1.2) {
          this.setOLEDText(this.sortingWasteType);
          this.state.sortingState = 'POSITIONING_FLAP';
          this.state.sortingTimer = 0;
          
          // Organic is Left (-X). The flap leans Right (Math.PI/4) to slide things Left.
          // Inorganic is Right (+X). The flap leans Left (-Math.PI/4) to slide things Right.
          this.sortingFlapTarget = this.sortingWasteType === 'ORGANIC' ? Math.PI / 4 : -Math.PI / 4;
        }
        break;
        
      case 'POSITIONING_FLAP':
        if (this.components.SortingFlap) {
          const currentZ = this.components.SortingFlap.rotation.z;
          this.components.SortingFlap.rotation.z = THREE.MathUtils.lerp(currentZ, this.sortingFlapTarget, 8 * deltaTime);
          
          if (Math.abs(this.components.SortingFlap.rotation.z - this.sortingFlapTarget) < 0.05) {
            this.components.SortingFlap.rotation.z = this.sortingFlapTarget;
            this.state.sortingState = 'ROUTING';
            this.state.sortingTimer = 0;
          }
        } else {
           this.state.sortingState = 'ROUTING';
        }
        break;
        
      case 'ROUTING':
        // Target chambers
        const targetX = this.sortingWasteType === 'ORGANIC' ? -0.16 : 0.16;
        const targetY = 0.9; // Top of the chambers
        
        // Arc interpolation
        this.demoWasteGroup.position.x = THREE.MathUtils.lerp(this.demoWasteGroup.position.x, targetX, 3 * deltaTime);
        this.demoWasteGroup.position.y -= 1.0 * deltaTime; // Fall down continuously
        
        if (this.demoWasteGroup.position.y < targetY) {
          this.state.sortingState = 'RETURNING_FLAP';
          
          // Hide waste upon hitting destination
          this.model.remove(this.demoWasteGroup);
          this.demoWasteGroup = null;
          
          // Briefly display success
          this.setOLEDText('ROUTED');
        }
        break;
        
      case 'RETURNING_FLAP':
        if (this.components.SortingFlap) {
          const defaultZ = this.originalStates.flapRotationZ;
          const currentZ = this.components.SortingFlap.rotation.z;
          this.components.SortingFlap.rotation.z = THREE.MathUtils.lerp(currentZ, defaultZ, 5 * deltaTime);
          
          if (Math.abs(this.components.SortingFlap.rotation.z - defaultZ) < 0.05) {
            this.components.SortingFlap.rotation.z = defaultZ;
            this.state.sortingState = 'IDLE';
            this.clearOLED();
            console.log('[DemoController] Sorting demo complete.');
          }
        } else {
          this.state.sortingState = 'IDLE';
          this.clearOLED();
        }
        break;
    }
  }

  // --- Organic Processing Animation State Machine ---
  
  updateOrganicProcessingDemo(deltaTime) {
    const orgX = -0.16;
    const orgZ = -0.05;
    
    switch (this.state.orgProcState) {
      case 'FEEDING':
        // Move towards cutting zone
        this.orgWasteGroup.position.x = THREE.MathUtils.lerp(this.orgWasteGroup.position.x, orgX, 2 * deltaTime);
        this.orgWasteGroup.position.z = THREE.MathUtils.lerp(this.orgWasteGroup.position.z, orgZ, 2 * deltaTime);
        this.orgWasteGroup.position.y -= 0.5 * deltaTime;
        
        if (this.orgWasteGroup.position.y <= 1.25) {
          this.orgWasteGroup.position.y = 1.25;
          this.state.orgProcState = 'CUTTING';
          this.state.orgProcTimer = 0;
          this.startCuttingDemo();
          this.setOLEDText('SHREDDING');
        }
        break;
        
      case 'CUTTING':
        this.state.orgProcTimer += deltaTime;
        // Jiggle slightly to simulate shredding
        this.orgWasteGroup.rotation.x += 10 * deltaTime;
        this.orgWasteGroup.rotation.z += 10 * deltaTime;
        
        // Scale down gradually
        const scale = Math.max(0.4, 1.0 - (this.state.orgProcTimer / 2.0) * 0.6);
        this.orgWasteGroup.scale.set(scale, scale, scale);
        
        if (this.state.orgProcTimer > 2.0) {
          this.stopCuttingDemo();
          
          // Replace with 3 smaller pieces
          this.orgWasteGroup.clear();
          const smallGeo = new THREE.DodecahedronGeometry(0.015);
          for (let i = 0; i < 3; i++) {
            const smallMesh = new THREE.Mesh(smallGeo, this.orgWasteMaterial);
            smallMesh.position.set((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.04);
            this.orgWasteGroup.add(smallMesh);
          }
          
          this.state.orgProcState = 'SIZING';
        }
        break;
        
      case 'SIZING':
        this.orgWasteGroup.position.y -= 0.4 * deltaTime;
        if (this.orgWasteGroup.position.y <= 1.05) {
          this.state.orgProcState = 'STORAGE';
          this.state.orgProcTimer = 0;
          this.setOLEDText('STORING');
        }
        break;
        
      case 'STORAGE':
        this.orgWasteGroup.position.y -= 0.1 * deltaTime; // settle slowly
        this.state.orgProcTimer += deltaTime;
        if (this.orgWasteGroup.position.y <= 1.0) this.orgWasteGroup.position.y = 1.0;
        
        if (this.state.orgProcTimer > 1.5) {
          this.openStorageDoors();
          this.state.orgProcState = 'OPENING_DOORS';
        }
        break;
        
      case 'OPENING_DOORS':
        if (this.state.doorOpenProgress >= 0.99) {
          this.state.orgProcState = 'DROPPING';
        }
        break;
        
      case 'DROPPING':
        this.orgWasteGroup.position.y -= 0.6 * deltaTime;
        if (this.orgWasteGroup.position.y <= 0.75) {
          this.orgWasteGroup.position.y = 0.75;
          this.closeStorageDoors();
          this.startAgitator();
          this.activateHeating();
          this.setOLEDText('DECOMPOSITION');
          this.state.orgProcState = 'DECOMPOSITION';
          this.state.orgProcTimer = 0;
        }
        break;
        
      case 'DECOMPOSITION':
        this.state.orgProcTimer += deltaTime;
        
        // Swirl around in the chamber
        this.orgWasteGroup.rotation.y += 2 * deltaTime;
        
        // Gradually turn brown and shrink
        const progress = Math.min(1.0, this.state.orgProcTimer / 4.0);
        const startColor = new THREE.Color(0x55aa22); // Green
        const endColor = new THREE.Color(0x664422); // Brown
        this.orgWasteMaterial.color.lerpColors(startColor, endColor, progress);
        
        const finalScale = 1.0 - (progress * 0.5);
        this.orgWasteGroup.scale.set(finalScale, finalScale, finalScale);
        
        if (this.state.orgProcTimer > 4.0) {
          this.stopAgitator();
          // Leave heating active to show it's a thermophilic environment
          this.setOLEDText('PROCESS COMPLETE');
          this.state.orgProcState = 'COMPLETE';
          console.log('[DemoController] Organic processing complete.');
        }
        break;
        
      case 'COMPLETE':
        // Idle at end state
        break;
    }
  }

  // --- Inorganic Processing Animation State Machine ---
  
  updateInorganicProcessingDemo(deltaTime) {
    const fallSpeed = 0.5;
    
    switch (this.state.inorgProcState) {
      case 'FEEDING':
        this.inorgWasteGroup.position.y -= fallSpeed * deltaTime;
        if (this.inorgWasteGroup.position.y <= 1.65) {
          this.inorgWasteGroup.position.y = 1.65;
          this.state.inorgProcState = 'CLASSIFICATION';
          this.state.inorgProcTimer = 0;
          this.setOLEDText('SCANNING...');
        }
        break;
        
      case 'CLASSIFICATION':
        this.state.inorgProcTimer += deltaTime;
        if (this.state.inorgProcTimer > 1.2) {
          this.setOLEDText('INORGANIC');
          this.state.inorgProcState = 'ROUTING';
          this.state.inorgProcTimer = 0;
        }
        break;
        
      case 'ROUTING':
        const targetFlap = -Math.PI / 4; // Lean left to route right (+X)
        if (this.components.SortingFlap) {
          const currentZ = this.components.SortingFlap.rotation.z;
          this.components.SortingFlap.rotation.z = THREE.MathUtils.lerp(currentZ, targetFlap, 8 * deltaTime);
        }
        
        // Arc interpolation
        this.inorgWasteGroup.position.x = THREE.MathUtils.lerp(this.inorgWasteGroup.position.x, 0.16, 3 * deltaTime);
        this.inorgWasteGroup.position.y -= 1.0 * deltaTime;
        
        if (this.inorgWasteGroup.position.y < 0.9) {
          this.state.inorgProcState = 'SEGREGATED_STORAGE';
          this.state.inorgProcTimer = 0;
          this.setOLEDText('INORGANIC SORTED');
          
          // Replace single blue box with 3 distinct smaller items dropping into compartments
          this.inorgWasteGroup.clear();
          
          // Plastic (blue box)
          const plastic = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), new THREE.MeshStandardMaterial({ color: 0x2288ff }));
          plastic.position.set(0.04, 0, 0.04);
          // Metal (grey cyl)
          const metal = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.04), new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8 }));
          metal.position.set(-0.04, 0, 0.04);
          metal.rotation.x = Math.PI / 2;
          // Other (dark object)
          const other = new THREE.Mesh(new THREE.DodecahedronGeometry(0.02), new THREE.MeshStandardMaterial({ color: 0x333333 }));
          other.position.set(0, 0, -0.04);
          
          this.inorgWasteGroup.add(plastic, metal, other);
        }
        break;
        
      case 'SEGREGATED_STORAGE':
        this.state.inorgProcTimer += deltaTime;
        
        // Return flap
        if (this.components.SortingFlap) {
          const defaultZ = this.originalStates.flapRotationZ;
          this.components.SortingFlap.rotation.z = THREE.MathUtils.lerp(this.components.SortingFlap.rotation.z, defaultZ, 5 * deltaTime);
        }
        
        // Drop pieces down into SegregatedOutputSection (Y = 0.25)
        this.inorgWasteGroup.position.y -= 0.8 * deltaTime;
        if (this.inorgWasteGroup.position.y <= 0.25) {
          this.inorgWasteGroup.position.y = 0.25;
        }
        
        if (this.state.inorgProcTimer > 2.0 && this.inorgWasteGroup.position.y === 0.25) {
          this.setOLEDText('OUTPUT READY');
          this.state.inorgProcState = 'COMPLETE';
          console.log('[DemoController] Inorganic processing complete.');
        }
        break;
        
      case 'COMPLETE':
        break;
    }
  }

  // --- Leachate Demo Animation State Machine ---
  
  updateLeachateDemo(deltaTime) {
    const pipeTopOrgY = 0.95;
    const pipeTopFoodY = 1.15;
    const pipeBottomY = 0.2;
    const trayY = 0.1;
    
    switch (this.state.leachateState) {
      case 'ORGANIC_DRAINAGE':
        // Spawn particles
        for(let i = 0; i < 5; i++) {
          const drop = new THREE.Mesh(
            new THREE.SphereGeometry(0.008), 
            new THREE.MeshStandardMaterial({ color: 0x77bb22, transparent: true, opacity: 0.7 })
          );
          // Scatter slightly around organic path (Y=1.0)
          drop.position.set(-0.16 + (Math.random()-0.5)*0.1, 1.0 + Math.random()*0.1, -0.05 + (Math.random()-0.5)*0.1);
          this.liquidParticles.push(drop);
          this.model.add(drop);
        }
        this.state.leachateState = 'ORGANIC_PIPE_FLOW';
        break;
        
      case 'ORGANIC_PIPE_FLOW':
        let orgReached = true;
        this.liquidParticles.forEach(p => {
          // Lerp towards pipe top, then fall down
          if (p.position.y > pipeTopOrgY) {
            p.position.x = THREE.MathUtils.lerp(p.position.x, -0.32, 5 * deltaTime);
            p.position.y -= 0.2 * deltaTime;
            orgReached = false;
          } else if (p.position.y > pipeBottomY) {
            p.position.x = -0.32;
            p.position.z = -0.05;
            p.position.y -= 1.0 * deltaTime; // fast fall
            orgReached = false;
          }
        });
        
        if (orgReached) {
          this.state.leachateState = 'FOOD_DRAINAGE';
        }
        break;
        
      case 'FOOD_DRAINAGE':
        // Spawn more particles for food side
        for(let i = 0; i < 4; i++) {
          const drop = new THREE.Mesh(
            new THREE.SphereGeometry(0.008), 
            new THREE.MeshStandardMaterial({ color: 0xaadd22, transparent: true, opacity: 0.7 })
          );
          // Scatter around food chamber
          drop.position.set(0 + (Math.random()-0.5)*0.1, 1.25 + Math.random()*0.1, 0.25 + (Math.random()-0.5)*0.1);
          this.liquidParticles.push(drop);
          this.model.add(drop);
        }
        this.state.leachateState = 'FOOD_PIPE_FLOW';
        break;
        
      case 'FOOD_PIPE_FLOW':
        let foodReached = true;
        this.liquidParticles.forEach(p => {
          if (p.position.x > 0.0) { // Food side drops (positive X mostly)
            if (p.position.y > pipeTopFoodY) {
              p.position.x = THREE.MathUtils.lerp(p.position.x, 0.08, 5 * deltaTime);
              p.position.y -= 0.2 * deltaTime;
              foodReached = false;
            } else if (p.position.y > pipeBottomY) {
              p.position.x = 0.08;
              p.position.z = 0.25;
              p.position.y -= 1.5 * deltaTime;
              foodReached = false;
            }
          }
        });
        
        if (foodReached) {
          this.setOLEDText('LEACHATE COLLECTING');
          this.state.leachateState = 'COLLECTION';
          this.state.leachateTimer = 0;
        }
        break;
        
      case 'COLLECTION':
        let allCollected = true;
        this.liquidParticles.forEach(p => {
          if (p.position.y > trayY) {
            // Flow towards center tray X=0, Z=0.1
            p.position.x = THREE.MathUtils.lerp(p.position.x, (Math.random()-0.5)*0.1, 2 * deltaTime);
            p.position.z = THREE.MathUtils.lerp(p.position.z, 0.1 + (Math.random()-0.5)*0.05, 2 * deltaTime);
            p.position.y -= 0.3 * deltaTime;
            allCollected = false;
          }
        });
        
        if (allCollected) {
          this.state.leachateTimer += deltaTime;
          if (this.state.leachateTimer > 1.0) { // wait a moment before pulling tray
            this.setOLEDText('LEACHATE READY');
            this.showLeachateTray();
            this.state.leachateState = 'COMPLETE';
            console.log('[DemoController] Leachate demo complete.');
          }
        }
        break;
        
      case 'COMPLETE':
        break;
    }
  }

  // --- Main Animation Loop Hook ---
  
  update(deltaTime) {
    // 0. Camera Animation
    if (this.cameraIsAnimating && this.camera && this.controls) {
      this.camera.position.lerp(this.cameraTargetPos, 3 * deltaTime);
      this.controls.target.lerp(this.cameraTargetLook, 3 * deltaTime);
      if (this.camera.position.distanceTo(this.cameraTargetPos) < 0.01) {
        this.cameraIsAnimating = false;
      }
    }
    
    // 1. Sorting Demo State Machine
    if (this.state.sortingState !== 'IDLE') {
      this.updateSortingDemo(deltaTime);
    }
    
    // 1b. Organic Processing Demo State Machine
    if (this.state.orgProcState !== 'IDLE') {
      this.updateOrganicProcessingDemo(deltaTime);
    }
    
    // 1c. Inorganic Processing Demo State Machine
    if (this.state.inorgProcState !== 'IDLE') {
      this.updateInorganicProcessingDemo(deltaTime);
    }
    
    // 1d. Leachate Demo State Machine
    if (this.state.leachateState !== 'IDLE') {
      this.updateLeachateDemo(deltaTime);
    }

    // 2. Cutting Mechanism Rotation
    if (this.state.cuttingRunning && this.components.CuttingBlades) {
      this.components.CuttingBlades.rotation.y += 15.0 * deltaTime; // fast shredding speed
    }

    // 3. Agitator Rotation
    if (this.state.agitatorRunning && this.components.RotatingMechanism) {
      this.components.RotatingMechanism.rotation.y += 2.0 * deltaTime; // slower mixing speed
    }

    // 4. Fan Rotation
    if (this.state.fanRunning && this.components.FanRotor) {
      this.components.FanRotor.rotation.y += 25.0 * deltaTime; // high speed extraction
    }

    // 5. Storage Doors Animation (Lerp)
    const doorSpeed = 3.0 * deltaTime;
    if (this.state.doorsOpening) {
      this.state.doorOpenProgress = Math.min(1.0, this.state.doorOpenProgress + doorSpeed);
    } else {
      this.state.doorOpenProgress = Math.max(0.0, this.state.doorOpenProgress - doorSpeed);
    }

    if (this.components.LeftDoor && this.components.RightDoor) {
      const openAngle = -Math.PI / 2; // hang straight down
      this.components.LeftDoor.rotation.z = THREE.MathUtils.lerp(
        this.originalStates.leftDoorRotationZ, 
        openAngle, 
        this.state.doorOpenProgress
      );
      this.components.RightDoor.rotation.z = THREE.MathUtils.lerp(
        this.originalStates.rightDoorRotationZ, 
        -openAngle, 
        this.state.doorOpenProgress
      );
    }

    // 6. Leachate Tray Animation (Lerp)
    const traySpeed = 2.0 * deltaTime;
    if (this.state.trayVisible) {
      this.state.trayOpenProgress = Math.min(1.0, this.state.trayOpenProgress + traySpeed);
    } else {
      this.state.trayOpenProgress = Math.max(0.0, this.state.trayOpenProgress - traySpeed);
    }

    if (this.components.LeachateTray) {
      const openOffset = 0.3; // slide distance outward along +Z
      this.components.LeachateTray.position.z = THREE.MathUtils.lerp(
        this.originalStates.trayPositionZ, 
        this.originalStates.trayPositionZ + openOffset, 
        this.state.trayOpenProgress
      );
    }
  }
}
