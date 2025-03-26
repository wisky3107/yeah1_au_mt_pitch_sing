import { _decorator, Component, Node, director } from 'cc';
import { PitchConstants, GameState, MusicalNote, PitchAccuracy, FeedbackType } from './PitchConstants';
import { PitchDetectionSystem } from './PitchDetectionSystem';
import { PitchCharacterAnimator } from './PitchCharacterAnimator';
import { PitchTimer } from './PitchTimer';
import { PitchUIManager } from '../UI/PitchUIManager';
import { PitchNoteSequence, PitchSequenceLibrary } from '../Data/PitchNoteSequence';
const { ccclass, property } = _decorator;

/**
 * Pitch detection result interface
 */
interface PitchDetectionResult {
    frequency: number;
    note: MusicalNote | null;
    accuracy: PitchAccuracy;
    volume: number;
}

/**
 * Main controller for the Pitch Detection Game
 * Manages game flow, integrates all components, and handles user input
 */
@ccclass('PitchGameplayController')
export class PitchGameplayController extends Component {
    // Singleton instance
    private static _instance: PitchGameplayController = null;
    
    // Core components
    @property(PitchDetectionSystem)
    private detectionSystem: PitchDetectionSystem = null;
    
    @property(PitchCharacterAnimator)
    private characterAnimator: PitchCharacterAnimator = null;
    
    @property(PitchTimer)
    private timer: PitchTimer = null;
    
    // Game state
    private gameState: GameState = GameState.INIT;
    private currentSequence: PitchNoteSequence = null;
    private totalNotesMatched: number = 0;
    private totalAccuracy: number = 0;
    private noteMatchThreshold: number = 3; // Number of consecutive frames to match a note
    private noteMatchCounter: number = 0;
    
    /**
     * Get the singleton instance
     */
    public static get instance(): PitchGameplayController {
        return this._instance;
    }
    
    onLoad() {
        // Set up singleton instance
        if (PitchGameplayController._instance !== null) {
            this.node.destroy();
            return;
        }
        
        PitchGameplayController._instance = this;
        
        // Initialize PitchSequenceLibrary
        PitchSequenceLibrary.initialize();
    }
    
