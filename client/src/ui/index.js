import './styles/controls.css';
import { ControlSection } from './components/ControlSection.js';
import { SliderControl } from './components/SliderControl.js';
import { SelectControl } from './components/SelectControl.js';
import { ToggleControl } from './components/ToggleControl.js';
import { sphereSettings, DrawMode } from '../game/world/planetSphereVoronoi.js';
import { generateAndDisplayPlanet, updatePlanetColors } from '../game/game.js';
import { MapRegistry } from '../game/world/registries/MapTypeRegistry.js';

// Stub: you can fill in logic to match current sphereSettings & event hooks
export function renderGlobeControls() {
  const panel = document.getElementById('globe-control-panel');
  if (!panel) return;
  panel.innerHTML = '';
  // Draw Mode
  const drawBtns = Object.entries(DrawMode).map(([key, val]) => {
    const btn = document.createElement('button');
    btn.textContent = key.charAt(0) + key.slice(1).toLowerCase();
    btn.classList.add('control-btn');
    if (sphereSettings.drawMode === val) btn.classList.add('active');
    btn.onclick = () => {
      sphereSettings.drawMode = val;
      generateAndDisplayPlanet();
      renderGlobeControls();
    };
    return btn;
  });
  panel.appendChild(ControlSection({ label: 'Draw Mode', children: drawBtns }));

  // Algorithm selection
  const algoBtns = [1, 2].map(num => {
    const btn = document.createElement('button');
    btn.textContent = `Algorithm ${num}`;
    btn.classList.add('control-btn');
    if (sphereSettings.algorithm === num) btn.classList.add('active');
    btn.onclick = () => {
      sphereSettings.algorithm = num;
      generateAndDisplayPlanet();
      renderGlobeControls();
    };
    return btn;
  });
  panel.appendChild(ControlSection({ label: 'Select points using:', children: algoBtns }));

  // Number of Points slider
  const ptsValue = document.createElement('span');
  ptsValue.textContent = sphereSettings.numPoints;
  const ptsSlider = SliderControl({
    min: 50, max: 12000, step: 50, value: sphereSettings.numPoints,
    onInput: e => ptsValue.textContent = e.target.value,
    onChange: e => {
      sphereSettings.numPoints = +e.target.value;
      generateAndDisplayPlanet();
    }
  });
  panel.appendChild(ControlSection({ label: 'Number of Points', children: [ptsSlider, ptsValue] }));

  // Jitter slider
  const jitterValue = document.createElement('span');
  jitterValue.textContent = sphereSettings.jitter.toFixed(2);
  const jitterSlider = SliderControl({
    min: 0, max: 1, step: 0.01, value: sphereSettings.jitter,
    onInput: e => jitterValue.textContent = parseFloat(e.target.value).toFixed(2),
    onChange: e => { sphereSettings.jitter = +e.target.value; generateAndDisplayPlanet(); }
  });
  panel.appendChild(ControlSection({ label: 'Jitter', children: [jitterSlider, jitterValue] }));

  // Globe size (radius)
  const radValue = document.createElement('span');
  radValue.textContent = sphereSettings.radius || '';
  const radSlider = SliderControl({
    min: 5, max: 50, step: 1, value: sphereSettings.radius,
    onInput: e => radValue.textContent = e.target.value,
    onChange: e => { sphereSettings.radius = +e.target.value; generateAndDisplayPlanet(); }
  });
  panel.appendChild(ControlSection({ label: 'Globe Size', children: [radSlider, radValue] }));

  // Map Type select
  const mapOptions = Object.entries(MapRegistry).map(([key, {description}]) => ({ value: key, label: key }));
  const mapSelect = SelectControl({
    options: mapOptions, value: sphereSettings.mapType,
    onChange: e => { sphereSettings.mapType = e.target.value; generateAndDisplayPlanet(); }
  });
  panel.appendChild(ControlSection({ label: 'Map Type', children: mapSelect }));

  // Show outlines toggle
  const outlineToggle = ToggleControl({
    id: 'outline-toggle', checked: sphereSettings.outlineVisible,
    labelText: 'Show Outlines',
    onChange: e => { sphereSettings.outlineVisible = e.target.checked; updatePlanetColors(); }
  });
  panel.appendChild(ControlSection({ label: '', children: outlineToggle }));

  // Number of plates slider
  const platesValue = document.createElement('span');
  platesValue.textContent = sphereSettings.numPlates;
  const platesSlider = SliderControl({
    min: 4, max: 64, step: 1, value: sphereSettings.numPlates,
    onInput: e => platesValue.textContent = e.target.value,
    onChange: e => { sphereSettings.numPlates = +e.target.value; generateAndDisplayPlanet(); }
  });
  panel.appendChild(ControlSection({ label: 'Number of Plates', children: [platesSlider, platesValue] }));

  // Elevation bias slider
  const elevValue = document.createElement('span');
  elevValue.textContent = sphereSettings.elevationBias.toFixed(2);
  const elevSlider = SliderControl({
    min: -0.5, max: 0.5, step: 0.01, value: sphereSettings.elevationBias,
    onInput: e => elevValue.textContent = parseFloat(e.target.value).toFixed(2),
    onChange: e => { sphereSettings.elevationBias = +e.target.value; updatePlanetColors(); }
  });
  panel.appendChild(ControlSection({ label: 'Elevation Bias', children: [elevSlider, elevValue] }));

  // View selector
  const viewOptions = [
    { value: 'terrain', label: 'Terrain' },
    { value: 'plates', label: 'Tectonic Plates' },
    { value: 'elevation', label: 'Elevation' },
    { value: 'moisture', label: 'Moisture' }
  ];
  const viewSelect = SelectControl({
    options: viewOptions, value: sphereSettings.viewMode,
    onChange: e => { sphereSettings.viewMode = e.target.value; updatePlanetColors(); }
  });
  panel.appendChild(ControlSection({ label: 'View', children: viewSelect }));
} 