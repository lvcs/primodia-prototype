import TerrainType from '../model/TerrainType.js';

export const Terrains = {
  OCEAN:      new TerrainType({ id:'OCEAN',      name:'Ocean',      color:0x1a75b0 }),
  COAST:      new TerrainType({ id:'COAST',      name:'Coast',      color:0x6ec6e2 }),
  PLAINS:     new TerrainType({ id:'PLAINS',     name:'Plains',     color:0x91de6c }),
  FOREST:     new TerrainType({ id:'FOREST',     name:'Forest',     color:0x2e8b57 }),
  HILLS:      new TerrainType({ id:'HILLS',      name:'Hills',      color:0xa0744e }),
  MOUNTAINS:  new TerrainType({ id:'MOUNTAINS',  name:'Mountains',  color:0x8d8d8d }),
  DESERT:     new TerrainType({ id:'DESERT',     name:'Desert',     color:0xe8c17d }),
  TUNDRA:     new TerrainType({ id:'TUNDRA',     name:'Tundra',     color:0xd9edee }),
  SNOW:       new TerrainType({ id:'SNOW',       name:'Snow',       color:0xffffff }),
  JUNGLE:     new TerrainType({ id:'JUNGLE',     name:'Jungle',     color:0x228b22 }),
  MARSH:      new TerrainType({ id:'MARSH',      name:'Marsh',      color:0x7ec850 })
};

export const terrainById = id => Terrains[id]; 