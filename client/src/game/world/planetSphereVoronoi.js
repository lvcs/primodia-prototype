import * as THREE from 'three';
import Delaunator from 'delaunator';
import { MapTypes, defaultMapType, generateMapTerrain } from './registries/MapTypeRegistry.js';
import { debug } from '../utils/debug.js';
import { terrainById } from './registries/TerrainRegistry.js';
import WorldGlobe from './model/WorldGlobe.js';
import Tile from './model/Tile.js';
import { Terrains } from './registries/TerrainRegistry.js';
import * as Const from '../../config/gameConstants.js'; // Import constants
import RandomService from '../core/RandomService.js'; // Added import

// Cache for random lat/lon offsets
const _randomLat = [];
const _randomLon = [];

const TerrainType = Object.keys(Terrains).reduce((o,k)=>(o[k]=k,o),{});
const terrainColors = Object.fromEntries(Object.values(Terrains).map(t=>[t.id,t.color]));

function generateFibonacciSphere1(N, jitter, randomFloat) {
    const points = [];
    const phi = Math.PI * (Math.sqrt(5) - 1); // golden ratio
    
    // Add north pole point
    points.push(0, 1, 0);
    
    // Generate points from top to bottom
    for (let i = 0; i < N - 2; i++) {
        const y = 1 - (i + 1) * 2.0 / (N - 1);
        const radius = Math.sqrt(1 - y * y);
        const theta = phi * i;
        
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        
        if (jitter > 0) {
            const angle = randomFloat() * Math.PI * 2;
            const amount = randomFloat() * jitter;
            const rx = Math.cos(angle) * amount;
            const rz = Math.sin(angle) * amount;
            
            const nx = x + rx;
            const nz = z + rz;
            const ny = y;
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
            points.push(nx/len, ny/len, nz/len);
        } else {
            points.push(x, y, z);
        }
    }
    
    // Add south pole point
    points.push(0, -1, 0);
    
    return points;
}

function generateFibonacciSphere2(N, jitter, randomFloat) {
    const points = [];
    const dlong = Math.PI * (3-Math.sqrt(5)); // ~2.39996323
    
    // Add north pole point
    points.push(0, 1, 0);
    
    // Generate points in a more even distribution
    for (let i = 0; i < N - 2; i++) {
        const y = 1.0 - (i + 1.0) * 2.0 / (N - 1);
        const radius = Math.sqrt(1 - y * y);
        const theta = dlong * i;
        
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        
        if (jitter > 0) {
            const angle = randomFloat() * Math.PI * 2;
            const amount = randomFloat() * jitter;
            const rx = Math.cos(angle) * amount;
            const rz = Math.sin(angle) * amount;
            
            const nx = x + rx;
            const nz = z + rz;
            const ny = y;
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
            points.push(nx/len, ny/len, nz/len);
        } else {
            points.push(x, y, z);
        }
    }
    
    // Add south pole point
    points.push(0, -1, 0);
    
    return points;
}

function pushCartesianFromSpherical(out, latDeg, lonDeg) {
    const latRad = latDeg / 180.0 * Math.PI;
    const lonRad = lonDeg / 180.0 * Math.PI;
    out.push(
        Math.cos(latRad) * Math.cos(lonRad),
        Math.cos(latRad) * Math.sin(lonRad),
        Math.sin(latRad)
    );
    return out;
}

function stereographicProjection(points) {
    const projected = []; // 2D points for Delaunator (x,y, x,y, ...)
    let southPoleIndex = -1; // index in the original points array / 3
    const originalIndicesMap = []; // map from new projected index to original point index

    for (let i = 0; i < points.length; i += 3) {
        const originalPointIndex = i / 3;
        const x = points[i];
        const y = points[i + 1];
        const z = points[i + 2];

        if (y <= -0.99999) { // South pole check (y is up/down, so -1 is south)
            southPoleIndex = originalPointIndex;
            continue; // Skip adding south pole to 'projected'
        }

        // Project from south pole (0, -1, 0) onto y = 0 plane, then map to z=1 equivalent or scale.
        // A common stereographic projection from south pole (0,-1,0) to plane y=0 is:
        // Px = x / (1 + y)
        // Pz = z / (1 + y)
        // We need to handle the case 1+y is near zero if projection point is included, but it's excluded.
        const scale = 1 / (1 + y); // Denominator for projection from (0,-1,0) to plane y=... (or related to y component of vector from pole)
                                   // This projects points onto a plane. For Delaunay, relative positions matter.
        projected.push(x * scale, z * scale); // Using x and z for the 2D plane
        originalIndicesMap.push(originalPointIndex); // Store mapping
    }

    return { projected, southPoleIndex, originalIndicesMap };
}

