import { _decorator, Component } from 'cc';
import { AuditionAccuracyRating } from './AuditionBeatSystem';
import { AuditionInputType } from './AuditionInputHandler';
import { AuditionAudioManager } from './AuditionAudioManager';
const { ccclass, property } = _decorator;

/**
 * Interface for storing accuracy statistics
 */
interface AccuracyStats {
    perfect: number;
    good: number;
    miss: number;
    total: number;
}

/**
 * Scoring System for Audition module
 * Manages scores, combos, and statistics
 */
@ccclass('AuditionScoringSystem')
export class AuditionScoringSystem extends Component {
    // Base score values for different accuracy ratings
    @property
    private perfectScore: number = 100;
    
    @property
    private goodScore: number = 50;
    
    @property
    private missScore: number = 0;
    
    // Combo settings
    @property
    private comboMultiplierIncrement: number = 0.1; // Increment for each combo step
    
    @property
    private maxComboMultiplier: number = 3.0; // Maximum combo multiplier
    
    @property
    private comboBreakPenalty: number = 0; // Optional penalty for breaking combo
    
    // Pattern-based scoring settings
    @property
    private patternComplexityMultiplier: number = 0.2; // Multiplier per complexity level
    
    @property
    private consecutivePatternBonus: number = 50; // Base bonus for consecutive successful patterns
    
    @property
    private finishMoveMultiplier: number = 2.0; // Score multiplier for finish moves
    
    @property
    private patternSkipPenalty: number = 100; // Penalty for skipping a pattern
    
    @property(AuditionAudioManager)
    private audioManager: AuditionAudioManager = null;

    // Scoring statistics
    private patternsCompleted: number = 0;
    private consecutivePatterns: number = 0;
    private finishMovesCompleted: number = 0;
    private patternsSkipped: number = 0;
    
    // Score tracking
    private totalScore: number = 0;
    private currentCombo: number = 0;
    private maxCombo: number = 0;
    private patternMultiplier: number = 1.0;
    
    // Statistics tracking
    private accuracyStats: AccuracyStats = {
        perfect: 0,
        good: 0,
        miss: 0,
        total: 0
    };
    
    // Callbacks
    private onScoreUpdateCallback: (score: number) => void = null;
    private onComboUpdateCallback: (combo: number) => void = null;
    private onPatternMultiplierUpdateCallback: (multiplier: number) => void = null;
    
    /**
     * Reset scoring system for new gameplay
     */
    public reset(): void {
        this.totalScore = 0;
        this.currentCombo = 0;
        this.maxCombo = 0;
        this.patternMultiplier = 1.0;
        this.patternsCompleted = 0;
        this.consecutivePatterns = 0;
        this.finishMovesCompleted = 0;
        this.patternsSkipped = 0;
        
        this.accuracyStats = {
            perfect: 0,
            good: 0,
            miss: 0,
            total: 0
        };
        
        // Trigger callbacks with initial values
        if (this.onScoreUpdateCallback) {
            this.onScoreUpdateCallback(this.totalScore);
        }
        
        if (this.onComboUpdateCallback) {
            this.onComboUpdateCallback(this.currentCombo);
        }
        
        if (this.onPatternMultiplierUpdateCallback) {
            this.onPatternMultiplierUpdateCallback(this.patternMultiplier);
        }
        
        console.log('Scoring system reset');
    }
    
