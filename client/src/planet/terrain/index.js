import TerrainType from './TerrainType.js';
import { 
  TERRAIN_DISCRETE_COLORS, 
  TERRAIN_WATER_PRIORITY, 
  TERRAIN_ICE_SNOW_PRIORITY, 
  TERRAIN_LAND_BASE_PRIORITY 
} from './terrainConfig.js';

// Define terrain types with classification criteria
export const Terrains = {
  OCEAN:      new TerrainType({ id:'OCEAN',      name:'Ocean',         color:TERRAIN_DISCRETE_COLORS.OCEAN, baseType:'WATER', priority: TERRAIN_WATER_PRIORITY, maxElevation: -0.05 }), // Deepest parts, now includes coast
  LAKE:       new TerrainType({ id:'LAKE',       name:'Lake',          color:TERRAIN_DISCRETE_COLORS.LAKE, baseType:'WATER', priority: TERRAIN_WATER_PRIORITY + 2, minElevation: -0.049, requiresLake: true }), // Inland water, above general sea level if not ocean connected
  LAKESHORE:  new TerrainType({ id:'LAKESHORE',  name:'Lakeshore',     color:TERRAIN_DISCRETE_COLORS.LAKESHORE, baseType:'LAND',  priority: TERRAIN_LAND_BASE_PRIORITY, maxElevation: 0.05, requiresLake: true }), // Land immediately bordering a lake

  // Ice and Snow Biomes (high priority after water)
  ICE:        new TerrainType({ id:'ICE',        name:'Ice',           color:TERRAIN_DISCRETE_COLORS.ICE, baseType:'ICE', priority: TERRAIN_ICE_SNOW_PRIORITY, maxTemp: 0.1, minMoisture: 0.1}), // Permanent ice, very cold
  SNOW:       new TerrainType({ id:'SNOW',       name:'Snow',          color:TERRAIN_DISCRETE_COLORS.SNOW, baseType:'ICE', priority: TERRAIN_ICE_SNOW_PRIORITY + 1, minElevation: 0.7, maxTemp: 0.25 }), // High mountains or very cold areas
  
  // Land Biomes - General order: Cold/Dry to Hot/Wet, with specific overriding general
  TUNDRA:     new TerrainType({ id:'TUNDRA',     name:'Tundra',        color:TERRAIN_DISCRETE_COLORS.TUNDRA, baseType:'LAND', priority: TERRAIN_LAND_BASE_PRIORITY, minElevation: 0.2, maxTemp: 0.3, minMoisture: 0.05, maxMoisture: 0.5 }),
  BARE:       new TerrainType({ id:'BARE',       name:'Bare Rock/Soil',color:TERRAIN_DISCRETE_COLORS.BARE, baseType:'LAND', priority: TERRAIN_LAND_BASE_PRIORITY + 1, minElevation: 0.5, maxMoisture: 0.1 }), // Mountain rock or very dry non-desert
  SCORCHED:   new TerrainType({ id:'SCORCHED',   name:'Scorched',      color:TERRAIN_DISCRETE_COLORS.SCORCHED, baseType:'LAND', priority: TERRAIN_LAND_BASE_PRIORITY + 2, minTemp: 0.9, maxMoisture: 0.05 }), // Hottest, driest

  TEMPERATE_DESERT: new TerrainType({ id:'TEMPERATE_DESERT', name:'Temperate Desert',color:TERRAIN_DISCRETE_COLORS.TEMPERATE_DESERT, baseType:'LAND', priority: TERRAIN_LAND_BASE_PRIORITY + 5, minTemp: 0.35, maxTemp: 0.65, maxMoisture: 0.2 }),
  SUBTROPICAL_DESERT: new TerrainType({ id:'SUBTROPICAL_DESERT', name:'Subtropical Desert', color:TERRAIN_DISCRETE_COLORS.SUBTROPICAL_DESERT, baseType:'LAND', priority: TERRAIN_LAND_BASE_PRIORITY + 5, minTemp: 0.65, maxMoisture: 0.2 }),
  
  GRASSLAND:  new TerrainType({ id:'GRASSLAND',  name:'Grassland',     color:TERRAIN_DISCRETE_COLORS.GRASSLAND, baseType:'LAND', priority: TERRAIN_LAND_BASE_PRIORITY + 10, minMoisture: 0.18, maxMoisture: 0.5 }), // Lowered minMoisture from 0.2 to 0.18
  PLAINS:     new TerrainType({ id:'PLAINS',     name:'Plains',        color:TERRAIN_DISCRETE_COLORS.PLAINS, baseType:'LAND', priority: TERRAIN_LAND_BASE_PRIORITY + 11, minMoisture: 0.25, maxMoisture: 0.6, maxElevation: 0.3 }), // Reintroduced, perhaps slightly wetter/lower than grassland

  TAIGA:      new TerrainType({ id:'TAIGA',      name:'Taiga',         color:TERRAIN_DISCRETE_COLORS.TAIGA, baseType:'LAND', priority: TERRAIN_LAND_BASE_PRIORITY + 20, minTemp: 0.10, maxTemp: 0.4, minMoisture: 0.4, maxMoisture: 0.85 }), // Lowered minTemp from 0.15 to 0.10, Increased maxMoisture from 0.8 to 0.85
  
  FOREST:     new TerrainType({ id:'FOREST',     name:'Forest',        color:TERRAIN_DISCRETE_COLORS.FOREST, baseType:'LAND', priority: TERRAIN_LAND_BASE_PRIORITY + 25, minMoisture: 0.5, maxMoisture: 0.8 }), // Generic Forest as fallback
  
  RAINFOREST: new TerrainType({ 
    id:'RAINFOREST', 
    name:'Rainforest', 
    color:TERRAIN_DISCRETE_COLORS.RAINFOREST,
    baseType:'LAND', 
    priority: TERRAIN_LAND_BASE_PRIORITY + 22,
    minTemp: 0.3,
    maxTemp: 1.0,
    minMoisture: 0.65,
    maxMoisture: 1.0
  }),
  
  JUNGLE:     new TerrainType({ id:'JUNGLE',     name:'Jungle',        color:TERRAIN_DISCRETE_COLORS.JUNGLE, baseType:'LAND', priority: TERRAIN_LAND_BASE_PRIORITY + 30, minTemp:0.65, minMoisture: 0.65 }), // Generic Jungle/Tropical as fallback
  
  MARSH:      new TerrainType({ id:'MARSH',      name:'Marsh',         color:TERRAIN_DISCRETE_COLORS.MARSH, baseType:'LAND', priority: TERRAIN_LAND_BASE_PRIORITY + 4, minElevation: -0.049, maxElevation: 0.1, minMoisture: 0.7 }), // Low-lying, very wet land
  BEACH:      new TerrainType({ id:'BEACH',      name:'Beach',         color:TERRAIN_DISCRETE_COLORS.BEACH, baseType:'LAND', priority: TERRAIN_LAND_BASE_PRIORITY + 3, minElevation: -0.049, maxElevation: 0.05, maxMoisture: 0.3 }) // Coastal, dry
};

