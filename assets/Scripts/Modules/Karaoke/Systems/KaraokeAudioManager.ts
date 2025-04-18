import { _decorator, Component, AudioSource, resources, AudioClip, EventTarget, director } from 'cc';
import { KaraokeConstants } from './KaraokeConstants';
import { resourceUtil } from '../../../Common/resourceUtil';

const { ccclass, property } = _decorator;

/**
 * Manages audio playback for the Karaoke application
 */
@ccclass('KaraokeAudioManager')
export class KaraokeAudioManager extends Component {
    private eventTarget: EventTarget = new EventTarget();

    //#region Properties
    @property({ type: AudioSource, tooltip: "Audio source for music playback", group: { name: "Audio", id: "audio" } })
    private musicSource: AudioSource = null;

    @property({ tooltip: "Volume for music playback (0-1)", range: [0, 1], slide: true, group: { name: "Audio", id: "audio" } })
    private musicVolume: number = 0.7;

    @property({ tooltip: "Fade in duration in seconds", group: { name: "Audio", id: "audio" } })
    private fadeInDuration: number = 1.0;

    @property({ tooltip: "Fade out duration in seconds", group: { name: "Audio", id: "audio" } })
    private fadeOutDuration: number = 1.0;
    //#endregion

    //#region Private Variables
    private currentAudioClip: AudioClip = null;
    private isPlaying: boolean = false;
    private isPaused: boolean = false;
    private currentTime: number = 0;
    private duration: number = 0;
    private fadeInterval: number = null;
    //#endregion

    //#region Lifecycle Methods
    onLoad() {
        // Create audio source if not provided
        if (!this.musicSource) {
            this.musicSource = this.addComponent(AudioSource);
        }

        // Set initial volume
        this.musicSource.volume = this.musicVolume;
    }

    update(dt: number) {
        if (!this.isPlaying || this.isPaused) return;

        // Update current time from audio source
        this.currentTime = this.musicSource.currentTime;

        // Check if song has ended by detecting when time stops progressing or resets to 0
        // When audio finishes, currentTime might reset to 0 or stop progressing
        if (this.isPlaying && !this.isPaused) {
            // If currentTime suddenly drops to near 0 after progressing significantly
            if (this.duration > 0 &&
                this.currentTime > this.duration - 0.5) {
                this.handlePlaybackEnd();
            }
            else if (this.musicSource.playing == false) {
                this.handlePlaybackEnd();
            }
        }
    }

    onDestroy() {
        // Clean up resources
        this.stopPlayback();
        this.clearFadeInterval();
    }
    //#endregion

    //#region Public Methods
    /**
     * Load audio from path
     * @param path Path to audio file
     * @returns Promise resolving to true if loaded successfully
     */
    public loadAudio(path: string): Promise<boolean> {
        return new Promise((resolve) => {
            // Stop any current playback
            this.stopPlayback();
            // Load audio clip from resources using resourceUtil
            resourceUtil.loadRes(path, AudioClip, (err, clip) => {
                if (err) {
                    console.error(`Failed to load audio: ${path}`, err);
                    resolve(false);
                    return;
                }

                this.currentAudioClip = clip;
                this.musicSource.clip = clip;

                // Since AudioClip doesn't expose duration directly in some Cocos versions,
                // we'll use a timeout to give the audio source time to load metadata
                // Try to get duration from audio source if available
                // In Cocos Creator, the duration property might be available after clip is assigned
                if (this.musicSource.duration !== undefined) {
                    this.duration = this.musicSource.duration;
                } else {
                    // If duration is not available, use a reasonable default
                    console.warn(`Could not determine duration for ${path}, using estimate`);
                    // Assume a standard length for a song (3 minutes)
                    this.duration = 180;
                }

                console.log(`Loaded audio: ${path}, duration: ${this.duration}s`);
                this.emit(KaraokeConstants.EVENTS.SONG_LOADED, {
                    path,
                    duration: this.duration
                });

                resolve(true);
            });
        });
    }

    /**
     * Start audio playback
     * @param fadeIn Whether to fade in the audio
     */
    public startPlayback(fadeIn: boolean = false): void {
        if (this.isPlaying && !this.isPaused) return;

        if (!this.currentAudioClip) {
            console.warn('No audio loaded');
            return;
        }

        // If paused, resume playback
        if (this.isPaused) {
            this.musicSource.play();
            this.isPaused = false;
        } else {
            // Start from beginning
            this.currentTime = 0;
            this.musicSource.currentTime = 0;

            // Apply fade in if requested
            if (fadeIn) {
                this.musicSource.volume = 0;
                this.fadeIn();
            } else {
                this.musicSource.volume = this.musicVolume;
            }

            this.musicSource.play();
        }

        this.isPlaying = true;

        console.log('Audio playback started');
        this.emit(KaraokeConstants.EVENTS.SONG_STARTED);
    }

