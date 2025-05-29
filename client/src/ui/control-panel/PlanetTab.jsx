import React, { useEffect } from 'react';
import { Button } from '@ui/components/Button';
import { ControlSectionWrapper } from '@ui/components/ControlSectionWrapper';
import { Slider } from '@ui/components/Slider';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@ui/components/Select';
import { Switch } from '@ui/components/Switch';
import { Input } from '@ui/components/Input';
import { useWorldStore } from '@stores';

// Import constants for slider ranges
import {
  PLANET_TILES_MIN,
  PLANET_TILES_MAX,
  PLANET_TILES_STEP,
  PLANET_JITTER_MIN,
  PLANET_JITTER_MAX,
  PLANET_JITTER_STEP,
  PLANET_TECHTONIC_PLATES_MIN,
  PLANET_TECHTONIC_PLATES_MAX,
  PLANET_TECHTONIC_PLATES_STEP,
  PLANET_ELEVATION_BIAS_MIN,
  PLANET_ELEVATION_BIAS_MAX,
  PLANET_ELEVATION_BIAS_STEP,
  PLANET_DRAW_MODE,
  MAP_TYPES,
  PLANET_VIEW_MODES,
  PLANET_RENDERING_ALGORITHMS
} from '@config';

// TODO: Integrate MapRegistry for live data

// --- Mock/Placeholder Game Logic Imports ---

// We don't need the mock planetSettings and functions anymore as we're using the store
// and real functions from game.js

// --- End Mock/Placeholder Game Logic Imports ---

function PlanetTab() {
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
  } = useWorldStore();

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
          {Object.entries(PLANET_DRAW_MODE).map(([key, value]) => (
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
          {PLANET_RENDERING_ALGORITHMS.map(algoNumber => (
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
          min={PLANET_TILES_MIN}
          max={PLANET_TILES_MAX}
          step={PLANET_TILES_STEP}
          onValueChange={handleNumPointsChange}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Jitter: ${jitter.toFixed(2)}`}>
        <Slider
          value={[jitter]}
          min={PLANET_JITTER_MIN}
          max={PLANET_JITTER_MAX}
          step={PLANET_JITTER_STEP}
          onValueChange={handleJitterChange}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label="Map Type">
        <Select value={mapType} onValueChange={setMapType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select map type..." />
          </SelectTrigger>
          <SelectContent>
            {Object.values(MAP_TYPES).map((mapDetails) => (
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
          min={PLANET_TECHTONIC_PLATES_MIN}
          max={PLANET_TECHTONIC_PLATES_MAX}
          step={PLANET_TECHTONIC_PLATES_STEP}
          onValueChange={handleNumPlatesChange}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Elevation Bias: ${elevationBias.toFixed(2)}`}>
        <Slider
          value={[elevationBias]}
          min={PLANET_ELEVATION_BIAS_MIN}
          max={PLANET_ELEVATION_BIAS_MAX}
          step={PLANET_ELEVATION_BIAS_STEP}
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
            {PLANET_VIEW_MODES.map((option) => (
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

export default PlanetTab; 