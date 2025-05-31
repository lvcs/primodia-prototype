import { Scene, Color } from 'three';
import { SCENE_BACKGROUND_COLOR } from './sceneConfig.js';

const scene = new Scene();

const setupScene = () => {
    scene.background = new Color(SCENE_BACKGROUND_COLOR);
    return scene;
}

export { setupScene }; 