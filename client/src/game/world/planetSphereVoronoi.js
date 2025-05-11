import * as THREE from 'three';
import Delaunator from 'delaunator';
import { TerrainType, ResourceType, terrainColors, resourceMarkers } from './constants.js';
import { debug, error } from '../debug.js';

// --- Helper Functions (adapted from Red Blob Games or new) ---

/**
 * Generates 3D Cartesian points on a sphere using a Fibonacci lattice.
 * @param {number} n - Number of points.
 * @param {number} radius - Sphere radius.
 * @param {number} jitter - Amount of random displacement (0 to 1).
 * @param {number} algorithmId - 1 or 2 for different Fibonacci algorithms.
 * @returns {Array<THREE.Vector3>} Array of 3D points.
 */
function generateFibonacciSpherePoints(n, radius, jitter, algorithmId = 1) {
    const points = [];
    const phi = Math.PI * (Math.sqrt(5) - 1); // Golden angle

    for (let i = 0; i < n; i++) {
        let y, r_at_y, theta;
        if (algorithmId === 1) {
            y = 1 - (i / (n - 1)) * 2; // y goes from 1 to -1
            r_at_y = Math.sqrt(1 - y * y);
            theta = phi * i;
        } else { // Algorithm 2 (from Red Blob Games demo, slightly different y distribution)
            y = (2 * i + 1) / n - 1;
            r_at_y = Math.sqrt(1 - y*y);
            theta = i * 2.399963229728653; // Approx 2.pi.phi_conjugate
        }

        let x = Math.cos(theta) * r_at_y;
        let z = Math.sin(theta) * r_at_y;

        if (jitter > 0) {
            // Apply jitter by small random rotations (spherical coordinates)
            let spherical = new THREE.Spherical().setFromCartesianCoords(x, y, z);
            spherical.theta += (Math.random() - 0.5) * jitter * 0.5; 
            spherical.phi += (Math.random() - 0.5) * jitter * 0.5;
            spherical.makeSafe(); // Keep phi within [0, PI]
            const vec = new THREE.Vector3().setFromSpherical(spherical);
            x = vec.x;
            y = vec.y;
            z = vec.z;
        }
        points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
    }
    return points;
}

/**
 * Projects 3D points on a sphere to a 2D plane using stereographic projection.
 * Assumes the projection pole is (0, 0, -radius) [South Pole for Z-up] or (0, -radius, 0) [South Pole for Y-up].
 * We'll assume Y-up, so projection pole is (0, -R, 0).
 * The point (0, R, 0) [North Pole] projects to infinity.
 * @param {Array<THREE.Vector3>} points3D - Array of 3D points on the sphere.
 * @param {number} radius - Sphere radius.
 * @returns {Array<number>} Flat array of 2D coordinates [x0, y0, x1, y1, ...].
 */
function stereographicProject(points3D, radius) {
    const projectedCoords = [];
    for (const p of points3D) {
        // Formula for projection from (0, -R, 0) onto y=0 plane:
        // x' = p.x * (2R / (R + p.y))
        // z' = p.z * (2R / (R + p.y))
        // We need to handle the case where p.y is close to -R (projection pole)
        // And also the point that projects to infinity (0, R, 0)
        // For Delaunator, we project all but one point (the "infinity" point).
        
        // Red Blob Games projects from Z-pole. If our points are Y-polar:
        // Project from (0, -R, 0) onto the plane y = 0.
        // x_proj = x / (1 + y/R)  (if projecting onto a plane at distance R from origin)
        // z_proj = z / (1 + y/R)
        // Let's use the formula that maps to plane z=0 from pole (0,0,-1) for unit sphere from RedBlob
        // then adapt. If our pole is (0, -R, 0), and we project other points:
        // The point (0,R,0) is the one at infinity.
        // For any other point (x,y,z), scale = R / (R + y_sphere)
        // projected_x = x_sphere * scale_factor
        // projected_z = z_sphere * scale_factor
        // But Delaunator expects 2D coords. Let's use the RedBlob method: project from (0,0,-1) to z=0 plane.
        // Requires rotating our points if our pole isn't (0,0,-1).

        // Simpler: for points (px, py, pz) on unit sphere, projection from (0,0,-1) to z=0 plane:
        // x' = px / (1+pz)
        // y' = py / (1+pz)
        // We need to ensure one of our points is effectively the south pole for this projection.
        // The RedBlob code picks the *last* point in its r_xyz array, then does Delaunay on r_xyz WITHOUT that last point.
        // Let's adopt this. The input `points3D` to this function should be all points *except* the one chosen as projection pole.
        
        projectedCoords.push(p.x / (1 + p.z), p.y / (1 + p.z)); // Assuming points are on unit sphere and projection from (0,0,-1)
    }
    return projectedCoords;
}

