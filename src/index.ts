import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Scene } from '@babylonjs/core/scene';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { DefaultLoadingScreen } from '@babylonjs/core/Loading/loadingScreen';
import "@babylonjs/loaders/glTF"; 
import "@babylonjs/loaders/OBJ"; 

// const ASSETS = "/Volumes/Data/work/ggj24/assets";
const ASSETS = "assets";
const ASSETS_BUILDER = `${ASSETS}/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/`;
const ASSETS_MECHA = `${ASSETS}/MechGolem/`;

import { createFirstStepScene } from './firstStep.js';
import { createLoadingMeshScene } from './loadingMesh';

const SCENES = [
  {
    name: 'firstStep',
    createScene: createFirstStepScene,
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

const selectedScene = SCENES[1].createScene(engine, canvas);

// Render every frame
engine.runRenderLoop(() => {
  // scene.render();
  selectedScene.render();
});
