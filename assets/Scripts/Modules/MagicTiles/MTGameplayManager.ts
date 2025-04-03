import { _decorator, Component, Node, director, Toggle } from 'cc';
import { MagicTilesAudioManager } from './AudioManager';
import { BeatmapManager } from './BeatmapManager';
import { TileManager } from './TileManager';
import { InputManager } from './InputManager';
import { FeedbackManager } from './FeedbackManager';
import { TapValidator } from './TapValidator';
import { ScoreManager } from './ScoreManager';
import { HitRating } from './Tile';
import { BeatmapAudioData } from './MTDefines';

const { ccclass, property } = _decorator;

// Define possible game states
export enum GameState {
    NONE,
    LOADING,
    WAITING_FOR_START,  // State for waiting for the beginning tile tap
    PLAYING,
    PAUSED,
    COMPLETED,
    FAILED
}

/**
 * GameplayManager for Magic Tiles 3
 * Coordinates gameplay systems and manages game flow
 */
@ccclass('MTGameplayManager')
export class MTGameplayManager extends Component {
    // Current game state
    private gameState: GameState = GameState.NONE;

    @property(TileManager)
    tileManager: TileManager = null!;

    @property(InputManager)
    inputManager: InputManager = null!;

    @property(FeedbackManager)
    feedbackManager: FeedbackManager = null!;

    @property(TapValidator)
    tapValidator: TapValidator = null!;

    @property(ScoreManager)
    scoreManager: ScoreManager = null!;

    @property(Toggle)
    toggleAutoPlay: Toggle = null!;
    // Game settings
    @property
    countdownDuration: number = 3;

    @property
    minSurvivalHP: number = 40;

    @property
    maxSurvivalHP: number = 100;

    @property
    missHPPenalty: number = 10;

    @property
    badHitHPPenalty: number = 5;

    @property
    perfectHPRecovery: number = 2;

    // Current data
    private survivalHP: number = 100;
    private currentBeatmapId: string = "";
    private elapsedTime: number = 0;
    private notesPassed: number = 0;
    private totalNotes: number = 0;
    private autoPlay: boolean = false;
    private isPaused: boolean = false;

    // Callbacks
    private onGameStateChangedCallback: ((newState: GameState) => void) | null = null;
    private onSurvivalHPChangedCallback: ((hp: number) => void) | null = null;

    audioManager: MagicTilesAudioManager = null!;
    beatmapManager: BeatmapManager = null!;

    onLoad() {
        // Initialize references if not set in the inspector
        if (!this.audioManager) {
            this.audioManager = MagicTilesAudioManager.instance;
        }

        if (!this.beatmapManager) {
            this.beatmapManager = BeatmapManager.instance;
        }

        // Register callback for ratings to update HP
        if (this.tapValidator) {
            this.tapValidator.onRating(this.onRatingEvent.bind(this));
        }

        //test play sample song 
        // this.LoadBeatMap("DauCoLoiLam_ATVNCG_bestcut");
        // this.LoadBeatMap("Perfect_EdSheeran_demo");
    }

    /**
     * Start loading a beatmap
     * @param beatmapId ID of the beatmap to load
     */
    async LoadBeatMap(beatmapId: string): Promise<boolean> {
        // Reset states 
        this.resetGameState();

        // Set current beatmap ID
        this.currentBeatmapId = beatmapId;

        // Change to loading state
        this.setGameState(GameState.LOADING);

        try {
            // Load the beatmap
            const beatmap = await this.beatmapManager.loadBeatmapInfo(beatmapId);
            if (!beatmap) {
                console.error(`Failed to load beatmap: ${beatmapId}`);
                return false;
            }

            // Set total notes count
            // Load the audio
            const audioLoaded: BeatmapAudioData = await this.beatmapManager.loadBeatmapAudioData();
            if (!audioLoaded) {
                console.error("Failed to load beatmap audio");
                return false;
            }
            //update notes if not exist
            if (beatmap.notes == null || beatmap.notes.length == 0) {
                const beatmapUpdated = this.beatmapManager.updateNotes(beatmapId, audioLoaded.trackInfo.notes);
                this.totalNotes = beatmapUpdated.notes.length;
            } else {
                this.totalNotes = beatmap.notes.length;
            }
            this.tileManager.initGame();
            // Create beginning tile and wait for user tap
            this.createBeginningTile();
            return true;
        } catch (err) {
            console.error("Error starting game:", err);
            return false;
        }
    }

