import { _decorator, Node, AudioClip, AudioSource, game, director, error, Tween, tween, easing } from "cc";
import { AudioManager as CommonAudioManager } from '../../../Common/audioManager';
import { resourceUtil } from '../../../Common/resourceUtil';
import { loadMidi } from '../../../Common/MidiReader';
import { BeatmapAudioData, MidiTrackInfo, MTConstant } from "../Data/MTDefines";
import { SongConstant } from "../../../Constant/SongConstant";

const { ccclass, property } = _decorator;


/**
 * AudioManager for Magic Tiles 3
 * Extends the common AudioManager with additional functionality for music synchronization with gameplay
 */
@ccclass("MTAudioManager")
export class MTAudioManager {
    private static _instance: MTAudioManager | null = null;

    // Singleton pattern
    public static get instance(): MTAudioManager {
        if (!this._instance) {
            this._instance = new MTAudioManager();
        }
        return this._instance;
    }

    // Reference to the common audio manager
    private commonAudioManager: CommonAudioManager = CommonAudioManager.instance;

    // Music source specifically for the beatmap playback
    private _beatmapAudioSource: AudioSource = null!;

    // Current beatmap audio data
    private _currentBeatmap: BeatmapAudioData | null = null;

    // Callbacks for beat events
    private _beatCallbacks: Function[] = [];

    // Audio buffering status
    private _isBuffering: boolean = false;

    // Timer for tracking audio playback position
    private _playbackTimer: number = 0;

    // Add properties for time estimation
    private audioTimeEstimation: number = 0;
    private lastSystemTime: number = 0;
    private _timeCheckCounter: number = 0;
    private _timeCheckInterval: number = 30; // Check actual time every 30 frames

    constructor() {
        this.init();
    }

    private init(): void {
        // Create a dedicated node for beatmap audio
        const beatmapNode = new Node('beatmap-audio');
        director.getScene()!.addChild(beatmapNode);

        // Create a dedicated audio source for beatmaps
        this._beatmapAudioSource = beatmapNode.addComponent(AudioSource);
    }

    /**
     * Load a beatmap audio file and its corresponding MIDI data
     * @param audioPath Path to the audio file
     * @param midiPath Path to the MIDI file
     * @param trackIndex Index of the MIDI track to use
     * @returns Promise that resolves when loading is complete
     */
    public async loadBeatmapAudioData(audioPath: string, midiPath: string, trackIndex: number = 1): Promise<BeatmapAudioData> {
        this._isBuffering = true;

        try {
            // Load both resources in parallel for better performance
            const [audioClip, midiTrack] = await Promise.all([
                this.loadAudioClip(`${SongConstant.RESOURCE_MUSIC_PATH}/${audioPath}`),
                loadMidi(`${MTConstant.RESOURCE_MIDI_PATH}/${midiPath}`, trackIndex)
            ]);

            // Create beatmap audio data
            this._currentBeatmap = {
                clip: audioClip,
                trackInfo: midiTrack,
                totalDuration: audioClip.getDuration(),
                currentTime: 0,
                isPlaying: false,
                isPaused: false
            };

            // Setup the audio source
            this._beatmapAudioSource.clip = audioClip;
            this._beatmapAudioSource.volume = 1.0;
            // this._beatmapAudioSource.volume = this.commonAudioManager.getMusicVolume();

            this._isBuffering = false;
            return this._currentBeatmap;
        } catch (err) {
            console.error("Failed to load beatmap audio:", err);
            this._isBuffering = false;
            return null;
        }
    }

    public setCurrentBeatmap(beatmap: BeatmapAudioData) {
        this._currentBeatmap = beatmap;
        // Setup the audio source
        this._beatmapAudioSource.clip = beatmap.clip;
        this._beatmapAudioSource.volume = 1.0;
        this._isBuffering = false;
    }

