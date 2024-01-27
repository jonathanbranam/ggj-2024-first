import { Engine } from '@babylonjs/core/Engines/engine';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { AdvancedDynamicTexture } from '@babylonjs/gui';
// import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { ActionManager, ExecuteCodeAction, ActionEvent, IKeyboardEvent } from '@babylonjs/core';
import { Inspector } from '@babylonjs/inspector';

type ActionName = string;
type ActionType = 'pressed' | 'held' | 'released';
type ActionDefinition = ActionType;
type Action = {
  name: ActionName,
  type: ActionType,
};
type KeyActionsMap = Record<string, ActionName[]>;
type ActionKeysMap = Record<ActionName, string[]>;
type ActionDefinitions = Record<ActionName, ActionDefinition>;

const ACTION_DEFS: Record<ActionName, ActionDefinition> = {
  'forward': 'held',
  'back': 'held',
  'left': 'held',
  'right': 'held',
  'inspector': 'pressed',
}

// Event properties
// altKey
// metaKey
// ctrlKey
// shiftKey
// repeat: boolean
// key: string
// keyCode: number

function callForAction(
  actionType: ActionType,
  inputState: InputState,
  keyToActions: KeyActionsMap,
  actionDefs: ActionDefinitions,
  callback: (action: ActionName, keyState: KeyState, event?: ActionEvent) => void,
  event?: ActionEvent)
  {
  // for each key in the down state if it maps to an action call the action
  // held down handler
  for (const [key, held] of Object.entries(inputState)) {
    if (key in keyToActions) {
      for (const actionName of keyToActions[key]) {
        const actionDef = ACTION_DEFS[actionName];
        if (held && actionDef === 'held') {
          callback(actionName, held, event);
        }
      }
    }
  }
}

function callActionForEvent(
  actionType: ActionType,
  key: string,
  inputState: InputState,
  keyToActions: KeyActionsMap,
  actionDefs: ActionDefinitions,
  callback: (action: ActionName, keyState: KeyState, event?: ActionEvent) => void,
  event: ActionEvent)
  {
  // for each key in the down state if it maps to an action call the action
  // held down handler
  if (key in keyToActions) {
    for (const actionName of keyToActions[key]) {
      const actionDef = ACTION_DEFS[actionName];
      if (actionDef === 'pressed' && event) {
        if (event.sourceEvent.type === 'keydown' && !event.sourceEvent.repeat) {
          callback(actionName, true, event);
        }
      }
    }
  }
}

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
  public logActions: boolean = false;

  private _inspectorVisible = false;

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
        if (this.logKeyPresses) {
          console.log(`Key ${e.sourceEvent.key}: ${e.sourceEvent.type}`, e);
        }
        this.inputState[e.sourceEvent.key] = e.sourceEvent.type == "keydown";
        if (e.sourceEvent.type == "keydown") {
          callActionForEvent('pressed', e.sourceEvent.key, this.inputState, this._keyToActions, ACTION_DEFS, this.actionDown, e);
        }
      }
    ));

    this._scene.actionManager.registerAction(new ExecuteCodeAction(
      ActionManager.OnKeyUpTrigger, (e) => {
        if (this.logKeyPresses) {
          console.log(`Key ${e.sourceEvent.key}: ${e.sourceEvent.type}`, e);
        }
        this.inputState[e.sourceEvent.key] = e.sourceEvent.type == "keydown";
        // if (e.sourceEvent.type == "keyup") {
        callActionForEvent('released', e.sourceEvent.key, this.inputState, this._keyToActions, ACTION_DEFS, this.actionUp, e);
        // }
      }
    ));

    this._scene.onBeforeRenderObservable.add(() => {
      this.updateFromInput();
    });
  }

  updateFromInput = () => {

    callForAction('held', this.inputState, this._keyToActions, ACTION_DEFS, this.actionHeldDown);

  }

  actionUp = (action: string, keyState: KeyState, event?: ActionEvent) => {
    if (this.logActions) {
      console.log(`Action released: ${action}`, event);
    }
  }

  actionDown = (action: string, keyState: KeyState) => {
    if (this.logActions) {
      console.log(`Action pressed: ${action}`, event);
    }

    if (action === 'inspector') {
      if (this._inspectorVisible) {
        console.log(`Hide inspector`);
        Inspector.Hide();
        this._inspectorVisible = false;
      } else {
        console.log(`Show inspector`);
        Inspector.Show(this._scene, {});
        this._inspectorVisible = true;
      }
    }
  }

  actionHeldDown = (action: string) => {
    if (this.logActions) {
      console.log(`Action held: ${action}`);
    }
    if (action === 'forward') {
      // console.log(`Move forward`);
    }
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