    /**
     * Process a note hit or miss
     * @param accuracyRating Accuracy rating of the hit
     * @param inputType Type of input used
     */
    public processNoteResult(accuracyRating: AuditionAccuracyRating, inputType: AuditionInputType): void {
        // Update statistics
        this.accuracyStats.total++;
        
        let baseScore = 0;
        
        // Update accuracy counters and determine base score
        switch (accuracyRating) {
            case AuditionAccuracyRating.PERFECT:
                this.accuracyStats.perfect++;
                baseScore = this.perfectScore;
                this.updateCombo(true);
                // Play different perfect sound based on combo count (1-5)
                const perfectSound = this.currentCombo === 1 ? 'perfect' : `perfect${Math.min(this.currentCombo, 5)}`;
                this.audioManager.playSound(perfectSound);
                break;
            case AuditionAccuracyRating.GOOD:
                this.accuracyStats.good++;
                baseScore = this.goodScore;
                this.updateCombo(false);
                this.audioManager.playSound('good');
                break;
            case AuditionAccuracyRating.MISS:
                this.accuracyStats.miss++;
                baseScore = this.missScore;
                this.updateCombo(false);
                this.audioManager.playSound('miss');
                break;
        }
        
        // Calculate score with combo multiplier
        const comboMultiplier = 1 + Math.min(this.maxComboMultiplier - 1, 
                                              this.comboMultiplierIncrement * (this.currentCombo - 1));
        
        const pointsEarned = accuracyRating === AuditionAccuracyRating.MISS ? 
                              baseScore : Math.floor(baseScore * comboMultiplier);
        
        // Update total score
        this.totalScore += pointsEarned;
        
        // Call score update callback
        if (this.onScoreUpdateCallback) {
            this.onScoreUpdateCallback(this.totalScore);
        }
        
        console.log(`Note result: ${AuditionAccuracyRating[accuracyRating]}, Score: ${this.totalScore}, ` +
                    `Combo: ${this.currentCombo}, Points earned: ${pointsEarned}`);
    }
    
    /**
     * Process a complete pattern result
     * @param accuracyRating Accuracy of the sync input
     * @param complexity Pattern complexity (number of inputs)
     * @param isFinishMove Whether this was a finish move
     */
    public processPatternResult(
        accuracyRating: AuditionAccuracyRating, 
        complexity: number, 
        isFinishMove: boolean
    ): void {
        if (accuracyRating === AuditionAccuracyRating.MISS) {
            // Handle pattern miss
            this.patternsSkipped++;
            this.consecutivePatterns = 0;
            this.resetPatternMultiplier();
            
            // Apply skip penalty
            this.totalScore = Math.max(0, this.totalScore - this.patternSkipPenalty);
            
            console.log(`Pattern missed! Score: ${this.totalScore}, Skipped: ${this.patternsSkipped}`);
            return;
        }
        
        // Calculate base pattern score based on complexity and accuracy
        let baseScore = complexity * 50; // Base 50 points per step in pattern
        
        // Apply accuracy modifier
        if (accuracyRating === AuditionAccuracyRating.PERFECT) {
            baseScore *= 1.5; // 50% bonus for perfect timing
        }
        
        // Apply pattern multiplier (consecutive patterns bonus)
        const finalScore = Math.floor(baseScore * this.patternMultiplier);
        
        // Track statistics
        this.patternsCompleted++;
        this.consecutivePatterns++;
        
        if (isFinishMove) {
            this.finishMovesCompleted++;
            // Apply finish move multiplier
            const finishMoveBonus = Math.floor(finalScore * (this.finishMoveMultiplier - 1));
            this.totalScore += finalScore + finishMoveBonus;
            
            console.log(`Finish move completed! Base: ${finalScore}, Bonus: ${finishMoveBonus}`);
        } else {
            // Standard pattern completion
            this.totalScore += finalScore;
            
            // Add consecutive pattern bonus if applicable
            if (this.consecutivePatterns > 1) {
                const consecutiveBonus = this.consecutivePatternBonus * (this.consecutivePatterns - 1);
                this.totalScore += consecutiveBonus;
                console.log(`Consecutive pattern bonus: +${consecutiveBonus}`);
            }
        }
        
        // Increase pattern multiplier
        this.increasePatternMultiplier();
        
        // Call score update callback
        if (this.onScoreUpdateCallback) {
            this.onScoreUpdateCallback(this.totalScore);
        }
        
        console.log(`Pattern completed! Complexity: ${complexity}, Score added: ${finalScore}, ` +
                   `Total: ${this.totalScore}, Pattern multiplier: ${this.patternMultiplier.toFixed(1)}x`);
    }
    
    /**
     * Update combo counter
     * @param success Whether the note was hit successfully
     */
    private updateCombo(success: boolean): void {
        if (success) {
            // Increment combo
            this.currentCombo++;
            
            // Update max combo if needed
            if (this.currentCombo > this.maxCombo) {
                this.maxCombo = this.currentCombo;
            }
        } else {
            // Apply combo break penalty if any
            if (this.comboBreakPenalty > 0) {
                this.totalScore = Math.max(0, this.totalScore - this.comboBreakPenalty);
            }
            
            // Reset combo
            this.currentCombo = 0;
        }
        
        // Call combo update callback
        if (this.onComboUpdateCallback) {
            this.onComboUpdateCallback(this.currentCombo);
        }
    }
    