    /**
     * Stop audio playback
     * @param fadeOut Whether to fade out the audio
     */
    public stopPlayback(fadeOut: boolean = true): void {
        if (!this.isPlaying) return;

        // Apply fade out if requested
        if (fadeOut) {
            this.fadeOut(() => {
                this.musicSource.stop();
                this.finishStopPlayback();
            });
        } else {
            this.musicSource.stop();
            this.finishStopPlayback();
        }
    }

    /**
     * Pause audio playback
     */
    public pausePlayback(): void {
        if (!this.isPlaying || this.isPaused) return;

        this.musicSource.pause();
        this.isPaused = true;

        console.log('Audio playback paused');
    }

    /**
     * Resume audio playback
     */
    public resumePlayback(): void {
        if (!this.isPaused) return;

        this.musicSource.play();
        this.isPaused = false;

        console.log('Audio playback resumed');
    }

    /**
     * Seek to a specific time in the audio
     * @param time Time in seconds to seek to
     */
    public seekTo(time: number): void {
        if (!this.currentAudioClip) return;

        // Clamp time to valid range
        time = Math.max(0, Math.min(time, this.duration));

        this.currentTime = time;
        this.musicSource.currentTime = time;

        console.log(`Seeked to ${time}s`);
    }

    /**
     * Get current playback time
     * @returns Current time in seconds
     */
    public getCurrentTime(): number {
        return this.musicSource.currentTime;
    }

    /**
     * Get total duration of the current audio
     * @returns Duration in seconds
     */
    public getDuration(): number {
        return this.duration;
    }

    /**
     * Set music volume
     * @param volume Volume level (0-1)
     */
    public setVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.musicSource.volume = this.musicVolume;
    }

    /**
     * Get current volume
     * @returns Volume level (0-1)
     */
    public getVolume(): number {
        return this.musicVolume;
    }

    /**
     * Check if audio is currently playing
     * @returns True if playing, false otherwise
     */
    public isAudioPlaying(): boolean {
        return this.isPlaying && !this.isPaused;
    }

    /**
     * Check if audio is currently paused
     * @returns True if paused, false otherwise
     */
    public isAudioPaused(): boolean {
        return this.isPaused;
    }
    //#endregion

    //#region Private Methods
    private clearFadeInterval(): void {
        // Clear fade interval
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
    }

    private handlePlaybackEnd(): void {
        // Only process end event once
        if (!this.isPlaying) return;

        console.log('Audio playback ended');

        this.isPlaying = false;
        this.isPaused = false;

        this.emit(KaraokeConstants.EVENTS.SONG_ENDED);
    }

    private finishStopPlayback(): void {
        this.clearFadeInterval();
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;

        console.log('Audio playback stopped');
    }

    private fadeIn(): void {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
        }

        let volume = 0;
        const step = this.musicVolume / (this.fadeInDuration * 10);
        console.log(`Fade in starting with step: ${step}, target volume: ${this.musicVolume}, duration: ${this.fadeInDuration}`);

        this.fadeInterval = setInterval(() => {
            volume += step;
            console.log(`Fade in: current volume=${volume.toFixed(2)}`);

            if (volume >= this.musicVolume) {
                volume = this.musicVolume;
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                console.log(`Fade in completed`);
            }

            this.musicSource.volume = volume;
        }, 100);
    }

    private fadeOut(callback?: () => void): void {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
        }

        let volume = this.musicSource.volume;
        const step = volume / (this.fadeOutDuration * 10);

        this.fadeInterval = setInterval(() => {
            volume -= step;

            if (volume <= 0) {
                volume = 0;
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;

                if (callback) {
                    callback();
                }
            }

            this.musicSource.volume = volume;
        }, 100);
    }
    //#endregion

    //#region Event Methods
    public on(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget?.on(eventName, callback, target);
    }

    public off(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget?.off(eventName, callback, target);
    }

    private emit(eventName: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any): void {
        this.eventTarget?.emit(eventName, arg1, arg2, arg3, arg4, arg5);
    }
    //#endregion
} 