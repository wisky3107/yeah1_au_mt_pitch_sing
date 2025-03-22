import { _decorator, Component, Node, Button, Label, ProgressBar, director } from 'cc';
import { AuditionGameManager } from '../Core/AuditionGameManager';
import { AuditionAudioManager } from '../Systems/AuditionAudioManager';
import { AuditionUIManager, FeedbackType } from './AuditionUIManager';
import { AuditionBeatSystem, AuditionAccuracyRating } from '../Systems/AuditionBeatSystem';
import { AuditionScoringSystem } from '../Systems/AuditionScoringSystem';
import { AuditionCharacterAnimation } from '../Systems/AuditionCharacterAnimation';
import { AuditionInputType } from '../Systems/AuditionInputHandler';

// Game state enum
enum GameState {
    INIT,
    PLAYING,
    PAUSED,
    GAME_OVER
}

const { ccclass, property } = _decorator;

/**
 * Controller for the Gameplay scene
 * Integrates beat system, scoring, character animations, and UI
 */
@ccclass('AuditionGameplayController')
export class AuditionGameplayController extends Component {
    // Core gameplay components
    @property(AuditionBeatSystem)
    private beatSystem: AuditionBeatSystem = null;

    @property(AuditionScoringSystem)
    private scoringSystem: AuditionScoringSystem = null;

    @property(AuditionCharacterAnimation)
    private characterAnimation: AuditionCharacterAnimation = null;

    // UI elements
    @property(Button)
    private pauseButton: Button = null;

    @property(Node)
    private pauseMenu: Node = null;

    @property(Button)
    private resumeButton: Button = null;

    @property(Button)
    private restartButton: Button = null;

    @property(Button)
    private quitButton: Button = null;

    @property(ProgressBar)
    private songProgressBar: ProgressBar = null;

    // State tracking
    private gameState: GameState = GameState.INIT;
    private songStartTime: number = 0;
    private songDuration: number = 0;
    private notesProcessed: number = 0;

    onLoad() {
    }

    start() {
        // Setup UI
        AuditionUIManager.instance.showGameplay();
        // Setup button events
        this.setupButtonEvents();

        // Reset scoring system
        if (this.scoringSystem) {
            this.scoringSystem.reset();

            // Connect scoring system to UI
            this.scoringSystem.onScoreUpdate(this.updateScoreDisplay.bind(this));
            this.scoringSystem.onComboUpdate(this.updateComboDisplay.bind(this));
        }

        // Reset character animation
        if (this.characterAnimation) {
            this.characterAnimation.resetToIdle();
        }

        // Initialize gameplay
        this.initGameplay();
    }

    /**
     * Initialize gameplay with current song
     */
    private initGameplay(): void {
        const gameManager = AuditionGameManager.instance;
        const audioManager = AuditionAudioManager.instance;

        if (!gameManager || !audioManager || !this.beatSystem) {
            console.error('Required components not found');
            return;
        }

        // Get current song
        const currentSong = gameManager.getCurrentSong();
        if (!currentSong) {
            console.error('No song selected');
            gameManager.changeScene('AuditionSongSelection');
            return;
        }

        // Load beatmap
        // Load song audio first
        audioManager.loadSong(currentSong.audioPath)
            .then(() => {
                // Get song duration from audio manager
                this.songDuration = audioManager.getDuration() * 1000.0;
                // Load beatmap with song duration
                return this.songDuration;
            })
            .then(() => {
                // Setup scoring callback
                this.beatSystem.setScoreCallback(this.onNoteProcessed.bind(this));
                // Set total notes count
                // Start gameplay
                this.startGameplay();
            })
            .catch(error => {
                console.error('Failed to initialize gameplay:', error);
                gameManager.changeScene('AuditionSongSelection');
            });
    }

    /**
     * Start gameplay
     */
    private startGameplay(): void {
        const currentSong = AuditionGameManager.instance.getCurrentSong();

        // Record start time
        this.songStartTime = Date.now();

        // Get song duration from audio manager
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            // We won't be able to access the clip directly
            // Set a default duration (3 minutes) that can be adjusted based on song progress
            this.songDuration = 180000; // 3 minutes in ms
        }

        // Start audio
        audioManager.playSong();

        // Start beatmap
        this.beatSystem.startBeatSystem(currentSong.bpm, this.songDuration);

        // Set game state to playing
        this.gameState = GameState.PLAYING;

