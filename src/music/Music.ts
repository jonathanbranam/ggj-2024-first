import { Sound, Scene } from '@babylonjs/core';

import { ASSETS_MUSIC } from '../constants';

const SOUNDTRACK_1 = "soundtrack_1.mp3";

export class Music {
  public playing: boolean = false;
  public muted: boolean = false;

  private _scene: Scene;
  private _initialized = false;
  public soundtrack;

  constructor(scene: Scene) {
    this._scene = scene
  }

  initialize = () => {
    if (this._initialized) {
      return;
    }
    this.play1();
    this.playing = true;
    this._initialized = true;
  }

  loadSound = (fname:string, autoplay = false, loop = true) => {
    // const f = `http://localhost:8080/${ASSETS_MUSIC}${fname}`;
    const f = `${ASSETS_MUSIC}${fname}`;
    console.log(`Loading sound ${f}`);
    this.soundtrack = new Sound(
      "sound",
      `${ASSETS_MUSIC}${fname}`,
      this._scene,
      () => {
        console.log(`Sound ${fname} ready to play.`);
      },
      {
        loop, autoplay,
      },
    );
  }

  play1 = () => {
    this.loadSound(SOUNDTRACK_1, !this.muted);
  }

  unmute = () => {
    console.log("Unmute");
    this.muted = false;
    if (this.soundtrack) {
      console.log("Playing soundtrack");
      this.soundtrack.play();
    }
  }

  mute = () => {
    console.log("Mute");
    this.muted = true;
    if (this.soundtrack) {
      this.soundtrack.pause();
    }
  }

}
