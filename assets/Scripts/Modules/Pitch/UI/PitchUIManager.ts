import { _decorator, Component, Node, Label, Sprite, Button, UITransform, Vec3, tween, Color, Animation } from 'cc';
import { PitchConstants, MusicalNote, FeedbackType, GameState } from '../Systems/PitchConstants';
import { PitchNoteSequence } from '../Data/PitchNoteSequence';
import { PitchGameplayController } from '../Systems/PitchGameplayController';
const { ccclass, property } = _decorator;

/**
 * UI Manager for the Pitch Detection Game
 * Manages all UI elements and visual feedback
 */
@ccclass('PitchUIManager')
export class PitchUIManager extends Component {
    //#region Singleton
    private static _instance: PitchUIManager = null;

    public static get instance(): PitchUIManager {
        return this._instance;
    }
    //#endregion

    //#region UI Screens
    @property({ type: Node, group: { name: "UI Screens", id: "screens" } })
    private mainMenuScreen: Node = null;

    @property({ type: Node, group: { name: "UI Screens", id: "screens" } })
    private gameplayScreen: Node = null;

    @property({ type: Node, group: { name: "UI Screens", id: "screens" } })
    private resultsScreen: Node = null;

    @property({ type: Node, group: { name: "UI Screens", id: "screens" } })
    private calibrationScreen: Node = null;
    //#endregion

    //#region Gameplay UI Elements
    @property({ type: Node, group: { name: "Gameplay UI", id: "gameplay" } })
    private progressLine: Node = null;

    @property({ type: Label, group: { name: "Gameplay UI", id: "gameplay" } })
    private timerLabel: Label = null;

    @property({ type: Label, group: { name: "Gameplay UI", id: "gameplay" } })
    private currentNoteLabel: Label = null;

    @property({ type: Label, group: { name: "Gameplay UI", id: "gameplay" } })
    private targetNoteLabel: Label = null;

    //#endregion

    //#region Feedback Elements
    @property({ type: [Node], group: { name: "Feedback", id: "feedback" } })
    private feedbackNodes: Node[] = [];

    @property({ type: Animation, group: { name: "Feedback", id: "feedback" } })
    private feedbackAnimation: Animation = null;
    //#endregion

    //#region Results UI Elements
    @property({ type: Label, group: { name: "Results UI", id: "results" } })
    private resultsTitleLabel: Label = null;

    @property({ type: Label, group: { name: "Results UI", id: "results" } })
    private resultsTimeLabel: Label = null;

    @property({ type: Label, group: { name: "Results UI", id: "results" } })
    private resultsAccuracyLabel: Label = null;

    @property({ type: Button, group: { name: "Results UI", id: "results" } })
    private retryButton: Button = null;

    @property({ type: Button, group: { name: "Results UI", id: "results" } })
    private mainMenuButton: Button = null;
    //#endregion

    //#region Animation Properties
    private readonly PROGRESS_LINE_MOVE_DURATION: number = 0.5;
    //#endregion

    //#region Current State
    private currentGameState: GameState = GameState.INIT;
    //#endregion

    //#region Lifecycle Methods
    onLoad() {
        // Set up singleton instance
        if (PitchUIManager._instance !== null) {
            this.node.destroy();
            return;
        }
        PitchUIManager._instance = this;
    }
    //#endregion

    //#region Screen Management
    private hideAllScreens(): void {
        if (this.mainMenuScreen) this.mainMenuScreen.active = false;
        if (this.gameplayScreen) this.gameplayScreen.active = false;
        if (this.resultsScreen) this.resultsScreen.active = false;
        if (this.calibrationScreen) this.calibrationScreen.active = false;
    }

    public showMainMenu(): void {
        this.hideAllScreens();
        if (this.mainMenuScreen) {
            this.mainMenuScreen.active = true;
            this.currentGameState = GameState.INIT;
        }
    }

    public showGameplay(sequence: PitchNoteSequence): void {
        this.hideAllScreens();
        if (this.gameplayScreen) {
            this.gameplayScreen.active = true;
            this.currentGameState = GameState.PLAYING;

            // Initialize UI elements
            this.initializeGameplayUI();
        }
    }

