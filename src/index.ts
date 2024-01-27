import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { Inspector } from '@babylonjs/inspector';
import { DefaultLoadingScreen } from '@babylonjs/core/Loading/loadingScreen';

import { createFirstStepScene } from './firstStep.js';
import { createLoadingMeshScene } from './loadingMesh';
import { createInputTestScene } from './inputTest';
import { createFirstWorldScene } from './firstWorld';

const SCENES = [
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

const selectedScene = SCENES[0].createScene(engine, canvas);

// Render every frame
engine.runRenderLoop(() => {
  selectedScene.render();
});