export const terrainById = id => Terrains[id];

export function getColorForTerrain(terrainId, elevation) {
  // console.log(`getColorForTerrain called with: terrainId=${terrainId}, elevation=${elevation}`); // DEBUG LINE - Commented out
  const terrainType = Terrains[terrainId];
  if (!terrainType) {
    // console.warn(`Unknown terrainId '${terrainId}', returning grey.`); // DEBUG LINE - Keep if this is rare and important
    return 0x808080; // Default grey if terrainId is unknown
  }

  const colorDefinition = terrainType.color;
  // console.log(`Color definition for ${terrainId}:`, JSON.stringify(colorDefinition)); // DEBUG LINE - Commented out

  if (typeof colorDefinition === 'object' && colorDefinition !== null && Array.isArray(colorDefinition.variants)) {
    const sortedVariants = [...colorDefinition.variants].sort((a, b) => a.maxElevation - b.maxElevation);
    // console.log(`Sorted variants for ${terrainId}:`, JSON.stringify(sortedVariants)); // DEBUG LINE - Commented out

    for (const variant of sortedVariants) {
      // console.log(`Checking variant: maxElevation=${variant.maxElevation}, color=0x${variant.color.toString(16)}`); // DEBUG LINE - Commented out
      if (elevation <= variant.maxElevation) {
        // console.log(`Matched variant! Returning 0x${variant.color.toString(16)}`); // DEBUG LINE - Commented out
        return variant.color;
      }
    }
    const fallbackColor = colorDefinition.default !== undefined ? colorDefinition.default : (sortedVariants.length > 0 ? sortedVariants[sortedVariants.length -1].color : 0x808080);
    // console.warn(`No variant matched for elevation ${elevation} in ${terrainId}. Fallback to: 0x${fallbackColor.toString(16)}`); // DEBUG LINE - Keep if important
    return fallbackColor;
  } else if (typeof colorDefinition === 'number') {
    // console.log(`Simple hex color found: 0x${colorDefinition.toString(16)}. Returning it.`); // DEBUG LINE - Commented out
    return colorDefinition; // It's a simple hex color
  }

  console.error(`Misconfigured color for ${terrainId}. Returning grey.`); // Keep this critical error log
  return 0x808080; // Fallback for misconfigured color
}

// Export TerrainType class for external use
export { default as TerrainType } from './TerrainType.js'; 