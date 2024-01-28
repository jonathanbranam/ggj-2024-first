import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';

import { ASSETS_CHARACTER } from '../constants';

import { loadGltkMesh, LoadedMesh } from '../mesh/Mesh';

const CHARACTER_ORIG = "Character_first.glb";
const CHARACTER_B = "Character_new.glb";
const CHARACTER_CUR = "Character.glb";

export async function loadCharacterA(scene: Scene, position?: Vector3): Promise<LoadedMesh> {
  return loadGltkMesh(ASSETS_CHARACTER,  CHARACTER_B, scene, position);
}