// Placeholder for the complex logic of adding the south pole back to the mesh
function addSouthPoleToDelaunay(southPoleIndex, points3D, delaunay) {
    debug('addSouthPoleToDelaunay: Stitching south pole - placeholder.');
    // This function needs to: 
    // 1. Identify edges on the convex hull of the 2D Delaunay triangulation.
    // 2. For each hull edge, create two new triangles fanning out to the southPoleIndex.
    // 3. This means adding new entries to delaunay.triangles and delaunay.halfedges.
    // This is non-trivial. Referring to RedBlobGames's addSouthPoleToMesh is key.
    // For now, we'll just return the original delaunay object.
    // `delaunay.hull` gives indices of points on the hull.
    return delaunay; 
}


/**
 * Calculates triangle centers (circumcenters or centroids) on the sphere.
 * @param {Array<THREE.Vector3>} spherePoints - Original 3D seed points on the sphere.
 * @param {Delaunator} delaunay - Delaunay object (after spherical adjustments).
 * @param {string} mode - 'voronoi' (circumcenter) or 'centroid'.
 * @param {number} radius - Sphere radius.
 * @returns {Array<THREE.Vector3>} Array of 3D triangle center points.
 */
function calculateSphericalTriangleCenters(spherePoints, delaunay, mode, radius) {
    const centers = [];
    for (let i = 0; i < delaunay.triangles.length; i += 3) {
        const p1 = spherePoints[delaunay.triangles[i]];
        const p2 = spherePoints[delaunay.triangles[i+1]];
        const p3 = spherePoints[delaunay.triangles[i+2]];

        if (!p1 || !p2 || !p3) {
            error('Undefined point in triangle ', i/3, delaunay.triangles[i], delaunay.triangles[i+1], delaunay.triangles[i+2]);
            centers.push(new THREE.Vector3()); // Placeholder
            continue;
        }

        if (mode === 'centroid') {
            const centroid = new THREE.Vector3().add(p1).add(p2).add(p3).divideScalar(3);
            centroid.normalize().multiplyScalar(radius);
            centers.push(centroid);
        } else { // Voronoi (circumcenter) - Placeholder, complex on a sphere
            debug('Spherical circumcenter calculation is complex, using centroid as placeholder for Voronoi mode.');
            const centroid = new THREE.Vector3().add(p1).add(p2).add(p3).divideScalar(3);
            centroid.normalize().multiplyScalar(radius);
            centers.push(centroid);
        }
    }
    return centers;
}


/**
 * Main exported function to generate planet geometry.
 */