    /**
     * Start actual gameplay after the beginning tile is tapped
     */
    private startPlaying() {
        this.setAutoPlay(this.toggleAutoPlay.isChecked);

        // Reset managers
        this.tapValidator.resetCombo();
        this.scoreManager.resetScore();
        this.scoreManager.startTracking();

        // Enable input
        this.inputManager.setEnabled(true);

        // Start the tile manager
        this.tileManager.startGame();

        // Play the beatmap audio
        this.audioManager.playBeatmapAudio();

        // Set game state
        this.setGameState(GameState.PLAYING);

        // Start update loop
        this.schedule(this.gameUpdate, 0);
    }

    /**
     * Pause the game
     */
    pauseGame() {
        if (this.gameState !== GameState.PLAYING) return;

        // Pause audio
        this.audioManager.pauseBeatmapAudio();

        // Pause tile manager
        this.tileManager.pauseGame();

        // Disable input
        this.inputManager.setEnabled(false);

        // Pause score tracking
        this.scoreManager.pauseTracking();

        // Set paused flag and game state
        this.isPaused = true;
        this.setGameState(GameState.PAUSED);

        // Unschedule update
        this.unschedule(this.gameUpdate);
    }

    /**
     * Resume the game from pause
     */
    resumeGame() {
        if (this.gameState !== GameState.PAUSED) return;

        // Resume audio
        this.audioManager.resumeBeatmapAudio();

        // Resume tile manager
        this.tileManager.resumeGame();

        // Enable input
        this.inputManager.setEnabled(true);

        // Resume score tracking
        this.scoreManager.resumeTracking();

        // Reset paused flag and game state
        this.isPaused = false;
        this.setGameState(GameState.PLAYING);

        // Schedule update
        this.schedule(this.gameUpdate, 0);
    }

    /**
     * Update method called every frame during gameplay
     */
    private gameUpdate(dt: number) {
        // Update elapsed time
        this.elapsedTime += dt;

        // Sync game time with audio
        if (this.audioManager.isPlaying()) {
            const audioTime = this.audioManager.getCurrentTime();
            this.tileManager.setGameTime(audioTime);
        }

        // Check for auto-fail condition (HP too low)
        if (this.survivalHP <= 0) {
            this.failGame();
            return;
        }

        // Check for completion condition (reached the end of the song)
        if (this.notesPassed >= this.totalNotes && this.tileManager.getActiveTileCount() === 0) {
            this.completeGame();
            return;
        }
    }

    /**
     * Handle a rating event from the tap validator
     */
    private onRatingEvent(lane: number, rating: HitRating) {
        this.feedbackManager.showRatingFeedback(lane, rating);
        this.feedbackManager.updateCombo(this.tapValidator.getCombo());
        // Count the note
        this.notesPassed++;

        // Update HP based on rating
        switch (rating) {
            case HitRating.PERFECT:
                this.changeSurvivalHP(this.perfectHPRecovery);
                break;
            case HitRating.GREAT:
                // No HP change for GOOD hits
                break;
            case HitRating.COOL:
                this.changeSurvivalHP(-this.badHitHPPenalty);
                break;
            case HitRating.MISS:
                this.changeSurvivalHP(-this.missHPPenalty);
                break;
        }
    }

    /**
     * Change the survival HP and notify listeners
     */
    private changeSurvivalHP(amount: number) {
        this.survivalHP = Math.max(0, Math.min(this.maxSurvivalHP, this.survivalHP + amount));

        // Notify listeners
        if (this.onSurvivalHPChangedCallback) {
            this.onSurvivalHPChangedCallback(this.survivalHP);
        }
    }

    /**
     * Complete the game (successfully finished)
     */
    private completeGame() {
        // Stop the gameplay
        this.stopGameplay();

        // Set game state
        this.setGameState(GameState.COMPLETED);

        // Show completion message
        this.feedbackManager.showMessage("LEVEL COMPLETE!");

        // Submit final score
        const finalScore = this.scoreManager.getFinalScore();
        const accuracy = this.tapValidator.getAccuracy();
        const maxCombo = this.tapValidator.getMaxCombo();

        console.log(`Game completed! Score: ${finalScore}, Accuracy: ${accuracy}%, Max Combo: ${maxCombo}`);

        // Show score screen after a delay
        this.scheduleOnce(() => {
            // This would typically transition to a results screen
            console.log("Show results screen");
        }, 2);
    }

