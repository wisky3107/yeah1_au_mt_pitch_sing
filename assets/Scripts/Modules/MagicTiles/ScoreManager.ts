import { _decorator, Component, Node, Label } from 'cc';
import { TapValidator } from './TapValidator';
import { HitRating } from './Tile';
import { MTUIManager } from './MTUIManager';

const { ccclass, property } = _decorator;

/**
 * ScoreManager for Magic Tiles 3
 * Handles score calculation, tracking, and display
 */
@ccclass('ScoreManager')
export class ScoreManager extends Component {
    // Reference to the tap validator
    @property(TapValidator)
    tapValidator: TapValidator = null!;
    
    // UI references
    @property(Label)
    scoreLabel: Label = null!;
    
    @property(Label)
    accuracyLabel: Label = null!;
    
    // Score settings
    @property
    perfectScore: number = 1000;
    
    @property
    goodScore: number = 500;
    
    @property
    okScore: number = 100;
    
    @property
    missScore: number = 0;
    
    @property
    maxComboBonus: number = 10000;
    
    @property
    accuracyBonus: number = 10000;
    
    // Current score data
    private currentScore: number = 0;
    private finalScore: number = 0;
    private isTracking: boolean = false;
    private highScores: Map<string, number> = new Map();
    
    // Callbacks
    private onScoreChangedCallback: ((score: number) => void) | null = null;
    
    onLoad() {
        // Initialize score display
        this.updateScoreDisplay();
        
        // Register for rating events to update score in real-time
        if (this.tapValidator) {
            this.tapValidator.onRating(this.onRatingEvent.bind(this));
        }
    }
    
    /**
     * Start tracking score
     */
    startTracking() {
        this.resetScore();
        this.isTracking = true;
    }
    
    /**
     * Pause score tracking
     */
    pauseTracking() {
        this.isTracking = false;
    }
    
    /**
     * Resume score tracking
     */
    resumeTracking() {
        this.isTracking = true;
    }
    
    /**
     * Stop tracking and finalize the score
     */
    stopTracking() {
        this.isTracking = false;
        this.finalizeScore();
    }
    
    /**
     * Reset the score to zero
     */
    resetScore() {
        this.currentScore = 0;
        this.finalScore = 0;
        this.updateScoreDisplay();
    }
    
    /**
     * Handle a rating event and update the score
     */
    private onRatingEvent(lane: number, rating: HitRating) {
        if (!this.isTracking) return;
        
        // Add points based on the rating
        let points = 0;
        
        switch (rating) {
            case HitRating.PERFECT:
                points = this.perfectScore;
                break;
            case HitRating.GREAT:
                points = this.goodScore;
                break;
            case HitRating.COOL:
                points = this.okScore;
                break;
            case HitRating.MISS:
                points = this.missScore;
                break;
        }
        
        // Apply combo multiplier (bonus for consecutive hits)
        const combo = this.tapValidator.getCombo();
        if (combo > 1) {
            // Increase points by up to 50% for higher combos
            const comboMultiplier = 1 + Math.min(combo / 100, 0.5);
            points = Math.round(points * comboMultiplier);
        }
        
        // Add points to the current score
        this.addScore(points);
    }
    
    /**
     * Add points to the current score
     */
    addScore(points: number) {
        if (!this.isTracking) return;
        
        this.currentScore += points;
        this.updateScoreDisplay();
        
        // Notify listeners
        if (this.onScoreChangedCallback) {
            this.onScoreChangedCallback(this.currentScore);
        }
    }
    
    /**
     * Update the score display
     */
    private updateScoreDisplay() {
        if (this.scoreLabel) {
            this.scoreLabel.string = this.formatScore(this.currentScore);
        }
        
        if (this.accuracyLabel && this.tapValidator) {
            const accuracy = this.tapValidator.getAccuracy();
            this.accuracyLabel.string = `${accuracy}%`;
        }
    }
    
    /**
     * Format the score for display
     */
    private formatScore(score: number): string {
        return score.toLocaleString();
    }
    
    /**
     * Calculate and finalize the score when the game ends
     */
    private finalizeScore() {
        if (!this.tapValidator) {
            this.finalScore = this.currentScore;
            return;
        }
        
        // Get performance metrics
        const accuracy = this.tapValidator.getAccuracy();
        const maxCombo = this.tapValidator.getMaxCombo();
        const ratingCounts = this.tapValidator.getRatingCounts();
        const totalNotes = this.tapValidator.getTotalNotes();
        
        // Base score from tap ratings
        let baseScore = this.currentScore;
        
        // Add combo bonus
        const maxPossibleCombo = totalNotes;
        const comboPercentage = maxPossibleCombo > 0 ? maxCombo / maxPossibleCombo : 0;
        const comboBonus = Math.round(this.maxComboBonus * comboPercentage);
        
        // Add accuracy bonus
        const accuracyBonus = Math.round(this.accuracyBonus * (accuracy / 100));
        
        // Final score calculation
        this.finalScore = baseScore + comboBonus + accuracyBonus;
        
        // Console log for debugging
        console.log("Score Breakdown:");
        console.log(`Base Score: ${baseScore}`);
        console.log(`Combo Bonus (${maxCombo}x): ${comboBonus}`);
        console.log(`Accuracy Bonus (${accuracy}%): ${accuracyBonus}`);
        console.log(`Final Score: ${this.finalScore}`);
        
        // Update high score if applicable
        this.checkHighScore();
    }
    
    /**
     * Check if this is a new high score
     */
    private checkHighScore() {
        // This would typically use the beatmap ID as the key
        const beatmapId = "current"; // Placeholder
        
        if (!this.highScores.has(beatmapId) || this.finalScore > this.highScores.get(beatmapId)!) {
            this.highScores.set(beatmapId, this.finalScore);
            return true;
        }
        
        return false;
    }
    
    /**
     * Get the current score
     */
    getCurrentScore(): number {
        return this.currentScore;
    }
    
    /**
     * Get the final score
     */
    getFinalScore(): number {
        return this.finalScore;
    }
    
    /**
     * Register a callback for score changes
     */
    onScoreChanged(callback: (score: number) => void) {
        this.onScoreChangedCallback = callback;
    }
    
    /**
     * Get the high score for a beatmap
     */
    getHighScore(beatmapId: string): number {
        return this.highScores.get(beatmapId) || 0;
    }
    
    /**
     * Save high scores to persistent storage
     */
    saveHighScores() {
        // Convert Map to plain object for storage
        const scoreObject: Record<string, number> = {};
        this.highScores.forEach((score, beatmapId) => {
            scoreObject[beatmapId] = score;
        });
        
        // Save to local storage or other persistent storage
        const scoresJSON = JSON.stringify(scoreObject);
        localStorage.setItem('magicTilesHighScores', scoresJSON);
    }
    
    /**
     * Load high scores from persistent storage
     */
    loadHighScores() {
        // Load from local storage or other persistent storage
        const scoresJSON = localStorage.getItem('magicTilesHighScores');
        if (scoresJSON) {
            try {
                const scoreObject = JSON.parse(scoresJSON);
                
                // Convert plain object back to Map
                this.highScores.clear();
                for (const beatmapId in scoreObject) {
                    if (Object.prototype.hasOwnProperty.call(scoreObject, beatmapId)) {
                        this.highScores.set(beatmapId, scoreObject[beatmapId]);
                    }
                }
            } catch (e) {
                console.error('Failed to parse high scores:', e);
            }
        }
    }
}