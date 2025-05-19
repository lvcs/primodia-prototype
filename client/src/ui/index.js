import './styles/controls.css';
import { ControlSection } from './components/ControlSection.js';
import { SliderControl } from './components/SliderControl.js';
import { SelectControl } from './components/SelectControl.js';
import { ToggleControl } from './components/ToggleControl.js';
import { sphereSettings, DrawMode } from '../game/world/planetSphereVoronoi.js';
import { requestPlanetRegeneration, triggerPlanetColorUpdate } from '../game/game.js';
import { MapRegistry } from '../game/world/registries/MapTypeRegistry.js';
import * as Const from '../config/gameConstants.js'; // Import constants
import RandomService from '../game/core/RandomService.js'; // Import RandomService

let seedInputField; // To store the reference to the input field for updates

// Stub: you can fill in logic to match current sphereSettings & event hooks
// export function renderGlobeControls() {
//   const panel = document.getElementById('globe-control-panel');
//   if (!panel) return;
//   panel.innerHTML = '';
//   // Draw Mode
//   const drawBtns = Object.entries(DrawMode).map(([key, val]) => {
//     const btn = document.createElement('button');
//     btn.textContent = key.charAt(0) + key.slice(1).toLowerCase();
//     btn.classList.add('control-btn');
//     if (sphereSettings.drawMode === val) btn.classList.add('active');
//     btn.onclick = () => {
//       sphereSettings.drawMode = val;
//       requestPlanetRegeneration();
//       renderGlobeControls();
//     };
//     return btn;
//   });
//   panel.appendChild(ControlSection({ label: 'Draw Mode', children: drawBtns }));
//
//   // Algorithm selection
//   const algoBtns = [1, 2].map(num => {
//     const btn = document.createElement('button');
//     btn.textContent = `Algorithm ${num}`;
//     btn.classList.add('control-btn');
//     if (sphereSettings.algorithm === num) btn.classList.add('active');
//     btn.onclick = () => {
//       sphereSettings.algorithm = num;
//       requestPlanetRegeneration();
//       renderGlobeControls();
//     };
//     return btn;
//   });
//   panel.appendChild(ControlSection({ label: 'Select points using:', children: algoBtns }));
//
//   // Number of Points slider
//   const ptsValue = document.createElement('span');
//   ptsValue.textContent = sphereSettings.numPoints;
//   const ptsSlider = SliderControl({
//     min: Const.MIN_NUMBER_OF_GLOBE_TILES, 
//     max: Const.MAX_NUMBER_OF_GLOBE_TILES, 
//     step: Const.STEP_NUMBER_OF_GLOBE_TILES, 
//     value: sphereSettings.numPoints,
//     onInput: e => ptsValue.textContent = e.target.value,
//     onChange: e => {
//       sphereSettings.numPoints = +e.target.value;
//       requestPlanetRegeneration();
//     }
//   });
//   panel.appendChild(ControlSection({ label: 'Number of Points', children: [ptsSlider, ptsValue] }));
//
//   // Jitter slider
//   const jitterValue = document.createElement('span');
//   jitterValue.textContent = sphereSettings.jitter.toFixed(2);
//   const jitterSlider = SliderControl({
//     min: Const.MIN_JITTER, 
//     max: Const.MAX_JITTER, 
//     step: Const.STEP_JITTER, 
//     value: sphereSettings.jitter,
//     onInput: e => jitterValue.textContent = parseFloat(e.target.value).toFixed(2),
//     onChange: e => { sphereSettings.jitter = +e.target.value; requestPlanetRegeneration(); }
//   });
//   panel.appendChild(ControlSection({ label: 'Jitter', children: [jitterSlider, jitterValue] }));
//
//   // Map Type select
//   const mapOptions = Object.entries(MapRegistry).map(([key, {description}]) => ({ value: key, label: key }));
//   const mapSelect = SelectControl({
//     options: mapOptions, value: sphereSettings.mapType,
//     onChange: e => { sphereSettings.mapType = e.target.value; requestPlanetRegeneration(); }
//   });
//   panel.appendChild(ControlSection({ label: 'Map Type', children: mapSelect }));
//
//   // Show outlines toggle
//   const outlineToggle = ToggleControl({
//     id: 'outline-toggle', checked: sphereSettings.outlineVisible,
//     labelText: 'Show Outlines',
//     onChange: e => { sphereSettings.outlineVisible = e.target.checked; triggerPlanetColorUpdate(); }
//   });
//   panel.appendChild(ControlSection({ label: '', children: outlineToggle }));
//
//   // Number of plates slider
//   const platesValue = document.createElement('span');
//   platesValue.textContent = sphereSettings.numPlates;
//   const platesSlider = SliderControl({
//     min: Const.MIN_TECHTONIC_PLATES, 
//     max: Const.MAX_TECHTONIC_PLATES, 
//     step: Const.STEP_TECHTONIC_PLATES, 
//     value: sphereSettings.numPlates,
//     onInput: e => platesValue.textContent = e.target.value,
//     onChange: e => { sphereSettings.numPlates = +e.target.value; requestPlanetRegeneration(); }
//   });
//   panel.appendChild(ControlSection({ label: 'Number of Plates', children: [platesSlider, platesValue] }));
//
//   // Elevation bias slider
//   const elevValue = document.createElement('span');
//   elevValue.textContent = sphereSettings.elevationBias.toFixed(2);
//   const elevSlider = SliderControl({
//     min: Const.MIN_ELEVATION_BIAS, 
//     max: Const.MAX_ELEVATION_BIAS, 
//     step: Const.STEP_ELEVATION_BIAS, 
//     value: sphereSettings.elevationBias,
//     onInput: e => elevValue.textContent = parseFloat(e.target.value).toFixed(2),
//     onChange: e => { sphereSettings.elevationBias = +e.target.value; triggerPlanetColorUpdate(); }
//   });
//   panel.appendChild(ControlSection({ label: 'Elevation Bias', children: [elevSlider, elevValue] }));
//
//   // World Seed Section
//   const currentSeed = RandomService.getCurrentSeed() || 'Default';
//   seedInputField = TextInputControl({
//     id: 'map-seed-input',
//     label: 'Map Seed:',
//     value: sphereSettings.currentSeed !== undefined ? sphereSettings.currentSeed : (RandomService.getCurrentSeed() || '')
//   });
//
//   const regenerateButton = ButtonControl({
//     id: 'regenerate-world-button',
//     label: 'Regenerate World',
//     onClick: () => {
//       let seedValue = seedInputField.getValue();
//       let seed = parseInt(seedValue, 10);
//       if (isNaN(seed)) {
//         seed = undefined;
//       }
//       sphereSettings.currentSeed = seed; // Store for UI consistency before regeneration call
//       
//       requestPlanetRegeneration(seed); // Regenerate the world
//       
//       // After regeneration, ensure UI reflects the correct state:
//       // 1. Update the seed input field with the seed that was actually used (RandomService might have picked a default)
//       seedInputField.setValue(RandomService.getCurrentSeed() || '');
//       sphereSettings.currentSeed = RandomService.getCurrentSeed(); // Also update sphereSettings to be sure
//
//       // 2. Re-apply the current view mode to the planet's colors
//       triggerPlanetColorUpdate();
//
//       // 3. Re-render the entire control panel to ensure all controls are consistent
//       // This is a bit of a catch-all for now; more granular updates would be part of a larger UI refactor.
//       renderGlobeControls(); 
//     }
//   });
//   panel.appendChild(ControlSection({ label: 'World Seed', children: [seedInputField.getControl(), regenerateButton.getControl()] }));
//
//   // View selector
//   const viewOptions = [
//     { value: 'terrain', label: 'Terrain' },
//     { value: 'plates', label: 'Tectonic Plates' },
//     { value: 'elevation', label: 'Elevation' },
//     { value: 'moisture', label: 'Moisture' },
//     { value: 'temperature', label: 'Temperature' }
//   ];
//   const viewSelect = SelectControl({
//     options: viewOptions, value: sphereSettings.viewMode,
//     onChange: e => { sphereSettings.viewMode = e.target.value; triggerPlanetColorUpdate(); }
//   });
//   panel.appendChild(ControlSection({ label: 'View', children: viewSelect }));
//
//   // Update seed input with the actually used seed after generation if it changed
//   if (seedInputField && sphereSettings.currentSeed !== undefined) {
//     seedInputField.setValue(sphereSettings.currentSeed);
//   } else if (seedInputField) {
//     seedInputField.setValue(RandomService.getCurrentSeed() || '');
//   }
// }

// Helper function to create simple ButtonControl if not existing
function ButtonControl({ id, label, onClick }) {
  const button = document.createElement('button');
  button.id = id;
  button.textContent = label;
  button.classList.add('control-btn');
  button.onclick = onClick;
  return { getControl: () => button };
}

// Helper function to create simple TextInputControl if not existing
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