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

// Mock RandomService - might be needed for other parts of GlobeTab
const RandomService = {
  getCurrentSeed: () => String(Date.now()).slice(-5),
  nextFloat: Math.random // Simplistic mock
};

// We don't need the mock sphereSettings and functions anymore as we're using the store
// and real functions from game.js

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

  const handleNumPointsChange = (newValue) => {
    console.log('UI Slider changed numPoints to:', newValue[0], 'from previous value:', numPoints);
    setNumPoints(newValue[0]);
  };

  const handleJitterChange = (newValue) => {
    console.log('UI Slider changed jitter to:', newValue[0], 'from previous value:', jitter);
    setJitter(newValue[0]);
  };

  const handleNumPlatesChange = (newValue) => {
    console.log('UI Slider changed numPlates to:', newValue[0], 'from previous value:', numPlates);
    setNumPlates(newValue[0]);
  };

  const handleElevationBiasChange = (newValue) => {
    console.log('UI Slider changed elevationBias to:', newValue[0], 'from previous value:', elevationBias);
    setElevationBias(newValue[0]);
  };

  const handleRegenerateWorld = () => {
    console.log('handleRegenerateWorld called');
    let seedToUse = worldSeedInput.trim();
    if (seedToUse === '') {
      seedToUse = undefined; 
    }
    // Update the store's currentSeed if a specific seed is entered
    // The store action `regenerateWorldWithCurrentSettings` will use the store's `currentSeed` if seedToUse is undefined here.
    if (seedToUse !== undefined) {
        console.log('Using seed from input:', seedToUse);
        // First update the store's currentSeed value
        setCurrentSeed(String(seedToUse)); 
        
        // Then regenerate the world with this seed, getting all other settings from the store
        console.log('Calling regenerateWorldWithCurrentSettings with seed input');
        regenerateWorldWithCurrentSettings(String(seedToUse));
    } else {
        console.log('Using seed from store or generating new seed');
        // No seed provided, so just use whatever is in the store
        // The store will pass its current state to the game functions
        console.log('Calling regenerateWorldWithCurrentSettings without seed');
        regenerateWorldWithCurrentSettings(); 
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