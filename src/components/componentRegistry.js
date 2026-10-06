import * as THREE from 'three';

/**
 * Expected 33 Fusion 360 imported component mesh names in the USDZ assembly.
 */
export const EXPECTED_COMPONENT_NAMES = [
  'Funnel',
  'Main_Housing',
  'Rightside_Divider',
  'central_divider',
  'storage_chamber',
  'decompostion_chamber',
  'leachate_section',
  'inorganic_output_chamber',
  'leftover_food_outpu_section',
  'door_mechanism_left',
  'door_mechanism_right',
  'cutting_blades',
  'cutting_motor',
  'cutting_mesh',
  'circular_frame',
  'agitator',
  'exhaust_fan',
  'carbon_filter',
  'servo',
  'battery_pack',
  'control_unit',
  'camera_module',
  'ultrasonic_sensor',
  'temperature_sensor',
  'moisture_sensor',
  'load_cell',
  'motor_support',
  'cutting_motor_support',
  'top_closuer',
  'leftover_food_closur',
  'bottom_of_decomposition_section',
  'rotating_base',
  'display'
];

/**
 * Builds a full breadcrumb path from root to given node.
 * @param {THREE.Object3D} node
 * @returns {string}
 */
function getNodePath(node) {
  const parts = [];
  let curr = node;
  while (curr) {
    parts.unshift(curr.name || `(${curr.type})`);
    curr = curr.parent;
  }
  return parts.join(' > ');
}

/**
 * ComponentRegistry manages all imported components from the Fusion 360 USDZ model.
 * It provides direct, reliable access to individual component meshes and their parent groups
 * for future animation (position, rotation, scale) without modifying initial geometry or assembled state.
 */
export class ComponentRegistry {
  /**
   * @param {THREE.Object3D} rootModel The loaded USDZ model root (Fusion360_USDZ_Model)
   */
  constructor(rootModel) {
    if (!rootModel) {
      throw new Error('ComponentRegistry requires a root THREE.Object3D model.');
    }
    this.model = rootModel;

    // Fast lookup dictionaries
    this.components = {};     // name -> THREE.Mesh
    this.groups = {};         // groupName -> THREE.Object3D
    this.entries = new Map(); // name -> ComponentEntry
    this.names = [];          // list of all component names
    this.groupNames = [];     // list of group names

    this.build();
  }

  /**
   * Traverses the USDZ hierarchy and indexes all 33 component meshes and 34 component groups.
   */
  build() {
    // 1. Index direct children of root as groups (34 groups including Gomikin_3d_model_v1 and MeshPrimDef_*)
    if (this.model.children && this.model.children.length > 0) {
      for (const child of this.model.children) {
        if (child.name) {
          this.groups[child.name] = child;
          if (!this.groupNames.includes(child.name)) {
            this.groupNames.push(child.name);
          }
        }
      }
    }

    // 2. Traverse entire hierarchy to find all genuine Mesh components
    this.model.traverse((node) => {
      if (node.isMesh && node.name) {
        const meshName = node.name;

        // Compute bounding box and spatial extents
        const box = new THREE.Box3().setFromObject(node);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const vertexCount = node.geometry?.attributes?.position?.count || 0;
        const indexCount = node.geometry?.index ? node.geometry.index.count : vertexCount;
        const faceCount = Math.floor(indexCount / 3);

        const materialType = Array.isArray(node.material)
          ? node.material.map(m => m.type || m.constructor.name).join(', ')
          : (node.material?.type || node.material?.constructor.name || 'Unknown');

        const entry = {
          name: meshName,
          mesh: node,
          object: node,
          type: node.type, // 'Mesh'
          parent: node.parent,
          parentGroup: node.parent,
          parentName: node.parent ? node.parent.name : null,
          hierarchyPath: getNodePath(node),
          vertexCount,
          faceCount,
          materialType,
          initialPosition: node.position.clone(),
          initialRotation: node.rotation.clone(),
          initialScale: node.scale.clone(),
          initialParentPosition: node.parent ? node.parent.position.clone() : new THREE.Vector3(),
          initialParentRotation: node.parent ? node.parent.rotation.clone() : new THREE.Euler(),
          boundingBox: box,
          size,
          center
        };

        // Attach metadata directly to node.userData for runtime convenience
        node.userData.isFusionComponent = true;
        node.userData.componentName = meshName;
        node.userData.parentGroupName = node.parent ? node.parent.name : null;
        node.userData.initialPosition = entry.initialPosition.clone();
        node.userData.initialRotation = entry.initialRotation.clone();
        node.userData.initialScale = entry.initialScale.clone();
        node.userData.bboxSize = size.clone();
        node.userData.bboxCenter = center.clone();

        // Register in fast lookup table
        this.components[meshName] = node;
        this.entries.set(meshName, entry);

        if (!this.names.includes(meshName)) {
          this.names.push(meshName);
        }

        // Allow direct property indexing on the registry itself: registry[meshName]
        if (!this[meshName]) {
          this[meshName] = node;
        }
      }
    });
  }

  /**
   * Retrieves the actual THREE.Mesh component by name.
   * @param {string} name
   * @returns {THREE.Mesh|null}
   */
  get(name) {
    return this.components[name] || null;
  }

  /**
   * Alias for get(name).
   * @param {string} name
   * @returns {THREE.Mesh|null}
   */
  getMesh(name) {
    return this.get(name);
  }

  /**
   * Retrieves the full registry entry containing metadata, bounding box, dimensions, and hierarchy path.
   * @param {string} name
   * @returns {Object|null}
   */
  getEntry(name) {
    return this.entries.get(name) || null;
  }

