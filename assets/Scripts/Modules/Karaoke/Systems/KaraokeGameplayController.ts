import { _decorator, Component, Node } from 'cc';
import { KaraokeConstants, KaraokeState } from './KaraokeConstants';
import { PitchDetectionResult } from '../Data/KaraokeTypes';
import { KaraokePitchDetectionSystem } from './KaraokePitchDetectionSystem';
import { KaraokeLyricsManager } from './KaraokeLyricsManager';
import { KaraokeAudioManager } from './KaraokeAudioManager';
import { KaraokeCharacterAnimator } from './KaraokeCharacterAnimator';
import { KaraokeScoringSystem } from './KaraokeScoringSystem';
import { KaraokeUIManager } from '../UI/KaraokeUIManager';
import { KaraokeSongModel } from '../../../Models/Songs/KaraokeSongModel';
import { UIManager } from '../../../Common/uiManager';
import { POPUP } from '../../../Constant/PopupDefine';

const { ccclass, property } = _decorator;

/**
 * Main manager for the Karaoke application
 * Coordinates all subsystems and manages application state
 */
@ccclass('KaraokeGameplayController')
export class KaraokeGameplayController extends Component {
    //#region Properties
    @property({ type: KaraokePitchDetectionSystem, tooltip: "Node containing KaraokePitchDetectionSystem component", group: { name: "Systems", id: "systems" } })
    private pitchDetection: KaraokePitchDetectionSystem = null;

    @property({ type: KaraokeLyricsManager, tooltip: "Node containing KaraokeLyricsManager component", group: { name: "Systems", id: "systems" } })
    private lyricsManager: KaraokeLyricsManager = null;

    @property({ type: KaraokeAudioManager, tooltip: "Node containing KaraokeAudioManager component", group: { name: "Systems", id: "systems" } })
    private audioManager: KaraokeAudioManager = null;

    @property({ type: KaraokeCharacterAnimator, tooltip: "Node containing KaraokeCharacterAnimator component", group: { name: "Systems", id: "systems" } })
    private characterAnimator: KaraokeCharacterAnimator = null;

    @property({ type: KaraokeScoringSystem, tooltip: "Node containing KaraokeScoringSystem component", group: { name: "Systems", id: "systems" } })
    private scoringSystem: KaraokeScoringSystem = null;

    @property({ type: KaraokeUIManager, tooltip: "Node containing KaraokeUIManager component", group: { name: "Systems", id: "systems" } })
    private uiManager: KaraokeUIManager = null;

    @property({ tooltip: "Whether to autostart microphone access on initialization", group: { name: "Config", id: "config" } })
    private autoInitMicrophone: boolean = true;

    @property({ tooltip: "Path to default song to load (can be empty)", group: { name: "Config", id: "config" } })
    private defaultSongPath: string = "";

    //#endregion

    //#region Private Variables
    private state: KaraokeState = KaraokeState.INIT;
    private currentSong: KaraokeSongModel = null;
    private microphoneInitialized: boolean = false;
    private isLyricActive: boolean = false;
    //#endregion

    private availableSongs: KaraokeSongModel[] = [
        {
            id: 'TrongCom_ATVNCG',
            title: 'Trống Cơm',
            artist: 'ATVNCG',
            bpm: 86,
            musicPath: 'TrongCom_ATVNCG',
            lyricPath: 'trongcom',
            lyrics: [],
            duration: 254,
            difficulty: 1,
            previewStart: 0,
            previewEnd: 10000,
        },
    ];

    //#region Lifecycle Methods
    async onLoad() {
        // Initialize subsystems
        this.initializeSubsystems();

        // Ensure proper event handling is set up
        this.setupEventListeners();

        // Initialize state
        this.changeState(KaraokeState.INIT);

        // Auto-initialize microphone if enabled
        if (this.autoInitMicrophone) {
            await this.initializeMicrophone();
        }
    }

    start() {
        // Load default song if provided
        this.loadSong(this.availableSongs[0]);
    }

    onDestroy() {
        // Clean up event listeners and resources
        this.removeEventListeners();
    }

