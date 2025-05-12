import * as THREE from 'three';
import Delaunator from 'delaunator';
import { TerrainType, terrainColors } from './terrain.js';
import { MapType, defaultMapType, generateMapTerrain } from './mapTypes.js';
import { debug } from '../debug.js';

// Cache for random lat/lon offsets
const _randomLat = [];
const _randomLon = [];

function generateFibonacciSphere1(N, jitter) {
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
            const angle = Math.random() * Math.PI * 2;
            const amount = Math.random() * jitter;
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

function generateFibonacciSphere2(N, jitter) {
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
            const angle = Math.random() * Math.PI * 2;
            const amount = Math.random() * jitter;
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
    const projected = [];
    let southPoleIndex = -1;
    
    // Project from south pole onto z = 1 plane
    for (let i = 0; i < points.length; i += 3) {
        const x = points[i];
        const y = points[i + 1];
        const z = points[i + 2];
        
        // Mark south pole index
        if (y <= -0.99999) {
            southPoleIndex = i / 3;
            continue;
        }
        
        const scale = 1 / (1 + y);
        projected.push(x * scale, z * scale);
    }
    
    return { projected, southPoleIndex };
}

function addSouthPoleToMesh(southPoleId, {triangles, halfedges}) {
    const numSides = triangles.length;
    
    // Find unpaired edges (the convex hull)
    const unpairedEdges = [];
    for (let s = 0; s < numSides; s++) {
        if (halfedges[s] === -1) {
            unpairedEdges.push(s);
        }
    }
    
    const numUnpairedEdges = unpairedEdges.length;
    const numNewTriangles = numUnpairedEdges;
    
    // Create new arrays with space for the additional triangles
    const newTriangles = new Int32Array(numSides + 3 * numNewTriangles);
    const newHalfedges = new Int32Array(numSides + 3 * numNewTriangles);
    
    // Copy existing triangles and halfedges
    newTriangles.set(triangles);
    newHalfedges.set(halfedges);
    
    // Add new triangles connecting the hull to the south pole
    for (let i = 0; i < numUnpairedEdges; i++) {
        const edge = unpairedEdges[i];
        const nextEdge = unpairedEdges[(i + 1) % numUnpairedEdges];
        
        const baseIndex = numSides + 3 * i;
        
        // Create new triangle
        newTriangles[baseIndex] = triangles[edge];
        newTriangles[baseIndex + 1] = triangles[nextEdge];
        newTriangles[baseIndex + 2] = southPoleId;
        
        // Update halfedges
        newHalfedges[baseIndex] = -1;  // Outer edge
        newHalfedges[baseIndex + 1] = baseIndex + ((i + 1 < numUnpairedEdges) ? 5 : -3 * (numUnpairedEdges - 1));
        newHalfedges[baseIndex + 2] = baseIndex - 3;
        
        if (i > 0) {
            newHalfedges[baseIndex - 1] = baseIndex + 1;
        }
    }
    
    // Connect the last triangle to the first
    if (numUnpairedEdges > 0) {
        newHalfedges[numSides + 3 * numUnpairedEdges - 1] = numSides + 1;
    }
    
    return {
        triangles: newTriangles,
        halfedges: newHalfedges
    };
}

// Function to determine terrain type based on vertex position
function determineTerrainType(position) {
    // First check if there's a map-specific algorithm
    const mapBasedTerrain = generateMapTerrain(sphereSettings.mapType, position);
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
        return Math.random() > 0.7 ? TerrainType.TUNDRA : TerrainType.PLAINS;
    } else if (y < -0.2) {
        if (noiseValue > 0.05) return TerrainType.FOREST;
        if (noiseValue < -0.05) return TerrainType.HILLS;
        return TerrainType.PLAINS;
    } else if (y < 0.2) {
        const rand = Math.random();
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
        return Math.random() > 0.7 ? TerrainType.TUNDRA : TerrainType.PLAINS;
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

function generateDelaunayGeometry(xyz, delaunay) {
    const {triangles} = delaunay;
    const numTriangles = triangles.length / 3;
    const geometry = [];
    const colors = [];
    const ids = [];
    const tileTerrain = {};
    
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
        
        for (let i = 0; i < 3; i++) {
            const vertex = triangles[3*t + i];
            geometry.push(xyz[3*vertex], xyz[3*vertex+1], xyz[3*vertex+2]);
            colors.push(...rgb);
            ids.push(t);
        }
    }
    
    return {geometry, colors, ids, tileTerrain};
}

function generateVoronoiGeometry(points, delaunay) {
    const {triangles} = delaunay;
    const geometry = [];
    const colors = [];
    const ids = [];
    const tileTerrain = {};

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
            return { tIdx, angle };
        }).sort((a, b) => a.angle - b.angle);

        // Determine terrain type based on vertex position
        const terrainType = determineTerrainType(normal);
        const rgb = getTerrainColorRGB(terrainType);
        tileTerrain[v] = terrainType;

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

    return { geometry, colors, ids, tileTerrain };
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
  numPoints: 96000,
  jitter: 0.5,
  rotation: 0.0,
  mapType: defaultMapType,
  outlineVisible: true
};

// Main function to generate the planet geometry
export function generatePlanetGeometryGroup(config) {
    const { radius = 10 } = config;
    const N = sphereSettings.numPoints;
    const jitter = sphereSettings.jitter;
    const algorithm = sphereSettings.algorithm;
    const drawMode = sphereSettings.drawMode;
    const rotation = sphereSettings.rotation;
    
    // Generate points using selected algorithm
    const points = algorithm === 2 ? 
        generateFibonacciSphere2(N, jitter) : 
        generateFibonacciSphere1(N, jitter);
    
    // Project points for triangulation
    const { projected, southPoleIndex } = stereographicProjection(points);
    let delaunay = new Delaunator(projected);
    
    // Add south pole triangles
    if (southPoleIndex !== -1) {
        delaunay = addSouthPoleToMesh(southPoleIndex, delaunay);
    }
    
    // Create base group
    const group = new THREE.Group();
    
    // Generate geometry based on draw mode
    let geometry, colors, ids, tileTerrain;
    if (drawMode === DrawMode.VORONOI) {
        ({geometry, colors, ids, tileTerrain} = generateVoronoiGeometry(points, delaunay));
    } else if (drawMode === DrawMode.DELAUNAY) {
        ({geometry, colors, ids, tileTerrain} = generateDelaunayGeometry(points, delaunay));
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
        group.add(mesh);

        // Build custom boundary edges only between distinct tileIds
        const boundaryPositions = [];
        const tileEdges = {};
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
    }
    
    // Apply rotation
    if (rotation !== 0) {
        group.rotation.y = rotation * Math.PI / 180;
    }
    
    return group;
} 