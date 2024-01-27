import { AbstractMesh, Mesh, GroundMesh } from '@babylonjs/core';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import "@babylonjs/loaders/glTF"; 
import "@babylonjs/loaders/OBJ"; 

import { ASSETS_WORLD, ASSETS_BUILDER, ASSETS_MECHA } from '../constants';

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

type LoadedMesh = [AbstractMesh, AbstractMesh[]];

/**
 * returns __root__
 */
export function loadGltkMesh(path: string, filename: string, scene: Scene, position?: Vector3): Promise<LoadedMesh> {
  return new Promise((resolve, reject) => {
    SceneLoader.ImportMesh("", path, filename, scene, (meshes: AbstractMesh[]) => {
      // console.log("Mesh imported", meshes);
      // return mesh named __root__ and all meshes
      for (const m of meshes) {
        if (m.name === "__root__") {
          // m.addRotation(0, Math.PI, 0);
          if (position) {
            m.position = position;
          }
          return resolve([m, meshes]);
        }
        // console.log(`Imported mesh ${m.name} at ${m.position}, ${m.rotation}.`);
      }
      // if no mesh is named __root__ then just return the first one
      if (meshes.length > 0) {
        return resolve([meshes[0], meshes]);
      }

      reject();
    });
  });
}

export async function loadBuildingB(scene: Scene, position?: Vector3): Promise<LoadedMesh> {
  return loadGltkMesh(ASSETS_BUILDER,  'building_B.gltf', scene, position);
}

export async function loadSpikeFloor(scene: Scene, position?: Vector3): Promise<LoadedMesh> {
  return loadGltkMesh(ASSETS_WORLD, SPIKE_FLOOR, scene, position);
}

