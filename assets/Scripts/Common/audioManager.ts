import { CurrentEnviroment, GameConstant } from '../Constant/Constants';
import { StorageManager } from './storageManager';
import { _decorator, Node, AudioClip, sys, AudioSource, game, director, Component, error, AudioSourceComponent, Tween, tween, easing } from "cc";
import { resourceUtil } from './resourceUtil';
const { ccclass, property } = _decorator;

interface AudioData {
    source: AudioSource;
    isMusic: boolean;
}

interface AudioDataMap {
    [name: string]: AudioData;
}

@ccclass("AudioManager")
export class AudioManager {
    static instance: AudioManager;

    private audioMap: Map<string, AudioClip> = new Map<string, AudioClip>();

    private _persistRootNode: Node = null!;
    private _audioSources: AudioSource[] = [];

    dictWeaponSoundIndex: any = {};

    bgmVolume: number = 0.8;
    sfxVolume: number = 1;
    audios: AudioDataMap = {};
    arrSound: AudioData[] = [];
    BGM_VOLUME: number = 0.35;
    SFX_VOLUME: number = 0.75;
    asMusic: AudioSource = null!;

    constructor() {
        this.init();
    }

    init() {
        if (this._persistRootNode) return; //
        this._persistRootNode = new Node('audio');
        director.getScene()!.addChild(this._persistRootNode);
        game.addPersistRootNode(this._persistRootNode)

        this.asMusic = this._persistRootNode.addComponent(AudioSource);
        for (let i = 0; i < 15; i++) {
            this._audioSources.push(this._persistRootNode.addComponent(AudioSource));
        }

        this.bgmVolume = this.getAudioSetting(true);
        this.sfxVolume = this.getAudioSetting(false);

        //mapping clips
        this.audioMap.clear();
    }

    private curGetSFXSourceIndex = 0;
    getAudioSetting(isMusic: boolean): number {
        let state;
        if (isMusic) {
            state = StorageManager.instance.getGlobalData(GameConstant.STORAGE_KEY.BGM_VOLUME) ?? this.BGM_VOLUME;
        } else {
            state = StorageManager.instance.getGlobalData(GameConstant.STORAGE_KEY.SFX_VOLUME) ?? this.SFX_VOLUME;
        }

        return state;
    }

    get bgmProgress(): number {
        return this.bgmVolume / this.BGM_VOLUME;
    }

    get sfxProgress(): number {
        return this.sfxVolume / this.SFX_VOLUME;
    }

    public setBGMProgress(progress: number): void {
        this.bgmVolume = progress * this.BGM_VOLUME;
        StorageManager.instance.setGlobalData(GameConstant.STORAGE_KEY.BGM_VOLUME, this.bgmVolume);
    }

    public setSFXProgress(progress: number): void {
        this.sfxVolume = progress * this.SFX_VOLUME;
        StorageManager.instance.setGlobalData(GameConstant.STORAGE_KEY.SFX_VOLUME, this.sfxVolume);
    }

    getSound(name: string): AudioClip {
        if (this.audioMap.has(name)) {
            return this.audioMap.get(name);
        }
        return null;
    }

    playMusic(name: string, loop: boolean): AudioSource {
        let source = this.asMusic;

        const path = "sounds/bgm/" + name;
        resourceUtil.loadRes(path, AudioClip, (error, clip: AudioClip) => {
            if (error) {
                if (CurrentEnviroment.LOG) console.error(error);
                return;
            }
            if (!clip) return null;
            let tmp: AudioData = {
                source,
                isMusic: true,
            };
            this.audios[name] = tmp;
            source.stop();
            source.clip = clip;
            source.volume = this.bgmVolume;
            source.loop = loop;
            source.play();
        })
        return source;
    }

