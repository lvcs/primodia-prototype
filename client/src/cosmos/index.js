import { Scene, Color } from 'three';
import { COSMOS_BACKGROUND_COLOR } from './cosmosConfig.js';

const cosmos = new Scene();

const setupCosmos = () => {
    cosmos.background = new Color(COSMOS_BACKGROUND_COLOR);
    return cosmos;
}

export  { setupCosmos };