    /**
     * Fail the game (HP reached 0)
     */
    private failGame() {
        // Stop the gameplay
        this.stopGameplay();

        // Set game state
        this.setGameState(GameState.FAILED);

        // Show failure message
        this.feedbackManager.showMessage("GAME OVER");

        // Camera shake effect
        this.feedbackManager.shakeCamera(0.3, 0.8);

        // Show retry screen after a delay
        this.scheduleOnce(() => {
            // This would typically transition to a retry/fail screen
            console.log("Show fail screen");
        }, 2);
    }

    /**
     * Stop all gameplay systems
     */
    private stopGameplay() {
        // Stop audio
        this.audioManager.stopBeatmapAudio();

        // Stop tile manager
        this.tileManager.stopGame();

        // Disable input
        this.inputManager.setEnabled(false);

        // Stop score tracking
        this.scoreManager.stopTracking();

        // Unschedule update
        this.unschedule(this.gameUpdate);
    }

    /**
     * Reset the game state to defaults
     */
    public resetGameState() {
        this.gameState = GameState.NONE;
        this.survivalHP = this.maxSurvivalHP;
        this.elapsedTime = 0;
        this.notesPassed = 0;
        this.totalNotes = 0;
        this.isPaused = false;
    }

    /**
     * Set the game state and notify listeners
     */
    public setGameState(newState: GameState) {
        this.gameState = newState;

        // Notify listeners
        if (this.onGameStateChangedCallback) {
            this.onGameStateChangedCallback(newState);
        }
    }

    /**
     * Register a callback for game state changes
     */
    onGameStateChanged(callback: (newState: GameState) => void) {
        this.onGameStateChangedCallback = callback;
    }

    /**
     * Register a callback for survival HP changes
     */
    onSurvivalHPChanged(callback: (hp: number) => void) {
        this.onSurvivalHPChangedCallback = callback;
    }

    /**
     * Get the current game state
     */
    getGameState(): GameState {
        return this.gameState;
    }

    /**
     * Get the current survival HP
     */
    getSurvivalHP(): number {
        return this.survivalHP;
    }

    /**
     * Get the progress through the song (0-1)
     */
    getProgress(): number {
        if (this.totalNotes === 0) return 0;
        return this.notesPassed / this.totalNotes;
    }

    /**
     * Enable/disable auto-play mode
     */
    setAutoPlay(enable: boolean) {
        this.autoPlay = enable;
        this.tileManager.toggleAutoplay(enable);
    }

    /**
     * Check if auto-play is enabled
     */
    isAutoPlayEnabled(): boolean {
        return this.autoPlay;
    }

    /**
     * Toggle the game pause state
     */
    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    /**
     * Restart the current beatmap
     */
    restartGame() {
        if (this.currentBeatmapId) {
            this.LoadBeatMap(this.currentBeatmapId);
        }
    }

    /**
     * Exit the current game and return to menu
     */
    exitGame() {
        // Stop gameplay
        this.stopGameplay();

        // Reset state
        this.resetGameState();

        // This would typically transition to the menu scene
        console.log("Exit to menu");
    }

    /**
     * Create a beginning tile that the player must tap to start the game
     */
    public createBeginningTile() {
        // Change to waiting state
        this.setGameState(GameState.WAITING_FOR_START);

        // Show message to tap to start
        this.feedbackManager.showMessage("Tap to Start", 0, 140);

        // Initialize the tileManager with a minimal setup to just show the beginning tile
        if (this.tileManager) {
            // Set up tileManager to show the beginning tile but not start the full song
            this.tileManager.setupBeginningTile();
        }

        // Enable input for just the beginning tile interaction
        this.inputManager.setEnabled(true);

        // Register callback for the beginning tile tap
        this.inputManager.onLaneTap(this.onBeginningTileTap.bind(this));
    }

    /**
     * Handler for when the beginning tile is tapped
     * @param laneIndex The lane that was tapped
     */
    private onBeginningTileTap(laneIndex: number) {
        // Check if we're in the waiting for start state
        if (this.gameState !== GameState.WAITING_FOR_START) {
            return;
        }

        // Check if this lane has the beginning tile
        const beginningTileTapped = this.tileManager.checkBeginningTileTap(laneIndex);
        if (beginningTileTapped) {
            // Unregister the lane tap callback to avoid duplicate calls
            this.inputManager.removeOnLaneTap(this.onBeginningTileTap.bind(this));

            // Start the actual gameplay
            this.startPlaying();
        }
    }
} 