    /**
     * Promise-based audio clip loading
     */
    private loadAudioClip(path: string): Promise<AudioClip> {
        return new Promise((resolve, reject) => {
            resourceUtil.loadRes(path, AudioClip, (err, clip: AudioClip) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(clip);
            });
        });
    }

    /**
     * Start playing the beatmap audio
     * @param startTime Optional start time in seconds
     */
    public playBeatmapAudio(startTime: number = 0): void {
        if (!this._currentBeatmap || this._isBuffering) {
            console.warn("No beatmap loaded or still buffering");
            return;
        }

        this._currentBeatmap.currentTime = startTime;
        this._currentBeatmap.isPlaying = true;
        this._currentBeatmap.isPaused = false;

        this._beatmapAudioSource.currentTime = startTime;
        this._beatmapAudioSource.play();

        // Start tracking beats
        // this.startBeatTracking();
    }

    /**
     * Get estimated audio time with minimal overhead
     * Uses time estimation between actual audio time checks
     */
    public getEstimatedAudioTime(): number {
        const currentTime = Date.now() / 1000;

        // Initialize if first call
        if (!this.lastSystemTime) {
            this.lastSystemTime = currentTime;
            this.audioTimeEstimation = this._beatmapAudioSource.currentTime;
            return this.audioTimeEstimation;
        }

        // Calculate time elapsed since last check
        const deltaTime = currentTime - this.lastSystemTime;

        // Update estimation
        this.audioTimeEstimation += deltaTime;

        // Periodically correct estimation (less frequently)
        if (this._timeCheckCounter++ % this._timeCheckInterval === 0) {
            const actualTime = this._beatmapAudioSource.currentTime;
            // Smoothly adjust to actual time
            this.audioTimeEstimation = 0.95 * this.audioTimeEstimation + 0.05 * actualTime;
        }

        this.lastSystemTime = currentTime;
        return this.audioTimeEstimation;
    }

    /**
     * Get the current audio time
     * This is the original method, but we now recommend using getEstimatedAudioTime()
     */
    public getAudioTime(): number {
        return this._beatmapAudioSource.currentTime;
    }

    /**
     * Pause the beatmap audio
     */
    public pauseBeatmapAudio(): void {
        if (!this._currentBeatmap || !this._currentBeatmap.isPlaying) {
            return;
        }

        this._beatmapAudioSource.pause();
        this._currentBeatmap.isPaused = true;
        this._currentBeatmap.isPlaying = false;
    }

    /**
     * Resume the beatmap audio
     */
    public resumeBeatmapAudio(): void {
        if (!this._currentBeatmap || !this._currentBeatmap.isPaused) {
            return;
        }

        this._beatmapAudioSource.play();
        this._currentBeatmap.isPaused = false;
        this._currentBeatmap.isPlaying = true;
    }

    /**
     * Stop the beatmap audio
     */
    public stopBeatmapAudio(): void {
        if (!this._currentBeatmap) {
            return;
        }

        this._beatmapAudioSource.stop();
        this._currentBeatmap.isPlaying = false;
        this._currentBeatmap.isPaused = false;
        this._currentBeatmap.currentTime = 0;
    }

    /**
     * Get the current playback time of the beatmap audio
     */
    public getCurrentTime(): number {
        if (!this._currentBeatmap) {
            return 0;
        }

        return this._beatmapAudioSource.currentTime;
    }

    /**
     * Get the total duration of the current beatmap
     */
    public getTotalDuration(): number {
        if (!this._currentBeatmap) {
            return 0;
        }

        return this._currentBeatmap.totalDuration;
    }

    /**
     * Register a callback to be called on each beat
     * @param callback Function to call on each beat
     */
    public onBeat(callback: Function): void {
        this._beatCallbacks.push(callback);
    }

    /**
     * Remove a beat callback
     * @param callback The callback to remove
     */
    public offBeat(callback: Function): void {
        const index = this._beatCallbacks.indexOf(callback);
        if (index !== -1) {
            this._beatCallbacks.splice(index, 1);
        }
    }

    /**
     * Start tracking beats from the MIDI file and call registered callbacks
     */
    private startBeatTracking(): void {
        if (!this._currentBeatmap || !this._currentBeatmap.trackInfo.notes) {
            return;
        }

        // Clean up any existing timer
        this.stopBeatTracking();

        // Track note timings and call callbacks
        const notes = this._currentBeatmap.trackInfo.notes;
        let nextNoteIndex = 0;

        // Use requestAnimationFrame for more precise timing
        const trackBeats = () => {
            if (!this._currentBeatmap || !this._currentBeatmap.isPlaying) {
                return;
            }

            const currentTime = this._beatmapAudioSource.currentTime;

            // Check if we've reached any new notes
            while (nextNoteIndex < notes.length &&
                notes[nextNoteIndex].time <= currentTime) {
                // Call all beat callbacks with the note info
                this._beatCallbacks.forEach(callback => {
                    callback(notes[nextNoteIndex]);
                });

                nextNoteIndex++;
            }

            // Continue tracking
            requestAnimationFrame(trackBeats);
        };

        // Start tracking
        requestAnimationFrame(trackBeats);
    }

    /**
     * Stop tracking beats
     */
    private stopBeatTracking(): void {
        // This will naturally stop the requestAnimationFrame loop
        if (this._currentBeatmap) {
            this._currentBeatmap.isPlaying = false;
        }
    }

    /**
     * Set the music volume
     * @param volume Volume from 0 to 1
     */
    public setMusicVolume(volume: number): void {
        this._beatmapAudioSource.volume = volume;
    }

    /**
     * Get the music volume
     */
    public getMusicVolume(): number {
        return this._beatmapAudioSource.volume;
    }

    /**
     * Check if beatmap audio is still buffering
     */
    public isBuffering(): boolean {
        return this._isBuffering;
    }

    /**
     * Check if beatmap audio is currently playing
     */
    public isPlaying(): boolean {
        return this._currentBeatmap ? this._currentBeatmap.isPlaying : false;
    }

    /**
     * Check if beatmap audio is currently paused
     */
    public isPaused(): boolean {
        return this._currentBeatmap ? this._currentBeatmap.isPaused : false;
    }

    /**
     * Play a sound effect through the common audio manager
     */
    public playSound(name: string, volumePercent: number = 1.0): AudioSource {
        return this.commonAudioManager?.playSound(name, volumePercent);
    }

    /**
     * Create BeatmapAudioData directly from already loaded assets
     * Useful for drag-and-drop functionality where assets are loaded outside the resource system
     * 
     * @param audioClip The already loaded AudioClip
     * @param midiTrack The already parsed MIDI track data
     * @returns Promise that resolves with the BeatmapAudioData
     */
    public async createBeatmapAudioDataFromAssets(audioClip: AudioClip, midiTrack: any): Promise<BeatmapAudioData> {
        this._isBuffering = true;

        try {
            // Create beatmap audio data directly from the provided assets
            this._currentBeatmap = {
                clip: audioClip,
                trackInfo: midiTrack,
                totalDuration: audioClip.getDuration(),
                currentTime: 0,
                isPlaying: false,
                isPaused: false
            };

            // Setup the audio source
            this._beatmapAudioSource.clip = audioClip;
            this._beatmapAudioSource.volume = 1.0;
            // this._beatmapAudioSource.volume = this.commonAudioManager.getMusicVolume();

            this._isBuffering = false;
            return this._currentBeatmap;
        } catch (err) {
            console.error("Failed to create beatmap audio from assets:", err);
            this._isBuffering = false;
            return null;
        }
    }

    /**
     * Cleanup and deinitialize the audio manager
     * Call this when changing scenes to prevent memory leaks
     */
    public deinit(): void {
        // Stop any playing audio
        if (this._beatmapAudioSource) {
            this._beatmapAudioSource.stop();
        }

        // Clear current beatmap data
        this._currentBeatmap = null;

        // Clear beat callbacks
        this._beatCallbacks = [];

        // Reset buffering and timer states
        this._isBuffering = false;
        this._playbackTimer = 0;
        this.audioTimeEstimation = 0;
        this.lastSystemTime = 0;
        this._timeCheckCounter = 0;

        // If we need to release the singleton instance
        MTAudioManager._instance = null;
    }
} 