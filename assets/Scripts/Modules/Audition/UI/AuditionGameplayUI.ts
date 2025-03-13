import { _decorator, Component, Node, Label, Sprite, Color, Animation, UIOpacity, tween, Vec3, Material } from 'cc';
import { AuditionInputType } from '../Systems/AuditionInputHandler';
import { AuditionAccuracyRating } from '../Systems/AuditionBeatSystem';
const { ccclass, property } = _decorator;

/**
 * Gameplay UI for Audition module
 * Manages the visual representation of gameplay elements
 */
@ccclass('AuditionGameplayUI')
export class AuditionGameplayUI extends Component {
    // Score and combo display
    @property(Label)
    private scoreLabel: Label = null;
    
    @property(Label)
    private comboLabel: Label = null;
    
    @property(Label)
    private multiplierLabel: Label = null;
    
    // Accuracy feedback
    @property(Node)
    private accuracyFeedbackNode: Node = null;
    
    @property(Label)
    private accuracyLabel: Label = null;
    
    // Pattern display
    @property(Node)
    private patternDisplay: Node = null;
    
    @property([Node])
    private patternDots: Node[] = [];
    
    @property(Node)
    private patternProgressBar: Node = null;
    
    @property(Node)
    private syncPointIndicator: Node = null;
    
    // Finish move elements
    @property(Node)
    private finishMoveIndicator: Node = null;
    
    @property(Label)
    private finishMoveLabel: Label = null;
    
    // Virtual buttons
    @property(Node)
    private leftButton: Node = null;
    
    @property(Node)
    private rightButton: Node = null;
    
    @property(Node)
    private spaceButton: Node = null;
    
    // Colors for different elements
    @property(Color)
    private leftButtonColor: Color = new Color(79, 195, 247); // Light blue
    
    @property(Color)
    private rightButtonColor: Color = new Color(255, 112, 67); // Coral red
    
    @property(Color)
    private spaceButtonColor: Color = new Color(255, 235, 59); // Yellow
    
    @property(Color)
    private perfectColor: Color = new Color(120, 255, 120); // Bright green
    
    @property(Color)
    private goodColor: Color = new Color(255, 193, 7); // Amber
    
    @property(Color)
    private missColor: Color = new Color(211, 47, 47); // Red
    
    // Active pattern tracking
    private currentSequence: AuditionInputType[] = [];
    private currentProgress: number = 0;
    
    // Animation references
    private activeFeedbackAnimation: any = null;
    
    onLoad() {
        // Initialize UI elements
        this.resetUI();
    }
    
    /**
     * Reset all UI elements to their default state
     */
    public resetUI(): void {
        // Reset score and combo display
        this.updateScore(0);
        this.updateCombo(0);
        this.updateMultiplier(1.0);
        
        // Hide accuracy feedback
        if (this.accuracyFeedbackNode) {
            this.accuracyFeedbackNode.active = false;
        }
        
        // Reset pattern display
        this.clearPatternDisplay();
        
        // Hide finish move indicator
        if (this.finishMoveIndicator) {
            this.finishMoveIndicator.active = false;
        }
        
        // Reset buttons to normal state
        this.resetButtons();
    }
    
