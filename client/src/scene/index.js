import { Scene, Color } from 'three';
import { SCENE_COSMOS_BACKGROUND_COLOR } from './sceneConfig.js';
import { useSceneStore } from '@stores';

const setupScene = () => {
    const scene = new Scene();
    scene.background = new Color(SCENE_COSMOS_BACKGROUND_COLOR);
    
    useSceneStore.getState().setScene(scene);
    
    return scene;
}

// setupScene is only used internally by core/setup.js
export { setupScene }; 