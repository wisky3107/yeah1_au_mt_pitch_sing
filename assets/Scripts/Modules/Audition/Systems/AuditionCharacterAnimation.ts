import { _decorator, Component, Node, Animation, AnimationState, Enum } from 'cc';
import { AuditionAccuracyRating } from './AuditionBeatSystem';
import { AuditionInputType } from './AuditionInputHandler';
import { AuditionCharacterAnimationData, DanceMoveDifficulty, DanceMoveData } from './AuditionCharacterAnimationData';
const { ccclass, property } = _decorator;

/**
 * Animation types for the character
 */
enum AnimationType {
    IDLE,
    PERFECT_LEFT,
    PERFECT_RIGHT,
    PERFECT_SPACE,
    GOOD_LEFT,
    GOOD_RIGHT,
    GOOD_SPACE,
    MISS,
    COMBO,
    DANCE_MOVE
}

/**
 * Input history record used for tracking sequences
 */
interface InputRecord {
    inputType: AuditionInputType;
    accuracyRating: AuditionAccuracyRating;
    timestamp: number;
}

/**
 * Character Animation System for Audition module
 * Manages character animations based on player performance
 */
@ccclass('AuditionCharacterAnimation')
export class AuditionCharacterAnimation extends Component {
    // Character model/sprite
    @property(Node)
    private character: Node = null;
    
    // Animation component
    @property(Animation)
    private animationController: Animation = null;
    
    // Animation configuration
    @property
    private transitionDuration: number = 0.2; // Duration for animation transitions
    
    @property
    private comboThreshold: number = 10; // Combo count to trigger combo animation
    
    @property
    private inputHistorySize: number = 20; // Number of recent inputs to track
    
    @property({
        type: Enum(DanceMoveDifficulty)
    })
    private maxDanceMoveDifficulty: DanceMoveDifficulty = DanceMoveDifficulty.EXPERT;
    
    // Current state
    private currentAnimation: string = 'idle';
    private currentCombo: number = 0;
    private isPlayingSpecial: boolean = false;
    private inputHistory: InputRecord[] = [];
    private availableDanceMoves: DanceMoveData[] = [];
    
    onLoad() {
        // Initialize animation controller if not set
        if (!this.animationController && this.character) {
            this.animationController = this.character.getComponent(Animation);
        }
        
        // Initialize dance move data
        AuditionCharacterAnimationData.initialize();
        
        // Get available dance moves
        this.updateAvailableDanceMoves();
    }
    
    start() {
        // Play idle animation by default
        if (this.animationController) {
            this.playAnimation(AnimationType.IDLE);
        }
    }
    
    /**
     * React to player input with appropriate animation
     * @param accuracyRating Accuracy rating of the hit
     * @param inputType Type of input
     * @param combo Current combo
     */
    public reactToInput(accuracyRating: AuditionAccuracyRating, inputType: AuditionInputType, combo: number): void {
        // Update combo count
        this.currentCombo = combo;
        
        // If combo has increased, update available dance moves
        if (combo % 5 === 0) {
            this.updateAvailableDanceMoves();
        }
        
        // Record input for sequence detection
        this.recordInput(accuracyRating, inputType);
        
        // Check for dance move sequences first
        const danceMoveId = this.checkForDanceMoveSequence();
        if (danceMoveId) {
            // Play dance move animation if a sequence is matched
            this.playDanceMove(danceMoveId);
            return;
        }
        
        // Determine animation to play based on accuracy and input type
        let animationType: AnimationType;
        
        switch (accuracyRating) {
            case AuditionAccuracyRating.PERFECT:
                switch (inputType) {
                    case AuditionInputType.LEFT:
                        animationType = AnimationType.PERFECT_LEFT;
                        break;
                    case AuditionInputType.RIGHT:
                        animationType = AnimationType.PERFECT_RIGHT;
                        break;
                    case AuditionInputType.SPACE:
                        animationType = AnimationType.PERFECT_SPACE;
                        break;
                    default:
                        animationType = AnimationType.PERFECT_SPACE;
                }
                break;
                
            case AuditionAccuracyRating.GOOD:
                switch (inputType) {
                    case AuditionInputType.LEFT:
                        animationType = AnimationType.GOOD_LEFT;
                        break;
                    case AuditionInputType.RIGHT:
                        animationType = AnimationType.GOOD_RIGHT;
                        break;
                    case AuditionInputType.SPACE:
                        animationType = AnimationType.GOOD_SPACE;
                        break;
                    default:
                        animationType = AnimationType.GOOD_SPACE;
                }
                break;
                
            case AuditionAccuracyRating.MISS:
                animationType = AnimationType.MISS;
                break;
                
            default:
                animationType = AnimationType.IDLE;
        }
        
        // Check for combo animation
        if (this.currentCombo > 0 && this.currentCombo % this.comboThreshold === 0 && 
            accuracyRating === AuditionAccuracyRating.PERFECT) {
            animationType = AnimationType.COMBO;
        }
        
        // Play the animation
        this.playAnimation(animationType);
    }
    
