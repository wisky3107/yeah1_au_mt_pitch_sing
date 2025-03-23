import { _decorator, Component, Node, Label, Button, UITransform, Sprite, Color, Tween, tween, Vec3, game, UIOpacity, ParticleSystem2D, Animation } from 'cc';
const { ccclass, property } = _decorator;

/**
 * UI state enum
 */
enum UIState {
    MAIN_MENU,
    SONG_SELECTION,
    GAMEPLAY,
    RESULTS,
    SETTINGS
}

/**
 * Feedback type enum for visual feedback
 */
export enum FeedbackType {
    PERFECT,
    GREAT,
    COOL,
    MISS
}

/**
 * UI Manager for Audition module
 * Manages UI screens, transitions, and common functionality
 */
@ccclass('AuditionUIManager')
export class AuditionUIManager extends Component {
    // Singleton instance
    private static _instance: AuditionUIManager = null;

    // UI screens
    @property(Node)
    private mainMenuScreen: Node = null;

    @property(Node)
    private songSelectionScreen: Node = null;

    @property(Node)
    private gameplayScreen: Node = null;

    @property(Node)
    private resultsScreen: Node = null;

    @property(Node)
    private settingsScreen: Node = null;

    // Gameplay UI elements
    @property(Label)
    private scoreLabel: Label = null;

    @property(Label)
    private comboCountLabel: Label = null;

    @property(Sprite)
    private progressBar: Sprite = null;

    // Results UI elements
    @property(Label)
    private finalScoreLabel: Label = null;

    @property(Label)
    private accuracyLabel: Label = null;

    @property(Label)
    private maxComboLabel: Label = null;

    @property(Label)
    private gradeLabel: Label = null;

    @property(Animation)
    animScoreFeedBacks: Animation = null;

    // Individual feedback nodes
    @property({
        type: [Node],
        tooltip: "Feedback animation nodes in order: perfect, good, cool, miss"
    })
    feedbackNodes: Node[] = [];

    @property(ParticleSystem2D)
    particleSystemPerfectFragments: ParticleSystem2D = null!;

    @property(Node)
    private comboLabel: Node = null;

    // Current state
    private currentUIState: UIState = UIState.MAIN_MENU;

    // Animations
    private feedbackTween: Tween<Node> = null;
    private comboTween: Tween<Node> = null;

    // Singleton pattern implementation
    public static get instance(): AuditionUIManager {
        return this._instance;
    }

    onLoad() {
        // Make this a singleton
        if (AuditionUIManager._instance === null) {
            AuditionUIManager._instance = this;
        } else {
            this.node.destroy();
        }
    }

    start() {
        // Initialize UI state
        this.showMainMenu();
    }

    /**
     * Show the main menu screen
     */
    public showMainMenu(): void {
        this.hideAllScreens();
        if (this.mainMenuScreen) {
            this.mainMenuScreen.active = true;
            this.currentUIState = UIState.MAIN_MENU;
        }
        console.log('Showing main menu');
    }

    /**
     * Show the song selection screen
     */
    public showSongSelection(): void {
        this.hideAllScreens();
        if (this.songSelectionScreen) {
            this.songSelectionScreen.active = true;
            this.currentUIState = UIState.SONG_SELECTION;
        }
        console.log('Showing song selection');
    }

    /**
     * Show the gameplay screen
     */
    public showGameplay(): void {
        this.hideAllScreens();
        if (this.gameplayScreen) {
            this.gameplayScreen.active = true;
            this.currentUIState = UIState.GAMEPLAY;
        }
        console.log('Showing gameplay');
    }

    /**
     * Show the results screen
     */
    public showResults(): void {
        this.hideAllScreens();
        if (this.resultsScreen) {
            this.resultsScreen.active = true;
            this.currentUIState = UIState.RESULTS;
        }
        console.log('Showing results');
    }

    /**
     * Show the settings screen
     */
    public showSettings(): void {
        this.hideAllScreens();
        if (this.settingsScreen) {
            this.settingsScreen.active = true;
            this.currentUIState = UIState.SETTINGS;
        }
        console.log('Showing settings');
    }

