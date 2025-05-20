import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../ui/Button';
import { ControlSectionWrapper } from '../ui/ControlSectionWrapper';
import { Slider } from '../ui/Slider';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { Input } from '../ui/Input';
import { useWorldSettingsStore } from '../../stores/worldSettingsStore';

// Import constants for slider ranges
import {
  MIN_NUMBER_OF_GLOBE_TILES,
  MAX_NUMBER_OF_GLOBE_TILES,
  DEFAULT_NUMBER_OF_GLOBE_TILES,
  STEP_NUMBER_OF_GLOBE_TILES,
  MIN_JITTER,
  MAX_JITTER,
  DEFAULT_JITTER,
  STEP_JITTER,
  MIN_TECHTONIC_PLATES,
  MAX_TECHTONIC_PLATES,
  DEFAULT_TECHTONIC_PLATES,
  STEP_TECHTONIC_PLATES,
  MIN_ELEVATION_BIAS,
  MAX_ELEVATION_BIAS,
  DEFAULT_ELEVATION_BIAS,
  STEP_ELEVATION_BIAS,
  DrawMode,
  mockMapTypes,
  defaultMapType,
  DEFAULT_VIEW_MODE,
  globeViewOptions,
  algorithms
} from '../../config/gameConstants';

// TODO: Integrate MapRegistry for live data

// --- Mock/Placeholder Game Logic Imports ---

// Mock RandomService
const RandomService = {
  getCurrentSeed: () => mockSphereSettings.currentSeed || String(Date.now()).slice(-5),
  nextFloat: Math.random // Simplistic mock
};

let mockSphereSettings = {
  drawMode: DrawMode.VORONOI,
  algorithm: 1,
  numPoints: DEFAULT_NUMBER_OF_GLOBE_TILES,
  jitter: DEFAULT_JITTER,
  mapType: defaultMapType,
  outlineVisible: true,
  numPlates: DEFAULT_TECHTONIC_PLATES,
  viewMode: DEFAULT_VIEW_MODE,
  elevationBias: DEFAULT_ELEVATION_BIAS,
  currentSeed: '12345'
};

const requestPlanetRegeneration = (seed) => {
  if (seed !== undefined) {
    mockSphereSettings.currentSeed = String(seed);
  } else {
    // mockSphereSettings.currentSeed = String(Date.now()).slice(-5);
  }
  console.log(`TODO: Request planet regeneration. Seed: ${mockSphereSettings.currentSeed}, Points: ${mockSphereSettings.numPoints}, Algo: ${mockSphereSettings.algorithm}, Draw: ${mockSphereSettings.drawMode}, Jitter: ${mockSphereSettings.jitter}, Map: ${mockSphereSettings.mapType}, Plates: ${mockSphereSettings.numPlates}`);
};

const triggerPlanetColorUpdate = () => {
  console.log(`TODO: Trigger planet color update. Outline visible: ${mockSphereSettings.outlineVisible}, Elevation Bias: ${mockSphereSettings.elevationBias}, View Mode: ${mockSphereSettings.viewMode}`);
};
// --- End Mock/Placeholder Game Logic Imports ---

