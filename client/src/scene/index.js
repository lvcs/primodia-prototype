import { Scene, Color, AmbientLight, DirectionalLight, HemisphereLight } from 'three';
import { 
    SCENE_COSMOS_BACKGROUND_COLOR,
    AMBIENT_LIGHT_COLOR,
    AMBIENT_LIGHT_INTENSITY,
    DIRECTIONAL_LIGHT_COLOR,
    DIRECTIONAL_LIGHT_INTENSITY,
    DIRECTIONAL_LIGHT_POSITION,
    DIRECTIONAL_LIGHT_SHADOW_MAP_SIZE,
    DIRECTIONAL_LIGHT_SHADOW_BIAS,
    HEMISPHERE_LIGHT_SKY_COLOR,
    HEMISPHERE_LIGHT_GROUND_COLOR,
    HEMISPHERE_LIGHT_INTENSITY
} from './sceneConfig.js';
import { useSceneStore } from '@stores';

const setupScene = () => {
    const scene = new Scene();
    scene.background = new Color(SCENE_COSMOS_BACKGROUND_COLOR);
    
    useSceneStore.getState().setScene(scene);
    
    setAmbientLight(scene);
    setDirectionalLight(scene);
    setHemisphereLight(scene);
    
    return scene;
}

const setAmbientLight = (scene) => {
    const ambientLight = new AmbientLight(AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY);
    scene.add(ambientLight);
    return ambientLight;
}

const setDirectionalLight = (scene) => {
    const sunLight = new DirectionalLight(DIRECTIONAL_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
    const [x, y, z] = DIRECTIONAL_LIGHT_POSITION;
    sunLight.position.set(x, y, z);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = DIRECTIONAL_LIGHT_SHADOW_MAP_SIZE;
    sunLight.shadow.mapSize.height = DIRECTIONAL_LIGHT_SHADOW_MAP_SIZE;
    sunLight.shadow.bias = DIRECTIONAL_LIGHT_SHADOW_BIAS;
    scene.add(sunLight);
    return sunLight;
}

const setHemisphereLight = (scene) => {
    const hemiplanetLight = new HemisphereLight(
        HEMISPHERE_LIGHT_SKY_COLOR, 
        HEMISPHERE_LIGHT_GROUND_COLOR, 
        HEMISPHERE_LIGHT_INTENSITY
    );
    scene.add(hemiplanetLight);
    return hemiplanetLight;
}

// setupScene is only used internally by core/setup.js
export { setupScene }; 