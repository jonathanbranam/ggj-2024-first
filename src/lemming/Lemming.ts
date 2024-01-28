import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core';
import { Scalar } from '@babylonjs/core/Maths/math.scalar';

import * as _ from 'lodash';
import { ASSETS_LEMMING } from '../constants';

import { loadGltkMesh, LoadedMesh } from '../mesh/Mesh';
import { FirstPhysics } from "../firstPhysics";

const LEMMING = "Lemming.glb";

export async function loadLemming(scene: Scene, position?: Vector3): Promise<LoadedMesh> {
  return loadGltkMesh(ASSETS_LEMMING,  LEMMING, scene, position);
}

const FORCE_SCALE = 100;
const MIN_SPEED = 5;

// distance to be considered in the goal
const GOAL_DIST = 5;
// how long they have to be in the goal to leave
const GOAL_TIME = 3;

type UpdateResult = "none" | "achieved" | "in_goal";

export class LemmingAI {
  public mesh: Mesh;
  public exitPos: Vector3;
  public speed: number;

  public goal: Vector3;
  public timeToGoal: number;

  public timeInGoal: number = 0;
  public lastResult: UpdateResult = "none";

  constructor(mesh: Mesh) {
    this.mesh = mesh;
    this.exitPos = new Vector3(8, 0, -40*4);
    this.speed = MIN_SPEED + _.random(0.0, 1.5);
    // console.log(`Lemming ${mesh.name} speed ${this.speed}`);
  }

  update = (deltaTime: number): UpdateResult => {
    const myPos = this.mesh.position;
    const vectorToGoal = this.exitPos.subtract(myPos);
    const distToGaol = vectorToGoal.length();

    if (distToGaol < GOAL_DIST) {
      this.timeInGoal += deltaTime;
      if (this.timeInGoal > GOAL_TIME) {
        this.lastResult = "achieved";
        return this.lastResult;
      } else {
        this.lastResult = "in_goal";
        return this.lastResult;
      }
    } else if (this.timeInGoal > 0) {
      this.timeInGoal -= deltaTime;
    }

    // console.log(`${this.mesh.name} distance: ${distToGaol.toFixed(2)}`);
    const dir = vectorToGoal.normalize();

    const force = dir.scale(this.speed*FORCE_SCALE*deltaTime);

    this.mesh.physicsBody.applyForce(force, myPos);

    this.lastResult = "none";
    return this.lastResult;
  }

}

export class Lemmings {
  private scene: Scene;
  private game: FirstPhysics;

  public base: Mesh;
  private lemmings: Mesh[] = [];
  private lemmingAIs: LemmingAI[] = [];

  public spawnLocation = new Vector3(10, 15, -8);
  public lastSpawn = 0;
  public spawnTime = 5;
  public maxLemmings = 100;

  constructor(_game: FirstPhysics) {
    this.game = _game;
    this.scene = _game.scene;
  }

  init = async () => {
    const [base] = await loadLemming(this.scene);
    this.base = base;
    base.addRotation(0, -Math.PI/8, 0);
    base.scalingDeterminant = 0.8;
    base.bakeCurrentTransformIntoVertices();

    base.position = new Vector3(10, 5, -8);

    this.setupNewLemming(base);
    this.lemmings.push(base);

    this.scene.onBeforeRenderObservable.add(() => {
      this.updateLemmings();
    });
  }

  cleanupAI = (ai: LemmingAI) => {
    ai.mesh.dispose();
  }

  updateLemmings = () => {
    const deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

    const needUpdate = [...this.lemmingAIs];

    for (const ai of needUpdate) {
      ai.update(deltaTime);
    }

    this.lemmingAIs = this.lemmingAIs.filter((ai) => {
      if (ai.mesh === this.base) {
        return true;
      } else if (ai.lastResult === "achieved") {
        // console.log(`Lemming ${ai.mesh.name} achieved goal`);
        this.cleanupAI(ai);
        return false;
      } else {
        return true;
      }
    });

    if (this.lemmingAIs.length < this.maxLemmings) {
      this.lastSpawn += deltaTime;
      if (this.lastSpawn >= this.spawnTime) {
        this.lastSpawn = 0;
        this.scene.onBeforeRenderObservable.addOnce(async () => {
          return this.spawnLemming();
        });
      }
    }
  }

  setupNewLemming = async (newLemming: Mesh) => {
    const ai = new LemmingAI(newLemming);
    this.lemmingAIs.push(ai);

    const body = _.sample(Object.values(this.game.materials));
    const wheels = _.sample(Object.values(this.game.materials));
    const nose = _.sample(Object.values(this.game.materials));
    for (const node of newLemming.getChildMeshes(false)) {
      if (node.name.includes("Torus")) {
        node.material = wheels;
      } else if (node.name.includes("Cone")) {
        node.material = nose;
      } else if (!node.name.includes("Icosphere")) {
        node.material = body;
      }
    }

  }

  spawnLemming = async (position?: Vector3) => {
    if (!position) {
      position = this.spawnLocation.add(Vector3.Random(0, 2));
    } else {
      position = position.add(Vector3.Random(0, 1));
    }

    const newLemming = this.base.clone(`lemming-${this.lemmings.length}`);

    newLemming.physicsBody.disablePreStep = false;
    newLemming.position = position;

    this.setupNewLemming(newLemming);

    this.scene.onAfterRenderObservable.addOnce(() => {
      newLemming.physicsBody.disablePreStep = true;
      newLemming.physicsBody.applyForce(
        new Vector3(Scalar.RandomRange(1,2), 0, Scalar.RandomRange(1,2)),
        newLemming.position, // world position of force applied
      );
    });

    this.lemmings.push(newLemming);
  }
}
