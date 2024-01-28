import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';

import { ASSETS_LEMMING } from '../constants';

import { loadGltkMesh, LoadedMesh } from '../mesh/Mesh';

const LEMMING = "Lemming.glb";

export async function loadLemming(scene: Scene, position?: Vector3): Promise<LoadedMesh> {
  return loadGltkMesh(ASSETS_LEMMING,  LEMMING, scene, position);
}

