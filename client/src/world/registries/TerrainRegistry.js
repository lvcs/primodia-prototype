import TerrainType from '@game/world/model/TerrainType';

// Define terrain types with classification criteria
// Priority: Lower numbers are checked first.
// Water Biomes (highest priority)
const WATER_PRIORITY = 0;
const LAND_BASE_PRIORITY = 10;
const ICE_SNOW_PRIORITY = 5;

// Discrete colors provided by user
const discreteColors = {
    OCEAN: {
        default: 0x1D4179, // Shallowest ocean color
        variants: [
            { maxElevation: -0.82, color: 0x0B0033 }, // Deepest
            { maxElevation: -0.75, color: 0x0A0233 },
            { maxElevation: -0.68, color: 0x080335 },
            { maxElevation: -0.61, color: 0x060437 },
            { maxElevation: -0.54, color: 0x05053C },
            { maxElevation: -0.47, color: 0x060A42 },
            { maxElevation: -0.40, color: 0x081049 },
            { maxElevation: -0.33, color: 0x0B1852 },
            { maxElevation: -0.26, color: 0x0E1F5B },
            { maxElevation: -0.19, color: 0x122965 },
            { maxElevation: -0.12, color: 0x17346F },
            { maxElevation: -0.05, color: 0x1D4179 }  // Shallowest
        ]
    },
    LAKESHORE: 0x225588,
    LAKE: 0x336699,
    MARSH: 0x2f6666,
    ICE: 0xffffff,
    BEACH: 0xa09077,
    SNOW: 0xffffff,
    TUNDRA: 0xbbbbaa,
    BARE: 0x888888,
    SCORCHED: 0x555555,
    TAIGA: 0x99aa77,
    TEMPERATE_DESERT: 0xc9d29b,
    RAINFOREST: 0x448855,
    GRASSLAND: {
        default: 0x88aa55,
        variants: [ // Lower elevation = darker/more saturated
            { maxElevation: 0.2, color: 0x6B8E23 },
            { maxElevation: 0.4, color: 0x88aa55 }, // Mid-range, original color
            { maxElevation: 0.6, color: 0xAABD77 }  // Higher elevation = lighter/less saturated
        ]
    },
    SUBTROPICAL_DESERT: 0xd2b98b,
    PLAINS: {
        default: 0x9ACD32,
        variants: [ // Lower elevation = darker/more saturated
            { maxElevation: 0.1, color: 0x7FAF1F },
            { maxElevation: 0.2, color: 0x9ACD32 }, // Mid-range, original color
            { maxElevation: 0.3, color: 0xB8DC56 }  // Higher elevation = lighter/less saturated
        ]
    },
    FOREST: 0x556B2F,
    JUNGLE: 0x2E8B57
};