// New function to add south pole triangles and ensure all indices are original.
function addSouthPoleTriangles(southPoleOriginalIndex, delaunatorInstance, originalIndicesMap) {
    const hullDelaunatorIndices = delaunatorInstance.hull; // Indices for 'projected' / 'originalIndicesMap'
    const numHullPoints = hullDelaunatorIndices.length;

    if (numHullPoints < 3) {
        // Not enough hull points to form triangles, something is wrong or the projected shape is too simple.
        // Just convert existing triangles and return.
        console.warn('South pole stitching: Not enough hull points (<3).');
        const convertedTriangles = new Int32Array(delaunatorInstance.triangles.length);
        for (let i = 0; i < delaunatorInstance.triangles.length; i++) {
            convertedTriangles[i] = originalIndicesMap[delaunatorInstance.triangles[i]];
        }
        return convertedTriangles;
    }

    // Size of the new triangles array: original projected triangles + new triangles for the pole.
    const finalTriangles = new Int32Array(delaunatorInstance.triangles.length + numHullPoints * 3);
    let currentTriangleArrIndex = 0;

    // 1. Copy existing Delaunay triangles from the projected set, converting their indices to original point indices.
    for (let i = 0; i < delaunatorInstance.triangles.length; i++) {
        finalTriangles[currentTriangleArrIndex++] = originalIndicesMap[delaunatorInstance.triangles[i]];
    }

    // 2. Add new triangles for the South Pole, connecting it to the hull edges.
    for (let j = 0; j < numHullPoints; j++) {
        const hull_d_idx_j = hullDelaunatorIndices[j];
        const hull_d_idx_k = hullDelaunatorIndices[(j + 1) % numHullPoints]; // Next hull point in CCW order

        // Convert Delaunator hull indices to original point indices
        const original_hull_pt_j = originalIndicesMap[hull_d_idx_j];
        const original_hull_pt_k = originalIndicesMap[hull_d_idx_k];

        // Add triangle (southPoleOriginalIndex, original_hull_pt_k, original_hull_pt_j)
        // Winding order: S, P_next, P_current for CCW hull when viewed from outside.
        // This should form triangles facing outwards.
        finalTriangles[currentTriangleArrIndex++] = southPoleOriginalIndex;
        finalTriangles[currentTriangleArrIndex++] = original_hull_pt_k; 
        finalTriangles[currentTriangleArrIndex++] = original_hull_pt_j;
    }
    return finalTriangles;
}

// Function to determine terrain type based on vertex position
function determineTerrainType(position, randomFloat) {
    // First check if there's a map-specific algorithm
    const mapBasedTerrain = generateMapTerrain(sphereSettings.mapType, position, randomFloat);
    if (mapBasedTerrain) {
        return mapBasedTerrain;
    }
    
    // Extract y coordinate (latitude) and normalize to [-1, 1]
    const y = position.y;
    
    // Introduce some noise based on position
    const noiseValue = Math.sin(position.x * 10) * Math.cos(position.z * 8) * 0.1;
    
    // Determine terrain type based on latitude and noise
    if (y < -0.8) {
        return TerrainType.SNOW; // South pole
    } else if (y > 0.8) {
        return TerrainType.SNOW; // North pole
    } else if (y < -0.5) {
        return randomFloat() > 0.7 ? TerrainType.TUNDRA : TerrainType.PLAINS;
    } else if (y < -0.2) {
        if (noiseValue > 0.05) return TerrainType.FOREST;
        if (noiseValue < -0.05) return TerrainType.HILLS;
        return TerrainType.PLAINS;
    } else if (y < 0.2) {
        const rand = randomFloat();
        if (rand < 0.4) return TerrainType.OCEAN;
        if (rand < 0.6) return TerrainType.COAST;
        if (noiseValue > 0.05) return TerrainType.JUNGLE;
        if (noiseValue < -0.05) return TerrainType.DESERT;
        return TerrainType.PLAINS;
    } else if (y < 0.5) {
        if (noiseValue > 0.05) return TerrainType.FOREST;
        if (noiseValue < -0.05) return TerrainType.HILLS;
        return TerrainType.PLAINS;
    } else {
        return randomFloat() > 0.7 ? TerrainType.TUNDRA : TerrainType.PLAINS;
    }
}

