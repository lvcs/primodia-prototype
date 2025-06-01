import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupRenderer } from '@/render';
import { useRenderStore } from '@stores';

// Mock THREE.js
vi.mock('three', () => ({
  WebGLRenderer: vi.fn().mockImplementation(() => ({
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    shadowMap: {
      enabled: false,
      type: null
    }
  })),
  PCFSoftShadowMap: 'PCFSoftShadowMap',
  Clock: vi.fn().mockImplementation(() => ({
    getDelta: vi.fn().mockReturnValue(0.016)
  }))
}));

// Mock other dependencies
vi.mock('@game/scene', () => ({
  setupScene: vi.fn().mockReturnValue({})
}));

vi.mock('@game/camera/', () => ({
  initializeCam: vi.fn().mockReturnValue({})
}));

describe('setupRenderer', () => {
  beforeEach(() => {
    // Reset the render store
    useRenderStore.getState().resetRenderState();
  });

  it('should throw error when no canvas is set in store', () => {
            expect(() => setupRenderer()).toThrow('setupRenderer requires a canvas to be set in the render store.');
  });

  it('should successfully setup when canvas is available in store', () => {
    // Create a mock canvas element
    const mockCanvas = {
      clientWidth: 800,
      clientHeight: 600
    };

    // Set canvas in store
    useRenderStore.getState().setCanvas(mockCanvas);

    // Should not throw
            expect(() => setupRenderer()).not.toThrow();
  });

  it('should store renderer in render store', () => {
    const mockCanvas = {
      clientWidth: 1024,
      clientHeight: 768
    };

    useRenderStore.getState().setCanvas(mockCanvas);
    
            setupRenderer();
    
    // Should store renderer in the render store
    const renderer = useRenderStore.getState().getRenderer();
    expect(renderer).toBeDefined();
  });
}); 