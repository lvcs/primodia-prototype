import ResourceType from '../model/ResourceType.js';

export const Resources = {
  GRAIN:     new ResourceType({ id:'GRAIN',     name:'Grain',     color:0xffff00, symbol:'🌾' }),
  WHEAT:     new ResourceType({ id:'WHEAT',     name:'Wheat',     color:0xffe066, symbol:'🌾' }),
  FISH:      new ResourceType({ id:'FISH',      name:'Fish',      color:0x1e90ff, symbol:'🐟' }),
  LIVESTOCK: new ResourceType({ id:'LIVESTOCK', name:'Livestock', color:0xcd853f, symbol:'🐄' }),
  WOOD:      new ResourceType({ id:'WOOD',      name:'Wood',      color:0x8b4513, symbol:'🌲' }),
  STONE:     new ResourceType({ id:'STONE',     name:'Stone',     color:0x696969, symbol:'⛰️' }),
  IRON:      new ResourceType({ id:'IRON',      name:'Iron',      color:0x708090, symbol:'⚒️' }),
  GOLD:      new ResourceType({ id:'GOLD',      name:'Gold',      color:0xffd700, symbol:'💰' }),
  OIL:       new ResourceType({ id:'OIL',       name:'Oil',       color:0x000000, symbol:'🛢️' }),
  NITER:     new ResourceType({ id:'NITER',     name:'Niter',     color:0xe5e4e2, symbol:'🧂' }),
  URANIUM:   new ResourceType({ id:'URANIUM',   name:'Uranium',   color:0x39ff14, symbol:'☢️' }),
  GEMS:      new ResourceType({ id:'GEMS',      name:'Gems',      color:0x00ffff, symbol:'💎' }),
  COTTON:    new ResourceType({ id:'COTTON',    name:'Cotton',    color:0xffffff, symbol:'🧵' }),
  IVORY:     new ResourceType({ id:'IVORY',     name:'Ivory',     color:0xf8f8ff, symbol:'🐘' })
};

export const resourceById = id => Resources[id];
export const ResourceTypeEnum = Object.keys(Resources).reduce((o,k)=>(o[k]=k,o),{});
export const resourceMarkers = Object.fromEntries(Object.values(Resources).map(r=>[r.id,{color:r.color,symbol:r.symbol}])); 