// Export determineTerrainType for external usage (e.g., picking/debug)
export { determineTerrainType as classifyTerrain };

// Convert terrain hex color to RGB array [0-1, 0-1, 0-1]
function getTerrainColorRGB(terrainType) {
    const hexColor = terrainColors[terrainType];
    return [
        ((hexColor >> 16) & 255) / 255,
        ((hexColor >> 8) & 255) / 255,
        (hexColor & 255) / 255
    ];
}

// Helper function to calculate spherical excess (area on unit sphere) of a spherical triangle
// vertices v1, v2, v3 are THREE.Vector3 unit vectors
function calculateSphericalTriangleExcess(v1, v2, v3) {
    // Using the formula: E = 2 * atan2( |det(v1,v2,v3)|, 1 + v1·v2 + v2·v3 + v3·v1 )
    // where det(v1,v2,v3) = v1 · (v2 x v3)
    const v2_cross_v3 = new THREE.Vector3().crossVectors(v2, v3);
    const scalarTripleProduct = v1.dot(v2_cross_v3);
    
    const denominator = 1.0 + v1.dot(v2) + v2.dot(v3) + v3.dot(v1);

    // Handle degenerate triangles or numerical precision issues leading to very small denominator
    if (Math.abs(denominator) < 1e-9) {
        return 0.0;
    }
    
    return 2.0 * Math.atan2(Math.abs(scalarTripleProduct), denominator);
}

function generateDelaunayGeometry(xyz, delaunay) {
    const {triangles} = delaunay;
    const numTriangles = triangles.length / 3;
    const geometry = [];
    const colors = [];
    const ids = [];
    const tileTerrain = {};
    const tileSphericalExcesses = {}; // Added for area calculation

    for (let t = 0; t < numTriangles; t++) {
        const a = triangles[3*t];
        const b = triangles[3*t+1];
        const c = triangles[3*t+2];
        
        // Calculate centroid position for terrain determination
        const centroidX = (xyz[3*a] + xyz[3*b] + xyz[3*c]) / 3;
        const centroidY = (xyz[3*a+1] + xyz[3*b+1] + xyz[3*c+1]) / 3;
        const centroidZ = (xyz[3*a+2] + xyz[3*b+2] + xyz[3*c+2]) / 3;
        const centroid = new THREE.Vector3(centroidX, centroidY, centroidZ).normalize();
        
        // Determine terrain type based on position
        const terrainType = determineTerrainType(centroid, RandomService.nextFloat.bind(RandomService));
        const rgb = getTerrainColorRGB(terrainType);
        tileTerrain[t] = terrainType;

        // Calculate spherical excess for this Delaunay triangle (tile t)
        const v1 = new THREE.Vector3(xyz[3*a], xyz[3*a+1], xyz[3*a+2]);
        const v2 = new THREE.Vector3(xyz[3*b], xyz[3*b+1], xyz[3*b+2]);
        const v3 = new THREE.Vector3(xyz[3*c], xyz[3*c+1], xyz[3*c+2]);
        tileSphericalExcesses[t] = calculateSphericalTriangleExcess(v1, v2, v3);

        for (let i = 0; i < 3; i++) {
            const vertex = triangles[3*t + i];
            geometry.push(xyz[3*vertex], xyz[3*vertex+1], xyz[3*vertex+2]);
            colors.push(...rgb);
            ids.push(t);
        }
    }
    
    return {geometry, colors, ids, tileTerrain, tileSphericalExcesses};
}

