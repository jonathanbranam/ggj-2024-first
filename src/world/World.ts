import { GroundMesh } from '@babylonjs/core';
import { Vector3, Vector2 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';
import * as _ from 'lodash';

import { ASSETS_WORLD, ASSETS_BUILDER, ASSETS_MECHA } from '../constants';

import { loadGltkMesh, LoadedMesh } from '../mesh/Mesh';

const SPIKE_FLOOR = "Spike_floor.glb";
// const FLOOR_TILE_SIZE = [4, 4];
const FLOOR_TILE_SIZE = new Vector2(4, 4);


export function createGroundOld(scene: Scene): GroundMesh {
  // Create a grid material
  var material = new GridMaterial("grid", scene);
  // material.gridRatio = 0.25;

  // Our built-in 'ground' shape.
  var ground = CreateGround('ground1', { width: 14, height: 6, subdivisions: 1 }, scene);
  ground.material = material;

  const g2 = CreateGround('ground2', { width: 14, height: 6, subdivisions: 1 }, scene);
  g2.material = material;
  g2.position.z = 6;

  return ground;
}

export function createGround(scene: Scene): GroundMesh {
  // Create a grid material
  var material = new GridMaterial("grid", scene);
  // material.gridRatio = 0.25;

  // Our built-in 'ground' shape.
  var ground = CreateGround('', { width: 4, height: 4, subdivisions: 1 }, scene);
  ground.material = material;

  const groundWidth = 4;
  const groundLength = 12;

  _.range(groundLength).forEach((i) => {
    _.range(groundWidth).forEach((j) => {
      // console.log(`Floor ${i}, ${j}`);
      var ground = CreateGround('', { width: FLOOR_TILE_SIZE.x, height: FLOOR_TILE_SIZE.y, subdivisions: 1 }, scene);
      ground.position.x = FLOOR_TILE_SIZE.x*(groundWidth/2) - j*4;
      ground.position.z = -i*4;
      ground.material = material;
    });
  });


  return ground;
}

export async function loadBuildingB(scene: Scene, position?: Vector3): Promise<LoadedMesh> {
  return loadGltkMesh(ASSETS_BUILDER,  'building_B.gltf', scene, position);
}

export async function loadSpikeFloor(scene: Scene, position?: Vector3): Promise<LoadedMesh> {
  return loadGltkMesh(ASSETS_WORLD, SPIKE_FLOOR, scene, position);
}

