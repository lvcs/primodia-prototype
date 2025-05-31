import { Scene, Color } from 'three';
import { SCENE_COSMOS_BACKGROUND_COLOR } from './sceneConfig.js';
import { useSceneStore } from '@stores';

const setupScene = () => {
    const scene = new Scene();
    scene.background = new Color(SCENE_COSMOS_BACKGROUND_COLOR);
    
    // Store the scene in the sceneStore
    useSceneStore.getState().setScene(scene);
    
    return scene;
}

export { setupScene }; 