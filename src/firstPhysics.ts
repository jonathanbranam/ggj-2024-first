import { Engine } from '@babylonjs/core/Engines/engine';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { FollowCamera } from '@babylonjs/core/Cameras/followCamera';
import { Vector3, Quaternion } from '@babylonjs/core/Maths/math.vector';
import { Ray } from '@babylonjs/core';
import { Scene } from '@babylonjs/core/scene';
import { AdvancedDynamicTexture } from '@babylonjs/gui';
import { HemisphericLight, Camera, ActionManager, ExecuteCodeAction, ActionEvent, IKeyboardEvent } from '@babylonjs/core';
import { Mesh, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { Inspector } from '@babylonjs/inspector';

import { GameInput } from './input/GameInput';
import { Music } from './music/Music';
import { createGround, loadSpikeFloor } from './world/World';
import { loadCharacterA } from './character/PlayerMesh';
import { loadLemming } from './lemming/Lemming';

import HavokPhysics from '@babylonjs/havok';
import { PhysicsMotionType, PhysicsBody, HavokPlugin, PhysicsShapeCapsule, PhysicsShapeSphere, PhysicsAggregate, PhysicsShapeType } from '@babylonjs/core';

import { RayHelper } from '@babylonjs/core';

import { debugPhysics } from './physics/Physics';

const CAMERA_OFFSET = new Vector3(0, 18, 8);
const SPEED = 10;
const ANG_SCALE = 0.3;
const FORCE_SCALE = 15;
const FORCE = 300;


export class FirstPhysics {
  private scene: Scene;
  private havok;
  private havokPlugin;

  private pcShape;
  private lemmingShape;
  private pcBody;
  private groundBody;
  private pcFacingRay;
  private pcBackRay;
  private pcFacingRayHelper;

  private lemming1;
  private lemmingBody;

  private pc;
  private lookCamera;
  private followCamera;

  private groundMeshes;

  private music: Music;

  private controlType: 'pc' | 'camera' = 'pc';
  private input: GameInput;

  constructor() {
  }

  setupInput = () => {
    const input = this.input = new GameInput(this.scene);

    this.scene.onBeforeRenderObservable.add(() => {
      if (this.controlType === 'pc') {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
        const goal = this.pc.position.add(CAMERA_OFFSET);
        // this.camera.position = goal;
        const result = new Vector3(0,0,0);
        this.lookCamera.position = Vector3.SmoothToRef(this.lookCamera.position, goal, deltaTime, 0.2, result);
      }
    });

    const movePlayer = (deltaTime, amountForward, amountRight) => {
      // character mesh faces positive X which is not "forwards" for BabylonJS
      if (this.controlType === 'pc') {

        const curRot = this.pc.rotationQuaternion;

        const forward = new Vector3(0, 0, -1);
        const right = new Vector3(1, 0, 0);
        right.applyRotationQuaternionInPlace(curRot);
        forward.applyRotationQuaternionInPlace(curRot);

        const forces = forward
          .scale(amountForward)
          .add(right.scale(-amountRight))
          .scale(FORCE_SCALE);

        // compute a quaternion to look in the direction of movement and then
        // rotation towards it

        this.pcBody.applyForce(
          forces,
          this.pc.position, // world position of force applied
        );

        if (amountRight > 0) {
          this.pcBody.setAngularVelocity(new Vector3(0, amountRight*ANG_SCALE, 0));
        } else if (amountRight < 0) {
          this.pcBody.setAngularVelocity(new Vector3(0, amountRight*ANG_SCALE, 0));
        }

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
        if (this.controlType === 'camera') {
          this.scene.activeCamera = this.lookCamera;
        } else {
          this.scene.activeCamera = this.followCamera;
        }
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

  setupMusic = async () => {
    this.music = new Music(this.scene);
    this.music.play1();

    this.input.addAction('mute', {
      type: 'pressed',
      callback: () => {
        if (this.music.muted) {
          this.music.unmute();
        } else {
          this.music.mute();
        }
      },
    });
  }

  setupGui = async () => {
    const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI")
  }

  setupLemmings = async () => {
    const [lemming1] = await loadLemming(this.scene);
    this.lemming1 = lemming1;
    lemming1.addRotation(0, -Math.PI/8, 0);
    lemming1.scalingDeterminant = 0.8;
    lemming1.bakeCurrentTransformIntoVertices();
    lemming1.position = new Vector3(10, 5, -8);

  }

  setupPlayer = async () => {
    const [pc] = await loadCharacterA(this.scene, new Vector3(0, 0, 0));
    this.pc = pc;

    pc.addRotation(0, -Math.PI/2, 0);
    pc.bakeCurrentTransformIntoVertices();
    pc.position.y = 5;
    pc.position.z = -5;

    this.pcFacingRay = new Ray(this.pc.position.clone(), new Vector3(0, 0, -1), 2);
    this.pcBackRay = new Ray(this.pc.position.clone(), new Vector3(0, 0, 1), 2);
    this.pcFacingRayHelper = RayHelper.CreateAndShow(this.pcFacingRay, this.scene, Color3.Green());
    RayHelper.CreateAndShow(this.pcBackRay, this.scene, Color3.Red());

    this.scene.onBeforeRenderObservable.add(() => {
      const forward = new Vector3(0, 0, -1);
      const up = new Vector3(0, 1, 0);
      forward.applyRotationQuaternionInPlace(this.pc.rotationQuaternion);
      up.applyRotationQuaternionInPlace(this.pc.rotationQuaternion);

      let newPos = this.pc.position.clone();
      newPos.addInPlace(up.scale(2));

      this.pcFacingRay.origin = newPos;
      this.pcBackRay.origin = newPos;
      // this.pcFacingRay.origin = this.pc.position;

      this.pcFacingRay.direction = forward;
      this.pcBackRay.direction = forward.scale(-1);
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
      1.1,
      scene,
    );
    const lemmingBody = this.lemmingBody = new PhysicsBody(
      this.lemming1, PhysicsMotionType.DYNAMIC, false, scene
    );
    lemmingBody.setMassProperties({
      mass: 1,
      inertia: new Vector3(0, 1, 0),
      // centerOfMass, inertia, inertiaOrientation
    });
    lemmingBody.shape = this.lemmingShape;
    // lemmingBody.setLinearDamping(1);
    // lemmingBody.setAngularDamping(5);

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
    const pcBody = this.pcBody = new PhysicsBody(
      this.pc, PhysicsMotionType.DYNAMIC, false, scene
    );
    pcBody.setMassProperties({
      mass: 5,
      inertia: new Vector3(0, 1, 0),
      // centerOfMass, inertia, inertiaOrientation
    });
    pcBody.shape = this.pcShape;
    pcBody.setLinearDamping(1);
    pcBody.setAngularDamping(5);

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

    // debugPhysics(scene);

  }

  createScene = async (engine: Engine, canvas) => {
    // Create our first scene.
    const scene = this.scene = new Scene(engine);

    await this.setupPlayer();

    await this.createCameras(scene, canvas);
    await this.setupInput();

    // await this.setupGui();
    await this.setupMusic();

    await this.createWorld(scene);

    await this.setupLemmings();

    this.groundMeshes = createGround(scene);

    await this.setupPhysics();

    return scene;
  }

  createCameras = async (scene: Scene, canvas) => {
    const startPos = this.pc.position.add(CAMERA_OFFSET);
    // TODO: Use universal camera instead
    const lookCamera = this.lookCamera = new FreeCamera("freeCamera", startPos, scene);
    lookCamera.setTarget(new Vector3(0, 0, 0));
    lookCamera.attachControl(canvas, true);

    const followCamera = this.followCamera = new FollowCamera("followCamera", startPos, scene);
    followCamera.radius = 25;
    // followCamera.rotationOffset = -90;
    followCamera.heightOffset = 18;
    followCamera.cameraAcceleration = 0.01;
    followCamera.maxCameraSpeed = 10;
    followCamera.lockedTarget = this.pc;

    scene.activeCamera = followCamera;
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