function GlobeTab() {
  const {
    drawMode, setDrawMode,
    algorithm, setAlgorithm,
    numPoints, setNumPoints,
    jitter, setJitter,
    mapType, setMapType,
    outlineVisible, setOutlineVisible,
    numPlates, setNumPlates,
    elevationBias, setElevationBias,
    currentSeed, setCurrentSeed, regenerateWorldWithCurrentSettings,
    viewMode, setViewMode,
  } = useWorldSettingsStore();

  // Local state for the seed input field, as it might differ from committed store seed until 'Regenerate' is clicked
  const [worldSeedInput, setWorldSeedInput] = React.useState(currentSeed || '');

  useEffect(() => {
    setWorldSeedInput(currentSeed || '');
  }, [currentSeed]);

  const handleNumPointsChange = (newValue) => setNumPoints(newValue[0]);
  const handleJitterChange = (newValue) => setJitter(newValue[0]);
  const handleNumPlatesChange = (newValue) => setNumPlates(newValue[0]);
  const handleElevationBiasChange = (newValue) => setElevationBias(newValue[0]);

  const handleRegenerateWorld = () => {
    let seedToUse = worldSeedInput.trim();
    if (seedToUse === '') {
      seedToUse = undefined; 
    }
    // Update the store's currentSeed if a specific seed is entered
    // The store action `regenerateWorldWithCurrentSettings` will use the store's `currentSeed` if seedToUse is undefined here.
    if (seedToUse !== undefined) {
        setCurrentSeed(String(seedToUse)); // Commit typed seed to store
        regenerateWorldWithCurrentSettings(String(seedToUse));
    } else {
        regenerateWorldWithCurrentSettings(); // Use whatever seed is in store (or let game logic decide if store seed is also undefined)
    }
    // The input field will be updated by the useEffect watching currentSeed from store.
  };

  return (
    <div>
      <ControlSectionWrapper label="Draw Mode">
        <div className="flex space-x-2">
          {Object.entries(DrawMode).map(([key, value]) => (
            <Button
              key={value}
              onClick={() => setDrawMode(value)}
              className={drawMode === value ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}
            >
              {key.charAt(0) + key.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </ControlSectionWrapper>

      <ControlSectionWrapper label="Point Selection Algorithm">
        <div className="flex space-x-2">
          {algorithms.map(algoNumber => (
            <Button
              key={algoNumber}
              onClick={() => setAlgorithm(algoNumber)}
              className={algorithm === algoNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}
            >
              {`Algorithm ${algoNumber}`}
            </Button>
          ))}
        </div>
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Number of Points: ${numPoints}`}>
        <Slider
          value={[numPoints]}
          min={MIN_NUMBER_OF_GLOBE_TILES}
          max={MAX_NUMBER_OF_GLOBE_TILES}
          step={STEP_NUMBER_OF_GLOBE_TILES}
          onValueChange={handleNumPointsChange}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Jitter: ${jitter.toFixed(2)}`}>
        <Slider
          value={[jitter]}
          min={MIN_JITTER}
          max={MAX_JITTER}
          step={STEP_JITTER}
          onValueChange={handleJitterChange}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label="Map Type">
        <Select value={mapType} onValueChange={setMapType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select map type..." />
          </SelectTrigger>
          <SelectContent>
            {Object.values(mockMapTypes).map((mapDetails) => (
              <SelectItem key={mapDetails.id} value={mapDetails.id}>
                {mapDetails.name} <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({mapDetails.description})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ControlSectionWrapper>

      <ControlSectionWrapper className="flex items-center space-x-2">
        <Switch
          id="outline-toggle"
          checked={outlineVisible}
          onCheckedChange={setOutlineVisible}
        />
        <label htmlFor="outline-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
          Show Outlines
        </label>
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Number of Plates: ${numPlates}`}>
        <Slider
          value={[numPlates]}
          min={MIN_TECHTONIC_PLATES}
          max={MAX_TECHTONIC_PLATES}
          step={STEP_TECHTONIC_PLATES}
          onValueChange={handleNumPlatesChange}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Elevation Bias: ${elevationBias.toFixed(2)}`}>
        <Slider
          value={[elevationBias]}
          min={MIN_ELEVATION_BIAS}
          max={MAX_ELEVATION_BIAS}
          step={STEP_ELEVATION_BIAS}
          onValueChange={handleElevationBiasChange}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label="World Seed">
        <div className="flex items-center space-x-2">
          <Input
            id="map-seed-input"
            type="text"
            value={worldSeedInput}
            onChange={(e) => setWorldSeedInput(e.target.value)}
            placeholder="Enter seed or leave blank"
            className="flex-grow"
          />
          <Button onClick={handleRegenerateWorld}>Regenerate</Button>
        </div>
      </ControlSectionWrapper>

      <ControlSectionWrapper label="View Mode">
        <Select value={viewMode} onValueChange={setViewMode}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select view mode..." />
          </SelectTrigger>
          <SelectContent>
            {globeViewOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ControlSectionWrapper>

    </div>
  );
}

GlobeTab.propTypes = {};

export default GlobeTab; 