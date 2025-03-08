import { _decorator, Node, AudioClip, AudioSource, game, director, error, Tween, tween, easing } from "cc";
import { AudioManager as CommonAudioManager } from '../../Common/audioManager';
import { resourceUtil } from '../../Common/resourceUtil';
import { loadMidi } from '../../Common/MidiReader';
import { BeatmapAudioData, MidiTrackInfo } from "./MTDefines";

const { ccclass, property } = _decorator;


/**
 * AudioManager for Magic Tiles 3
 * Extends the common AudioManager with additional functionality for music synchronization with gameplay
 */
@ccclass("MagicTilesAudioManager")
export class MagicTilesAudioManager {
    private static _instance: MagicTilesAudioManager | null = null;
    
    // Singleton pattern
    public static get instance(): MagicTilesAudioManager {
        if (!this._instance) {
            this._instance = new MagicTilesAudioManager();
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
    
    constructor() {
        this.init();
    }
    
    private init(): void {
        // Create a dedicated node for beatmap audio
        const beatmapNode = new Node('beatmap-audio');
        director.getScene()!.addChild(beatmapNode);
        game.addPersistRootNode(beatmapNode);
        
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
            // Load the audio clip
            const audioClip = await this.loadAudioClip(audioPath);
            
            // Load the MIDI data
            const midiTrack: MidiTrackInfo = await loadMidi(midiPath, trackIndex);
            
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
        this.startBeatTracking();
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
        return this.commonAudioManager.playSound(name, volumePercent);
    }
} 