    /**
     * Register callback for score updates
     * @param callback Function to call when score changes
     */
    public onScoreUpdate(callback: (score: number) => void): void {
        this.onScoreUpdateCallback = callback;
    }
    
    /**
     * Register callback for combo updates
     * @param callback Function to call when combo changes
     */
    public onComboUpdate(callback: (combo: number) => void): void {
        this.onComboUpdateCallback = callback;
    }
    
    /**
     * Register callback for pattern multiplier updates
     * @param callback Function to call when pattern multiplier changes
     */
    public onPatternMultiplierUpdate(callback: (multiplier: number) => void): void {
        this.onPatternMultiplierUpdateCallback = callback;
    }
    
    /**
     * Increase the pattern multiplier
     */
    private increasePatternMultiplier(): void {
        this.patternMultiplier += 0.1;
        
        if (this.onPatternMultiplierUpdateCallback) {
            this.onPatternMultiplierUpdateCallback(this.patternMultiplier);
        }
    }
    
    /**
     * Reset the pattern multiplier
     */
    public resetPatternMultiplier(): void {
        this.patternMultiplier = 1.0;
        
        if (this.onPatternMultiplierUpdateCallback) {
            this.onPatternMultiplierUpdateCallback(this.patternMultiplier);
        }
    }
    
    /**
     * Handle a pattern break
     */
    public handlePatternBreak(): void {
        this.consecutivePatterns = 0;
        this.resetPatternMultiplier();
        
        // Reset combo
        this.updateCombo(false);
    }
    
    /**
     * Get current total score
     * @returns Total score
     */
    public getScore(): number {
        return this.totalScore;
    }
    
    /**
     * Get current combo
     * @returns Current combo
     */
    public getCombo(): number {
        return this.currentCombo;
    }
    
    /**
     * Get maximum combo achieved
     * @returns Maximum combo
     */
    public getMaxCombo(): number {
        return this.maxCombo;
    }
    
    /**
     * Get accuracy statistics
     * @returns Accuracy statistics object
     */
    public getAccuracyStats(): AccuracyStats {
        return { ...this.accuracyStats };
    }
    
    /**
     * Calculate accuracy percentage
     * @returns Accuracy percentage (0-100)
     */
    public getAccuracyPercentage(): number {
        if (this.accuracyStats.total === 0) {
            return 0;
        }
        
        // Calculate weighted accuracy: Perfect = 100%, Good = 50%, Miss = 0%
        const weightedSum = this.accuracyStats.perfect * 1.0 + 
                             this.accuracyStats.good * 0.5 + 
                             this.accuracyStats.miss * 0.0;
        
        return (weightedSum / this.accuracyStats.total) * 100;
    }
    
    /**
     * Get grade based on accuracy and completion
     * @returns Letter grade (S, A, B, C, D, F)
     */
    public getGrade(): string {
        const accuracy = this.getAccuracyPercentage();
        
        if (accuracy >= 95) return 'S';
        if (accuracy >= 90) return 'A';
        if (accuracy >= 80) return 'B';
        if (accuracy >= 70) return 'C';
        if (accuracy >= 60) return 'D';
        return 'F';
    }
    
    /**
     * Calculate experience points earned based on performance
     * @returns Experience points
     */
    public calculateExperiencePoints(): number {
        const baseXP = Math.floor(this.totalScore / 100);
        const accuracyBonus = Math.floor(this.getAccuracyPercentage() / 10);
        const comboBonus = Math.floor(this.maxCombo / 10);
        const patternBonus = this.patternsCompleted * 2;
        const finishMoveBonus = this.finishMovesCompleted * 10;
        
        return baseXP + accuracyBonus + comboBonus + patternBonus + finishMoveBonus;
    }
    
    /**
     * Get pattern completion statistics
     * @returns Object with pattern statistics
     */
    public getPatternStats(): { completed: number, skipped: number, finishMoves: number } {
        return {
            completed: this.patternsCompleted,
            skipped: this.patternsSkipped,
            finishMoves: this.finishMovesCompleted
        };
    }
} 