    /**
     * Update the score display
     * @param score Current score
     */
    public updateScore(score: number): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = score.toString();
        }
    }
    
    /**
     * Update the combo display
     * @param combo Current combo
     */
    public updateCombo(combo: number): void {
        if (this.comboLabel) {
            if (combo > 0) {
                this.comboLabel.node.active = true;
                this.comboLabel.string = `Combo: ${combo}`;
                
                // Animate combo update
                this.pulseNode(this.comboLabel.node);
            } else {
                this.comboLabel.node.active = false;
            }
        }
    }
    
    /**
     * Update pattern multiplier display
     * @param multiplier Current pattern multiplier
     */
    public updateMultiplier(multiplier: number): void {
        if (this.multiplierLabel) {
            this.multiplierLabel.string = `x${multiplier.toFixed(1)}`;
            
            // Change color based on multiplier value
            if (multiplier > 2.0) {
                this.multiplierLabel.color = this.perfectColor;
            } else if (multiplier > 1.5) {
                this.multiplierLabel.color = this.goodColor;
            } else {
                this.multiplierLabel.color = Color.WHITE;
            }
        }
    }
    
    /**
     * Show accuracy feedback
     * @param rating Accuracy rating
     */
    public showAccuracyFeedback(rating: AuditionAccuracyRating): void {
        if (!this.accuracyFeedbackNode || !this.accuracyLabel) return;
        
        // Stop any active animation
        if (this.activeFeedbackAnimation) {
            this.activeFeedbackAnimation.stop();
        }
        
        // Set text and color based on rating
        let text: string;
        let color: Color;
        
        switch (rating) {
            case AuditionAccuracyRating.PERFECT:
                text = "PERFECT";
                color = this.perfectColor;
                break;
            case AuditionAccuracyRating.GOOD:
                text = "GOOD";
                color = this.goodColor;
                break;
            case AuditionAccuracyRating.MISS:
                text = "MISS";
                color = this.missColor;
                break;
        }
        
        this.accuracyLabel.string = text;
        this.accuracyLabel.color = color;
        this.accuracyFeedbackNode.active = true;
        
        // Create pop-up animation
        const originalScale = this.accuracyFeedbackNode.scale.clone();
        this.accuracyFeedbackNode.setScale(0, 0, 1);
        
        const opacity = this.accuracyFeedbackNode.getComponent(UIOpacity) || 
                        this.accuracyFeedbackNode.addComponent(UIOpacity);
        opacity.opacity = 255;
        
        // Animate the feedback
        this.activeFeedbackAnimation = tween(this.accuracyFeedbackNode)
            .to(0.2, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.1, { scale: originalScale })
            .delay(0.5)
            .to(0.3, { scale: new Vec3(0.8, 0.8, 1) })
            .parallel(
                tween(opacity).to(0.3, { opacity: 0 })
            )
            .call(() => {
                this.accuracyFeedbackNode.active = false;
                this.accuracyFeedbackNode.setScale(originalScale);
            })
            .start();
    }
    
    /**
     * Update the pattern display with a new sequence
     * @param sequence Array of input types in the pattern
     */
    public updatePatternDisplay(sequence: AuditionInputType[]): void {
        if (!this.patternDisplay) return;
        
        this.patternDisplay.active = true;
        this.currentSequence = sequence;
        this.currentProgress = 0;
        
        // Update each pattern dot
        this.patternDots.forEach((dot, index) => {
            const sprite = dot.getComponent(Sprite);
            if (index < sequence.length) {
                sprite.color = this.getColorForInput(sequence[index]);
                dot.active = true;
                
                // Reset dot state (not completed)
                // Note: We're just using the default material state here
                // No need to set materials manually
            } else {
                dot.active = false;
            }
        });
        
        // Show sync point indicator after the last dot
        if (this.syncPointIndicator) {
            this.syncPointIndicator.active = true;
            
            // Position after the last dot
            if (sequence.length > 0 && sequence.length <= this.patternDots.length) {
                const lastDotPosition = this.patternDots[sequence.length - 1].position;
                this.syncPointIndicator.setPosition(
                    lastDotPosition.x + 60, // Adjust as needed for spacing
                    lastDotPosition.y,
                    lastDotPosition.z
                );
            }
        }
        
        // Reset progress bar
        this.updatePatternProgress(0, sequence.length);
    }
    
    /**
     * Update the progress through the current pattern
     * @param progress Current progress (number of correct inputs)
     * @param total Total inputs in the pattern
     */
    public updatePatternProgress(progress: number, total: number): void {
        if (!this.patternProgressBar) return;
        
        this.currentProgress = progress;
        
        // Update progress bar fill
        const progressRatio = total > 0 ? progress / total : 0;
        
        const barSprite = this.patternProgressBar.getComponent(Sprite);
        if (barSprite) {
            barSprite.fillRange = progressRatio;
        }
        
        // Update dot visuals to show completed steps
        for (let i = 0; i < this.patternDots.length; i++) {
            if (i < this.currentSequence.length) {
                const dot = this.patternDots[i];
                const sprite = dot.getComponent(Sprite);
                
                if (i < progress) {
                    // Mark as completed
                    sprite.color = this.perfectColor;
                } else {
                    // Reset to normal color
                    sprite.color = this.getColorForInput(this.currentSequence[i]);
                }
            }
        }
        
        // When all inputs are completed, highlight sync point
        if (progress === total && this.syncPointIndicator) {
            const syncSprite = this.syncPointIndicator.getComponent(Sprite);
            if (syncSprite) {
                syncSprite.color = this.perfectColor;
                
                // Pulse animation for sync point
                this.pulseNode(this.syncPointIndicator);
            }
        }
    }
    
    /**
     * Clear the pattern display
     */
    public clearPatternDisplay(): void {
        this.currentSequence = [];
        this.currentProgress = 0;
        
        if (this.patternDisplay) {
            this.patternDisplay.active = false;
        }
        
        if (this.syncPointIndicator) {
            this.syncPointIndicator.active = false;
        }
        
        // Hide all dots
        this.patternDots.forEach(dot => {
            dot.active = false;
        });
    }
    
    /**
     * Show button press effect
     * @param inputType Type of input
     * @param correct Whether the input was correct
     */
    public showButtonPress(inputType: AuditionInputType, correct: boolean): void {
        let button: Node = null;
        
        switch (inputType) {
            case AuditionInputType.LEFT:
                button = this.leftButton;
                break;
            case AuditionInputType.RIGHT:
                button = this.rightButton;
                break;
            case AuditionInputType.SPACE:
                button = this.spaceButton;
                break;
        }
        
        if (!button) return;
        
        // Get button sprite
        const sprite = button.getComponent(Sprite);
        if (!sprite) return;
        
        // Store original color
        const originalColor = sprite.color.clone();
        
        // Set color based on correctness
        sprite.color = correct ? this.perfectColor : this.missColor;
        
        // Create press animation
        const originalScale = button.scale.clone();
        
        tween(button)
            .to(0.05, { scale: new Vec3(originalScale.x * 0.9, originalScale.y * 0.9, originalScale.z) })
            .to(0.1, { scale: originalScale })
            .call(() => {
                // Reset color
                sprite.color = originalColor;
            })
            .start();
    }
    
    /**
     * Reset all buttons to normal state
     */
    private resetButtons(): void {
        // Left button
        if (this.leftButton) {
            this.leftButton.setScale(1, 1, 1);
            const leftSprite = this.leftButton.getComponent(Sprite);
            if (leftSprite) leftSprite.color = this.leftButtonColor;
        }
        
        // Right button
        if (this.rightButton) {
            this.rightButton.setScale(1, 1, 1);
            const rightSprite = this.rightButton.getComponent(Sprite);
            if (rightSprite) rightSprite.color = this.rightButtonColor;
        }
        
        // Space button
        if (this.spaceButton) {
            this.spaceButton.setScale(1, 1, 1);
            const spaceSprite = this.spaceButton.getComponent(Sprite);
            if (spaceSprite) spaceSprite.color = this.spaceButtonColor;
        }
    }
    
    /**
     * Show finish move indicator effect
     */
    public showFinishMoveEffect(): void {
        if (!this.finishMoveIndicator || !this.finishMoveLabel) return;
        
        this.finishMoveIndicator.active = true;
        this.finishMoveLabel.string = "FINISH MOVE!";
        
        // Play animation if available
        const anim = this.finishMoveIndicator.getComponent(Animation);
        if (anim) {
            anim.play('finish_move_flash');
        } else {
            // Fallback animation if no Animation component
            this.pulseNode(this.finishMoveIndicator, 1.5, 0.5);
            
            // Auto-hide after animation
            setTimeout(() => {
                this.finishMoveIndicator.active = false;
            }, 3000);
        }
    }
    
    /**
     * Helper to get color for input type
     * @param input Input type
     * @returns Color for that input
     */
    private getColorForInput(input: AuditionInputType): Color {
        switch(input) {
            case AuditionInputType.LEFT:
                return this.leftButtonColor;
            case AuditionInputType.RIGHT:
                return this.rightButtonColor;
            case AuditionInputType.SPACE:
                return this.spaceButtonColor;
            default:
                return Color.WHITE;
        }
    }
    
    /**
     * Create a pulse animation for a node
     * @param node The node to animate
     * @param scale Scale factor (default: 1.2)
     * @param duration Duration in seconds (default: 0.3)
     */
    private pulseNode(node: Node, scale: number = 1.2, duration: number = 0.3): void {
        if (!node) return;
        
        const originalScale = node.scale.clone();
        
        tween(node)
            .to(duration / 2, { scale: new Vec3(originalScale.x * scale, originalScale.y * scale, originalScale.z) })
            .to(duration / 2, { scale: originalScale })
            .start();
    }
    
    /**
     * Show pattern skip effect (when a pattern is missed)
     */
    public showPatternSkipEffect(): void {
        if (!this.patternDisplay) return;
        
        // Flash red and slide out
        const opacity = this.patternDisplay.getComponent(UIOpacity) || 
                        this.patternDisplay.addComponent(UIOpacity);
        opacity.opacity = 255;
        
        const originalPosition = this.patternDisplay.position.clone();
        
        tween(this.patternDisplay)
            .to(0.1, { position: new Vec3(originalPosition.x + 20, originalPosition.y, originalPosition.z) })
            .to(0.1, { position: new Vec3(originalPosition.x - 200, originalPosition.y, originalPosition.z) })
            .parallel(
                tween(opacity).to(0.2, { opacity: 0 })
            )
            .call(() => {
                this.patternDisplay.setPosition(originalPosition);
                this.patternDisplay.active = false;
            })
            .start();
    }
    
    /**
     * Show pattern completion effect
     * @param isFinishMove Whether this was a finish move
     */
    public showPatternCompleteEffect(isFinishMove: boolean = false): void {
        if (!this.patternDisplay) return;
        
        // Different effects based on whether it's a finish move
        if (isFinishMove) {
            this.showFinishMoveEffect();
        }
        
        // Fade out pattern display
        const opacity = this.patternDisplay.getComponent(UIOpacity) || 
                        this.patternDisplay.addComponent(UIOpacity);
        opacity.opacity = 255;
        
        tween(opacity)
            .to(0.5, { opacity: 0 })
            .call(() => {
                this.patternDisplay.active = false;
            })
            .start();
    }
} 