    /**
     * Update method called every frame
     * Updates lyrics manager and scoring system with current time
     * @param dt Delta time
     */
    update(dt: number): void {
        // Update current time from audio manager
        if (this.audioManager && this.state === KaraokeState.PLAYING) {
            const currentTime = this.audioManager.getCurrentTime();

            // Update lyrics manager with current time
            if (this.lyricsManager) {
                this.lyricsManager.updateTime(currentTime);
            }

            // Update scoring system with current time
            if (this.scoringSystem) {
                this.scoringSystem.updateTime(currentTime);
            }

            if (this.uiManager) {
                this.uiManager.updateTimer(currentTime, this.getCurrentPlaybackTime());
            }
        }
    }
    //#endregion

    //#region Public Methods
    /**
     * Initialize microphone and pitch detection
     * @returns Promise resolving to true if successful
     */
    public async initializeMicrophone(): Promise<boolean> {
        if (this.microphoneInitialized) return true;

        if (!this.pitchDetection) {
            console.error('Pitch detection system not found');
            return false;
        }

        try {
            // First initialize pitch detection system
            const initialized = await this.pitchDetection.initialize();
            if (!initialized) {
                console.error('Failed to initialize pitch detection');
                return false;
            }

            // Then request microphone access
            const micAccess = await this.pitchDetection.requestMicrophoneAccess();
            if (!micAccess) {
                console.error('Failed to access microphone');
                return false;
            }

            this.microphoneInitialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing microphone:', error);
            return false;
        }
    }

    /**
     * Load a song by path or ID
     * @param pathOrId Path or ID of the song to load
     * @param song Optional song data if already available
     */
    public async loadSong(song: KaraokeSongModel): Promise<boolean> {
        // Change state to loading
        this.changeState(KaraokeState.LOADING);

        try {
            // If song data is provided, use it
            let songToLoad = song;
            if (!songToLoad) {
                this.changeState(KaraokeState.INIT);
                return false;
            }

            try {
                // Load the lyrics using the new Promise-based method
                const updatedSong = await this.lyricsManager.loadLyrics(songToLoad);
                this.currentSong = updatedSong;

                // Calculate total interaction time (sum of all lyrics durations)
                let totalInteractionDuration = 0;
                if (updatedSong.lyrics && updatedSong.lyrics.length > 0) {
                    for (const lyric of updatedSong.lyrics) {
                        // Add the duration of each lyric segment (endTime - startTime)
                        totalInteractionDuration += (lyric.endTime - lyric.startTime);
                    }
                }

                // Update the scoring system with the total lyrics duration
                if (this.scoringSystem) {
                    this.scoringSystem.setTotalLyricsDuration(totalInteractionDuration);
                }

                console.log(`Total lyrics interaction duration: ${totalInteractionDuration.toFixed(2)} seconds`);

                // Load the audio
                await this.audioManager.loadAudio(KaraokeSongModel.getBeatmapPath(updatedSong));

                // Load lyrics into UI directly
                if (this.uiManager) {
                    this.uiManager.createLyricLabels(updatedSong.lyrics);
                }

                // Change state to ready
                this.changeState(KaraokeState.READY);
                return true;
            } catch (error) {
                console.error('Error loading lyrics:', error);

                // If lyrics failed to load but we still want to continue with the song
                // (e.g., for songs without lyrics or with loading issues)
                this.currentSong = songToLoad;

                // Set empty lyrics array
                this.lyricsManager.setLyrics([]);

                // Load the audio
                await this.audioManager.loadAudio(KaraokeSongModel.getBeatmapPath(songToLoad));

                // Change state to ready
                this.changeState(KaraokeState.READY);
                return true;
            }
        } catch (error) {
            console.error('Error loading song:', error);

            // Change state back to init
            this.changeState(KaraokeState.INIT);
            return false;
        }
    }

