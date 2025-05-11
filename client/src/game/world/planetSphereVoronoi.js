import * as THREE from 'three';
import Delaunator from 'delaunator';
import { TerrainType, terrainColors } from './constants.js';
import { debug } from '../debug.js';

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

// Function to generate points using Algorithm 1 (Fibonacci Spiral)
function generateFibonacciSpherePoints(n, radius, jitter) {
    const points = [];
    const phi = Math.PI * (Math.sqrt(5) - 1);
    for (let i = 0; i < n; i++) {
        // Basic Fibonacci spiral distribution
        const y = 1 - (i / (n - 1)) * 2;
        const r_at_y = Math.sqrt(1 - y * y);
        const theta = phi * i;
        
        // Calculate the base position
        let x = Math.cos(theta) * r_at_y;
        let y_pos = y;
        let z = Math.sin(theta) * r_at_y;
        
        // Apply jitter if specified
        if (jitter > 0) {
            const jitterScale = jitter * 0.05; // Scale down jitter for better control
            x += (Math.random() * 2 - 1) * jitterScale;
            y_pos += (Math.random() * 2 - 1) * jitterScale;
            z += (Math.random() * 2 - 1) * jitterScale;
            
            // Normalize back to the sphere surface
            const len = Math.sqrt(x*x + y_pos*y_pos + z*z);
            x = (x / len) * radius;
            y_pos = (y_pos / len) * radius;
            z = (z / len) * radius;
        } else {
            x *= radius;
            y_pos *= radius;
            z *= radius;
        }
        
        points.push(new THREE.Vector3(x, y_pos, z));
    }
    return points;
}

// Function to generate points using Algorithm 2 (Improved Distribution)
function generateAlternativeSpherePoints(n, radius, jitter) {
    const points = [];
    // Algorithm 2 implementation (Weighted Voronoi Stippling approximation)
    // This algorithm gives more even distribution by trying to maximize minimum distance
    
    const increment = Math.PI * (3 - Math.sqrt(5));
    const offset = 2 / n;
    
    for (let i = 0; i < n; i++) {
        const y = ((i * offset) - 1) + (offset / 2);
        const r = Math.sqrt(1 - y * y);
        const phi = i * increment;
        
        // Calculate the base position
        let x = Math.cos(phi) * r;
        let y_pos = y;
        let z = Math.sin(phi) * r;
        
        // Apply jitter if specified
        if (jitter > 0) {
            const jitterScale = jitter * 0.05;
            x += (Math.random() * 2 - 1) * jitterScale;
            y_pos += (Math.random() * 2 - 1) * jitterScale;
            z += (Math.random() * 2 - 1) * jitterScale;
            
            // Normalize back to the sphere surface
            const len = Math.sqrt(x*x + y_pos*y_pos + z*z);
            x = (x / len) * radius;
            y_pos = (y_pos / len) * radius;
            z = (z / len) * radius;
        } else {
            x *= radius;
            y_pos *= radius;
            z *= radius;
        }
        
        points.push(new THREE.Vector3(x, y_pos, z));
    }
    return points;
}

// Stereographic projection for Delaunay triangulation
function stereographicProjectZ(points3D) {
    const projectedPoints = [];
    for (let i = 0; i < points3D.length; i++) {
        const p = points3D[i];
        // Project from 3D sphere to 2D plane
        const x = p.x / (1 + p.z);
        const y = p.y / (1 + p.z);
        projectedPoints.push(x, y);
    }
    return projectedPoints;
}

// Calculate the circumcenter of a triangle on a sphere
function sphereCircumcenter(a, b, c) {
    // Cross product to get the normal
    const ab = new THREE.Vector3().subVectors(b, a);
    const ac = new THREE.Vector3().subVectors(c, a);
    const normal = new THREE.Vector3().crossVectors(ab, ac).normalize();
    
    // Calculate circumcenter
    const circumcenter = new THREE.Vector3(
        a.x + b.x + c.x,
        a.y + b.y + c.y,
        a.z + b.z + c.z
    ).normalize();
    
    // Make sure it's on the same side as the normal
    if (circumcenter.dot(normal) < 0) {
        circumcenter.multiplyScalar(-1);
    }
    
    return circumcenter;
}

