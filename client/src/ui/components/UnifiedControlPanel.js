import './UnifiedControlPanel.css';
import { ControlSection } from './ControlSection.js';
import { SliderControl } from './SliderControl.js';
import { SelectControl } from './SelectControl.js';
import { ToggleControl } from './ToggleControl.js';
import { sphereSettings, DrawMode } from '../../game/world/planetSphereVoronoi.js';
import { requestPlanetRegeneration, triggerPlanetColorUpdate } from '../../game/game.js';
import { MapRegistry } from '../../game/world/registries/MapTypeRegistry.js';
import * as Const from '../../config/gameConstants.js';
import RandomService from '../../game/core/RandomService.js';
import * as THREE from 'three';
import { getCamera, getControls, getWorldConfig } from '../../game/core/setup.js';
import { getPlanetGroup } from '../../game/planet.js';

function ButtonControl({ id, label, onClick }) {
  const button = document.createElement('button');
  button.id = id;
  button.textContent = label;
  button.classList.add('control-btn');
  button.onclick = onClick;
  return { getControl: () => button };
}
function TextInputControl({ id, label, value }) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('text-input-control');
  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.textContent = label;
  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;
  input.value = value;
  wrapper.appendChild(labelEl);
  wrapper.appendChild(input);
  return {
    getControl: () => wrapper,
    getValue: () => input.value,
    setValue: (val) => input.value = val
  };
}

export class UnifiedControlPanel {
  constructor() {
    this.element = document.createElement('div');
    this.initialize();
  }

