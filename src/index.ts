import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { Inspector } from '@babylonjs/inspector';
import { DefaultLoadingScreen } from '@babylonjs/core/Loading/loadingScreen';

import { createFirstStepScene } from './firstStep.js';
import { createLoadingMeshScene } from './loadingMesh';
import { createInputTestScene } from './inputTest';
import { createFirstWorldScene } from './firstWorld';
import { createFirstMovementScene } from './firstMovement';

const SCENES = [
  {
    name: 'firstMovement',
    createScene: createFirstMovementScene,
  },
  {
    name: 'firstWorld',
    createScene: createFirstWorldScene,
  },
  {
    name: 'firstStep',
    createScene: createFirstStepScene,
  },
  {
    name: 'inputTest',
    createScene: createInputTestScene,
  },
  {
    name: 'loadingMesh',
    createScene: createLoadingMeshScene,
  },
]

// Get the canvas element from the DOM.
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

// Associate a Babylon Engine to it.
const engine = new Engine(canvas);
engine.loadingScreen = new DefaultLoadingScreen(canvas);

async function loadScene(): Promise<Scene> {
  return SCENES[0].createScene(engine, canvas);
}

loadScene().then((scene) => {
  // Render every frame
  engine.runRenderLoop(() => {
    scene.render();
  });
});
