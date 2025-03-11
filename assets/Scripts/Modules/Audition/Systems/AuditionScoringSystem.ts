import { _decorator, Component } from 'cc';
import { AuditionAccuracyRating } from './AuditionBeatSystem';
import { AuditionInputType } from './AuditionInputHandler';
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
    
    // Score tracking
    private totalScore: number = 0;
    private currentCombo: number = 0;
    private maxCombo: number = 0;
    
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
    
    /**
     * Reset scoring system for new gameplay
     */
    public reset(): void {
        this.totalScore = 0;
        this.currentCombo = 0;
        this.maxCombo = 0;
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
                break;
            case AuditionAccuracyRating.GOOD:
                this.accuracyStats.good++;
                baseScore = this.goodScore;
                this.updateCombo(true);
                break;
            case AuditionAccuracyRating.MISS:
                this.accuracyStats.miss++;
                baseScore = this.missScore;
                this.updateCombo(false);
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
        
        return baseXP + accuracyBonus + comboBonus;
    }
} 