  initialize() {
    // Create main panel
    this.element.id = 'unified-control-panel';
    this.element.style.position = 'absolute';
    this.element.style.bottom = '1rem';
    this.element.style.left = '1rem';
    this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    this.element.style.padding = '1rem';
    this.element.style.borderRadius = '5px';
    this.element.style.border = '2px solid #f0a500';
    this.element.style.width = '400px';
    this.element.style.color = '#e6e6e6';
    this.element.style.zIndex = '2000';

    // Tab bar
    const tabBar = document.createElement('div');
    tabBar.style.display = 'flex';
    tabBar.style.marginBottom = '0.5rem';
    tabBar.style.gap = '0.5rem';

    const tabNames = [
      { key: 'globe', label: 'Globe' },
      { key: 'camera', label: 'Camera' },
      { key: 'tile-debug', label: 'Tile (debug)' },
      { key: 'camera-debug', label: 'Camera (debug)' },
      { key: 'globe-debug', label: 'Globe (debug)' },
    ];

    let activeTab = 'globe';
    const tabContents = {};

    // --- Globe Tab Content and related functions ---
    const globeContent = document.createElement('div');

    function populateGlobeControls(container) {
      // Clear existing content from container before populating
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      // Draw Mode
      const drawBtns = Object.entries(DrawMode).map(([key, val]) => {
        const btn = document.createElement('button');
        btn.textContent = key.charAt(0) + key.slice(1).toLowerCase();
        btn.classList.add('control-btn');
        if (sphereSettings.drawMode === val) btn.classList.add('active');
        btn.onclick = () => {
          sphereSettings.drawMode = val;
          requestPlanetRegeneration();
        };
        return btn;
      });
      container.appendChild(ControlSection({ label: 'Draw Mode', children: drawBtns }));
      // Algorithm selection
      const algoBtns = [1, 2].map(num => {
        const btn = document.createElement('button');
        btn.textContent = `Algorithm ${num}`;
        btn.classList.add('control-btn');
        if (sphereSettings.algorithm === num) btn.classList.add('active');
        btn.onclick = () => {
          sphereSettings.algorithm = num;
          requestPlanetRegeneration();
        };
        return btn;
      });
      container.appendChild(ControlSection({ label: 'Select points using:', children: algoBtns }));
      // Number of Points slider
      const ptsValue = document.createElement('span');
      ptsValue.textContent = sphereSettings.numPoints;
      const ptsSlider = SliderControl({
        min: Const.MIN_NUMBER_OF_GLOBE_TILES, 
        max: Const.MAX_NUMBER_OF_GLOBE_TILES, 
        step: Const.STEP_NUMBER_OF_GLOBE_TILES, 
        value: sphereSettings.numPoints,
        onInput: e => ptsValue.textContent = e.target.value,
        onChange: e => {
          sphereSettings.numPoints = +e.target.value;
          requestPlanetRegeneration();
        }
      });
      container.appendChild(ControlSection({ label: 'Number of Points', children: [ptsSlider, ptsValue] }));
      // Jitter slider
      const jitterValue = document.createElement('span');
      jitterValue.textContent = sphereSettings.jitter.toFixed(2);
      const jitterSlider = SliderControl({
        min: Const.MIN_JITTER, 
        max: Const.MAX_JITTER, 
        step: Const.STEP_JITTER, 
        value: sphereSettings.jitter,
        onInput: e => jitterValue.textContent = parseFloat(e.target.value).toFixed(2),
        onChange: e => { sphereSettings.jitter = +e.target.value; requestPlanetRegeneration(); }
      });
      container.appendChild(ControlSection({ label: 'Jitter', children: [jitterSlider, jitterValue] }));
      // Map Type select
      const mapOptions = Object.entries(MapRegistry).map(([key, {description}]) => ({ value: key, label: key }));
      const mapSelect = SelectControl({
        options: mapOptions, value: sphereSettings.mapType,
        onChange: e => { sphereSettings.mapType = e.target.value; requestPlanetRegeneration(); }
      });
      container.appendChild(ControlSection({ label: 'Map Type', children: mapSelect }));
      // Show outlines toggle
      const outlineToggle = ToggleControl({
        id: 'outline-toggle', checked: sphereSettings.outlineVisible,
        labelText: 'Show Outlines',
        onChange: e => { sphereSettings.outlineVisible = e.target.checked; triggerPlanetColorUpdate(); }
      });
      container.appendChild(ControlSection({ label: '', children: outlineToggle }));
      // Number of plates slider
      const platesValue = document.createElement('span');
      platesValue.textContent = sphereSettings.numPlates;
      const platesSlider = SliderControl({
        min: Const.MIN_TECHTONIC_PLATES, 
        max: Const.MAX_TECHTONIC_PLATES, 
        step: Const.STEP_TECHTONIC_PLATES, 
        value: sphereSettings.numPlates,
        onInput: e => platesValue.textContent = e.target.value,
        onChange: e => { sphereSettings.numPlates = +e.target.value; requestPlanetRegeneration(); }
      });
      container.appendChild(ControlSection({ label: 'Number of Plates', children: [platesSlider, platesValue] }));
      // Elevation bias slider
      const elevValue = document.createElement('span');
      elevValue.textContent = sphereSettings.elevationBias.toFixed(2);
      const elevSlider = SliderControl({
        min: Const.MIN_ELEVATION_BIAS, 
        max: Const.MAX_ELEVATION_BIAS, 
        step: Const.STEP_ELEVATION_BIAS, 
        value: sphereSettings.elevationBias,
        onInput: e => elevValue.textContent = parseFloat(e.target.value).toFixed(2),
        onChange: e => { sphereSettings.elevationBias = +e.target.value; triggerPlanetColorUpdate(); }
      });
      container.appendChild(ControlSection({ label: 'Elevation Bias', children: [elevSlider, elevValue] }));
      // World Seed Section
      let seedInputField = TextInputControl({
        id: 'map-seed-input',
        label: 'Map Seed:',
        value: sphereSettings.currentSeed !== undefined ? sphereSettings.currentSeed : (RandomService.getCurrentSeed() || '')
      });
      const regenerateButton = ButtonControl({
        id: 'regenerate-world-button',
        label: 'Regenerate World',
        onClick: () => {
          let seedValue = seedInputField.getValue();
          let seed = parseInt(seedValue, 10);
          if (isNaN(seed)) {
            seed = undefined;
          }
          sphereSettings.currentSeed = seed;
          requestPlanetRegeneration(seed);
          seedInputField.setValue(RandomService.getCurrentSeed() || '');
          sphereSettings.currentSeed = RandomService.getCurrentSeed();
          triggerPlanetColorUpdate();
        }
      });
      container.appendChild(ControlSection({ label: 'World Seed', children: [seedInputField.getControl(), regenerateButton.getControl()] }));
      // View selector
      const viewOptions = [
        { value: 'terrain', label: 'Terrain' },
        { value: 'plates', label: 'Tectonic Plates' },
        { value: 'elevation', label: 'Elevation' },
        { value: 'moisture', label: 'Moisture' },
        { value: 'temperature', label: 'Temperature' }
      ];
      const viewSelect = SelectControl({
        options: viewOptions, value: sphereSettings.viewMode,
        onChange: e => { sphereSettings.viewMode = e.target.value; triggerPlanetColorUpdate(); }
      });
      container.appendChild(ControlSection({ label: 'View', children: viewSelect }));
    }

    // Now, do the initial population for globeContent
    populateGlobeControls(globeContent);
    tabContents['globe'] = globeContent;
    
    // --- Camera Tab Content ---
    const cameraContent = document.createElement('div');
    cameraContent.className = 'unified-tab-content';
    cameraContent.style.display = 'none';

    // Helper to get the camera rig using setup.js getters
    function getCameraRig() {
      const cam = getCamera();
      if (!cam) return null;
      return cam.parent && cam.parent.type === 'Object3D' ? cam.parent : cam;
    }

    // Only render controls if camera and rig are available
    let cameraRig = getCameraRig();
    let camera = getCamera();
    if (!camera || !cameraRig || !cameraRig.position) {
      cameraContent.textContent = 'Camera not initialized yet.';
    } else {
      // Get dynamic ranges from controls and world config (with fallbacks)
      const worldRadius = getWorldConfig().radius || 6400;
      const controls = getControls();
      const minDistance = controls && controls.minDistance !== undefined ? controls.minDistance : worldRadius;
      const maxDistance = controls && controls.maxDistance !== undefined ? controls.maxDistance : worldRadius * 5;
      function createSliderRow(labelText, slider, valueDisplay) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '4px';
        const label = document.createElement('div');
        label.textContent = labelText;
        label.className = 'control-text-label';
        label.style.width = '90px';
        row.appendChild(label);
        row.appendChild(slider);
        if (valueDisplay) {
          valueDisplay.className = 'control-value-display';
          valueDisplay.style.marginLeft = '5px';
          row.appendChild(valueDisplay);
        }
        return row;
      }
      // Target X
      const targetXDisplay = document.createElement('span');
      const targetXSlider = SliderControl({
        id: 'camera-target-x-slider',
        min: (-worldRadius).toFixed(2),
        max: worldRadius.toFixed(2),
        step: (worldRadius/100).toFixed(2),
        value: '0',
        onInput: (e) => {
          targetXDisplay.textContent = e.target.value;
          applyCameraPanelControls();
        }
      });
      targetXDisplay.textContent = '0';
      // Target Y
      const targetYDisplay = document.createElement('span');
      const targetYSlider = SliderControl({
        id: 'camera-target-y-slider',
        min: (-worldRadius).toFixed(2),
        max: worldRadius.toFixed(2),
        step: (worldRadius/100).toFixed(2),
        value: '0',
        onInput: (e) => {
          targetYDisplay.textContent = e.target.value;
          applyCameraPanelControls();
        }
      });
      targetYDisplay.textContent = '0';
      // Target Z
      const targetZDisplay = document.createElement('span');
      const targetZSlider = SliderControl({
        id: 'camera-target-z-slider',
        min: (-worldRadius).toFixed(2),
        max: worldRadius.toFixed(2),
        step: (worldRadius/100).toFixed(2),
        value: '0',
        onInput: (e) => {
          targetZDisplay.textContent = e.target.value;
          applyCameraPanelControls();
        }
      });
      targetZDisplay.textContent = '0';
      // Zoom Distance
      const zoomDisplay = document.createElement('span');
      const initialZoom = cameraRig.position && cameraRig.position.length ? cameraRig.position.length() : worldRadius * 2.5;
      const zoomSlider = SliderControl({
        id: 'camera-zoom-distance-slider',
        min: minDistance.toString(),
        max: maxDistance.toString(),
        step: ((maxDistance - minDistance)/100).toFixed(2),
        value: initialZoom.toString(),
        onInput: (e) => {
          zoomDisplay.textContent = e.target.value;
          applyCameraPanelControls();
        }
      });
      zoomDisplay.textContent = initialZoom.toString();
      // Yaw
      const yawDisplay = document.createElement('span');
      const yawSlider = SliderControl({
        id: 'camera-yaw-slider',
        min: (-Math.PI).toFixed(4),
        max: Math.PI.toFixed(4),
        step: (Math.PI/180).toFixed(4),
        value: camera && camera.rotation ? camera.rotation.y.toString() : '0',
        onInput: (e) => {
          yawDisplay.textContent = parseFloat(e.target.value).toFixed(2);
          applyCameraPanelControls();
        }
      });
      yawDisplay.textContent = camera && camera.rotation ? parseFloat(camera.rotation.y).toFixed(2) : '0.00';
      // Roll
      const rollDisplay = document.createElement('span');
      const rollSlider = SliderControl({
        id: 'camera-roll-slider',
        min: (-Math.PI).toFixed(4),
        max: Math.PI.toFixed(4),
        step: (Math.PI/180).toFixed(4),
        value: camera && camera.rotation ? camera.rotation.z.toString() : '0',
        onInput: (e) => {
          rollDisplay.textContent = parseFloat(e.target.value).toFixed(2);
          applyCameraPanelControls();
        }
      });
      rollDisplay.textContent = camera && camera.rotation ? parseFloat(camera.rotation.z).toFixed(2) : '0.00';
      // Function to apply all slider values to CameraRig and Camera
      function applyCameraPanelControls() {
        cameraRig = getCameraRig();
        camera = getCamera();
        const controls = getControls();
        const targetVec = new THREE.Vector3(
          parseFloat(targetXSlider.value),
          parseFloat(targetYSlider.value),
          parseFloat(targetZSlider.value)
        );
        const zoomDist = parseFloat(zoomSlider.value);
        const dir = new THREE.Vector3();
        if (camera && camera.getWorldDirection) {
          camera.getWorldDirection(dir).negate();
        } else {
          dir.set(0, 0, -1);
        }
        if (cameraRig && cameraRig.position && cameraRig.lookAt) {
          cameraRig.position.copy(targetVec.clone().add(dir.multiplyScalar(zoomDist)));
          cameraRig.lookAt(targetVec);
        }
        if (camera && camera.rotation) {
          camera.rotation.set(
            0, // Pitch (X) is always 0
            parseFloat(yawSlider.value),
            parseFloat(rollSlider.value)
          );
        }
        if (controls && controls.target) {
          controls.target.copy(targetVec);
          if (controls.update) controls.update();
        }
      }
      cameraContent.appendChild(createSliderRow('Target X:', targetXSlider, targetXDisplay));
      cameraContent.appendChild(createSliderRow('Target Y:', targetYSlider, targetYDisplay));
      cameraContent.appendChild(createSliderRow('Target Z:', targetZSlider, targetZDisplay));
      cameraContent.appendChild(createSliderRow('Zoom Dist:', zoomSlider, zoomDisplay));
      cameraContent.appendChild(createSliderRow('Yaw (rad):', yawSlider, yawDisplay));
      cameraContent.appendChild(createSliderRow('Roll (rad):', rollSlider, rollDisplay));
    }
    tabContents['camera'] = cameraContent;

