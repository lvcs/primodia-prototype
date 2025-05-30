import Tile from './Tile.js';

export default class WorldPlanet {
  constructor({
    id = crypto.randomUUID(),
    drawMode,
    algorithm,
    numTiles,
    jitter,
    size
  }) {
    this.id = id;
    this.drawMode = drawMode;
    this.algorithm = algorithm;
    this.numTiles = numTiles;
    this.jitter = jitter;
    this.size = size;
    /** @type {Map<number,Tile>} */
    this.tiles = new Map();
  }

  addTile(tile) {
    this.tiles.set(tile.id, tile);
  }

  getTile(id) {
    return this.tiles.get(id);
  }

  get terrainStats() {
    const stats = {};
    this.tiles.forEach(t => {
      stats[t.terrain.id] = (stats[t.terrain.id] || 0) + 1;
    });
    return stats;
  }
} 