    /**
     * Record an input for sequence detection
     * @param accuracyRating Accuracy rating
     * @param inputType Input type
     */
    private recordInput(accuracyRating: AuditionAccuracyRating, inputType: AuditionInputType): void {
        // Add to history
        this.inputHistory.push({
            inputType: inputType,
            accuracyRating: accuracyRating,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.inputHistory.length > this.inputHistorySize) {
            this.inputHistory.shift();
        }
    }
    
    /**
     * Check for dance move sequences in the input history
     * @returns ID of the matched dance move, or null if none matched
     */
    private checkForDanceMoveSequence(): string | null {
        if (this.inputHistory.length < 2) return null;
        
        // Check each dance move
        for (const danceMove of this.availableDanceMoves) {
            // Skip if combo requirement not met
            if (danceMove.requiredCombo > this.currentCombo) {
                continue;
            }
            
            // Get requirements for this move
            const requirements = AuditionCharacterAnimationData.getDanceMoveRequirements(danceMove.id);
            if (!requirements) continue;
            
            // Check if we have enough inputs in history
            if (this.inputHistory.length < requirements.inputSequence.length) {
                continue;
            }
            
            // Get most recent inputs matching the sequence length
            const recentInputs = this.inputHistory.slice(-requirements.inputSequence.length);
            
            // Check time window
            const sequenceDuration = recentInputs[recentInputs.length - 1].timestamp - 
                                    recentInputs[0].timestamp;
            if (sequenceDuration > requirements.timeWindow) {
                continue;
            }
            
            // Check sequence match
            let isMatch = true;
            for (let i = 0; i < recentInputs.length; i++) {
                if (recentInputs[i].inputType !== requirements.inputSequence[i] ||
                    recentInputs[i].accuracyRating !== requirements.accuracySequence[i]) {
                    isMatch = false;
                    break;
                }
            }
            
            if (isMatch) {
                console.log(`Matched dance move sequence: ${danceMove.name}`);
                return danceMove.id;
            }
        }
        
        return null;
    }
    
    /**
     * Update the list of available dance moves based on current combo
     */
    private updateAvailableDanceMoves(): void {
        this.availableDanceMoves = AuditionCharacterAnimationData.getAvailableDanceMoves(this.currentCombo)
            .filter(move => move.difficulty <= this.maxDanceMoveDifficulty);
            
        console.log(`Updated available dance moves. Count: ${this.availableDanceMoves.length}`);
    }
    
    /**
     * Play a specific dance move animation
     * @param danceMoveId ID of the dance move to play
     */
    private playDanceMove(danceMoveId: string): void {
        const danceMove = AuditionCharacterAnimationData.getDanceMove(danceMoveId);
        if (!danceMove) return;
        
        console.log(`Playing dance move: ${danceMove.name}`);
        
        // Mark as special animation
        this.isPlayingSpecial = true;
        
        // Play the dance move animation
        if (this.animationController) {
            this.animationController.play(danceMove.animationName);
            
            // Get the animation state
            let state = this.animationController.getState(danceMove.animationName);
            
            if (state) {
                state.speed = 1.0;
                state.repeatCount = 1;
                this.currentAnimation = danceMove.animationName;
                
                // Set up completion listener
                state.on(Animation.EventType.FINISHED, this.onSpecialAnimationComplete, this);
            }
        }
    }
    
    /**
     * Play a specific animation
     * @param animationType Type of animation to play
     */
    private playAnimation(animationType: AnimationType): void {
        if (!this.animationController) {
            console.warn('No animation controller found');
            return;
        }
        
        // Don't interrupt special animations
        if (this.isPlayingSpecial) {
            return;
        }
        
        // Map animation type to animation clip name
        let animationName: string;
        
        switch (animationType) {
            case AnimationType.IDLE:
                animationName = 'idle';
                break;
            case AnimationType.PERFECT_LEFT:
                animationName = 'perfect_left';
                break;
            case AnimationType.PERFECT_RIGHT:
                animationName = 'perfect_right';
                break;
            case AnimationType.PERFECT_SPACE:
                animationName = 'perfect_space';
                break;
            case AnimationType.GOOD_LEFT:
                animationName = 'good_left';
                break;
            case AnimationType.GOOD_RIGHT:
                animationName = 'good_right';
                break;
            case AnimationType.GOOD_SPACE:
                animationName = 'good_space';
                break;
            case AnimationType.MISS:
                animationName = 'miss';
                break;
            case AnimationType.COMBO:
                animationName = 'combo';
                this.isPlayingSpecial = true;
                break;
            default:
                animationName = 'idle';
        }
        
        // Play the animation
        this.animationController.play(animationName);
        
        // Get the animation state
        let state = this.animationController.getState(animationName);
        
        // Set transition duration
        if (state) {
            state.speed = 1.0;
            state.repeatCount = 1; // Play once for actions
            
            // For idle and miss animations, loop continuously
            if (animationType === AnimationType.IDLE || animationType === AnimationType.MISS) {
                state.repeatCount = Infinity;
            }
            
            this.currentAnimation = animationName;
            
            // Set up completion listener for combo animations
            if (animationType === AnimationType.COMBO) {
                state.on(Animation.EventType.FINISHED, this.onSpecialAnimationComplete, this);
            }
        }
        
        console.log(`Playing animation: ${animationName}`);
    }
    
    /**
     * Handle special animation completion
     * @param type Event type
     * @param state Animation state
     */
    private onSpecialAnimationComplete(type: string, state: AnimationState): void {
        // Return to idle after special animation
        this.isPlayingSpecial = false;
        this.playAnimation(AnimationType.IDLE);
        
        // Remove the event listener
        state.off(Animation.EventType.FINISHED, this.onSpecialAnimationComplete, this);
    }
    
    /**
     * Set the combo threshold for combo animations
     * @param threshold Combo count threshold
     */
    public setComboThreshold(threshold: number): void {
        this.comboThreshold = threshold;
    }
    
    /**
     * Set the maximum difficulty level for dance moves
     * @param difficulty Maximum difficulty level
     */
    public setMaxDanceDifficulty(difficulty: DanceMoveDifficulty): void {
        this.maxDanceMoveDifficulty = difficulty;
        this.updateAvailableDanceMoves();
    }
    
    /**
     * Check if a special animation is currently playing
     * @returns True if a special animation is playing
     */
    public isPlayingSpecialAnimation(): boolean {
        return this.isPlayingSpecial;
    }
    
    /**
     * Get the current animation name
     * @returns Current animation name
     */
    public getCurrentAnimation(): string {
        return this.currentAnimation;
    }
    
    /**
     * Reset to idle animation
     */
    public resetToIdle(): void {
        this.playAnimation(AnimationType.IDLE);
        this.currentCombo = 0;
        this.isPlayingSpecial = false;
        this.inputHistory = [];
        this.updateAvailableDanceMoves();
    }
} 