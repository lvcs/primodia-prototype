import * as THREE from 'three';
import Delaunator from 'delaunator';

import { Terrains } from '@game/planet/terrain/index.js';
import {
    PLANET_DRAW_MODES,
} from '@config';
import { useWorldStore } from '@stores';
import { nextFloat } from '@utils/random';

const TerrainTypeIds = Object.keys(Terrains).reduce((o,k)=>(o[k]=k,o),{});
const terrainColors = Object.fromEntries(Object.values(Terrains).map(t=>[t.id,t.color]));

function generateFibonacciPlanet(N, jitter, algorithm = 1) {
    const points = [];
    
    // Pre-calculate angular increment based on algorithm
    const angularIncrement = algorithm === 1 
        ? Math.PI * (Math.sqrt(5) - 1)  // golden ratio
        : Math.PI * (3 - Math.sqrt(5)); // ~2.39996323
    
    // Add north pole point
    points.push(0, 1, 0);
    
    // Pre-calculate common values
    const numMiddlePoints = N - 2;
    const yStep = 2.0 / (N - 1);
    
    if (jitter > 0) {
        // Jittered point generation
        for (let i = 0; i < numMiddlePoints; i++) {
            const y = 1 - (i + 1) * yStep;
            const radius = Math.sqrt(1 - y * y);
            const theta = angularIncrement * i;
            
            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;
            
            // Apply jitter
            const jitterAngle = nextFloat() * Math.PI * 2;
            const jitterAmount = nextFloat() * jitter;
            const rx = Math.cos(jitterAngle) * jitterAmount;
            const rz = Math.sin(jitterAngle) * jitterAmount;
            
            const nx = x + rx;
            const nz = z + rz;
            const invLength = 1 / Math.sqrt(nx*nx + y*y + nz*nz);
            
            points.push(nx * invLength, y * invLength, nz * invLength);
        }
    } else {
        // Non-jittered point generation (faster path)
        for (let i = 0; i < numMiddlePoints; i++) {
            const y = 1 - (i + 1) * yStep;
            const radius = Math.sqrt(1 - y * y);
            const theta = angularIncrement * i;
            
            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;
            
            points.push(x, y, z);
        }
    }
    
    // Add south pole point
    points.push(0, -1, 0);
    
    return points;
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
// NOTE: This is a placeholder function used only for initial geometry generation.
// The actual terrain classification happens later in worldGenerator.js using
// classifyTileTerrainFromProperties with elevation, moisture, temperature data.
function determineTerrainType(position) {
    // Use GRASSLAND as default placeholder - will be properly classified later
    return TerrainTypeIds.GRASSLAND;
}

// Export determineTerrainType for external usage (e.g., picking/debug)
export { determineTerrainType as classifyTerrain };

// Prepare an ordered list of terrain types for classification
const orderedTerrainTypes = Object.values(Terrains).sort((a, b) => a.priority - b.priority);

// Modern terrain classification function using sophisticated rules based on tile properties
// This is the main terrain classification system used by worldGenerator.js
export function classifyTileTerrainFromProperties(tile) {
    if (!tile) {
        console.warn('[classifyTileTerrainFromProperties] Tile is null, defaulting to GRASSLAND.');
        return TerrainTypeIds.GRASSLAND; 
    }

    // console.log(`[Classify] Tile ID: ${tile.id}, Elevation: ${tile.elevation?.toFixed(3)}, Moisture: ${tile.moisture?.toFixed(3)}, Temp: ${tile.temperature?.toFixed(3)}, OceanConn: ${tile.isOceanConnected}, IsLakeCandidate: ${tile.elevation < -0.049 && !tile.isOceanConnected}`); // DEBUG LINE - Commented out

    for (const terrainRule of orderedTerrainTypes) {
        let match = true;
        let failReason = [];

        // Elevation check
        if (tile.elevation < terrainRule.minElevation || tile.elevation > terrainRule.maxElevation) {
            failReason.push(`Elev (Tile: ${tile.elevation?.toFixed(3)}, RuleMin: ${terrainRule.minElevation ?? '-inf'}, RuleMax: ${terrainRule.maxElevation ?? '+inf'})`);
            match = false;
        }
        // Moisture check
        if (match && (tile.moisture < terrainRule.minMoisture || tile.moisture > terrainRule.maxMoisture)) {
            failReason.push(`Moist (Tile: ${tile.moisture?.toFixed(3)}, RuleMin: ${terrainRule.minMoisture ?? '0'}, RuleMax: ${terrainRule.maxMoisture ?? '1'})`);
            match = false;
        }
        // Temperature check
        if (match && (tile.temperature < terrainRule.minTemp || tile.temperature > terrainRule.maxTemp)) {
            failReason.push(`Temp (Tile: ${tile.temperature?.toFixed(3)}, RuleMin: ${terrainRule.minTemp ?? '0'}, RuleMax: ${terrainRule.maxTemp ?? '1'})`);
            match = false;
        }

        // Lake check
        if (match && terrainRule.requiresLake) {
            if (tile.isOceanConnected === false && tile.elevation < -0.049) {
                // This rule is a candidate, proceed
            } else {
                failReason.push(`Lake (Rule requires lake, tile isn't one: oceanConn=${tile.isOceanConnected}, elev=${tile.elevation?.toFixed(3)})`);
                match = false; 
            }
        }
        
        // Special handling for OCEAN (preventing non-connected low areas from being ocean)
        if (match && (terrainRule.id === 'OCEAN')) {
            if (tile.isOceanConnected === false && tile.elevation < -0.05) {
                failReason.push(`Ocean (Tile is non-ocean-connected water: elev=${tile.elevation?.toFixed(3)})`);
                match = false; 
            }
        }

        if (match) {
            // console.log(`  [Classify] Tile ID: ${tile.id} Matched rule: ${terrainRule.id}. Returning.`); // DEBUG LINE - Commented out
            return terrainRule.id;
        } else {
            // Only log if it's a land biome we are interested in debugging, to reduce noise - Commented out for now
            // if (['PLAINS', 'GRASSLAND', 'FOREST', 'JUNGLE', 'BEACH', 'TUNDRA', 'BARE', 'SCORCHED', 'TAIGA', 'TEMPERATE_DESERT', 'SUBTROPICAL_DESERT', 'MARSH'].includes(terrainRule.id)) {
            //      console.log(`  [Classify] Tile ID: ${tile.id} Rule ${terrainRule.id} (Prio: ${terrainRule.priority}) FAILED due to: ${failReason.join('; ')}`);
            // }
        }
    }

    console.warn(`  [Classify] No rule matched for Tile ID: ${tile.id}. Defaulting to GRASSLAND. Input: Elev: ${tile.elevation?.toFixed(3)}, Moist: ${tile.moisture?.toFixed(3)}, Temp: ${tile.temperature?.toFixed(3)}`); // Keep this warning
    return TerrainTypeIds.GRASSLAND; 
}

// Convert terrain hex color to RGB array [0-1, 0-1, 0-1]
function getTerrainColorRGB(terrainType) {
    const hexColor = terrainColors[terrainType];
    return [
        ((hexColor >> 16) & 255) / 255,
        ((hexColor >> 8) & 255) / 255,
        (hexColor & 255) / 255
    ];
}

// Helper function to calculate area of a spherical triangle on unit planet
// vertices v1, v2, v3 are THREE.Vector3 unit vectors
function calculateArea(v1, v2, v3) {
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

// Helper function for edge processing in planet geometry generation
function pushEdge(geometry, boundaryPositions, tileEdges, tileNeighborSets, aIdx, bIdx, tileA, tileB) {
    const worldStore = useWorldStore.getState();
    const planetRadius = worldStore.planetRadius;
    
    const ax0 = geometry[aIdx*3], ay0 = geometry[aIdx*3+1], az0 = geometry[aIdx*3+2];
    const bx0 = geometry[bIdx*3], by0 = geometry[bIdx*3+1], bz0 = geometry[bIdx*3+2];

    const vecA = new THREE.Vector3(ax0, ay0, az0).normalize().multiplyScalar(planetRadius*1.001);
    const vecB = new THREE.Vector3(bx0, by0, bz0).normalize().multiplyScalar(planetRadius*1.001);

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
        const terrainType = determineTerrainType(centroid);
        const rgb = getTerrainColorRGB(terrainType);
        tileTerrain[t] = terrainType;

        // Calculate area for this Delaunay triangle (tile t)
        const v1 = new THREE.Vector3(xyz[3*a], xyz[3*a+1], xyz[3*a+2]);
        const v2 = new THREE.Vector3(xyz[3*b], xyz[3*b+1], xyz[3*b+2]);
        const v3 = new THREE.Vector3(xyz[3*c], xyz[3*c+1], xyz[3*c+2]);
        tileSphericalExcesses[t] = calculateArea(v1, v2, v3);

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
    const tilePolygonVertices = {}; // NEW: Store polygon vertices for each tile

    // 1. Pre-compute triangle centers (simple centroid projected to planet)
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
        const terrainType = determineTerrainType(normal);
        const rgb = getTerrainColorRGB(terrainType);
        tileTerrain[v] = terrainType;
        
        // Calculate area for this Voronoi cell (tile v)
        let currentTileArea = 0.0;
        const polygonVertices = centersWithAngle.map(cwa => cwa.vertex);

        // NEW: Store polygon vertices for this tile (on unit planet)
        tilePolygonVertices[v] = polygonVertices.map(vertex => ({
            x: vertex.x,
            y: vertex.y, 
            z: vertex.z
        }));

        if (polygonVertices.length >= 3) { // Need at least 3 vertices for a polygon
            for (let j = 0; j < polygonVertices.length; j++) {
                const p_i = polygonVertices[j];
                const p_next = polygonVertices[(j + 1) % polygonVertices.length];
                // Triangle is (tileCenter, p_i, p_next)
                currentTileArea += calculateArea(normal, p_i, p_next);
            }
        }
        tileSphericalExcesses[v] = currentTileArea;

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

    return { geometry, colors, ids, tileTerrain, tileSphericalExcesses, tilePolygonVertices };
}

// Main function to generate the planet geometry
export function generatePlanetGeometryGroup() {
    // Get settings directly from worldStore
    const worldStore = useWorldStore.getState();
    const N = worldStore.numPoints;
    const jitter = worldStore.jitter;
    const algorithm = worldStore.algorithm;
    const drawMode = worldStore.drawMode;
    const outlineVisible = worldStore.outlineVisible;
    const planetRadius = worldStore.planetRadius;
    
    // Generate points using the optimized function
    const points = generateFibonacciPlanet(N, jitter, algorithm);
    
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
    const planetTriangulation = { triangles: completeTriangles };

    // Create base group
    const group = new THREE.Group();
    
    // Generate geometry based on draw mode
    let geometry, colors, ids, tileTerrain, tileSphericalExcesses, tilePolygonVertices;
    if (drawMode === PLANET_DRAW_MODES.VORONOI) {
        ({geometry, colors, ids, tileTerrain, tileSphericalExcesses, tilePolygonVertices} = generateVoronoiGeometry(points, planetTriangulation));
    } else if (drawMode === PLANET_DRAW_MODES.DELAUNAY) {
        ({geometry, colors, ids, tileTerrain, tileSphericalExcesses} = generateDelaunayGeometry(points, planetTriangulation));
    }
    
    if (geometry && colors) {
        // Scale geometry to desired radius
        for (let i = 0; i < geometry.length; i += 3) {
            geometry[i] *= planetRadius;
            geometry[i + 1] *= planetRadius;
            geometry[i + 2] *= planetRadius;
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
        if (tilePolygonVertices) {
            mesh.userData.tilePolygonVertices = tilePolygonVertices; // Store polygon vertices for tree distribution
        }
        group.add(mesh);

        // Build custom boundary edges only between distinct tileIds
        const boundaryPositions = [];
        const tileEdges = {};
        const tileNeighborSets = {};
        const edgeMap = new Map();
        const vertCount = geometry.length / 3;
        const triCount = vertCount / 3;



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
                        pushEdge(geometry, boundaryPositions, tileEdges, tileNeighborSets, a, b, tid, otherTid);
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
                opacity:0.35,
                depthTest:true,
                depthWrite:false,
                polygonOffset:true,
                polygonOffsetFactor:-1,
                polygonOffsetUnits:-1
            });
            const outlineLines = new THREE.LineSegments(outlineGeo, lineMat);
            outlineLines.userData.isOutline = true;
            outlineLines.visible = outlineVisible;
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