    private tweenFadeMusic: Tween<{ value: number }> = null;
    setMusicFade(isFadeIn: boolean, time: number = 0.5, callback: Function = null) {
        const beginValue: number = isFadeIn ? 0.0 : 1.0;
        const endValue: number = isFadeIn ? 1.0 : 0.0;
        const gapValue = endValue - beginValue;
        const musicFadeValue: { value: number } = { value: beginValue };

        const onValueChanged = (ratio: number) => {
            const appliedValue = beginValue + ratio * gapValue;
            if (this.asMusic && this.bgmVolume) {
                this.asMusic.volume = this.bgmVolume * appliedValue;
            }
        }

        this.tweenFadeMusic?.stop();
        this.tweenFadeMusic = tween(musicFadeValue)
            .to(time, { value: endValue }, {
                easing: easing.linear, progress: (s, e, c, r) => {
                    onValueChanged(r);
                    return 0;
                }
            })
            .call(callback)
            .start();
    }

    public dimAllSounds() {
        this._audioSources.forEach(as => {
            as.volume = 0.0;
        })
    }

    playSound(name: string, volumePercent: number = 1.0): AudioSource {
        if (!this.sfxVolume) return;

        this.curGetSFXSourceIndex = ++this.curGetSFXSourceIndex % this._audioSources.length;
        let source: AudioSource | undefined = this._audioSources[this.curGetSFXSourceIndex];

        const path = "sounds/sfx/" + name;
        resourceUtil.loadRes(path, AudioClip, (error, clip: AudioClip) => {
            if (error) {
                if (CurrentEnviroment.LOG) console.error(error);
                return;
            }
            if (!clip) return;
            source.stop();

            source.clip = clip;
            source.currentTime = 0.0;
            source.volume = this.sfxVolume * volumePercent;
            source.play();
            // if (CurrentEnviroment.LOG) console.log("audiomanager sound played: ", name);
        })
        return source;
    }

    stop(name: string) {
        if (this.audios.hasOwnProperty(name)) {
            let audio = this.audios[name];
            audio.source.stop();
            audio.source.volume = 0.0;
        }
    }

    stopAll() {
        for (const i in this.audios) {
            if (this.audios.hasOwnProperty(i)) {
                let audio = this.audios[i];
                audio.source.stop();
                audio.source.clip = null;
            }
        }
        this.asMusic.stop();
        this.asMusic.clip = null;
    }

    getMusicVolume() {
        return this.bgmVolume;
    }

    setMusic(flag: number) {
        let volume = flag * this.BGM_VOLUME;
        StorageManager.instance.setGlobalData(GameConstant.STORAGE_KEY.BGM_VOLUME, volume);
        this.bgmVolume = volume;
        this.asMusic.volume = this.bgmVolume;
    }

    pauseAll() {
        if (CurrentEnviroment.LOG) console.log("pause all music!!!");

        for (let item in this.audios) {
            if (this.audios.hasOwnProperty(item)) {
                let audio = this.audios[item];
                audio.source.pause();
            }
        }
    }

    resumeAll() {
        for (let item in this.audios) {
            if (this.audios.hasOwnProperty(item)) {
                let audio = this.audios[item];
                audio.source.play();
            }
        }
    }

    setSound(flag: number) {
        let volume = flag * this.SFX_VOLUME;
        StorageManager.instance.setGlobalData(GameConstant.STORAGE_KEY.SFX_VOLUME, volume);
        this.sfxVolume = volume;
        for (let item in this.audios) {
            if (this.audios.hasOwnProperty(item) && !this.audios[item].isMusic) {
                // this.changeState(item, flag);
                let audio = this.audios[item];
                audio.source.volume = this.sfxVolume;
            }
        }

        for (let idx = 0; idx < this.arrSound.length; idx++) {
            let audio = this.arrSound[idx];
            audio.source.volume = this.sfxVolume;
        }
    }

    stopSingleSound(name: string) {
        if (this.audios.hasOwnProperty(name) && !this.audios[name].isMusic) {
            let audio = this.audios[name];
            audio.source.stop();
        }
    }
}
