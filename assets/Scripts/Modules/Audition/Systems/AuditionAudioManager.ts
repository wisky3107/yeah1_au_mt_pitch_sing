import { _decorator, Component, AudioSource, AudioClip, resources, game } from 'cc';
import { resourceUtil } from '../../../Common/resourceUtil';
const { ccclass, property } = _decorator;

/**
 * Audio Manager for Audition module
 * Handles music playback, sound effects, and audio synchronization
 */
@ccclass('AuditionAudioManager')
export class AuditionAudioManager extends Component {

    @property
    private musicFolder: string = 'audition/music/';

    // Audio sources for music and sound effects
    @property(AudioSource)
    private musicSource: AudioSource = null;

    @property(AudioSource)
    private sfxSource: AudioSource = null;

    // Audio settings
    @property
    private audioOffset: number = 0; // Calibration offset in milliseconds

    @property({ range: [0, 1] })
    private musicVolume: number = 0.7;

    @property({ range: [0, 1] })
    private sfxVolume: number = 1.0;

    // Internal properties
    private soundEffects: Map<string, AudioClip> = new Map();
    private startTime: number = 0;
    private isPaused: boolean = false;
    private pauseTime: number = 0;



    onLoad() {

        // Initialize audio sources if they weren't set in the Inspector
        if (!this.musicSource) {
            this.musicSource = this.node.addComponent(AudioSource);
            this.musicSource.loop = true;
            this.musicSource.volume = this.musicVolume;
        }

        if (!this.sfxSource) {
            this.sfxSource = this.node.addComponent(AudioSource);
            this.sfxSource.loop = false;
            this.sfxSource.volume = this.sfxVolume;
        }

        this.loadSoundEffects();
    }

    /**
     * Preload common sound effects
     */
    private loadSoundEffects(): void {
        // const sfxList = ['perfect', 'good', 'miss', 'click', 'combo'];
        const sfxList = ['good', 'miss', 's_ready', 's_go'];

        // Load base sound effects
        sfxList.forEach(sfx => {
            resourceUtil.loadRes(`audition/audio/sfx/${sfx}`, AudioClip, (err, clip) => {
                if (err) {
                    console.error(`Failed to load sound effect: ${sfx}`, err);
                    return;
                }

                this.soundEffects.set(sfx, clip);
                console.log(`Sound effect loaded: ${sfx}`);
            });
        });

        // Load perfect sound variations (1-5)
        for (let i = 1; i <= 5; i++) {
            const perfectSound = i === 1 ? 'perfect' : `perfect${i}`;
            resourceUtil.loadRes(`audition/audio/sfx/${perfectSound}`, AudioClip, (err, clip) => {
                if (err) {
                    console.error(`Failed to load perfect sound effect: ${perfectSound}`, err);
                    return;
                }

                this.soundEffects.set(perfectSound, clip);
                console.log(`Perfect sound effect loaded: ${perfectSound}`);
            });
        }
    }



    /**
     * Load a song audio file
     * @param songPath Path to the song audio file
     * @returns Promise that resolves when the song is loaded
     */
    public loadSong(songPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(`Loading song: ${songPath}`);
            const fullPath = this.musicFolder + songPath;
            resourceUtil.loadRes(fullPath, AudioClip, (err, clip) => {
                if (err) {
                    console.error(`Failed to load song: ${fullPath}`, err);
                    reject(err);
                    return;
                }

                this.musicSource.clip = clip;
                console.log(`Song loaded: ${fullPath}`);
                resolve();
            });
        });
    }

    /**
     * Play the loaded song
     * @param startTime Start time in milliseconds (default: 0)
     */
    public playSong(startTime: number = 0): void {
        if (!this.musicSource.clip) {
            console.error('No song loaded');
            return;
        }

        // Convert milliseconds to seconds for AudioSource
        this.musicSource.currentTime = startTime / 1000;
        this.startTime = Date.now() - startTime;
        this.isPaused = false;

        this.musicSource.play();
        console.log(`Playing song from ${startTime}ms`);
    }

    /**
     * Pause the current song
     */
    public pauseSong(): void {
        if (!this.musicSource.playing) {
            return;
        }

        this.musicSource.pause();
        this.isPaused = true;
        this.pauseTime = this.getCurrentTime();
        console.log(`Song paused at ${this.pauseTime}ms`);
    }

    /**
     * Resume the paused song
     */
    public resumeSong(): void {
        if (!this.isPaused) {
            return;
        }

        this.musicSource.play();
        this.startTime = Date.now() - this.pauseTime;
        this.isPaused = false;
        console.log(`Song resumed from ${this.pauseTime}ms`);
    }

    /**
     * Stop the current song
     */
    public stopSong(): void {
        this.musicSource.stop();
        this.isPaused = false;
        console.log('Song stopped');
    }

    /**
     * Get the current playback position
     * @returns Current time in milliseconds
     */
    public getCurrentTime(): number {
        if (this.isPaused) {
            return this.pauseTime;
        }

        // if (!this.musicSource.playing) {
        //     return 0;
        // }

        return this.musicSource.currentTime * 1000;
        // return Date.now() - this.startTime + this.audioOffset;
    }

    public getDuration(): number {
        return this.musicSource.clip.getDuration() * 1000;
    }

    /**
     * Play a sound effect
     * @param soundId ID of the sound effect to play
     */
    public playSound(soundId: string): void {
        const clip = this.soundEffects.get(soundId);
        if (!clip) {
            console.warn(`Sound effect not found: ${soundId}`);
            return;
        }

        this.sfxSource.playOneShot(clip);
    }

    /**
     * Set music volume
     * @param volume Volume level (0-1)
     */
    public setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.musicSource.volume = this.musicVolume;
    }

    /**
     * Set sound effects volume
     * @param volume Volume level (0-1)
     */
    public setSfxVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.sfxSource.volume = this.sfxVolume;
    }

    /**
     * Get music volume
     * @returns Music volume level (0-1)
     */
    public getMusicVolume(): number {
        return this.musicVolume;
    }

    /**
     * Get sound effects volume
     * @returns Sound effects volume level (0-1)
     */
    public getSfxVolume(): number {
        return this.sfxVolume;
    }

    /**
     * Set audio offset for calibration
     * @param offset Offset in milliseconds
     */
    public setAudioOffset(offset: number): void {
        this.audioOffset = offset;
        console.log(`Audio offset set to ${offset}ms`);
    }

    /**
     * Get current audio offset
     * @returns Offset in milliseconds
     */
    public getAudioOffset(): number {
        return this.audioOffset;
    }

    /**
     * Calibrate audio offset by measuring system latency
     * This is a simplified implementation and might need adjustment
     */
    public calibrateAudioOffset(): void {
        // TODO: Implement a more sophisticated calibration method
        // This could involve playing a sound and asking the user to tap in rhythm
        console.log('Audio calibration initiated');

        // For now, just use a default offset
        this.audioOffset = -50; // Common default adjustment
        console.log(`Audio calibrated with offset: ${this.audioOffset}ms`);
    }
} 