import { useRenderStore, useCameraStore } from '@stores';

let resizeObserver = null;

const handleCanvasResize = () => {
  const { getCanvas, getRenderer, setCanvasDimensions } = useRenderStore.getState();
  const { camera } = useCameraStore.getState();
  
  const canvas = getCanvas();
  const renderer = getRenderer();
  
  if (!canvas || !renderer) return;
  
  const { clientWidth: width, clientHeight: height } = canvas;
  
  setCanvasDimensions(width, height);
  renderer.setSize(width, height, false);
  
  if (camera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
};

export const setupCanvasResize = () => {
  const canvas = useRenderStore.getState().getCanvas();
  
  if (!canvas) {
    console.warn('Canvas not found in render store. Cannot setup resize observer.');
    return;
  }
  
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  
  resizeObserver = new ResizeObserver(handleCanvasResize);
  resizeObserver.observe(canvas.parentElement || canvas);
  
  window.addEventListener('resize', handleCanvasResize);
  handleCanvasResize();
};

export const cleanupCanvasResize = () => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  window.removeEventListener('resize', handleCanvasResize);
}; 