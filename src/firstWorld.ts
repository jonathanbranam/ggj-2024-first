import { Engine } from '@babylonjs/core/Engines/engine';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { AdvancedDynamicTexture } from '@babylonjs/gui';
import { HemisphericLight, Camera, ActionManager, ExecuteCodeAction, ActionEvent, IKeyboardEvent } from '@babylonjs/core';
import { Mesh, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { Inspector } from '@babylonjs/inspector';

import { GameInput } from './input/GameInput';
import { createGround, loadSpikeFloor } from './world/World';
import { loadCharacterA } from './character/PlayerMesh';

function createCamera(scene: Scene, canvas): Camera {
  // This creates and positions a free camera (non-mesh)
  var camera = new FreeCamera("camera1", new Vector3(0, 5, 10), scene);

  // This targets the camera to scene origin
  camera.setTarget(Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  return camera;
}

function redGround(scene: Scene): Mesh {
  // Our built-in 'ground' shape.
  var ground = MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);

  const groundMat = new StandardMaterial("Ground Mat", scene);
  groundMat.diffuseColor = Color3.Red();
  ground.material = groundMat;

  return ground;
}

function createSphere(scene: Scene): Mesh {
  // Our built-in 'sphere' shape.
  var sphere = MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);

  // Move the sphere upward 1/2 its height
  sphere.position.y = 1;

  return sphere;
}

function createWorld(scene: Scene) {
  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new HemisphericLight("light", new Vector3(1, 2, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  createSphere(scene);

  const g1 = createGround(scene);
  const spikeFloor = loadSpikeFloor(scene, new Vector3(3, 1, 0));

  return scene;
}

export function createFirstWorldScene(engine: Engine, canvas) {
  // Create our first scene.
  const scene = new Scene(engine);

  const camera = createCamera(scene, canvas);

  const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI")

  const input = new GameInput(scene);

  createWorld(scene);

  loadCharacterA(scene, new Vector3(3, 1, 2));

  return scene;
}


