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

import HavokPhysics from '@babylonjs/havok';
import { HavokPlugin, PhysicsShapeCylinder, PhysicsShapeSphere, PhysicsAggregate, PhysicsShapeType } from '@babylonjs/core';

import { debugPhysics } from './physics/Physics';

export class FirstPhysics {
  private scene: Scene;
  private havok;
  private havokPlugin;

  private pcShape;
  private lemmingShape;

  private pc;
  private camera;

  private groundMeshes;

  private controlType: 'pc' | 'camera' = 'pc';
  private input: GameInput;

  constructor() {
  }

  setupInput = () => {
    const input = this.input = new GameInput(this.scene);

    const SPEED = 10;

    const movePlayer = (deltaTime, amountForward, amountRight) => {
      // character mesh faces positive X which is not "forwards" for BabylonJS
      // const moveVec = pc.calcRotatePOV(-amountForward * deltaTime, 0, amountRight * deltaTime);
      if (this.controlType === 'pc') {
        const moveVec = this.pc.calcRotatePOV(-amountRight * deltaTime, 0, -amountForward * deltaTime);
        this.pc.position.addInPlace(moveVec);
        this.camera.position.addInPlace(moveVec);
      } else {
        // const moveVec = this.pc.calcRotatePOV(-amountRight * deltaTime, 0, -amountForward * deltaTime);
        // this.pc.position.addInPlace(moveVec);
        // this.camera.position.addInPlace(moveVec);
      }
    }

    input.addAction('togglePhysics', {
      type: 'pressed',
      callback: (action) => {
        debugPhysics(this.scene);
      },
    });

    input.addAction('toggleControl', {
      type: 'pressed',
      callback: (action) => {
        console.log(`Toggle input control`);
        this.controlType = this.controlType === 'pc' ? 'camera' : 'pc';
      },
    });

    input.addAction('forward', {
      type: 'held',
      callback: (action, deltaTime) => {
        movePlayer(deltaTime, SPEED, 0);
      },
    });
    input.addAction('back', {
      type: 'held',
      callback: (action, deltaTime) => {
        movePlayer(deltaTime, -SPEED, 0);
      },
    });
    input.addAction('left', {
      type: 'held',
      callback: (action, deltaTime) => {
        movePlayer(deltaTime, 0, -SPEED);
      },
    });
    input.addAction('right', {
      type: 'held',
      callback: (action, deltaTime) => {
        movePlayer(deltaTime, 0, SPEED);
      },
    });

  }

  setupPhysics = async () => {
    const scene = this.scene;
    this.havok = await HavokPhysics();
    this.havokPlugin = new HavokPlugin(true, this.havok);
    scene.enablePhysics(new Vector3(0, -9.8, 0), this.havokPlugin);


    this.lemmingShape = new PhysicsShapeSphere(
      new Vector3(5, 10, 0),
      3,
      scene,
    );

    this.pcShape = new PhysicsShapeCylinder(
      new Vector3(5, 10, 0),
      new Vector3(5, 14, 0),
      3,
      scene,
    );

    const pcPhysics = new PhysicsAggregate(this.pc, PhysicsShapeType.SPHERE,{
      mass: 1, restitution: 0.75,
    }, scene);

    for (const gm of this.groundMeshes) {
      const groundPhysics = new PhysicsAggregate(gm, PhysicsShapeType.BOX,{
        mass: 0,
      }, scene);
    }

    debugPhysics(scene);

  }

  createScene = async (engine: Engine, canvas) => {
    // Create our first scene.
    const scene = new Scene(engine);
    this.scene = scene;

    const camera = this.camera = createCamera(scene, canvas);
    const [pc] = await loadCharacterA(scene, new Vector3(0, 0, 0));
    this.pc = pc;
    pc.addRotation(0, -Math.PI/2, 0);
    pc.position.y = 15;

    this.setupInput();

    const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI")

    createWorld(scene);

    this.groundMeshes = createGround(scene);

    await this.setupPhysics();

    return scene;
  }
}

function createCamera(scene: Scene, canvas): Camera {
  // This creates and positions a free camera (non-mesh)
  var camera = new FreeCamera("camera1", new Vector3(0, 18, 8), scene);

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

  return scene;
}

export async function createFirstPhysicsScene(engine: Engine, canvas) {
  const clz = new FirstPhysics();
  return clz.createScene(engine, canvas);
}