  /**
   * Retrieves the parent group (e.g. MeshPrimDef_*) for a component, or a group by name.
   * @param {string} name
   * @returns {THREE.Object3D|null}
   */
  getGroup(name) {
    if (this.groups[name]) return this.groups[name];
    const entry = this.entries.get(name);
    return entry ? entry.parentGroup : null;
  }

  /**
   * Checks whether a component exists in the registry.
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return Boolean(this.components[name]);
  }

  /**
   * Returns an array of all registered component meshes.
   * @returns {THREE.Mesh[]}
   */
  getAll() {
    return Object.values(this.components);
  }

  /**
   * Returns an array of all registry entries with full metadata.
   * @returns {Object[]}
   */
  getEntries() {
    return Array.from(this.entries.values());
  }

  /**
   * Returns a copy of all component names.
   * @returns {string[]}
   */
  getNames() {
    return [...this.names];
  }

  /**
   * Resets a component back to its initial position, rotation, and scale.
   * @param {string} name
   */
  resetComponent(name) {
    const entry = this.entries.get(name);
    if (!entry) return;
    entry.mesh.position.copy(entry.initialPosition);
    entry.mesh.rotation.copy(entry.initialRotation);
    entry.mesh.scale.copy(entry.initialScale);
  }

  /**
   * Resets all components back to their initial assembled states.
   */
  resetAll() {
    for (const name of this.names) {
      this.resetComponent(name);
    }
  }

  /**
   * Executes the debug reporting utility and logs a complete report to the console.
   * @param {boolean} [logToConsole=true]
   * @returns {Object} Structured report summary
   */
  report(logToConsole = true) {
    return reportComponentRegistry(this, logToConsole);
  }
}

/**
 * Standalone debug utility that formats and reports all imported component names,
 * object types, hierarchy paths, bounding boxes, and verification against expected names.
 *
 * @param {ComponentRegistry} registry
 * @param {boolean} [logToConsole=true]
 * @returns {Object}
 */
export function reportComponentRegistry(registry, logToConsole = true) {
  const entries = registry.getEntries();
  const componentNames = registry.getNames();

  const missingExpected = EXPECTED_COMPONENT_NAMES.filter(name => !registry.has(name));
  const unexpectedNames = componentNames.filter(name => !EXPECTED_COMPONENT_NAMES.includes(name));

  const rows = entries.map((entry, idx) => ({
    '#': idx + 1,
    'Component Name': entry.name,
    'Object Type': entry.type,
    'Target Object': entry.mesh.constructor.name,
    'Parent Group': entry.parentName || 'None',
    'Vertices': entry.vertexCount,
    'Dimensions (X x Y x Z m)': `${entry.size.x.toFixed(3)} x ${entry.size.y.toFixed(3)} x ${entry.size.z.toFixed(3)}`,
    'Center (X, Y, Z)': `(${entry.center.x.toFixed(3)}, ${entry.center.y.toFixed(3)}, ${entry.center.z.toFixed(3)})`
  }));

  const summary = {
    totalComponents: entries.length,
    totalGroups: registry.groupNames.length,
    allExpectedPresent: missingExpected.length === 0,
    missingComponents: missingExpected,
    unexpectedComponents: unexpectedNames,
    components: entries.map(e => ({
      name: e.name,
      objectType: e.type,
      targetClass: e.mesh.constructor.name,
      parentGroup: e.parentName,
      path: e.hierarchyPath,
      vertexCount: e.vertexCount,
      dimensions: { x: e.size.x, y: e.size.y, z: e.size.z },
      center: { x: e.center.x, y: e.center.y, z: e.center.z }
    }))
  };

  if (logToConsole) {
    console.group(`%c📦 Fusion 360 USDZ Component Registry (${entries.length} Meshes, ${registry.groupNames.length} Groups)`, 'color: #00ffcc; font-weight: bold; font-size: 13px;');
    console.log(`%cStatus: ${summary.allExpectedPresent ? '✓ ALL 33 EXPECTED COMPONENTS REGISTERED' : '⚠ MISSING COMPONENTS DETECTED'}`, summary.allExpectedPresent ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;');
    console.log(`Hierarchy: Root "${registry.model.name}" has ${registry.model.children.length} direct groups, containing ${entries.length} individual meshes.`);
    if (console.table) {
      console.table(rows);
    }
    if (missingExpected.length > 0) {
      console.warn('Missing expected components:', missingExpected);
    }
    console.groupEnd();
  }

  return summary;
}

/**
 * Builds and initializes the ComponentRegistry for a loaded USDZ model.
 * Also attaches helper methods to the model and registers them onto the global window object.
 *
 * @param {THREE.Object3D} usdModel The loaded USDZ model
 * @param {boolean} [autoReport=true] Whether to automatically print the debug report
 * @returns {ComponentRegistry}
 */
export function buildComponentRegistry(usdModel, autoReport = true) {
  const registry = new ComponentRegistry(usdModel);

  // Attach direct accessor methods to usdModel
  usdModel.componentRegistry = registry;
  usdModel.getComponent = (name) => registry.get(name);
  usdModel.getComponentEntry = (name) => registry.getEntry(name);

  // Patch getObjectByName so looking up component names returns the genuine Mesh
  // rather than any empty dummy Object3D instances under Gomikin_3d_model_v1
  const originalGetObjectByName = THREE.Object3D.prototype.getObjectByName;
  usdModel.getObjectByName = function(name) {
    if (registry.has(name)) {
      return registry.get(name);
    }
    return originalGetObjectByName.call(this, name);
  };

  // Expose on window for easy developer & script access
  if (typeof window !== 'undefined') {
    window.componentRegistry = registry;
    window.usdComponents = registry.components;
    window.getComponent = (name) => registry.get(name);
    window.reportUSDZComponents = (log = true) => registry.report(log);
  }

  if (autoReport) {
    registry.report(true);
  }

  return registry;
}
