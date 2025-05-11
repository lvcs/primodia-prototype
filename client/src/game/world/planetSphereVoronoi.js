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
    
    // Project from south pole onto z = 1 plane
    for (let i = 0; i < points.length; i += 3) {
        const x = points[i];
        const y = points[i + 1];
        const z = points[i + 2];
        
        // Skip south pole (will be handled specially)
        if (y > -0.99999) {
            const scale = 1 / (1 + y);
            projected.push(x * scale, z * scale);
        }
    }
    
    return projected;
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
    const {triangles, halfedges} = delaunay;
    const geometry = [];
    const colors = [];
    
    // Calculate all triangle centers first
    const centers = [];
    for (let t = 0; t < triangles.length / 3; t++) {
        const i0 = triangles[3 * t];
        const i1 = triangles[3 * t + 1];
        const i2 = triangles[3 * t + 2];
        
        // Calculate circumcenter
        const p0 = new THREE.Vector3(
            points[3 * i0],
            points[3 * i0 + 1],
            points[3 * i0 + 2]
        );
        const p1 = new THREE.Vector3(
            points[3 * i1],
            points[3 * i1 + 1],
            points[3 * i1 + 2]
        );
        const p2 = new THREE.Vector3(
            points[3 * i2],
            points[3 * i2 + 1],
            points[3 * i2 + 2]
        );
        
        // Calculate circumcenter on sphere surface
        const e1 = p1.clone().sub(p0);
        const e2 = p2.clone().sub(p0);
        const n = e1.cross(e2).normalize();
        const center = p0.clone().add(p1).add(p2).divideScalar(3).normalize();
        
        centers.push(center);
    }
    
    // Process all edges to create Voronoi cells
    for (let e = 0; e < triangles.length; e++) {
        const t1 = Math.floor(e / 3);
        const t2 = Math.floor(halfedges[e] / 3);
        
        // Skip boundary edges
        if (t2 === -1) continue;
        
        // Get the vertex this edge belongs to
        const p = triangles[e];
        const vertex = new THREE.Vector3(
            points[3 * p],
            points[3 * p + 1],
            points[3 * p + 2]
        );
        
        const center1 = centers[t1];
        const center2 = centers[t2];
        
        const rgb = randomColor(p);
        
        // Create two triangles for each Voronoi edge
        geometry.push(
            center1.x, center1.y, center1.z,
            center2.x, center2.y, center2.z,
            vertex.x, vertex.y, vertex.z
        );
        
        // Add colors
        for (let i = 0; i < 3; i++) {
            colors.push(rgb[0], rgb[1], rgb[2]);
        }
    }
    
    return {geometry, colors};
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
    const projected = stereographicProjection(points);
    const delaunay = new Delaunator(projected);
    
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