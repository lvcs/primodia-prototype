// TODO: Move to mapConfig.js
export const MAP_TYPES = {
  CONTINENTS: { id: 'continents', name: 'Continents', description: 'Large landmasses.' },
  PANGAEA: { id: 'pangaea', name: 'Pangaea', description: 'One supercontinent.' },
  FRACTAL: { id: 'fractal', name: 'Fractal', description: 'Chaotic coastlines.' },
  ARCHIPELAGO: { id: 'archipelago', name: 'Archipelago', description: 'Small islands.' },
  ISLAND_PLATES: { id: 'island_plates', name: 'Island Plates', description: 'Mix of small-to-medium islands.'},
  HIGHLANDS: { id: 'highlands', name: 'Highlands', description: 'Mostly hills and mountains.'},
  LAKES: { id: 'lakes', name: 'Lakes', description: 'Tons of small inland lakes.'},
  DRY: { id: 'dry', name: 'Dry', description: 'Arid terrain.'},
};
export const MAP_TYPE_DEFAULT = 'continents';