export const Terrains = {
  OCEAN:      new TerrainType({ id:'OCEAN',      name:'Ocean',         color:discreteColors.OCEAN, baseType:'WATER', priority: WATER_PRIORITY, maxElevation: -0.05 }), // Deepest parts, now includes coast
  LAKE:       new TerrainType({ id:'LAKE',       name:'Lake',          color:discreteColors.LAKE, baseType:'WATER', priority: WATER_PRIORITY + 2, minElevation: -0.049, requiresLake: true }), // Inland water, above general sea level if not ocean connected
  LAKESHORE:  new TerrainType({ id:'LAKESHORE',  name:'Lakeshore',     color:discreteColors.LAKESHORE, baseType:'LAND',  priority: LAND_BASE_PRIORITY, maxElevation: 0.05, requiresLake: true }), // Land immediately bordering a lake

  // Ice and Snow Biomes (high priority after water)
  ICE:        new TerrainType({ id:'ICE',        name:'Ice',           color:discreteColors.ICE, baseType:'ICE', priority: ICE_SNOW_PRIORITY, maxTemp: 0.1, minMoisture: 0.1}), // Permanent ice, very cold
  SNOW:       new TerrainType({ id:'SNOW',       name:'Snow',          color:discreteColors.SNOW, baseType:'ICE', priority: ICE_SNOW_PRIORITY + 1, minElevation: 0.7, maxTemp: 0.25 }), // High mountains or very cold areas
  
  // Land Biomes - General order: Cold/Dry to Hot/Wet, with specific overriding general
  TUNDRA:     new TerrainType({ id:'TUNDRA',     name:'Tundra',        color:discreteColors.TUNDRA, baseType:'LAND', priority: LAND_BASE_PRIORITY, minElevation: 0.2, maxTemp: 0.3, minMoisture: 0.05, maxMoisture: 0.5 }),
  BARE:       new TerrainType({ id:'BARE',       name:'Bare Rock/Soil',color:discreteColors.BARE, baseType:'LAND', priority: LAND_BASE_PRIORITY + 1, minElevation: 0.5, maxMoisture: 0.1 }), // Mountain rock or very dry non-desert
  SCORCHED:   new TerrainType({ id:'SCORCHED',   name:'Scorched',      color:discreteColors.SCORCHED, baseType:'LAND', priority: LAND_BASE_PRIORITY + 2, minTemp: 0.9, maxMoisture: 0.05 }), // Hottest, driest

  TEMPERATE_DESERT: new TerrainType({ id:'TEMPERATE_DESERT', name:'Temperate Desert',color:discreteColors.TEMPERATE_DESERT, baseType:'LAND', priority: LAND_BASE_PRIORITY + 5, minTemp: 0.35, maxTemp: 0.65, maxMoisture: 0.2 }),
  SUBTROPICAL_DESERT: new TerrainType({ id:'SUBTROPICAL_DESERT', name:'Subtropical Desert', color:discreteColors.SUBTROPICAL_DESERT, baseType:'LAND', priority: LAND_BASE_PRIORITY + 5, minTemp: 0.65, maxMoisture: 0.2 }),
  
  GRASSLAND:  new TerrainType({ id:'GRASSLAND',  name:'Grassland',     color:discreteColors.GRASSLAND, baseType:'LAND', priority: LAND_BASE_PRIORITY + 10, minMoisture: 0.18, maxMoisture: 0.5 }), // Lowered minMoisture from 0.2 to 0.18
  PLAINS:     new TerrainType({ id:'PLAINS',     name:'Plains',        color:discreteColors.PLAINS, baseType:'LAND', priority: LAND_BASE_PRIORITY + 11, minMoisture: 0.25, maxMoisture: 0.6, maxElevation: 0.3 }), // Reintroduced, perhaps slightly wetter/lower than grassland

  TAIGA:      new TerrainType({ id:'TAIGA',      name:'Taiga',         color:discreteColors.TAIGA, baseType:'LAND', priority: LAND_BASE_PRIORITY + 20, minTemp: 0.10, maxTemp: 0.4, minMoisture: 0.4, maxMoisture: 0.85 }), // Lowered minTemp from 0.15 to 0.10, Increased maxMoisture from 0.8 to 0.85
  
  FOREST:     new TerrainType({ id:'FOREST',     name:'Forest',        color:discreteColors.FOREST, baseType:'LAND', priority: LAND_BASE_PRIORITY + 25, minMoisture: 0.5, maxMoisture: 0.8 }), // Generic Forest as fallback
  
  RAINFOREST: new TerrainType({ 
    id:'RAINFOREST', 
    name:'Rainforest', 
    color:discreteColors.RAINFOREST,
    baseType:'LAND', 
    priority: LAND_BASE_PRIORITY + 22,
    minTemp: 0.3,
    maxTemp: 1.0,
    minMoisture: 0.65,
    maxMoisture: 1.0
  }),
  
  JUNGLE:     new TerrainType({ id:'JUNGLE',     name:'Jungle',        color:discreteColors.JUNGLE, baseType:'LAND', priority: LAND_BASE_PRIORITY + 30, minTemp:0.65, minMoisture: 0.65 }), // Generic Jungle/Tropical as fallback
  
  MARSH:      new TerrainType({ id:'MARSH',      name:'Marsh',         color:discreteColors.MARSH, baseType:'LAND', priority: LAND_BASE_PRIORITY + 4, minElevation: -0.049, maxElevation: 0.1, minMoisture: 0.7 }), // Low-lying, very wet land
  BEACH:      new TerrainType({ id:'BEACH',      name:'Beach',         color:discreteColors.BEACH, baseType:'LAND', priority: LAND_BASE_PRIORITY + 3, minElevation: -0.049, maxElevation: 0.05, maxMoisture: 0.3 }) // Coastal, dry
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