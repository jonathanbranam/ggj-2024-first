import { Engine } from '@babylonjs/core/Engines/engine';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { FollowCamera } from '@babylonjs/core/Cameras/followCamera';
import { Vector3, Quaternion } from '@babylonjs/core/Maths/math.vector';
import { Scalar } from '@babylonjs/core/Maths/math.scalar';
import { Ray, Material } from '@babylonjs/core';
import { Scene } from '@babylonjs/core/scene';
import { AdvancedDynamicTexture } from '@babylonjs/gui';
import { HemisphericLight, Camera, ActionManager, ExecuteCodeAction, ActionEvent, IKeyboardEvent } from '@babylonjs/core';
import { Mesh, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { Inspector } from '@babylonjs/inspector';

import { GameInput } from './input/GameInput';
import { Music } from './music/Music';
import { createWalls, createGround, loadSpikeFloor } from './world/World';
import { loadCharacterA } from './character/PlayerMesh';
import { Lemmings } from './lemming/Lemming';

import HavokPhysics from '@babylonjs/havok';
import { PhysicsMotionType, PhysicsBody, HavokPlugin, PhysicsShapeBox, PhysicsShapeCapsule, PhysicsShapeSphere, PhysicsAggregate, PhysicsShapeType } from '@babylonjs/core';

import { RayHelper } from '@babylonjs/core';

import { debugPhysics } from './physics/Physics';
import * as _ from 'lodash';

const CAMERA_OFFSET = new Vector3(0, 18, 8);
const SPEED = 10;
const ANG_SCALE = 10; // 0.3;
const FORCE_SCALE = 800; // 15;


export class FirstPhysics {
  public scene: Scene;
  private havok;
  private havokPlugin;

  private pcShape;
  private lemmingShape;
  private pcBody;
  private groundBody;
  private pcFacingRay;
  private pcBackRay;
  private pcFacingRayHelper;

  private lemmings: Lemmings;
  private lemmingBody;

  private pc;
  private lookCamera;
  private followCamera;

  private groundMeshes;
  private wallMeshes;
  public materials: Record<string, Material> = {}

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
          .scale(FORCE_SCALE*deltaTime);

        // compute a quaternion to look in the direction of movement and then
        // rotation towards it

        this.pcBody.applyForce(
          forces,
          this.pc.position, // world position of force applied
        );

        if (amountRight > 0) {
          this.pcBody.setAngularVelocity(new Vector3(0, amountRight*ANG_SCALE*deltaTime, 0));
        } else if (amountRight < 0) {
          this.pcBody.setAngularVelocity(new Vector3(0, amountRight*ANG_SCALE*deltaTime, 0));
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

    input.addAction('spawnLemming', {
      type: 'pressed',
      callback: (action, deltaTime) => {
        this.spawnLemming();
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
    this.lemmings = new Lemmings(this);
    await this.lemmings.init();
  }

  setupMaterials = async () => {
    const scene = this.scene;

    const makeMat = (name: string, color: Color3): Material => {
      let mat = new StandardMaterial(`${name}Lemming`, scene);
      mat.diffuseColor = color;
      this.materials[name] = mat;
      return mat;
    }

    makeMat("red", Color3.Red());
    makeMat("green", Color3.Green());
    makeMat("blue", Color3.Blue());
    makeMat("purple", Color3.Purple());
    makeMat("magenta", Color3.Magenta());
    makeMat("teal", Color3.Teal());
    makeMat("yellow", Color3.Yellow());

  }

  spawnLemming = async (position?: Vector3) => {
    return this.lemmings.spawnLemming(position);
  }

  setupPlayer = async () => {
    const [pc] = await loadCharacterA(this.scene, new Vector3(0, 0, 0));
    this.pc = pc;

    // color the character
    const body = _.sample(Object.values(this.materials));
    const head = _.sample(Object.values(this.materials));
    const arms = _.sample(Object.values(this.materials));
    const legs = _.sample(Object.values(this.materials));
    for (const node of pc.getChildMeshes(false)) {
      if (node.name === "Sphere") {
        node.material = head;
      } else if (node.name === "Cylinder") {
        node.material = body;
      } else if (node.name.includes("Cube.001")) {
        node.material = arms;
      } else if (node.name.includes("Cylinder.00")) {
        node.material = legs;
      }
    }

    pc.addRotation(0, -Math.PI/2, 0);
    pc.bakeCurrentTransformIntoVertices();
    pc.position.y = 5;
    pc.position.z = -5;

    /*
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
    */
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
      this.lemmings.base, PhysicsMotionType.DYNAMIC, false, scene
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

    const groundShape = new PhysicsShapeBox(
      new Vector3(0, 0, 0),
      Quaternion.FromEulerAngles(0,0,0),
      new Vector3(4, 1, 4),
      scene,
    );
    for (const gm of this.groundMeshes) {
      const groundBody = new PhysicsBody(
        gm, PhysicsMotionType.STATIC, false, scene
      );
      groundBody.setMassProperties({
        mass: 0,
        inertia: new Vector3(0, 0, 0),
        // centerOfMass, inertia, inertiaOrientation
      });
      groundBody.shape = groundShape;
    }

    for (const wall of this.wallMeshes) {
      const wallAggregate = new PhysicsAggregate(wall, PhysicsShapeType.BOX,{
        mass: 0,
      }, scene);
    }
    // debugPhysics(scene);

  }

  createScene = async (engine: Engine, canvas) => {
    // Create our first scene.
    const scene = this.scene = new Scene(engine);

    await this.setupMaterials();
    await this.setupPlayer();

    await this.createCameras(scene, canvas);
    await this.setupInput();

    // await this.setupGui();
    await this.setupMusic();

    await this.createWorld(scene);

    await this.setupLemmings();

    this.groundMeshes = await createGround(scene);
    this.wallMeshes = await createWalls(scene);

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



