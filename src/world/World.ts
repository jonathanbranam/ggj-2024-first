import { GroundMesh } from '@babylonjs/core';
import { Scene } from '@babylonjs/core/scene';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';

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

