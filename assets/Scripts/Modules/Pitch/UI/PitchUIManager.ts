import { _decorator, Component, Node, Label, Sprite, Button, UITransform, Vec3, tween, Color, Animation, ParticleSystem2D } from 'cc';
import { PitchConstants, MusicalNote, FeedbackType, GameState, PitchAccuracy } from '../Systems/PitchConstants';
import { PitchNoteSequence } from '../Data/PitchNoteSequence';
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
    private musicalStaff: Node = null;

    @property({ type: Node, group: { name: "Gameplay UI", id: "gameplay" } })
    private butterfly: Node = null;

    @property({ type: Node, group: { name: "Gameplay UI", id: "gameplay" } })
    private progressLine: Node = null;

    @property({ type: Label, group: { name: "Gameplay UI", id: "gameplay" } })
    private timerLabel: Label = null;

    @property({ type: Label, group: { name: "Gameplay UI", id: "gameplay" } })
    private currentNoteLabel: Label = null;

    @property({ type: Label, group: { name: "Gameplay UI", id: "gameplay" } })
    private targetNoteLabel: Label = null;

    @property({ type: Sprite, group: { name: "Gameplay UI", id: "gameplay" } })
    private microphone: Sprite = null;

    @property({ type: [Node], group: { name: "Gameplay UI", id: "gameplay" } })
    private noteIndicators: Node[] = [];
    //#endregion

    //#region Feedback Elements
    @property({ type: [Node], group: { name: "Feedback", id: "feedback" } })
    private feedbackNodes: Node[] = [];

    @property({ type: ParticleSystem2D, group: { name: "Feedback", id: "feedback" } })
    private butterflyParticles: ParticleSystem2D = null;

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
    private readonly BUTTERFLY_MOVE_DURATION: number = 0.3;
    private readonly PROGRESS_LINE_MOVE_DURATION: number = 0.5;
    //#endregion

    //#region Current State
    private currentGameState: GameState = GameState.INIT;
    private currentSequence: PitchNoteSequence = null;
    private currentNoteIndex: number = 0;
    private butterflyTween: any = null;
    private transNotes: UITransform[] = [];
    private noteYPositions: number[] = [];
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

    start() {
        // Hide all screens initially
        // Show main menu by default
        this.transNotes = this.noteIndicators.map(indicator => indicator.getComponent(UITransform));
        const noteHeight = this.transNotes[0].height;
        this.noteYPositions = this.noteIndicators.map(trans => {
            return trans.position.y + this.musicalStaff.position.y + noteHeight / 2;
        });
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
            this.currentSequence = sequence;
            this.currentNoteIndex = 0;

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
        // Reset butterfly position to the bottom
        if (this.butterfly) {
            this.butterfly.setPosition(new Vec3(0, -150, 0));
        }

        // Reset progress line to the start
        if (this.progressLine) {
            this.progressLine.setPosition(new Vec3(-200, 0, 0));
        }

        // Set up note indicators
        this.setupNoteIndicators();

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

    private setupNoteIndicators(): void {
        if (!this.noteIndicators || !this.currentSequence) return;

        // Hide all note indicators initially
        for (const indicator of this.noteIndicators) {
            indicator.active = false;
        }

        // Show indicators for notes in the sequence
        const notes = this.currentSequence.notes;
        for (let i = 0; i < notes.length && i < this.noteIndicators.length; i++) {
            const noteValue = notes[i].note;
            if (noteValue >= 0 && noteValue < this.noteIndicators.length) {
                this.noteIndicators[noteValue].active = true;
            }
        }

        // Highlight the first note
        this.highlightNoteIndicator(notes[0].note);
    }

    private highlightNoteIndicator(note: MusicalNote): void {
        if (!this.noteIndicators) return;

        // Reset all indicators to normal state
        for (let i = 0; i < this.noteIndicators.length; i++) {
            const indicator = this.noteIndicators[i];
            if (indicator && indicator.active) {
                const sprite = indicator.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(255, 255, 255, 255);
                }
            }
        }

        // Highlight the target note
        if (note >= 0 && note < this.noteIndicators.length) {
            const indicator = this.noteIndicators[note];
            if (indicator && indicator.active) {
                const sprite = indicator.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(255, 255, 0, 255); // Yellow highlight
                }
            }
        }
    }
    //#endregion

    //#region Label Updates
    private updateTargetNoteLabel(): void {
        if (!this.targetNoteLabel || !this.currentSequence) return;

        const notes = this.currentSequence.notes;
        if (this.currentNoteIndex < notes.length) {
            const noteName = PitchConstants.NOTE_NAMES[notes[this.currentNoteIndex].note];
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

    //#region Animation Control
    public moveButterfly(note: MusicalNote | null, volume: number, frequency: number = 0): void {
        if (!this.butterfly || !this.noteIndicators) return;

        // Cancel any existing tween
        if (this.butterflyTween) {
            this.butterflyTween.stop();
            this.butterflyTween = null;
        }

        // Calculate target position based on note or frequency
        let targetY = -150; // Default position at the bottom

        if (note !== null) {
            // Use the note indicator's position for the target note
            if (note >= 0 && note < this.noteIndicators.length) {
                const indicator = this.noteIndicators[note];
                if (indicator && indicator.active) {
                    targetY = this.noteYPositions[note];
                }
            }

            // Activate butterfly particles
            if (this.butterflyParticles) {
                this.butterflyParticles.enabled = true;
                this.butterflyParticles.emissionRate = volume * 100; // Scale volume to emission rate
            }
        } else {
            // When no note is detected, use frequency to determine position
            // Map frequency to a position between the lowest and highest note indicators
            const lowestNote = 0; // DO
            const highestNote = 6; // SI

            if (this.noteIndicators[lowestNote] && this.noteIndicators[highestNote]) {
                const lowestY = this.noteYPositions[lowestNote] - 50.0;
                const highestY = this.noteYPositions[highestNote] + 50.0;

                // Normalize frequency to a value between 0 and 1
                // Assuming frequency range is between 100Hz and 1000Hz
                const normalizedFreq = Math.max(0, Math.min(1, (frequency - 100) / 900));

                // Interpolate between lowest and highest positions
                targetY = lowestY + (highestY - lowestY) * normalizedFreq;
            }

            // Disable butterfly particles
            if (this.butterflyParticles) {
                this.butterflyParticles.enabled = false;
            }
        }

        // Create tween to move butterfly
        const currentPos = this.butterfly.position;
        this.butterflyTween = tween(this.butterfly)
            .to(this.BUTTERFLY_MOVE_DURATION, { position: new Vec3(currentPos.x, targetY, -20.0) }, {
                easing: 'cubicOut'
            })
            .start();
    }

    public advanceProgressLine(): void {
        if (!this.progressLine || !this.currentSequence) return;

        // Calculate progress percentage
        const totalNotes = this.currentSequence.notes.length;
        const progress = (this.currentNoteIndex + 1) / totalNotes;

        // Calculate target position
        const startX = -200;
        const endX = 200;
        const targetX = startX + (endX - startX) * progress;

        // Create tween to move progress line
        const currentPos = this.progressLine.position;
        tween(this.progressLine)
            .to(this.PROGRESS_LINE_MOVE_DURATION, { position: new Vec3(targetX, currentPos.y, currentPos.z) }, {
                easing: 'cubicOut'
            })
            .start();
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
    public advanceToNextNote(): boolean {
        if (!this.currentSequence) return false;

        this.currentNoteIndex++;

        // Check if there are more notes
        if (this.currentNoteIndex < this.currentSequence.notes.length) {
            // Update UI for the next note
            this.updateTargetNoteLabel();
            this.highlightNoteIndicator(this.currentSequence.notes[this.currentNoteIndex].note);
            return true;
        } else {
            // Sequence complete
            return false;
        }
    }

    public getCurrentTargetNote(): MusicalNote | null {
        if (!this.currentSequence || this.currentNoteIndex >= this.currentSequence.notes.length) {
            return null;
        }

        return this.currentSequence.notes[this.currentNoteIndex].note;
    }

    public getGameState(): GameState {
        return this.currentGameState;
    }
    //#endregion
}