    /**
     * Start karaoke playback
     */
    public startPlayback(): void {
        if (this.state !== KaraokeState.READY && this.state !== KaraokeState.PAUSED) {
            console.warn('Cannot start playback in current state');
            return;
        }

        // Ensure microphone is initialized
        if (!this.microphoneInitialized) {
            console.warn('Microphone not initialized, cannot start playback');
            return;
        }

        // Start countdown before actually starting the playback
        if (this.uiManager && this.state === KaraokeState.READY) {
            // Start countdown and start the game when it finishes
            this.uiManager.startCountdown(() => {
                this.actuallyStartPlayback();
            });
        } else {
            // If we're resuming from pause or there's no UI manager, start immediately
            this.actuallyStartPlayback();
        }
    }

    /**
     * Actually start playback after countdown is complete
     * This is an internal method that should only be called by startPlayback
     */
    private actuallyStartPlayback(): void {
        // Start pitch detection
        this.pitchDetection.startDetection();

        // Start audio playback
        this.audioManager.startPlayback();

        // Start lyrics playback
        this.lyricsManager.startPlayback();

        // Start score recording
        this.scoringSystem.startScoring();

        // Start UI timer directly
        if (this.uiManager && this.currentSong) {
            this.uiManager.startTimer(this.currentSong.duration);
        }

        // Change state to playing
        this.changeState(KaraokeState.PLAYING);
    }

    /**
     * Pause karaoke playback
     */
    public pausePlayback(): void {
        if (this.state !== KaraokeState.PLAYING) {
            console.warn('Cannot pause playback in current state');
            return;
        }

        // Pause audio playback
        this.audioManager.pausePlayback();

        // Pause lyrics playback
        this.lyricsManager.pausePlayback();

        // Change state to paused
        this.changeState(KaraokeState.PAUSED);
    }

    /**
     * Resume karaoke playback
     */
    public resumePlayback(): void {
        if (this.state !== KaraokeState.PAUSED) {
            console.warn('Cannot resume playback in current state');
            return;
        }

        // Resume audio playback
        this.audioManager.resumePlayback();

        // Resume lyrics playback
        this.lyricsManager.resumePlayback();

        // Change state to playing
        this.changeState(KaraokeState.PLAYING);
    }

    /**
     * Stop karaoke playback
     */
    public stopPlayback(): void {
        if (this.state !== KaraokeState.PLAYING && this.state !== KaraokeState.PAUSED) {
            console.warn('Cannot stop playback in current state');
            return;
        }

        // Stop pitch detection
        this.pitchDetection.stopDetection();

        // Stop audio playback
        this.audioManager.stopPlayback();

        // Stop lyrics playback
        this.lyricsManager.stopPlayback();

        // Stop score recording
        this.scoringSystem.stopScoring();

        // Reset character animation to idle
        this.characterAnimator.playIdle();

        // Stop UI timer directly
        if (this.uiManager) {
            this.uiManager.stopTimer();
        }

        // Change state to ready
        this.changeState(KaraokeState.READY);
    }

    /**
     * Get the current application state
     * @returns Current state
     */
    public getState(): KaraokeState {
        return this.state;
    }

    /**
     * Get the current song
     * @returns Current song or null if none
     */
    public getCurrentSong(): KaraokeSongModel | null {
        return this.currentSong;
    }

    /**
     * Get the current playback time in seconds
     * @returns Current playback time or 0 if not playing
     */
    public getCurrentPlaybackTime(): number {
        if (this.audioManager && (this.state === KaraokeState.PLAYING || this.state === KaraokeState.PAUSED)) {
            return this.audioManager.getCurrentTime();
        }
        return 0;
    }

    /**
     * Handle exit request from UI
     */
    public handleExitRequest(): void {
        // Logic for exiting karaoke mode
        // This would be implemented based on your navigation system
        if (this.state === KaraokeState.PLAYING || this.state === KaraokeState.PAUSED) {
            this.stopPlayback();
        }
        console.log('Exiting karaoke mode');
    }
    //#endregion

    //#region Private Methods
    private initializeSubsystems(): void {
        // Log any missing subsystems
        if (!this.pitchDetection) console.warn('Pitch detection system not found');
        if (!this.lyricsManager) console.warn('Lyrics manager not found');
        if (!this.audioManager) console.warn('Audio manager not found');
        if (!this.characterAnimator) console.warn('Character animator not found');
        if (!this.scoringSystem) console.warn('Scoring system not found');
        if (!this.uiManager) console.warn('UI manager not found');
    }