    start() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Show main menu initially
        PitchUIManager.instance.showMainMenu();
    }
    
    /**
     * Set up event listeners for game events
     */
    private setupEventListeners(): void {
        // Listen for pitch detection events
        PitchDetectionSystem.on(PitchConstants.EVENTS.PITCH_DETECTED, this.onPitchDetected, this);
        
        // Listen for timer events
        PitchTimer.on(PitchConstants.EVENTS.TIME_WARNING, this.onTimeWarning, this);
        PitchTimer.on(PitchConstants.EVENTS.GAME_OVER, this.onTimeUp, this);
    }
    
    /**
     * Start a new game with the specified sequence
     * @param sequenceId Sequence ID to play
     */
    public startGame(sequenceId: string): void {
        // Get the sequence
        const sequence = PitchSequenceLibrary.getSequenceById(sequenceId);
        if (!sequence) {
            console.error(`Sequence with ID ${sequenceId} not found`);
            return;
        }
        
        this.currentSequence = sequence;
        this.gameState = GameState.PLAYING;
        this.totalNotesMatched = 0;
        this.totalAccuracy = 0;
        this.noteMatchCounter = 0;
        
        // Initialize UI
        PitchUIManager.instance.showGameplay(sequence);
        
        // Initialize detection system
        this.detectionSystem.initialize()
            .then(() => {
                return this.detectionSystem.requestMicrophoneAccess();
            })
            .then((success) => {
                if (success) {
                    // Start detection
                    this.detectionSystem.startDetection();
                    
                    // Start timer
                    this.timer.startTimer();
                    
                    console.log('Game started');
                } else {
                    console.error('Failed to access microphone');
                    // TODO: Show error message to user
                }
            })
            .catch((error) => {
                console.error('Error starting game:', error);
                // TODO: Show error message to user
            });
    }
    
    /**
     * Pause the game
     */
    public pauseGame(): void {
        if (this.gameState !== GameState.PLAYING) return;
        
        this.gameState = GameState.PAUSED;
        
        // Pause timer
        this.timer.pauseTimer();
        
        // Pause detection
        this.detectionSystem.stopDetection();
        
        console.log('Game paused');
    }
    
    /**
     * Resume the game
     */
    public resumeGame(): void {
        if (this.gameState !== GameState.PAUSED) return;
        
        this.gameState = GameState.PLAYING;
        
        // Resume timer
        this.timer.resumeTimer();
        
        // Resume detection
        this.detectionSystem.startDetection();
        
        console.log('Game resumed');
    }
    
    /**
     * End the game
     * @param success Whether the player completed the sequence successfully
     */
    public endGame(success: boolean): void {
        this.gameState = GameState.GAME_OVER;
        
        // Stop timer
        this.timer.stopTimer();
        
        // Stop detection
        this.detectionSystem.stopDetection();
        
        // Calculate accuracy
        const accuracy = this.totalNotesMatched > 0 
            ? (this.totalAccuracy / this.totalNotesMatched) * 100 
            : 0;
        
        // Show results
        PitchUIManager.instance.showResults(
            success,
            this.timer.getRemainingTime(),
            accuracy
        );
        
        console.log(`Game ended. Success: ${success}, Accuracy: ${accuracy.toFixed(2)}%`);
    }
    
    /**
     * Start calibration process
     */
    public startCalibration(): void {
        this.gameState = GameState.CALIBRATING;
        
        // Show calibration UI
        PitchUIManager.instance.showCalibration();
        
        // Initialize detection system
        this.detectionSystem.initialize()
            .then(() => {
                return this.detectionSystem.requestMicrophoneAccess();
            })
            .then((success) => {
                if (success) {
                    // Start calibration
                    this.detectionSystem.startCalibration((success) => {
                        if (success) {
                            console.log('Calibration completed successfully');
                            // Return to main menu
                            PitchUIManager.instance.showMainMenu();
                            this.gameState = GameState.INIT;
                        } else {
                            console.error('Calibration failed');
                            // TODO: Show error message to user
                        }
                    });
                } else {
                    console.error('Failed to access microphone');
                    // TODO: Show error message to user
                }
            })
            .catch((error) => {
                console.error('Error starting calibration:', error);
                // TODO: Show error message to user
            });
    }
    
    /**
     * Handle pitch detection event
     * @param result Pitch detection result
     */
    private onPitchDetected(result: PitchDetectionResult): void {
        if (this.gameState !== GameState.PLAYING) return;
        
        // Update UI with current note
        PitchUIManager.instance.updateCurrentNoteLabel(result.note);
        
        // Move butterfly to indicate current pitch
        PitchUIManager.instance.moveButterfly(result.note, result.volume);
        
        // Check if the detected note matches the target note
        const targetNote = PitchUIManager.instance.getCurrentTargetNote();
        
        if (targetNote !== null && result.note === targetNote) {
            // Increment match counter
            this.noteMatchCounter++;
            
            // Check if we've matched the note for enough consecutive frames
            if (this.noteMatchCounter >= this.noteMatchThreshold) {
                this.onNoteMatched(result.note, result.accuracy);
                this.noteMatchCounter = 0;
            }
        } else {
            // Reset match counter
            this.noteMatchCounter = 0;
        }
    }
    
    /**
     * Handle note matched event
     * @param note Matched note
     * @param accuracy Detection accuracy
     */
    private onNoteMatched(note: MusicalNote, accuracy: PitchAccuracy): void {
        // Play character animation
        this.characterAnimator.playNoteAnimation(note, accuracy);
        
        // Show feedback
        let feedbackType: FeedbackType;
        switch (accuracy) {
            case PitchAccuracy.PERFECT:
                feedbackType = FeedbackType.PERFECT;
                break;
            case PitchAccuracy.GOOD:
                feedbackType = FeedbackType.GOOD;
                break;
            default:
                feedbackType = FeedbackType.MISS;
        }
        
        PitchUIManager.instance.showFeedback(feedbackType);
        
        // Update accuracy tracking
        this.totalNotesMatched++;
        this.totalAccuracy += accuracy === PitchAccuracy.PERFECT ? 1.0 : 
                             accuracy === PitchAccuracy.GOOD ? 0.7 : 0.3;
        
        // Advance progress
        PitchUIManager.instance.advanceProgressLine();
        
        // Check if there are more notes
        const hasMoreNotes = PitchUIManager.instance.advanceToNextNote();
        
        if (!hasMoreNotes) {
            // Sequence complete
            this.endGame(true);
        }
    }
    
    /**
     * Handle time warning event
     * @param remainingTime Remaining time in seconds
     */
    private onTimeWarning(remainingTime: number): void {
        if (this.gameState !== GameState.PLAYING) return;
        
        // Show time warning
        PitchUIManager.instance.showTimeWarning(remainingTime);
    }
    
    /**
     * Handle time up event
     */
    private onTimeUp(): void {
        if (this.gameState !== GameState.PLAYING) return;
        
        // End game with failure
        this.endGame(false);
    }
    
    /**
     * Update method called every frame
     * @param dt Delta time
     */
    update(dt: number): void {
        if (this.gameState !== GameState.PLAYING) return;
        
        // Update timer display
        PitchUIManager.instance.updateTimer(this.timer.getRemainingTime());
    }
    
    /**
     * Return to the main menu
     */
    public returnToMainMenu(): void {
        // Stop any ongoing game
        if (this.gameState === GameState.PLAYING || this.gameState === GameState.PAUSED) {
            this.timer.stopTimer();
            this.detectionSystem.stopDetection();
        }
        
        // Reset game state
        this.gameState = GameState.INIT;
        
        // Show main menu
        PitchUIManager.instance.showMainMenu();
    }
    
    /**
     * Restart the current game
     */
    public restartGame(): void {
        if (!this.currentSequence) return;
        
        // Stop current game
        if (this.gameState === GameState.PLAYING || this.gameState === GameState.PAUSED) {
            this.timer.stopTimer();
            this.detectionSystem.stopDetection();
        }
        
        // Start a new game with the same sequence
        this.startGame(this.currentSequence.id);
    }
    
    onDestroy() {
        // Clean up event listeners
        PitchDetectionSystem.off(PitchConstants.EVENTS.PITCH_DETECTED, this.onPitchDetected, this);
        PitchTimer.off(PitchConstants.EVENTS.TIME_WARNING, this.onTimeWarning, this);
        PitchTimer.off(PitchConstants.EVENTS.GAME_OVER, this.onTimeUp, this);
        
        // Stop detection and timer
        this.detectionSystem.stopDetection();
        this.timer.stopTimer();
    }
}
