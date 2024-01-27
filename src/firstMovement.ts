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

export class FirstMovement {
  private _scene: Scene;

  constructor() {
  }

  createScene = (engine: Engine, canvas) => {
    // Create our first scene.
    const scene = new Scene(engine);

    const camera = createCamera(scene, canvas);

    const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI")

    const input = new GameInput(scene);
    input.addAction('forward', {
      type: 'held',
      callback: (action, deltaTime) => {
        camera.position.z -= 10 * deltaTime;
      },
    });
    input.addAction('back', {
      type: 'held',
      callback: (action, deltaTime) => {
        camera.position.z += 10 * deltaTime;
      },
    });
    input.addAction('left', {
      type: 'held',
      callback: (action, deltaTime) => {
        camera.position.x += 10 * deltaTime;
      },
    });
    input.addAction('right', {
      type: 'held',
      callback: (action, deltaTime) => {
        camera.position.x -= 10 * deltaTime;
      },
    });

    createWorld(scene);

    loadCharacterA(scene, new Vector3(3, 1, 2));

    return scene;
  }
}

function createCamera(scene: Scene, canvas): Camera {
  // This creates and positions a free camera (non-mesh)
  var camera = new FreeCamera("camera1", new Vector3(0, 5, 10), scene);

  // This targets the camera to scene origin
  camera.setTarget(Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  return camera;
}

function createWorld(scene: Scene) {
  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new HemisphericLight("light", new Vector3(1, 2, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  const g1 = createGround(scene);

  return scene;
}

export function createFirstMovementScene(engine: Engine, canvas) {
  const clz = new FirstMovement();
  return clz.createScene(engine, canvas);
}