function generateVoronoiGeometry(points, delaunay) {
    const {triangles} = delaunay;
    const geometry = [];
    const colors = [];
    const ids = [];
    const tileTerrain = {};
    const tileSphericalExcesses = {}; // Added for area calculation

    // 1. Pre-compute triangle centers (simple centroid projected to sphere)
    const centers = [];
    for (let t = 0; t < triangles.length / 3; t++) {
        const a = triangles[3 * t];
        const b = triangles[3 * t + 1];
        const c = triangles[3 * t + 2];

        const center = new THREE.Vector3(
            points[3 * a] + points[3 * b] + points[3 * c],
            points[3 * a + 1] + points[3 * b + 1] + points[3 * c + 1],
            points[3 * a + 2] + points[3 * b + 2] + points[3 * c + 2]
        ).divideScalar(3).normalize();
        centers.push(center);
    }

    // 2. Build mapping from vertex -> adjacent triangles
    const vertexToTriangles = new Map();
    for (let t = 0; t < triangles.length / 3; t++) {
        for (let i = 0; i < 3; i++) {
            const v = triangles[3 * t + i];
            if (!vertexToTriangles.has(v)) vertexToTriangles.set(v, []);
            vertexToTriangles.get(v).push(t);
        }
    }

    // Helper to generate consistent tangent basis for a vertex normal
    function computeBasis(normal) {
        let tangent = new THREE.Vector3(0, 0, 1).cross(normal);
        if (tangent.lengthSq() < 1e-6) {
            tangent = new THREE.Vector3(0, 1, 0).cross(normal); // fallback if normal ~ (0,0,1)
        }
        tangent.normalize();
        const bitangent = normal.clone().cross(tangent);
        return { tangent, bitangent };
    }

    const numVertices = points.length / 3;
    for (let v = 0; v < numVertices; v++) {
        const adjacent = vertexToTriangles.get(v);
        if (!adjacent) continue;

        // Deduplicate in case of repeated triangle indices
        const uniqueAdj = Array.from(new Set(adjacent));
        if (uniqueAdj.length < 3) continue; // need at least three unique triangles to form a cell

        const normal = new THREE.Vector3(points[3 * v], points[3 * v + 1], points[3 * v + 2]).normalize();
        const { tangent, bitangent } = computeBasis(normal);

        // Sort adjacent triangle centers by their angle around the vertex
        const centersWithAngle = uniqueAdj.map(tIdx => {
            const c = centers[tIdx];
            const vec = c.clone().sub(normal.clone().multiplyScalar(c.dot(normal))).normalize(); // project onto tangent plane
            const angle = Math.atan2(vec.dot(bitangent), vec.dot(tangent));
            return { tIdx, angle, vertex: c }; // Store vertex for convenience
        }).sort((a, b) => a.angle - b.angle);

        // Determine terrain type based on vertex position
        const terrainType = determineTerrainType(normal, RandomService.nextFloat.bind(RandomService));
        const rgb = getTerrainColorRGB(terrainType);
        tileTerrain[v] = terrainType;
        
        // Calculate spherical excess for this Voronoi cell (tile v)
        let currentTileSphericalExcess = 0.0;
        const polygonVertices = centersWithAngle.map(cwa => cwa.vertex);

        if (polygonVertices.length >= 3) { // Need at least 3 vertices for a polygon
            for (let j = 0; j < polygonVertices.length; j++) {
                const p_i = polygonVertices[j];
                const p_next = polygonVertices[(j + 1) % polygonVertices.length];
                // Triangle is (tileCenter, p_i, p_next)
                currentTileSphericalExcess += calculateSphericalTriangleExcess(normal, p_i, p_next);
            }
        }
        tileSphericalExcesses[v] = currentTileSphericalExcess;

        for (let i = 0; i < centersWithAngle.length; i++) {
            const c1 = centers[centersWithAngle[i].tIdx];
            const c2 = centers[centersWithAngle[(i + 1) % centersWithAngle.length].tIdx];

            geometry.push(
                c1.x, c1.y, c1.z,
                c2.x, c2.y, c2.z,
                normal.x, normal.y, normal.z
            );
            // push color for 3 vertices
            colors.push(rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2]);
            // push tile ids for 3 vertices (all belong to vertex v)
            ids.push(v, v, v);
        }
    }

    return { geometry, colors, ids, tileTerrain, tileSphericalExcesses };
}

// Constants for drawing modes
export const DrawMode = {
  POINTS: 'points',
  DELAUNAY: 'delaunay',
  VORONOI: 'voronoi',
  CENTROID: 'centroid'
};