    // --- Tile Debug Tab Content ---
    const tileDebugContent = document.createElement('div');
    tileDebugContent.className = 'unified-tab-content';
    tileDebugContent.style.display = 'none';
    // This will be updated by updateTileDebugInfo
    tileDebugContent.innerHTML = 'Tile debug info will appear here.';
    // Expose a global update function for tile info
    window.updateTileDebugInfo = (htmlContent) => {
      tileDebugContent.innerHTML = htmlContent;
    };
    tabContents['tile-debug'] = tileDebugContent;

    // --- Camera Debug Tab Content ---
    const cameraDebugContent = document.createElement('div');
    cameraDebugContent.className = 'unified-tab-content';
    cameraDebugContent.style.display = 'none';
    // Camera debug sliders and info
    function renderCameraDebug() {
      cameraDebugContent.innerHTML = '';
      const camera = getCamera();
      const controls = getControls();
      if (!camera || !controls) {
        cameraDebugContent.textContent = 'Camera or controls not initialized.';
        return;
      }
      // Info
      const infoDiv = document.createElement('div');
      infoDiv.style.fontSize = '12px';
      infoDiv.style.marginBottom = '8px';
      const pos = camera.position;
      const target = controls.target;
      infoDiv.innerHTML =
        `--- Camera Info ---<br>
        Pos: ${pos.x.toFixed(2)} km, ${pos.y.toFixed(2)} km, ${pos.z.toFixed(2)} km<br>
        Target: ${target.x.toFixed(2)} km, ${target.y.toFixed(2)} km, ${target.z.toFixed(2)} km<br>
        Dist: ${camera.position.distanceTo(target).toFixed(2)} km<br>
        FOV: ${camera.fov}°<br>`;
      cameraDebugContent.appendChild(infoDiv);
      // Sliders (reuse Camera tab logic)
      // ... could add more debug-specific sliders/info here ...
    }
    renderCameraDebug();
    // Optionally, update on camera/controls change
    window.updateCameraDebugInfo = renderCameraDebug;
    tabContents['camera-debug'] = cameraDebugContent;