        console.log('Gameplay started');
    }

    /**
     * Setup button event listeners
     */
    private setupButtonEvents(): void {
        // Pause button
        if (this.pauseButton) {
            this.pauseButton.node.on(Button.EventType.CLICK, this.onPauseButtonClicked, this);
        }

        // Resume button
        if (this.resumeButton) {
            this.resumeButton.node.on(Button.EventType.CLICK, this.onResumeButtonClicked, this);
        }

        // Restart button
        if (this.restartButton) {
            this.restartButton.node.on(Button.EventType.CLICK, this.onRestartButtonClicked, this);
        }

        // Quit button
        if (this.quitButton) {
            this.quitButton.node.on(Button.EventType.CLICK, this.onQuitButtonClicked, this);
        }

        // Hide pause menu initially
        if (this.pauseMenu) {
            this.pauseMenu.active = false;
        }
    }

    /**
     * Update method called every frame
     * @param dt Delta time
     */
    update(dt: number): void {
        if (this.gameState !== GameState.PLAYING) return;

        // Update progress bar
        this.updateProgressBar();

        // Check for song completion
        const audioManager = AuditionAudioManager.instance;
        // Use the getCurrentTime to check if the song has stopped
        if (audioManager && audioManager.getCurrentTime() === 0 && this.songStartTime > 0) {
            // Song has ended naturally
            this.endGameplay();
        }
    }

    /**
     * Update progress bar
     */
    private updateProgressBar(): void {
        if (!this.songProgressBar || this.songDuration <= 0) return;

        const audioManager = AuditionAudioManager.instance;
        if (!audioManager) return;

        const currentTime = audioManager.getCurrentTime();
        const progress = Math.min(1.0, currentTime / this.songDuration);

        // Update UI progress bar
        this.songProgressBar.progress = progress;

        // Also update UI manager progress
        AuditionUIManager.instance.updateProgress(progress);
    }

    /**
     * Handle note processing result
     * @param rating Accuracy rating
     * @param noteType Note type
     */
    private onNoteProcessed(rating: AuditionAccuracyRating, noteType: number): void {
        // Update notes processed count
        this.notesProcessed++;

        // Update scoring
        this.scoringSystem.processNoteResult(rating, noteType);

        // Update character animation
        this.characterAnimation.reactToInput(
            rating,
            noteType as AuditionInputType,
            this.scoringSystem.getCombo()
        );

        // Show UI feedback
        let feedbackType: FeedbackType;
        switch (rating) {
            case AuditionAccuracyRating.PERFECT:
                feedbackType = FeedbackType.PERFECT;
                break;
            case AuditionAccuracyRating.GOOD:
                feedbackType = FeedbackType.GOOD;
                break;
            case AuditionAccuracyRating.MISS:
                feedbackType = FeedbackType.MISS;
                break;
            default:
                feedbackType = FeedbackType.MISS;
        }

        AuditionUIManager.instance.showFeedback(feedbackType);

        // // Check if all notes have been processed
        // if (this.notesProcessed >= this.totalNotes) {
        //     // Slight delay to allow for animations and final score calculation
        //     this.scheduleOnce(() => {
        //         this.endGameplay();
        //     }, 2.0);
        // }
    }

    /**
     * Update score display
     * @param score Current score
     */
    private updateScoreDisplay(score: number): void {
        AuditionUIManager.instance.updateScore(score);
    }

    /**
     * Update combo display
     * @param combo Current combo
     */
    private updateComboDisplay(combo: number): void {
        AuditionUIManager.instance.updateCombo(combo);
    }

    /**
     * End gameplay and show results
     */
    private endGameplay(): void {
        // Set game state to game over
        this.gameState = GameState.GAME_OVER;

        // Stop audio and beatmap
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.stopSong();
        }

        this.beatSystem.stopBeatSystem();

        // Get final score and stats
        const score = this.scoringSystem.getScore();
        const maxCombo = this.scoringSystem.getMaxCombo();
        const accuracy = this.scoringSystem.getAccuracyPercentage();
        const grade = this.scoringSystem.getGrade();

        // Calculate experience
        const experiencePoints = this.scoringSystem.calculateExperiencePoints();

        // Update game manager with results
        const gameManager = AuditionGameManager.instance;
        if (gameManager) {
            gameManager.endSong(score, maxCombo);
            gameManager.addExperience(experiencePoints);
        }

        // Show results screen
        AuditionUIManager.instance.showResults();
        AuditionUIManager.instance.updateResults(score, accuracy, maxCombo, grade);

        console.log(`Gameplay ended. Score: ${score}, Accuracy: ${accuracy.toFixed(2)}%, Max Combo: ${maxCombo}, Grade: ${grade}`);
    }

    /**
     * Handle pause button click
     */
    private onPauseButtonClicked(): void {
        this.pauseGame();
    }

    /**
     * Handle resume button click
     */
    private onResumeButtonClicked(): void {
        this.resumeGame();
    }

    /**
     * Handle restart button click
     */
    private onRestartButtonClicked(): void {
        // Hide pause menu
        if (this.pauseMenu) {
            this.pauseMenu.active = false;
        }

        // Stop current gameplay
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.stopSong();
        }

        this.beatSystem.stopBeatSystem();

        // Reset game state
        this.gameState = GameState.INIT;

        // Reload the scene to restart
        director.loadScene(director.getScene().name);
    }

    /**
     * Handle quit button click
     */
    private onQuitButtonClicked(): void {
        // Stop gameplay
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.stopSong();
        }

        this.beatSystem.stopBeatSystem();

        // Reset game state
        this.gameState = GameState.INIT;

        // Return to song selection
        AuditionGameManager.instance.changeScene('AuditionSongSelection');
    }

    /**
     * Pause the game
     */
    private pauseGame(): void {
        if (this.gameState !== GameState.PLAYING) return;

        this.gameState = GameState.PAUSED;

        // Pause audio
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.pauseSong();
        }

        // Show pause menu
        if (this.pauseMenu) {
            this.pauseMenu.active = true;
        }
    }

    /**
     * Resume the game
     */
    private resumeGame(): void {
        if (this.gameState !== GameState.PAUSED) return;

        this.gameState = GameState.PLAYING;

        // Resume audio
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.resumeSong();
        }

        // Hide pause menu
        if (this.pauseMenu) {
            this.pauseMenu.active = false;
        }
    }

    onDestroy() {
        // Clean up
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.stopSong();
        }

        if (this.beatSystem) {
            this.beatSystem.stopBeatSystem();
        }
    }
} 