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
import { PhysicsMotionType, PhysicsBody, HavokPlugin, PhysicsShapeCapsule, PhysicsShapeSphere, PhysicsAggregate, PhysicsShapeType } from '@babylonjs/core';

import { debugPhysics } from './physics/Physics';

export class FirstPhysics {
  private scene: Scene;
  private havok;
  private havokPlugin;

  private pcShape;
  private lemmingShape;
  private pcBody;

  private pc;
  private lookCamera;
  private followCamera;

  private groundMeshes;

  private controlType: 'pc' | 'camera' = 'pc';
  private input: GameInput;

  constructor() {
  }

  setupInput = () => {
    const input = this.input = new GameInput(this.scene);

    const SPEED = 10;
    const FORCE = 100;
    let cameraOffset = new Vector3(0, 18, 8);

    this.scene.onBeforeRenderObservable.add(() => {
      if (this.controlType === 'pc') {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
        const goal = this.pc.position.add(cameraOffset);
        // this.camera.position = goal;
        const result = new Vector3(0,0,0);
        this.lookCamera.position = Vector3.SmoothToRef(this.lookCamera.position, goal, deltaTime, 0.2, result);
      }
    });

    const movePlayer = (deltaTime, amountForward, amountRight) => {
      // character mesh faces positive X which is not "forwards" for BabylonJS
      // const moveVec = pc.calcRotatePOV(-amountForward * deltaTime, 0, amountRight * deltaTime);
      if (this.controlType === 'pc') {
        const moveVec = this.pc.calcRotatePOV(-amountRight * deltaTime, 0, -amountForward * deltaTime).multiplyInPlace(new Vector3(FORCE, FORCE, FORCE));
        // this.pc.position.addInPlace(moveVec);
        // this.camera.position.addInPlace(moveVec);
        // this.camera.position = this.pc.position.add(cameraOffset);
        // console.log(`Applying force`, moveVec);
        this.pcBody.applyForce(
          moveVec,
          this.pc.position, // world position of force applied
        );
        // const result = new Vector3(0,0,0);
        // this.lookCamera.position = Vector3.SmoothToRef(this.lookCamera.position, goal, deltaTime, 0.2, result);
        // SetTargetTransform might be useful?
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

    // lemming physics

    this.lemmingShape = new PhysicsShapeSphere(
      new Vector3(0, 0, 0),
      3,
      scene,
    );

    // player physics

    this.pcShape = new PhysicsShapeCapsule(
      new Vector3(0, 0.5, 0),
      new Vector3(0, 2.5, 0),
      1,
      scene,
    );
    this.pcShape.material = {
      friction: 0.2,
      restitution: 0.3,
    };

    // Probably should be PhysicsMotionType.ANIMATED but then gravity didn't
    // seem to affect the body
    const pcBody = this.pcBody = new PhysicsBody(this.pc, PhysicsMotionType.DYNAMIC, false, scene)
    pcBody.setMassProperties({
      mass: 1,
      inertia: Vector3.Zero(), // this blocks rotational impacts
      // centerOfMass, inertia, inertiaOrientation
    });
    pcBody.shape = this.pcShape;

    // const pcPhysics = new PhysicsAggregate(this.pc, this.pcShape, {
    //   mass: 1, restitution: 0.75,
    // }, scene);


    // const pcPhysics = new PhysicsAggregate(this.pc, PhysicsShapeType.SPHERE,{
    //   mass: 1, restitution: 0.75,
    // }, scene);
    //
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

    const [pc] = await loadCharacterA(scene, new Vector3(0, 0, 0));
    this.pc = pc;
    pc.addRotation(0, -Math.PI/2, 0);
    pc.position.y = 15;

    this.createCameras(scene, canvas);
    this.setupInput();

    const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI")

    this.createWorld(scene);

    this.groundMeshes = createGround(scene);

    await this.setupPhysics();

    return scene;
  }
  createCameras = (scene: Scene, canvas) => {
    // This creates and positions a free camera (non-mesh)
    this.lookCamera = new FreeCamera("camera1", new Vector3(0, 18, 8), scene);

    // This targets the camera to scene origin
    this.lookCamera.setTarget(Vector3.Zero());

    // This attaches the camera to the canvas
    this.lookCamera.attachControl(canvas, true);
  }

  createWorld = (scene: Scene) => {
    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new HemisphericLight("light", new Vector3(1, 2, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    return scene;
  }

}

export async function createFirstPhysicsScene(engine: Engine, canvas) {
  const clz = new FirstPhysics();
  return clz.createScene(engine, canvas);
}