// Settings object to store sphere generation parameters
export const sphereSettings = {
  drawMode: DrawMode.VORONOI,
  algorithm: 1,
  numPoints: Const.DEFAULT_NUMBER_OF_GLOBE_TILES,
  jitter: Const.DEFAULT_JITTER,
  mapType: defaultMapType,
  outlineVisible: true,
  numPlates: Const.DEFAULT_TECHTONIC_PLATES,
  viewMode: 'terrain',
  elevationBias: Const.DEFAULT_ELEVATION_BIAS,
  // radius: Const.DEFAULT_GLOBE_RADIUS // Radius is now a global constant: Const.GLOBE_RADIUS
};

// Main function to generate the planet geometry
export function generatePlanetGeometryGroup(config) {
    const { radius = Const.GLOBE_RADIUS } = config; // Default to the global constant if not provided
    const N = sphereSettings.numPoints;
    const jitter = sphereSettings.jitter;
    const algorithm = sphereSettings.algorithm;
    const drawMode = sphereSettings.drawMode;
    
    let points;
    // Bind RandomService.nextFloat for convenience
    const randomFloat = RandomService.nextFloat.bind(RandomService);

    if(algorithm === 1){
        points = generateFibonacciSphere1(N, jitter, randomFloat);
    } else {
        points = generateFibonacciSphere2(N, jitter, randomFloat);
    }
    
    // Project points for triangulation
    const { projected, southPoleIndex, originalIndicesMap } = stereographicProjection(points);
    
    let completeTriangles; // Will hold all triangles with original indices
    const delaunatorInstance = new Delaunator(projected);

    if (southPoleIndex !== -1 && originalIndicesMap && originalIndicesMap.length > 0) {
        completeTriangles = addSouthPoleTriangles(
            southPoleIndex,      // Original index of the South Pole
            delaunatorInstance,  // Result of Delaunator(projected)
            originalIndicesMap   // Map from Delaunator's indices to original indices
        );
    } else {
        // Fallback: If no south pole handling (e.g., southPoleIndex is -1) or map is missing/empty,
        // just convert the existing triangles from delaunatorInstance.
        // This case should ideally not happen if points always include a south pole.
        console.warn('South pole stitching skipped or originalIndicesMap empty.');
        completeTriangles = new Int32Array(delaunatorInstance.triangles.length);
        for (let i = 0; i < delaunatorInstance.triangles.length; i++) {
            if (originalIndicesMap && originalIndicesMap[delaunatorInstance.triangles[i]] !== undefined) {
                 completeTriangles[i] = originalIndicesMap[delaunatorInstance.triangles[i]];
            } else {
                // This would indicate a serious issue: a Delaunay index is out of bounds for originalIndicesMap.
                // For robustness, one might skip this triangle or use a placeholder, but it signals a deeper problem.
                console.error('Error mapping Delaunay index to original index.');
                // As a temporary fallback, just copy the (problematic) delaunay index.
                // This part of the fallback might need more thought if it's ever hit.
                completeTriangles[i] = delaunatorInstance.triangles[i]; 
            }
        }
    }
    
    // This object now holds the complete triangulation with original point indices.
    const sphereTriangulation = { triangles: completeTriangles };

    // Create base group
    const group = new THREE.Group();
    
    // Generate geometry based on draw mode
    let geometry, colors, ids, tileTerrain, tileSphericalExcesses;
    if (drawMode === DrawMode.VORONOI) {
        ({geometry, colors, ids, tileTerrain, tileSphericalExcesses} = generateVoronoiGeometry(points, sphereTriangulation));
    } else if (drawMode === DrawMode.DELAUNAY) {
        ({geometry, colors, ids, tileTerrain, tileSphericalExcesses} = generateDelaunayGeometry(points, sphereTriangulation));
    }
    
    if (geometry && colors) {
        // Scale geometry to desired radius
        for (let i = 0; i < geometry.length; i += 3) {
            geometry[i] *= radius;
            geometry[i + 1] *= radius;
            geometry[i + 2] *= radius;
        }
        
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(geometry, 3));
        geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        if (ids && ids.length === geometry.length / 3) {
            geom.setAttribute('tileId', new THREE.Int32BufferAttribute(ids, 1));
        }
        
        const material = new THREE.MeshBasicMaterial({
            vertexColors: true,
            side: THREE.FrontSide
        });
        
        const mesh = new THREE.Mesh(geom, material);
        mesh.userData.isMainMesh = true;
        mesh.userData.tileTerrain = tileTerrain;
        if (tileSphericalExcesses) {
            mesh.userData.tileSphericalExcesses = tileSphericalExcesses; // Store for later use
        }
        group.add(mesh);

        // Build custom boundary edges only between distinct tileIds
        const boundaryPositions = [];
        const tileEdges = {};
        const tileNeighborSets = {};
        const edgeMap = new Map();
        const vertCount = geometry.length / 3;
        const triCount = vertCount / 3;

        function pushEdge(aIdx, bIdx, tileA, tileB) {
            const ax0 = geometry[aIdx*3], ay0 = geometry[aIdx*3+1], az0 = geometry[aIdx*3+2];
            const bx0 = geometry[bIdx*3], by0 = geometry[bIdx*3+1], bz0 = geometry[bIdx*3+2];

            const vecA = new THREE.Vector3(ax0, ay0, az0).normalize().multiplyScalar(radius*1.001);
            const vecB = new THREE.Vector3(bx0, by0, bz0).normalize().multiplyScalar(radius*1.001);

            const ax = vecA.x, ay = vecA.y, az = vecA.z;
            const bx = vecB.x, by = vecB.y, bz = vecB.z;
            boundaryPositions.push(ax,ay,az, bx,by,bz);
            if(!tileEdges[tileA]) tileEdges[tileA] = [];
            tileEdges[tileA].push(ax,ay,az, bx,by,bz);
            if(!tileEdges[tileB]) tileEdges[tileB] = [];
            tileEdges[tileB].push(ax,ay,az, bx,by,bz);

            // neighbor tracking
            if(!tileNeighborSets[tileA]) tileNeighborSets[tileA] = new Set();
            if(!tileNeighborSets[tileB]) tileNeighborSets[tileB] = new Set();
            tileNeighborSets[tileA].add(tileB);
            tileNeighborSets[tileB].add(tileA);
        }

        for (let t=0;t<triCount;t++){
            const i0 = t*3, i1 = i0+1, i2 = i0+2;
            const tid = ids[i0];
            const triEdges = [[i0,i1],[i1,i2],[i2,i0]];
            for(const [a,b] of triEdges){
                const ax0 = geometry[a*3], ay0=geometry[a*3+1], az0=geometry[a*3+2];
                const bx0 = geometry[b*3], by0=geometry[b*3+1], bz0=geometry[b*3+2];
                const key = (ax0<bx0 || (ax0===bx0 && ay0<by0) || (ax0===bx0 && ay0===by0 && az0< bz0)) ?
                  `${ax0.toFixed(5)}_${ay0.toFixed(5)}_${az0.toFixed(5)}|${bx0.toFixed(5)}_${by0.toFixed(5)}_${bz0.toFixed(5)}` :
                  `${bx0.toFixed(5)}_${by0.toFixed(5)}_${bz0.toFixed(5)}|${ax0.toFixed(5)}_${ay0.toFixed(5)}_${az0.toFixed(5)}`;

                if(!edgeMap.has(key)){
                    edgeMap.set(key, tid);
                } else {
                    const otherTid = edgeMap.get(key);
                    if(otherTid!==tid){
                        pushEdge(a,b, tid, otherTid);
                    }
                }
            }
        }

        if(boundaryPositions.length>0){
            const outlineGeo = new THREE.BufferGeometry();
            outlineGeo.setAttribute('position', new THREE.Float32BufferAttribute(boundaryPositions,3));
            const lineMat = new THREE.LineBasicMaterial({
                color:0x000000,
                transparent:true,
                opacity:0.16,
                depthTest:true,
                depthWrite:false,
                polygonOffset:true,
                polygonOffsetFactor:-1,
                polygonOffsetUnits:-1
            });
            const outlineLines = new THREE.LineSegments(outlineGeo, lineMat);
            outlineLines.userData.isOutline = true;
            outlineLines.visible = sphereSettings.outlineVisible;
            group.add(outlineLines);
            group.userData.outlineLines = outlineLines;
        }

        // store tileEdges map for highlighting
        mesh.userData.tileEdges = tileEdges;
        // store neighbor map
        const neighborObj = {};
        Object.keys(tileNeighborSets).forEach(id=>{
            neighborObj[id] = Array.from(tileNeighborSets[id]);
        });
        mesh.userData.tileNeighbors = neighborObj;
    }
    
    return group;
}
