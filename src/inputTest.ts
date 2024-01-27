import { Engine } from '@babylonjs/core/Engines/engine';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { AdvancedDynamicTexture } from '@babylonjs/gui';
// import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { ActionManager, ExecuteCodeAction } from '@babylonjs/core';

type Action = string;
type KeyActionsMap = Record<string, Action[]>;
type ActionKeysMap = Record<Action, string[]>;


const WASD_KEY_MAP: KeyActionsMap = {
  'w': ['forward'],
  'a': ['left'],
  's': ['back'],
  'd': ['right'],
  'i': ['inspector'],
  'ArrowUp': ['forward'],
  'ArrowLeft': ['left'],
  'ArrowDown': ['back'],
  'ArrowRight': ['right'],
};

type KeyState = boolean;
type InputState = Record<string, KeyState>;

class InputTest {
  private _scene;
  public inputState: InputState = {};
  private _keyToActions: KeyActionsMap;
  private _actionToKeys: ActionKeysMap;
  public logKeyPresses: boolean = false;

  private _initKeyMap = (keyMap: KeyActionsMap) => {
    this._keyToActions = keyMap;

    this._actionToKeys = Object.entries(keyMap).reduce(
      (prev: Record<string,string[]>, [key, actions]: [string, string[]]) => {
        for (const action of actions) {
          // console.log(`Mapping ${key} to ${action}`);
          if (action in prev) {
            prev[action].push(key);
          } else {
            prev[action] = [key];
          }
        }
        return prev;
      }, {}
    );
    // console.log(keyToActions);
    // console.log(actionToKeys);

  }

  constructor(scene: Scene, keyMap: KeyActionsMap = WASD_KEY_MAP) {
    this._scene = scene;
    this._scene.actionManager = new ActionManager(this._scene);

    if (!keyMap) {
      keyMap = WASD_KEY_MAP;
    }
    this._initKeyMap(keyMap);

    this._scene.actionManager.registerAction(new ExecuteCodeAction(
      ActionManager.OnKeyDownTrigger, (e) => {
        this.inputState[e.sourceEvent.key] = e.sourceEvent.type == "keydown";
        if (this.logKeyPresses) {
          console.log(`Key ${e.sourceEvent.key}: ${e.sourceEvent.type}`);
        }
      }
    ));

    this._scene.actionManager.registerAction(new ExecuteCodeAction(
      ActionManager.OnKeyUpTrigger, (e) => {
        this.inputState[e.sourceEvent.key] = e.sourceEvent.type == "keydown";
        if (this.logKeyPresses) {
          console.log(`Key ${e.sourceEvent.key}: ${e.sourceEvent.type}`);
        }
      }
    ));

    this._scene.onBeforeRenderObservable.add(() => {
      this.updateFromInput();
    });
  }

  updateFromInput = () => {

    function callForAction(inputState: InputState, keyToActions: KeyActionsMap, callback: (action: Action, keyState: KeyState)=>void) {
      // for each key in the down state if it maps to an action call the action
      // held down handler
      for (const [key, state] of Object.entries(inputState)) {
        if (state && key in keyToActions) {
          for (const action of keyToActions[key]) {
            callback(action, state);
          }
        }
      }
    }

    callForAction(this.inputState, this._keyToActions, this.actionHeldDown);

    // for each key in the down state if it maps to an action call the action
    // held down handler
    // for (const [key, down] of Object.entries(this.inputState)) {
    //   if (down && key in this._keyToActions) {
    //     for (const action of this._keyToActions[key]) {
    //       this.actionHeldDown(action);
    //     }
    //   }
    // }
    if ((this.inputState["i"])) {
      console.log(`Show or hide inspector`);
    }
  }

  actionDown = (action: string, keyState: KeyState) => {
    console.log(`Action pressed: ${action}`);
  }

  actionHeldDown = (action: string) => {
    console.log(`Action held: ${action}`);
    console.log(this.inputState);
  }
}

export function createInputTestScene(engine: Engine, canvas) {
  // Create our first scene.
  const scene = new Scene(engine);

  const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI")

  // This creates and positions a free camera (non-mesh)
  var camera = new FreeCamera("camera1", new Vector3(0, 5, 10), scene);

  // This targets the camera to scene origin
  camera.setTarget(Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  const input = new InputTest(scene);



  return scene;
}