    private setupEventListeners(): void {
        // Listen for pitch detection events
        this.pitchDetection.on(
            KaraokeConstants.EVENTS.PITCH_DETECTED,
            this.onPitchDetected,
            this
        );

        // Listen for lyrics events
        this.lyricsManager.on(
            KaraokeConstants.EVENTS.LYRICS_UPDATED,
            this.onLyricsUpdated,
            this
        );

        // Listen for audio events
        this.audioManager.on(
            KaraokeConstants.EVENTS.SONG_ENDED,
            this.onSongEnded,
            this
        );
    }

    private removeEventListeners(): void {
        // Remove all event listeners
        this.pitchDetection.off(
            KaraokeConstants.EVENTS.PITCH_DETECTED,
            this.onPitchDetected,
            this
        );

        this.lyricsManager.off(
            KaraokeConstants.EVENTS.LYRICS_UPDATED,
            this.onLyricsUpdated,
            this
        );

        this.audioManager.off(
            KaraokeConstants.EVENTS.SONG_ENDED,
            this.onSongEnded,
            this
        );
    }

    private changeState(newState: KaraokeState): void {
        // Skip if the state is the same
        if (newState === this.state) return;

        // Log state change
        console.log(`Karaoke state changed: ${KaraokeState[this.state]} -> ${KaraokeState[newState]}`);

        // Update state
        this.state = newState;

        // Update UI directly based on state change
        if (this.uiManager) {
            switch (newState) {
                case KaraokeState.INIT:
                case KaraokeState.LOADING:
                    break;

                case KaraokeState.READY:
                    UIManager.instance.hidePopup(POPUP.KARAOKE_LOADING);
                    this.uiManager.showReadyState();
                    this.uiManager.stopTimer();
                    break;

                case KaraokeState.PLAYING:
                    this.uiManager.showPlayingState();
                    this.uiManager.resumeTimer();
                    break;

                case KaraokeState.PAUSED:
                    this.uiManager.showPausedState();
                    this.uiManager.pauseTimer();
                    break;

                case KaraokeState.FINISHED:
                    this.uiManager.showFinishedState(this.scoringSystem.getScore().score);
                    this.uiManager.stopTimer();
                    break;
            }
        }
    }

    private onPitchDetected(result: PitchDetectionResult): void {
        // Update scoring system
        if (this.scoringSystem) {
            this.scoringSystem.updatePitchDetection(result);
        }

        // Update character animation based on pitch detection
        if (this.characterAnimator) {
            if (result.detected) {
                // Play singing animation if pitch is detected
                this.characterAnimator.playSinging();
            } else {
                // Play idle animation if no pitch is detected
                this.characterAnimator.playIdle();
            }
        }

        // Update UI directly with pitch detection results
        if (this.uiManager) {
            this.uiManager.updateMicVisualization(result, this.pitchDetection);
        }
    }

    private onLyricsUpdated(event: any): void {
        // Get current lyric active state
        const currentLyric = event.currentLyric;
        const currentLyricIndex = event.currentLyricIndex;
        this.isLyricActive = currentLyric !== null && this.lyricsManager.isLyricActive();

        // Update scoring system
        if (this.scoringSystem) {
            this.scoringSystem.updateLyricStatus(this.isLyricActive);
        }

        // Update UI directly with current lyric
        if (this.uiManager) {
            if (this.isLyricActive) {
                this.uiManager.updateLyrics(currentLyricIndex);
            } else {
                // If no lyric is active, hide the current highlight
                this.uiManager.hideLyricHighlight();
            }
        }
    }

    private onSongEnded(): void {
        // Stop playback and change state to finished
        this.pitchDetection.stopDetection();
        this.lyricsManager.stopPlayback();
        this.scoringSystem.stopScoring();
        this.characterAnimator.playIdle();

        // Update UI directly
        if (this.uiManager) {
            this.uiManager.stopTimer();
        }

        // Change state to finished
        this.changeState(KaraokeState.FINISHED);
    }
    //#endregion
} 