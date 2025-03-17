import { _decorator, Component, Node, Label, Button, UITransform, Sprite, Color, Tween, tween, Vec3, game, UIOpacity } from 'cc';
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
    GOOD,
    MISS,
    COMBO
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
    
    // Feedback elements
    @property(Node)
    private feedbackLabel: Node = null;
    
    @property(Node)
    private comboLabel: Node = null;
    
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
            this.comboCountLabel.string = combo.toString();
            this.comboCountLabel.node.active = combo > 0;
            
            // Animate combo label on milestone
            if (combo > 0 && combo % 10 === 0) {
                this.showComboFeedback(combo);
            }
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
     * Show visual feedback for note hit
     * @param type Type of feedback
     */
    public showFeedback(type: FeedbackType): void {
        if (!this.feedbackLabel) return;
        
        // Set text and color based on feedback type
        const label = this.feedbackLabel.getComponent(Label);
        if (label) {
            switch (type) {
                case FeedbackType.PERFECT:
                    label.string = 'PERFECT';
                    label.color = new Color(255, 215, 0, 255); // Gold
                    break;
                case FeedbackType.GOOD:
                    label.string = 'GOOD';
                    label.color = new Color(0, 191, 255, 255); // Blue
                    break;
                case FeedbackType.MISS:
                    label.string = 'MISS';
                    label.color = new Color(255, 69, 0, 255); // Red
                    break;
                case FeedbackType.COMBO:
                    label.string = 'COMBO!';
                    label.color = new Color(255, 105, 180, 255); // Pink
                    break;
            }
        }
        
        // Reset and show the label
        this.feedbackLabel.active = true;
        this.feedbackLabel.scale = new Vec3(1, 1, 1);
        
        // Get UIOpacity component or add one if needed
        let opacityComp = this.feedbackLabel.getComponent(UIOpacity);
        if (!opacityComp) {
            opacityComp = this.feedbackLabel.addComponent(UIOpacity);
        }
        opacityComp.opacity = 255;
        
        // Stop previous tween if any
        if (this.feedbackTween) {
            this.feedbackTween.stop();
        }
        
        // Animate the feedback label
        this.feedbackTween = tween(this.feedbackLabel)
            .to(0.1, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.5, { scale: new Vec3(1, 1, 1) })
            .start();
        
        // Animate opacity separately
        tween(opacityComp)
            .to(0.6, { opacity: 0 })
            .call(() => {
                this.feedbackLabel.active = false;
            })
            .start();
    }
    
    /**
     * Show combo feedback
     * @param combo Current combo count
     */
    private showComboFeedback(combo: number): void {
        if (!this.comboLabel) return;
        
        // Set text
        const label = this.comboLabel.getComponent(Label);
        if (label) {
            label.string = `${combo} COMBO!`;
        }
        
        // Reset and show the label
        this.comboLabel.active = true;
        this.comboLabel.scale = new Vec3(1, 1, 1);
        
        // Get UIOpacity component or add one if needed
        let opacityComp = this.comboLabel.getComponent(UIOpacity);
        if (!opacityComp) {
            opacityComp = this.comboLabel.addComponent(UIOpacity);
        }
        opacityComp.opacity = 255;
        
        // Stop previous tween if any
        if (this.comboTween) {
            this.comboTween.stop();
        }
        
        // Animate the combo label
        this.comboTween = tween(this.comboLabel)
            .to(0.2, { scale: new Vec3(1.5, 1.5, 1) })
            .to(0.8, { scale: new Vec3(1, 1, 1) })
            .start();
            
        // Animate opacity separately
        tween(opacityComp)
            .to(1.0, { opacity: 0 })
            .call(() => {
                this.comboLabel.active = false;
            })
            .start();
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
} 