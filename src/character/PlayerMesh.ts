import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';

import { ASSETS_CHARACTER } from '../constants';

import { loadGltkMesh, LoadedMesh } from '../mesh/Mesh';

const CHARACTER_A = "Character.glb";

export async function loadCharacterA(scene: Scene, position?: Vector3): Promise<LoadedMesh> {
  return loadGltkMesh(ASSETS_CHARACTER,  CHARACTER_A, scene, position);
}