// Calculate the centroid of a triangle on a sphere
function sphereCentroid(a, b, c) {
    // Simple average of the three points, then normalize to the sphere surface
    const centroid = new THREE.Vector3(
        (a.x + b.x + c.x) / 3,
        (a.y + b.y + c.y) / 3,
        (a.z + b.z + c.z) / 3
    );
    return centroid.normalize();
}

// Apply rotation to the sphere
function applyRotation(points, rotation) {
    const rotationMatrix = new THREE.Matrix4().makeRotationY(rotation * Math.PI / 180);
    for (let i = 0; i < points.length; i++) {
        points[i].applyMatrix4(rotationMatrix);
    }
    return points;
}

// Main function to generate the planet geometry
export function generatePlanetGeometryGroup(config) {
    const { radius = 10, detail = 2 } = config;
    let numPoints = Math.pow(10, detail + 1); // Scale points based on detail
    
    // Override with sphere settings if available
    numPoints = sphereSettings.numPoints || numPoints;
    const jitter = sphereSettings.jitter || 0;
    const algorithm = sphereSettings.algorithm || 1;
    const drawMode = sphereSettings.drawMode || DrawMode.POINTS;
    const rotation = sphereSettings.rotation || 0;
    
    debug('Generating planet with:',
          'radius:', radius,
          'numPoints:', numPoints,
          'jitter:', jitter,
          'algorithm:', algorithm,
          'drawMode:', drawMode,
          'rotation:', rotation);
    
    // Generate points based on selected algorithm
    let points3D;
    if (algorithm === 2) {
        points3D = generateAlternativeSpherePoints(numPoints, radius, jitter);
    } else {
        points3D = generateFibonacciSpherePoints(numPoints, radius, jitter);
    }
    
    // Apply rotation if specified
    if (rotation !== 0) {
        points3D = applyRotation(points3D, rotation);
    }
    
    // Create base group and ocean
    const group = new THREE.Group();
    const oceanMaterial = new THREE.MeshPhongMaterial({ 
        color: terrainColors[TerrainType.OCEAN],
        shininess: 20 
    });
    const oceanGeometry = new THREE.SphereGeometry(radius * 0.99, 64, 32);
    const oceanSphere = new THREE.Mesh(oceanGeometry, oceanMaterial);
    oceanSphere.userData.isOcean = true;
    group.add(oceanSphere);
    
    // Project the points for Delaunay triangulation
    const projected2D = stereographicProjectZ(points3D);
    const delaunay = new Delaunator(projected2D);
    
    // Draw based on selected mode
    switch (drawMode) {
        case DrawMode.POINTS:
            const pointsGeom = new THREE.BufferGeometry().setFromPoints(points3D);
            const pointsMat = new THREE.PointsMaterial({ 
                color: 0xffffff,
                size: radius * 0.05,
                sizeAttenuation: true
            });
            group.add(new THREE.Points(pointsGeom, pointsMat));
            break;
            
        case DrawMode.DELAUNAY:
            // Draw Delaunay triangulation
            const lineGeom = new THREE.BufferGeometry();
            const lineVerts = [];
            for (let i = 0; i < delaunay.triangles.length; i += 3) {
                const a = points3D[delaunay.triangles[i]];
                const b = points3D[delaunay.triangles[i+1]];
                const c = points3D[delaunay.triangles[i+2]];
                lineVerts.push(a.x, a.y, a.z, b.x, b.y, b.z);
                lineVerts.push(b.x, b.y, b.z, c.x, c.y, c.z);
                lineVerts.push(c.x, c.y, c.z, a.x, a.y, a.z);
            }
            lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
            const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
            group.add(new THREE.LineSegments(lineGeom, lineMat));
            break;
            
        case DrawMode.VORONOI:
            // Draw Voronoi diagram using Red Blob Games approach
            const centers = []; // Calculate circumcenters for all triangles
            const numTriangles = delaunay.triangles.length / 3;
            
            // Calculate circumcenter for each triangle
            for (let t = 0; t < numTriangles; t++) {
                const a = points3D[delaunay.triangles[3*t]];
                const b = points3D[delaunay.triangles[3*t+1]];
                const c = points3D[delaunay.triangles[3*t+2]];
                const center = sphereCircumcenter(a, b, c).multiplyScalar(radius);
                centers.push(center);
            }
            
            // Create triangle data for drawing Voronoi cells
            const voronoiVerts = [];
            const voronoiColors = [];
            
            // Cache for random colors
            const colorCache = {};
            const getRandomColor = (seed) => {
                if (!colorCache[seed]) {
                    colorCache[seed] = new THREE.Color(
                        0.5 + Math.random() * 0.5,
                        0.6 + Math.random() * 0.3,
                        0.5 + Math.random() * 0.5
                    );
                }
                return colorCache[seed];
            };
            
            // We need to connect triangles where they share an edge
            for (let s = 0; s < delaunay.triangles.length; s++) {
                const halfedge = delaunay.halfedges[s];
                if (halfedge !== -1 && s < halfedge) { // Process each edge once
                    const t1 = Math.floor(s / 3);
                    const t2 = Math.floor(halfedge / 3);
                    
                    // Get the vertex from this edge - it forms the Voronoi cell
                    const vertexId = delaunay.triangles[s];
                    const vertex = points3D[vertexId];
                    
                    // Get centers of both triangles
                    const center1 = centers[t1];
                    const center2 = centers[t2];
                    
                    // Assign random color based on vertex
                    const color = getRandomColor(vertexId);
                    
                    // Create a triangle connecting:
                    // 1. Center of current triangle
                    // 2. Center of adjacent triangle 
                    // 3. The point this side belongs to
                    voronoiVerts.push(
                        center1.x, center1.y, center1.z,
                        center2.x, center2.y, center2.z,
                        vertex.x, vertex.y, vertex.z
                    );
                    
                    // Add the same color for all vertices in the triangle
                    voronoiColors.push(
                        color.r, color.g, color.b,
                        color.r, color.g, color.b,
                        color.r, color.g, color.b
                    );
                }
            }
            
            // Create geometry from vertices and colors
            const voronoiGeom = new THREE.BufferGeometry();
            voronoiGeom.setAttribute('position', new THREE.Float32BufferAttribute(voronoiVerts, 3));
            voronoiGeom.setAttribute('color', new THREE.Float32BufferAttribute(voronoiColors, 3));
            
            // Create mesh with the geometry
            const voronoiMat = new THREE.MeshBasicMaterial({ 
                vertexColors: true,
                side: THREE.DoubleSide
            });
            group.add(new THREE.Mesh(voronoiGeom, voronoiMat));
            
            // Add wireframe for better cell visibility
            const voronoiWire = new THREE.LineSegments(
                new THREE.WireframeGeometry(voronoiGeom),
                new THREE.LineBasicMaterial({ 
                    color: 0x000000, 
                    transparent: true, 
                    opacity: 0.1,
                    linewidth: 0.5
                })
            );
            group.add(voronoiWire);
            
            // Also render the points
            const voronoiPointsGeom = new THREE.BufferGeometry().setFromPoints(points3D);
            const voronoiPointsMat = new THREE.PointsMaterial({ 
                color: 0x000000,
                size: radius * 0.01,
                sizeAttenuation: true
            });
            group.add(new THREE.Points(voronoiPointsGeom, voronoiPointsMat));
            break;
            
        case DrawMode.CENTROID:
            // Draw Centroid-based diagram (similar to Voronoi but using centroids)
            const centroidGeom = new THREE.BufferGeometry();
            const centroidVerts = [];
            
            for (let i = 0; i < delaunay.triangles.length; i += 3) {
                const a = points3D[delaunay.triangles[i]];
                const b = points3D[delaunay.triangles[i+1]];
                const c = points3D[delaunay.triangles[i+2]];
                const center = sphereCentroid(a, b, c).multiplyScalar(radius);
                
                // Connect centroid to the midpoints of each edge
                const midAB = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5).normalize().multiplyScalar(radius);
                const midBC = new THREE.Vector3().addVectors(b, c).multiplyScalar(0.5).normalize().multiplyScalar(radius);
                const midCA = new THREE.Vector3().addVectors(c, a).multiplyScalar(0.5).normalize().multiplyScalar(radius);
                
                centroidVerts.push(center.x, center.y, center.z, midAB.x, midAB.y, midAB.z);
                centroidVerts.push(center.x, center.y, center.z, midBC.x, midBC.y, midBC.z);
                centroidVerts.push(center.x, center.y, center.z, midCA.x, midCA.y, midCA.z);
            }
            
            centroidGeom.setAttribute('position', new THREE.Float32BufferAttribute(centroidVerts, 3));
            const centroidMat = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 1 });
            group.add(new THREE.LineSegments(centroidGeom, centroidMat));
            break;
    }
    
    return group;
} 