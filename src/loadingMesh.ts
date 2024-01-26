import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Scene } from '@babylonjs/core/scene';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { DefaultLoadingScreen } from '@babylonjs/core/Loading/loadingScreen';
import "@babylonjs/loaders/glTF"; 
import "@babylonjs/loaders/OBJ"; 

// const ASSETS = "/Volumes/Data/work/ggj24/assets";
const ASSETS = "assets";
const ASSETS_BUILDER = `${ASSETS}/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/`;
const ASSETS_MECHA = `${ASSETS}/MechGolem/`;

import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';

export function createLoadingMeshScene(engine, canvas) {

  // Create our first scene.
  var scene = new Scene(engine);

  // This creates and positions a free camera (non-mesh)
  var camera = new FreeCamera("camera1", new Vector3(0, 5, 10), scene);

  // This targets the camera to scene origin
  camera.setTarget(Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  // Create a grid material
  var material = new GridMaterial("grid", scene);
  material.gridRatio = 0.25;

  function createSphere(scene: Scene) {
    // Our built-in 'sphere' shape.
    var sphere = CreateSphere('sphere1', { segments: 16, diameter: 2 }, scene);

    // Move the sphere upward 1/2 its height
    sphere.position.y = 2;

    // Affect a material
    sphere.material = material;
  }

  // Our built-in 'ground' shape.
  var ground = CreateGround('ground1', { width: 14, height: 6, subdivisions: 2 }, scene);

  // Affect a material
  ground.material = material;

  // SceneLoader.AppendAsync(ASSETS, 'KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/base.gltf', scene);
  // SceneLoader.AppendAsync(ASSETS_BUILDER, 'building_D.gltf', scene);
  // SceneLoader.ImportMesh("", ASSETS_BUILDER, 'building_A.gltf', scene, (meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], animationGroups: AnimationGroup[], transformNodes: TransformNode[], geometries: Geometry[], lights: Light[]) => {
  SceneLoader.ImportMesh("", ASSETS_BUILDER, 'building_A.gltf', scene, (meshes: AbstractMesh[]) => {
    console.log("Mesh imported", meshes);
    for (const m of meshes) {
      if (m.name === "__root__") {
        m.position = new Vector3(3, 0, 0);
        // m.addRotation(0, Math.PI, 0);
      }
      console.log(`Imported mesh ${m.name} at ${m.position}, ${m.rotation}.`);
    }
  });

  SceneLoader.ImportMesh("", ASSETS_BUILDER, 'building_B.gltf', scene, (meshes: AbstractMesh[]) => {
    console.log("Mesh imported", meshes);
    for (const m of meshes) {
      if (m.name === "__root__") {
        // m.addRotation(0, Math.PI, 0);
        m.position = new Vector3(1, 0, 0);
      }
      console.log(`Imported mesh ${m.name} at ${m.position}, ${m.rotation}.`);
    }
  });

  SceneLoader.ImportMesh("", ASSETS_MECHA, 'MechaGolem.obj', scene, (meshes: AbstractMesh[]) => {
    console.log("Mesh imported", meshes);
    for (const m of meshes) {
      m.normalizeToUnitCube();
      m.position = new Vector3(0, 0, 0);
      console.log(`Imported mesh ${m.name} at ${m.position}, ${m.rotation}.`);
    }
  });

  return scene;

}
