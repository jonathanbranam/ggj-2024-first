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

export class Lemmings {
  private scene: Scene;
  private game: FirstPhysics;

  public base: Mesh;
  private lemmings: Mesh[] = [];

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
  }

  setupNewLemming = async (newLemming: Mesh) => {
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
      position = new Vector3(10, 15, -8).addInPlace(Vector3.Random(0, 1));
    } else {
      position = position.add(Vector3.Random(0, 1));
    }

    const newLemming = this.base.clone();

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
