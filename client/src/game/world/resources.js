// Resource types
export const ResourceType = {
  NONE: 'none',
  GRAIN: 'grain',
  WHEAT: 'wheat',
  FISH: 'fish',
  LIVESTOCK: 'livestock',
  WOOD: 'wood',
  STONE: 'stone',
  IRON: 'iron',
  GOLD: 'gold',
  OIL: 'oil',
  NITER: 'niter',
  URANIUM: 'uranium',
  GEMS: 'gems',
  COTTON: 'cotton',
  IVORY: 'ivory'
};

// Resource markers
export const resourceMarkers = {
  [ResourceType.GRAIN]: { color: 0xffff00, symbol: '🌾' },
  [ResourceType.WHEAT]: { color: 0xffe066, symbol: '🌾' },
  [ResourceType.FISH]: { color: 0x1e90ff, symbol: '🐟' },
  [ResourceType.LIVESTOCK]: { color: 0xcd853f, symbol: '🐄' },
  [ResourceType.WOOD]: { color: 0x8b4513, symbol: '🌲' },
  [ResourceType.STONE]: { color: 0x696969, symbol: '⛰️' },
  [ResourceType.IRON]: { color: 0x708090, symbol: '⚒️' },
  [ResourceType.GOLD]: { color: 0xffd700, symbol: '💰' },
  [ResourceType.OIL]: { color: 0x000000, symbol: '🛢️' },
  [ResourceType.NITER]: { color: 0xe5e4e2, symbol: '🧂' },
  [ResourceType.URANIUM]: { color: 0x39ff14, symbol: '☢️' },
  [ResourceType.GEMS]: { color: 0x00ffff, symbol: '💎' },
  [ResourceType.COTTON]: { color: 0xffffff, symbol: '🧵' },
  [ResourceType.IVORY]: { color: 0xf8f8ff, symbol: '🐘' }
}; 