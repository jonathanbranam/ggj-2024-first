import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { Inspector } from '@babylonjs/inspector';
import { ActionManager, ExecuteCodeAction, ActionEvent, IKeyboardEvent } from '@babylonjs/core';

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

export class GameInput {
  private _scene;
  public inputState: InputState = {};
  private _keyToActions: KeyActionsMap;
  private _actionToKeys: ActionKeysMap;
  private _actionDefs: ActionDefinitions = ACTION_DEFS;
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
          this._callActionForEvent('pressed', e.sourceEvent.key, this._actionDown, e);
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
        this._callActionForEvent('released', e.sourceEvent.key, this._actionUp, e);
        // }
      }
    ));

    this._scene.onBeforeRenderObservable.add(() => {
      this._updateFromInput();
    });
  }

  private _updateFromInput = () => {

    this._callForAction('held', this._actionHeldDown);

  }

  private _actionUp = (action: string, keyState: KeyState, event?: ActionEvent) => {
    if (this.logActions) {
      console.log(`Action released: ${action}`, event);
    }
  }

  private _actionDown = (action: string, keyState: KeyState) => {
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

  private _actionHeldDown = (action: string) => {
    if (this.logActions) {
      console.log(`Action held: ${action}`);
    }
    if (action === 'forward') {
      console.log(`Move forward`);
    }
  }

  private _callForAction = (
    actionType: ActionType,
    callback: (action: ActionName, keyState: KeyState, event?: ActionEvent) => void,
    event?: ActionEvent) => {
    // for each key in the down state if it maps to an action call the action
    // held down handler
    for (const [key, held] of Object.entries(this.inputState)) {
      if (key in this._keyToActions) {
        for (const actionName of this._keyToActions[key]) {
          const actionDef = this._actionDefs[actionName];
          if (held && actionDef === 'held') {
            callback(actionName, held, event);
          }
        }
      }
    }
  }

  private _callActionForEvent = (
    actionType: ActionType,
    key: string,
    callback: (action: ActionName, keyState: KeyState, event?: ActionEvent) => void,
    event: ActionEvent) => {
    // for each key in the down state if it maps to an action call the action
    // held down handler
    if (key in this._keyToActions) {
      for (const actionName of this._keyToActions[key]) {
        const actionDef = this._actionDefs[actionName];
        if (actionDef === 'pressed' && event) {
          if (event.sourceEvent.type === 'keydown' && !event.sourceEvent.repeat) {
            callback(actionName, true, event);
          }
        }
      }
    }
  }

}

