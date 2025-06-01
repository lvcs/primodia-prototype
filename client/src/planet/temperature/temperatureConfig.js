// Temperature levels inspired by the crochet blanket chart.
// Thresholds are upper bounds (exclusive for next level).
// Order matters: from coldest to hottest.
export const TEMPERATURE_LEVELS = Object.freeze([
  { id: 'TEMP_NEG_26_2', name: '< -26.2°C',    color: 0xFFC0CB, threshold: 0.04 }, // Pink (Very Cold)
  { id: 'TEMP_NEG_23_4', name: '-26.1 to -23.4°C', color: 0xFFB6C1, threshold: 0.08 }, // LightPink
  { id: 'TEMP_NEG_20_5', name: '-23.3 to -20.5°C', color: 0xFFA07A, threshold: 0.12 }, // LightSalmon (Pale Magenta/Pinkish)
  { id: 'TEMP_NEG_17_8', name: '-20.5 to -17.8°C', color: 0xEE82EE, threshold: 0.16 }, // Violet
  { id: 'TEMP_NEG_15_1', name: '-17.7 to -15.1°C', color: 0xDA70D6, threshold: 0.20 }, // Orchid
  { id: 'TEMP_NEG_12_3', name: '-15.0 to -12.3°C', color: 0xBA55D3, threshold: 0.24 }, // MediumOrchid
  { id: 'TEMP_NEG_9_5',  name: '-12.2 to -9.5°C',  color: 0x9932CC, threshold: 0.28 }, // DarkOrchid
  { id: 'TEMP_NEG_6_7',  name: '-9.4 to -6.7°C',   color: 0x8A2BE2, threshold: 0.32 }, // BlueViolet
  { id: 'TEMP_NEG_3_9',  name: '-6.6 to -3.9°C',   color: 0x4B0082, threshold: 0.36 }, // Indigo (Dark Blue/Purple)
  { id: 'TEMP_NEG_1_2',  name: '-3.8 to -1.2°C',   color: 0x0000CD, threshold: 0.40 }, // MediumBlue
  { id: 'TEMP_1_6',    name: '-1.1 to 1.6°C',    color: 0x4169E1, threshold: 0.44 }, // RoyalBlue
  { id: 'TEMP_4_3',    name: '1.7 to 4.3°C',     color: 0x00BFFF, threshold: 0.48 }, // DeepSkyBlue
  { id: 'TEMP_7_1',    name: '4.4 to 7.1°C',     color: 0x87CEEB, threshold: 0.52 }, // SkyBlue
  { id: 'TEMP_9_9',    name: '7.2 to 9.9°C',     color: 0xAFEEEE, threshold: 0.56 }, // PaleTurquoise
  { id: 'TEMP_12_7',   name: '10.0 to 12.7°C',   color: 0x98FB98, threshold: 0.60 }, // PaleGreen
  { id: 'TEMP_15_5',   name: '12.8 to 15.5°C',   color: 0x3CB371, threshold: 0.64 }, // MediumSeaGreen
  { id: 'TEMP_18_2',   name: '15.6 to 18.2°C',   color: 0xADFF2F, threshold: 0.68 }, // GreenYellow
  { id: 'TEMP_21_0',   name: '18.3 to 21.0°C',   color: 0xFFFF00, threshold: 0.72 }, // Yellow
  { id: 'TEMP_23_8',   name: '21.1 to 23.8°C',   color: 0xFFD700, threshold: 0.76 }, // Gold
  { id: 'TEMP_26_6',   name: '23.9 to 26.6°C',   color: 0xFFA500, threshold: 0.80 }, // Orange
  { id: 'TEMP_29_3',   name: '26.7 to 29.3°C',   color: 0xFF8C00, threshold: 0.84 }, // DarkOrange
  { id: 'TEMP_32_1',   name: '29.4 to 32.1°C',   color: 0xFF4500, threshold: 0.88 }, // OrangeRed
  { id: 'TEMP_35_0',   name: '32.2 to 35.0°C',   color: 0xFF0000, threshold: 0.92 }, // Red
  { id: 'TEMP_37_7',   name: '35.1 to 37.7°C',   color: 0xDC143C, threshold: 0.96 }, // Crimson
  { id: 'TEMP_OVER_37_8',name: '> 37.8°C',       color: 0x8B0000, threshold: 1.01 }  // DarkRed (Very Hot) - threshold 1.01 ensures it catches 1.0
]);

// Default color for undefined or invalid temperature values
export const TEMPERATURE_DEFAULT_COLOR = 0x808080; 