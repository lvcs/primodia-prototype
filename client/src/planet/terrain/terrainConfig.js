// Terrain classification priorities
export const TERRAIN_WATER_PRIORITY = 0;
export const TERRAIN_ICE_SNOW_PRIORITY = 5;
export const TERRAIN_LAND_BASE_PRIORITY = 10;

// Discrete colors for terrain types
export const TERRAIN_DISCRETE_COLORS = {
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