    // --- Globe Debug Tab Content ---
    const globeDebugContent = document.createElement('div');
    globeDebugContent.className = 'unified-tab-content';
    globeDebugContent.style.display = 'none';
    // Globe rotation sliders and info
    function renderGlobeDebug() {
      globeDebugContent.innerHTML = '';
      const planetGroup = getPlanetGroup();
      if (!planetGroup) {
        globeDebugContent.textContent = 'Globe not initialized.';
        return;
      }
      // Rotation sliders
      const axes = ['x', 'y', 'z'];
      axes.forEach(axis => {
        const row = document.createElement('div');
        row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.marginBottom = '4px';
        const label = document.createElement('div'); label.textContent = `Rot ${axis.toUpperCase()} (rad):`; label.style.width = '90px';
        const slider = SliderControl({
          id: `globe-rot-${axis}-slider`,
          min: (-Math.PI).toFixed(4),
          max: Math.PI.toFixed(4),
          step: (Math.PI/180).toFixed(4),
          value: planetGroup.rotation[axis].toFixed(4),
          onInput: (e) => {
            planetGroup.rotation[axis] = parseFloat(e.target.value);
            valueDisplay.textContent = parseFloat(e.target.value).toFixed(2);
          }
        });
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = planetGroup.rotation[axis].toFixed(2);
        valueDisplay.style.marginLeft = '5px';
        row.appendChild(label); row.appendChild(slider); row.appendChild(valueDisplay);
        globeDebugContent.appendChild(row);
      });
      // Info
      const infoDiv = document.createElement('div');
      infoDiv.style.fontSize = '12px';
      infoDiv.style.marginTop = '8px';
      infoDiv.innerHTML = `--- Globe Dynamics ---<br>
        CurrentRotationDeg: ${['x','y','z'].map(a=>planetGroup.rotation[a]).map(r=>THREE.MathUtils.radToDeg(r).toFixed(2)).join(', ')}<br>`;
      globeDebugContent.appendChild(infoDiv);
    }
    renderGlobeDebug();
    window.updateGlobeDebugInfo = renderGlobeDebug;
    tabContents['globe-debug'] = globeDebugContent;

