import { AbstractMesh } from '@babylonjs/core';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import "@babylonjs/loaders/glTF"; 
import "@babylonjs/loaders/OBJ"; 

export type LoadedMesh = [AbstractMesh, AbstractMesh[]];

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

