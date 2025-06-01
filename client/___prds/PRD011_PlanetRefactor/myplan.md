


const planet = new THREE.Group();
planet.add( polarIndicators );
planet.position.set(0,0,0);

const world = new THREE.Group();
world.add( planet );

scene.add( world );