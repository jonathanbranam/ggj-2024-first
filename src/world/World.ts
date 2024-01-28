import { GroundMesh, CreateBox } from '@babylonjs/core';
import { Vector3, Vector2 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';
import * as _ from 'lodash';

import { ASSETS_WORLD, ASSETS_BUILDER, ASSETS_MECHA } from '../constants';

import { loadGltkMesh, LoadedMesh } from '../mesh/Mesh';

const SPIKE_FLOOR = "Spike_floor.glb";

const TILE = 4;
const FLOOR_TILE_SIZE = new Vector2(TILE, TILE);
const WALL_THICKNESS = 1;
const WALL_TILE_SIZE = new Vector3(WALL_THICKNESS, TILE, TILE);


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

export function createGround(scene: Scene): GroundMesh[] {
  // Create a grid material
  var material = new GridMaterial("grid", scene);
  // material.gridRatio = 0.25;

  // Our built-in 'ground' shape.
  // var ground = CreateGround('', { width: 4, height: 4, subdivisions: 1 }, scene);
  // ground.material = material;
  const groundMeshes = [];

  const groundWidth = 4;
  const groundLength = 12;

  _.range(groundLength).forEach((i) => {
    _.range(groundWidth).forEach((j) => {
      // console.log(`Floor ${i}, ${j}`);
      const ground = CreateGround(`groundTile-${i}-${j}`, { width: FLOOR_TILE_SIZE.x, height: FLOOR_TILE_SIZE.y, subdivisions: 1 }, scene);
      ground.position.x = FLOOR_TILE_SIZE.x*(groundWidth/2) - j*TILE;
      ground.position.z = -i*TILE;
      ground.material = material;
      groundMeshes.push(ground);
    });
  });

  // Create some walls

  const wallLength = groundLength;
  const leftWall = CreateBox(`leftWall`, { 
    width: WALL_TILE_SIZE.x,
    height: WALL_TILE_SIZE.y,
    depth: groundLength * TILE,
  }, scene);
  leftWall.position.x = TILE*(groundWidth/2) + TILE/2;
  leftWall.position.y = (WALL_TILE_SIZE.y/2);
  leftWall.position.z = -wallLength*TILE/2 + TILE/2;
  leftWall.material = material;
  groundMeshes.push(leftWall);

  const rightWall = CreateBox(`rightWall`, { 
    width: WALL_TILE_SIZE.x,
    height: WALL_TILE_SIZE.y,
    depth: groundLength * TILE,
  }, scene);
  rightWall.position.x = -TILE*(groundWidth/2) + TILE/2;
  rightWall.position.y = (WALL_TILE_SIZE.y/2);
  rightWall.position.z = -wallLength*TILE/2 + TILE/2;
  rightWall.material = material;
  groundMeshes.push(rightWall);

  const backWall = CreateBox(`backWall`, { 
    width: groundWidth*TILE,
    height: WALL_TILE_SIZE.y,
    depth: WALL_THICKNESS,
  }, scene);
  backWall.position.x = TILE/2;
  backWall.position.y = (WALL_TILE_SIZE.y/2);
  backWall.position.z = TILE/2;
  backWall.material = material;
  groundMeshes.push(backWall);

  const endWall = CreateBox(`endWall`, { 
    width: groundWidth*TILE,
    height: WALL_TILE_SIZE.y,
    depth: WALL_THICKNESS,
  }, scene);
  endWall.position.x = TILE/2;
  endWall.position.y = (WALL_TILE_SIZE.y/2);
  endWall.position.z = -groundLength * TILE + TILE/2;
  endWall.material = material;
  groundMeshes.push(endWall);


  return groundMeshes;
}

export async function loadBuildingB(scene: Scene, position?: Vector3): Promise<LoadedMesh> {
  return loadGltkMesh(ASSETS_BUILDER,  'building_B.gltf', scene, position);
}

export async function loadSpikeFloor(scene: Scene, position?: Vector3): Promise<LoadedMesh> {
  return loadGltkMesh(ASSETS_WORLD, SPIKE_FLOOR, scene, position);
}

