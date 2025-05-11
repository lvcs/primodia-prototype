import * as THREE from 'three';
import Delaunator from 'delaunator';
import { TerrainType, terrainColors } from './constants.js';
import { debug } from '../debug.js';

// Cache for random colors
const _randomColor = {};

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

function randomColor(index) {
    if (!_randomColor[index]) {
        _randomColor[index] = [
            0.5 + 0.5 * Math.random(),
            0.5 + 0.5 * Math.random(),
            0.5 + 0.5 * Math.random()
        ];
    }
    return _randomColor[index];
}

function generateDelaunayGeometry(xyz, delaunay) {
    const {triangles} = delaunay;
    const numTriangles = triangles.length / 3;
    const geometry = [];
    const colors = [];
    
    for (let t = 0; t < numTriangles; t++) {
        const a = triangles[3*t];
        const b = triangles[3*t+1];
        const c = triangles[3*t+2];
        const rgb = randomColor(a+b+c);
        
        for (let i = 0; i < 3; i++) {
            const vertex = triangles[3*t + i];
            geometry.push(xyz[3*vertex], xyz[3*vertex+1], xyz[3*vertex+2]);
            colors.push(...rgb);
        }
    }
    
    return {geometry, colors};
}

function generateVoronoiGeometry(points, delaunay) {
    const {triangles} = delaunay;
    const geometry = [];
    const colors = [];

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
        if (!adjacent || adjacent.length < 3) continue; // need at least a triangle fan

        const normal = new THREE.Vector3(points[3 * v], points[3 * v + 1], points[3 * v + 2]).normalize();
        const { tangent, bitangent } = computeBasis(normal);

        // Sort adjacent triangle centers by their angle around the vertex
        const centersWithAngle = adjacent.map(tIdx => {
            const c = centers[tIdx];
            const vec = c.clone().sub(normal.clone().multiplyScalar(c.dot(normal))).normalize(); // project onto tangent plane
            const angle = Math.atan2(vec.dot(bitangent), vec.dot(tangent));
            return { tIdx, angle };
        }).sort((a, b) => a.angle - b.angle);

        const rgb = randomColor(v);
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
        }
    }

    return { geometry, colors };
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
  drawMode: DrawMode.POINTS,
  algorithm: 1,
  numPoints: 500,
  jitter: 0.0,
  rotation: 0.0
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
    let geometry, colors;
    if (drawMode === DrawMode.VORONOI) {
        ({geometry, colors} = generateVoronoiGeometry(points, delaunay));
    } else if (drawMode === DrawMode.DELAUNAY) {
        ({geometry, colors} = generateDelaunayGeometry(points, delaunay));
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
        
        const material = new THREE.MeshBasicMaterial({
            vertexColors: true,
            side: THREE.DoubleSide
        });
        
        group.add(new THREE.Mesh(geom, material));
    }
    
    // Apply rotation
    if (rotation !== 0) {
        group.rotation.y = rotation * Math.PI / 180;
    }
    
    return group;
} 