    // --- Tab Content Registration ---
    tabContents['globe'] = globeContent;
    tabContents['camera'] = cameraContent;
    tabContents['tile-debug'] = tileDebugContent;
    tabContents['camera-debug'] = cameraDebugContent;
    tabContents['globe-debug'] = globeDebugContent;

    // Create tab buttons and initialize content display
    tabNames.forEach(({ key, label }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.className = 'unified-tab-btn';
      if (key === activeTab) btn.classList.add('active');

      btn.onclick = () => {
        console.log('Tab clicked:', key);
        // Hide all tab contents
        Object.values(tabContents).forEach(el => {
          if (el) el.style.display = 'none';
        });
        // Show the selected tab content
        if (tabContents[key]) {
          tabContents[key].style.display = 'block'; // Or its original display style if needed
        }

        // Update active button
        Array.from(tabBar.children).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = key;
      };
      tabBar.appendChild(btn);
    });

    // Insert tab bar as the first child
    this.element.appendChild(tabBar);

    // Append all tab contents to the panel initially
    // Their display style is already set (e.g., 'none' for inactive, 'block' for initial active)
    Object.values(tabContents).forEach(contentElement => {
      if (contentElement) { // Ensure contentElement is defined
          this.element.appendChild(contentElement);
      }
    });

    // Ensure only the default active tab is visible initially
    Object.entries(tabContents).forEach(([key, el]) => {
      if (el) { // Ensure el is defined
          el.style.display = (key === activeTab) ? 'block' : 'none';
      }
    });
  }
}

// Updated initialization function
export function initControlPanel() {
  const existingPanel = document.getElementById('unified-control-panel');
  if (!existingPanel) {
    const panel = new UnifiedControlPanel();
    document.body.appendChild(panel.element);
    console.log('Control panel initialized');
  }
} 