export function generatePlanetGeometryGroup(config) {
    debug('generatePlanetGeometryGroup | Config:', config);
    const { numPoints, jitter, algorithmId, drawMode, radius } = config;

    // 1. Generate 3D seed points on sphere surface
    const seedPoints3D = generateFibonacciSpherePoints(numPoints, radius, jitter, algorithmId);
    
    // For stereographic projection, we need to pick a pole (e.g., the last point)
    // and project all *other* points. The RedBlob demo seems to normalize points to unit sphere for projection.
    const unitSeedPoints3D = seedPoints3D.map(p => p.clone().normalize());
    const projectionPole3D = unitSeedPoints3D[unitSeedPoints3D.length - 1]; // Choose last point as pole
    const pointsToProject3D = unitSeedPoints3D.slice(0, -1); // All but the pole

    // Rotate points so projectionPole3D is at (0,0,-1) for standard stereographic projection
    // This is a complex step. For initial simplicity, we might get artifacts if pole isn't (0,0,-1).
    // Or, adapt projection formula. RedBlob code does rotation.
    // For now, let's assume points are somewhat generally distributed and proceed with a simplified projection.
    // The `d3-geo-voronoi` we used before handles this rotation/projection internally.
    // If we follow RedBlob's direct Delaunator approach, this rotation is important for correctness.
    // TEMP: Let's use a simplified approach and see the artifacts first, then refine projection.
    // The points for Delaunator should be 2D.
    let projectedCoords2D = [];
    const cartesianForDelaunator = []; // Store the 3D points that correspond to projectedCoords2D

    // Simple projection: project all points assuming they are NOT the North Pole (0,R,0) if Y is up.
    // RedBlob projects from Z south pole. If our Y is polar, we need to adapt.
    // Let's try to use the same projection as in RedBlob (from Z south pole) by rotating points first.
    // For now, very simplified: take x, y of points (effectively projecting along Z axis - NOT stereographic)
    // This is WRONG for stereographic but will let Delaunator run.
    
    // Correct approach requires careful handling of the projection pole.
    // Let's use the first N-1 points and assume the Nth is the pole for now, and project onto XY plane
    // This is still not quite right for stereographic for Delaunator.
    
    // The RedBlob code `stereographicProjection(r_xyz)` expects r_xyz to be ALREADY rotated such that the pole of projection is aligned.
    // The `planet-generation.js` itself doesn't show this rotation before calling `stereographicProjection` for the main set.
    // It DOES rotate the camera. The `stereographicProjection` in that JS file is: 
    // function stereographicProjection(p) { let R = []; for (let i = 0; i < p.length/3; i++) { R.push(p[3*i]/(1+p[3*i+2]), p[3*i+1]/(1+p[3*i+2])); } return R; }
    // This implies input p[3*i+2] (z-coordinate) is used, so it projects from a Z-pole.
    // Our Fibonacci points use Y as the polar axis typically.

    // We MUST prepare points for Delaunator as a flat array [x0,y0, x1,y1, ...]
    // Let's take seedPoints3D, pick the last as the pole (pole3D), project the others.
    const pointsForProjection = seedPoints3D.slice(0, -1);
    const poleSeedPoint = seedPoints3D[seedPoints3D.length -1];

    const delaunayInput2D = [];
    pointsForProjection.forEach(p => {
        // Simplified stereographic projection from Y-south-pole (0, -radius, 0) to Y=0 plane.
        // Assuming p is NOT (0, radius, 0) (the north pole)
        const scale = (2 * radius) / (radius + p.y); 
        delaunayInput2D.push(p.x * scale, p.z * scale); 
    });

    debug('Points for Delaunator (2D projected):', delaunayInput2D.length / 2);
    let delaunay = new Delaunator(delaunayInput2D);
    debug('Initial Delaunay computed. Hull size:', delaunay.hull.length);

    // TODO: Implement robust south pole stitching.
    // For now, the Delaunay result is for a plane and doesn't wrap the sphere.
    // The `spherePoints` used for triangle centers should be the original `seedPoints3D`
    // mapped to the indices from the planar `delaunay` object. This needs care.
    // The `pointsForProjection` are the ones indexed by `delaunay.triangles`.

    // Placeholder for spherical triangle centers
    const triangleCenters3D = calculateSphericalTriangleCenters(pointsForProjection, delaunay, drawMode, radius);

    const planetMeshes = new THREE.Group();

    // 1. Ocean base (always there)
    const oceanMaterial = new THREE.MeshPhongMaterial({ color: terrainColors[TerrainType.OCEAN], transparent:true, opacity:0.7, shininess: 30 });
    const oceanGeometry = new THREE.SphereGeometry(radius * 0.99, 64, 32);
    const oceanSphere = new THREE.Mesh(oceanGeometry, oceanMaterial);
    oceanSphere.userData.isOcean = true;
    planetMeshes.add(oceanSphere);

    // 2. Generate requested geometry based on drawMode
    if (drawMode === 'points') {
        const geom = new THREE.BufferGeometry().setFromPoints(seedPoints3D);
        const mat = new THREE.PointsMaterial({ color: 0xffffff, size: radius * 0.05 });
        planetMeshes.add(new THREE.Points(geom, mat));
    } else if (drawMode === 'delaunay') {
        // This will draw the PLANAR Delaunay projection for now, not spherical triangles yet.
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const points = [];
        for (let i = 0; i < delaunay.triangles.length; i++) {
            const pIndex = delaunay.triangles[i];
            // These are indices into the `pointsForProjection` array for 3D coords
            // or into `delaunayInput2D` (every 2 elements) for 2D coords.
            // For simplicity, let's draw based on original seed points if possible,
            // but Delaunay is on the projected 2D points.
            // THIS PART NEEDS CAREFUL RECONSTRUCTION OF SPHERICAL DELAUNAY TRIANGLES
            // For now, just showing it won't be spherical.
            if (pointsForProjection[pIndex]) {
                 points.push(pointsForProjection[pIndex]);
            }
        }
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        // This will create lines for each edge of each triangle, so many duplicates.
        // A proper line mesh from delaunay.halfedges would be better.
        const mesh = new THREE.LineSegments(geom, lineMaterial); // Incorrect way to draw triangles as lines
        planetMeshes.add(mesh);
        debug('Delaunay mode drawing is a non-spherical placeholder.')

    } else if (drawMode === 'voronoi' || drawMode === 'centroid') {
        // This requires iterating through each original seedPoint,
        // finding its surrounding Delaunay triangles, then connecting their centers (triangleCenters3D).
        debug('Voronoi/Centroid mode drawing is a placeholder.');
        // Placeholder: draw triangleCenters as points
        const geom = new THREE.BufferGeometry().setFromPoints(triangleCenters3D);
        const mat = new THREE.PointsMaterial({ color: 0xffff00, size: radius * 0.06 });
        planetMeshes.add(new THREE.Points(geom, mat));
    }

    return { 
        meshGroup: planetMeshes, 
        cells: [], // Placeholder, to be filled with actual cell data later
        config 
    };
} 