    public showCalibration(): void {
        this.hideAllScreens();
        if (this.calibrationScreen) {
            this.calibrationScreen.active = true;
            this.currentGameState = GameState.CALIBRATING;
        }
    }

    public showResults(success: boolean, timeRemaining: number, accuracy: number): void {
        this.hideAllScreens();
        if (this.resultsScreen) {
            this.resultsScreen.active = true;
            this.currentGameState = GameState.GAME_OVER;

            // Update results UI
            if (this.resultsTitleLabel) {
                this.resultsTitleLabel.string = success ? "Success!" : "Time's Up!";
            }

            if (this.resultsTimeLabel) {
                this.resultsTimeLabel.string = `Time: ${timeRemaining.toFixed(1)}s remaining`;
            }

            if (this.resultsAccuracyLabel) {
                this.resultsAccuracyLabel.string = `Accuracy: ${accuracy.toFixed(1)}%`;
            }
        }
    }
    //#endregion

    //#region Gameplay UI Management
    private initializeGameplayUI(): void {
        // Reset progress line to the start
        if (this.progressLine) {
            this.progressLine.setPosition(new Vec3(-200, 0, 0));
        }

        // Update target note label
        this.updateTargetNoteLabel();

        // Reset current note label
        if (this.currentNoteLabel) {
            this.currentNoteLabel.string = "";
        }

        // Reset timer label
        if (this.timerLabel) {
            this.timerLabel.string = `${PitchConstants.GAME_DURATION}s`;
        }
    }

    //#region Label Updates
    public updateTargetNoteLabel(): void {
        if (!this.targetNoteLabel) return;

        const targetNote = PitchGameplayController.instance.getCurrentTargetNote();
        if (targetNote !== null) {
            const noteName = PitchConstants.NOTE_NAMES[targetNote];
            this.targetNoteLabel.string = `Target: ${noteName}`;
        } else {
            this.targetNoteLabel.string = "";
        }
    }

    public updateCurrentNoteLabel(note: MusicalNote | null): void {
        if (!this.currentNoteLabel) return;

        if (note !== null) {
            const noteName = PitchConstants.NOTE_NAMES[note];
            this.currentNoteLabel.string = `Current: ${noteName}`;
        } else {
            this.currentNoteLabel.string = "Current: -";
        }
    }

    public updateTimer(remainingTime: number): void {
        if (!this.timerLabel) return;

        this.timerLabel.string = `${Math.ceil(remainingTime)}s`;

        // Change color for time warnings
        if (remainingTime <= PitchConstants.WARNING_TIME_2) {
            this.timerLabel.color = new Color(255, 0, 0, 255); // Red for final warning
        } else if (remainingTime <= PitchConstants.WARNING_TIME_1) {
            this.timerLabel.color = new Color(255, 165, 0, 255); // Orange for first warning
        } else {
            this.timerLabel.color = new Color(255, 255, 255, 255); // White for normal
        }
    }
    //#endregion

    //#region Feedback Management
    public showFeedback(type: FeedbackType): void {
        if (!this.feedbackNodes || !this.feedbackAnimation) return;

        // Hide all feedback nodes
        for (const node of this.feedbackNodes) {
            node.active = false;
        }

        // Show the appropriate feedback node
        if (type >= 0 && type < this.feedbackNodes.length) {
            this.feedbackNodes[type].active = true;
        }

        // Play feedback animation
        const animationName = [
            'perfect',
            'good',
            'miss',
            'timeWarning'
        ][type];

        this.feedbackAnimation.play(animationName);
    }

    public showTimeWarning(remainingTime: number): void {
        // Flash the timer
        if (this.timerLabel && this.timerLabel.node) {
            tween(this.timerLabel.node)
                .to(0.2, { scale: new Vec3(1.5, 1.5, 1.5) })
                .to(0.2, { scale: new Vec3(1.0, 1.0, 1.0) })
                .repeat(2)
                .start();
        }

        // Show time warning feedback
        this.showFeedback(FeedbackType.TIME_WARNING);
    }
    //#endregion

    //#region Game State Management
    public getGameState(): GameState {
        return this.currentGameState;
    }
    //#endregion
}
