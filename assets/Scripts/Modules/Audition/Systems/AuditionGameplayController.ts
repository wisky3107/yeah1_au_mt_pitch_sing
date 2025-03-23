import { _decorator, Component, Node, Button, Label, ProgressBar, director } from 'cc';
import { AuditionAudioManager } from '../Systems/AuditionAudioManager';
import { AuditionBeatSystem, AuditionAccuracyRating } from '../Systems/AuditionBeatSystem';
import { AuditionScoringSystem } from '../Systems/AuditionScoringSystem';
import { AuditionCharacterAnimation } from '../Systems/AuditionCharacterAnimation';
import { AuditionUIManager, FeedbackType } from '../UI/AuditionUIManager';
import { SongData } from '../Data/SongData';

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

    // Singleton instance
    private static _instance: AuditionGameplayController = null;

    /**
     * Get the singleton instance
     */
    public static get instance(): AuditionGameplayController {
        return this._instance;
    }

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
    private currentSong: SongData = null;

    //test data should load from csv
    // Available songs in the game
    private availableSongs: SongData[] = [
        {
            id: 'song0211',
            title: '삐딱하게 (Crooked)',
            artist: 'G-Dragon',
            difficulty: 3,
            bpm: 130,
            audioPath: 'song0211',
            previewStart: 30000,
            previewEnd: 45000
        },
        {
            id: 'song0502',
            title: 'Growl',
            artist: 'EXO',
            difficulty: 2,
            bpm: 90,
            audioPath: 'song0502',
            previewStart: 25000,
            previewEnd: 40000
        }
    ];

    /**
     * Returns the list of available songs in the game
     * @returns Array of SongData objects
     */
    public getAvailableSongs(): SongData[] {
        return this.availableSongs;
    }

    /**
     * Returns the list of unlocked songs in the game
     * @returns Array of SongData objects
     */
    public getUnlockedSongs(): SongData[] {
        return this.availableSongs;
    }

    /**
     * Returns the high score for a given song
     * @param songId The ID of the song
     * @returns The high score for the song
     */
    public getHighScore(songId: string): number {
        return 0;
    }

    /**
     * Returns true if a song is unlocked
     * @param songId The ID of the song 
     * @returns True if the song is unlocked, false otherwise
     */
    public isSongUnlocked(songId: string): boolean {
        return true;
    }



    onLoad() {
        // Set up singleton instance
        if (AuditionGameplayController._instance !== null) {
            this.node.destroy();
            return;
        }

        AuditionGameplayController._instance = this;
    }

    start() {
        // Setup UI
        // Setup button events
        this.setupButtonEvents();

        // Reset scoring system
        if (this.scoringSystem) {
            this.scoringSystem.reset();

            // Connect scoring system to UI
            this.scoringSystem.onScoreUpdate(this.updateScoreDisplay.bind(this));
            this.scoringSystem.onComboUpdate(this.updateComboDisplay.bind(this));
            this.beatSystem.setScoreCallback(this.onScoringProcessed.bind(this));

        }

        // Reset character animation
        if (this.characterAnimation) {
            this.characterAnimation.resetToIdle();
        }

        // Select a random song from available songs
        if (this.availableSongs && this.availableSongs.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.availableSongs.length);
            const randomSong = this.availableSongs[randomIndex];
            this.startSong(randomSong.id);
            console.log(`Starting random song: ${randomSong.id}`);
        } else {
            console.error('No available songs found');
        }
    }

    public startSong(songId: string): void {
        this.gameState = GameState.INIT;
        console.log(`Starting song: ${songId}`);

        // Find the song data
        const songData = this.availableSongs.find(song => song.id === songId);
        if (!songData) {
            console.error(`Song with id ${songId} not found`);
            return;
        }

        this.currentSong = songData;
        // Initialize gameplay
        this.initGameplay();
        AuditionUIManager.instance.showGameplay(this.currentSong);
    }

    /**
     * Initialize gameplay with current song
     */
    private initGameplay(): void {
        const audioManager = AuditionAudioManager.instance;

        if (!audioManager || !this.beatSystem) {
            console.error('Required components not found');
            return;
        }

        // Get current song
        if (!this.currentSong) {
            console.error('No song selected');
            return;
        }

        // Load both song audio and dance data concurrently
        Promise.all([
            audioManager.loadSong(this.currentSong.audioPath),
            this.characterAnimation.loadDanceData(this.currentSong.id)
        ])
            .then(([songLoaded, danceDataLoaded]) => {
                console.log('Song and dance data loaded successfully');
                // Get song duration from audio manager

                this.songDuration = audioManager.getDuration();
                this.characterAnimation.setMusicSpeed(this.currentSong.bpm);

                this.startGameplay();
                return this.songDuration;
            })
            .catch(error => {
                console.error('Failed to load song or dance data:', error);
                throw error; // Re-throw to be caught by the outer catch
            })
    }

    /**
     * Start gameplay
     */
    private startGameplay(): void {
        // Record start time
        this.beatSystem.setReadyCallback(() => {
            AuditionUIManager.instance.playReadyGoAnimation();
        });

        this.songStartTime = Date.now();
        // Start audio
        AuditionAudioManager.instance.playSong();
        // Start beatmap
        this.beatSystem.startBeatSystem(this.currentSong.bpm, this.songDuration);
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
        if (audioManager && audioManager.getCurrentTime() >= this.songDuration && this.songStartTime > 0) {
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
        const progress = Math.min(1.0, currentTime / this.songDuration) * 0.9;

        // Update UI progress bar
        this.songProgressBar.progress = progress + 0.1;

        // Also update UI manager progress
        AuditionUIManager.instance.updateProgress(progress);
    }

    /**
     * Handle note processing result
     * @param rating Accuracy rating
     * @param noteType Note type
     */
    private onScoringProcessed(rating: AuditionAccuracyRating, noteType: number): void {
        // Update notes processed count
        this.notesProcessed++;

        // Update scoring
        this.scoringSystem.processNoteResult(rating, noteType);

        // Update character animation
        this.characterAnimation.reactToInput(
            rating,
            this.scoringSystem.getCombo()
        );

        // Show UI feedback
        let feedbackType: FeedbackType;
        switch (rating) {
            case AuditionAccuracyRating.PERFECT:
                feedbackType = FeedbackType.PERFECT;
                break;
            case AuditionAccuracyRating.GOOD:
                feedbackType = FeedbackType.GREAT;
                break;
            case AuditionAccuracyRating.MISS:
                feedbackType = FeedbackType.MISS;
                break;
            default:
                feedbackType = FeedbackType.MISS;
        }

        AuditionUIManager.instance.showFeedback(feedbackType);
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
        console
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