    /**
     * Hide all UI screens
     */
    private hideAllScreens(): void {
        if (this.mainMenuScreen) this.mainMenuScreen.active = false;
        if (this.songSelectionScreen) this.songSelectionScreen.active = false;
        if (this.gameplayScreen) this.gameplayScreen.active = false;
        if (this.resultsScreen) this.resultsScreen.active = false;
        if (this.settingsScreen) this.settingsScreen.active = false;
    }

    /**
     * Update the score display
     * @param score Current score
     */
    public updateScore(score: number): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = this.formatNumberWithZeros(score, 8);
        }
    }

    /**
     * Format number with leading zeros
     * @param num Number to format
     * @param length Desired length
     * @returns Formatted string
     */
    private formatNumberWithZeros(num: number, length: number): string {
        let result = num.toString();
        while (result.length < length) {
            result = '0' + result;
        }
        return result;
    }

    /**
     * Update the combo display
     * @param combo Current combo
     */
    public updateCombo(combo: number): void {
        if (this.comboCountLabel) {
            this.comboCountLabel.string = "x" + combo.toString();
            this.comboCountLabel.node.active = combo > 1;

            // Animate combo label on milestone
            // if (combo > 0 && combo % 10 === 0) {
            //     this.showComboFeedback(combo);
            // }
        }
    }

    /**
     * Update the progress bar
     * @param progress Progress value (0-1)
     */
    public updateProgress(progress: number): void {
        if (this.progressBar) {
            // Update fill amount (0-1)
            this.progressBar.fillRange = Math.max(0, Math.min(1, progress));
        }
    }


    /**
     * Update results screen with final stats
     * @param score Final score
     * @param accuracy Accuracy percentage
     * @param maxCombo Maximum combo
     * @param grade Grade (S, A, B, C, D, F)
     */
    public updateResults(score: number, accuracy: number, maxCombo: number, grade: string): void {
        if (this.finalScoreLabel) {
            this.finalScoreLabel.string = this.formatNumberWithZeros(score, 8);
        }

        if (this.accuracyLabel) {
            this.accuracyLabel.string = `${accuracy.toFixed(2)}%`;
        }

        if (this.maxComboLabel) {
            this.maxComboLabel.string = `${maxCombo}`;
        }

        if (this.gradeLabel) {
            this.gradeLabel.string = grade;

            // Set color based on grade
            switch (grade) {
                case 'S':
                    this.gradeLabel.color = new Color(255, 215, 0, 255); // Gold
                    break;
                case 'A':
                    this.gradeLabel.color = new Color(0, 191, 255, 255); // Blue
                    break;
                case 'B':
                    this.gradeLabel.color = new Color(50, 205, 50, 255); // Green
                    break;
                case 'C':
                    this.gradeLabel.color = new Color(255, 165, 0, 255); // Orange
                    break;
                case 'D':
                    this.gradeLabel.color = new Color(255, 69, 0, 255); // Red
                    break;
                case 'F':
                    this.gradeLabel.color = new Color(128, 128, 128, 255); // Gray
                    break;
            }
        }
    }

    /**
     * Get current UI state
     * @returns Current UI state
     */
    public getCurrentUIState(): UIState {
        return this.currentUIState;
    }

    //#region feedbacks animation

    // For backward compatibility and easier reference
    get perfectAnimNode(): Node { return this.feedbackNodes[0]; }
    get goodNode(): Node { return this.feedbackNodes[1]; }
    get coolNode(): Node { return this.feedbackNodes[2]; }
    get missNode(): Node { return this.feedbackNodes[3]; }
    private feedbackAnimNames = ["perfect", "great", "cool", "miss"];
    /**
        * Show visual feedback for note hit
        * @param type Type of feedback
        */
    public showFeedback(type: FeedbackType): void {
        for (const node of this.feedbackNodes) {
            node.active = false;
        }

        // Show the requested feedback
        if (this.feedbackNodes[type]) {
            this.feedbackNodes[type].active = true;
            // Add any animation or other logic here
        }

        const animName = this.feedbackAnimNames[type];
        this.animScoreFeedBacks.play(animName);
    }
    //#endregion
} 