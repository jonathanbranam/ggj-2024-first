import { GroundMesh } from '@babylonjs/core';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';

import { ASSETS_WORLD, ASSETS_BUILDER, ASSETS_MECHA } from '../constants';

import { loadGltkMesh, LoadedMesh } from '../mesh/Mesh';

const SPIKE_FLOOR = "Spike_floor.glb";

export function createGround(scene: Scene): GroundMesh {
  // Create a grid material
  var material = new GridMaterial("grid", scene);

  material.gridRatio = 0.25;
  // Our built-in 'ground' shape.
  var ground = CreateGround('ground1', { width: 14, height: 6, subdivisions: 2 }, scene);

  // Affect a material
  ground.material = material;

  return ground;
}

export async function loadBuildingB(scene: Scene, position?: Vector3): Promise<LoadedMesh> {
  return loadGltkMesh(ASSETS_BUILDER,  'building_B.gltf', scene, position);
}

export async function loadSpikeFloor(scene: Scene, position?: Vector3): Promise<LoadedMesh> {
  return loadGltkMesh(ASSETS_WORLD, SPIKE_FLOOR, scene, position);
}

