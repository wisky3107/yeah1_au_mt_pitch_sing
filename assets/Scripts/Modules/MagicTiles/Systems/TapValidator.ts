import { _decorator, Component, Node } from 'cc';
import { HitRating } from '../UI/Tile';
import { BeatmapManager } from './BeatmapManager';
import { director } from 'cc';

const { ccclass, property } = _decorator;

/**
 * Interface for combo data
 */
interface ComboData {
    count: number;
    maxCount: number;
    lastRating: HitRating;
    perfectCount: number;
    goodCount: number;
    okCount: number;
    missCount: number;
}

/**
 * TapValidator for Magic Tiles 3
 * Validates tap timing accuracy and manages combos
 */
@ccclass('TapValidator')
export class TapValidator extends Component {
    // Audio offset (milliseconds) - to adjust for audio latency
    @property
    audioOffset: number = 0;
    
    // Perfect hit window (seconds)
    @property
    perfectWindow: number = 0.05; // 50ms
    
    // Good hit window (seconds)
    @property
    goodWindow: number = 0.1; // 100ms
    
    // OK hit window (seconds)
    @property
    okWindow: number = 0.15; // 150ms
    
    // Reference to beatmap manager
    private beatmapManager: BeatmapManager = null!;
    
    // Combo data
    private combo: ComboData = {
        count: 0,
        maxCount: 0,
        lastRating: HitRating.MISS,
        perfectCount: 0,
        goodCount: 0,
        okCount: 0,
        missCount: 0
    };
    
    // Callback for combo change events
    private onComboChangeCallbacks: ((combo: number) => void)[] = [];
    
    // Callback for rating events
    private onRatingCallbacks: ((lane: number, rating: HitRating) => void)[] = [];
    
    onLoad() {
        this.resetCombo();
        this.beatmapManager = BeatmapManager.instance;
    }
    
    /**
     * Validate a tap at a specific time
     * @param lane The lane that was tapped
     * @param tapTime The time of the tap
     * @param rating The hit rating from the tile manager
     * @returns The hit rating for the tap
     */
    validateTap(lane: number, tapTime: number, rating: HitRating): HitRating {
        // Update combo based on rating
        this.updateCombo(rating);
        // Notify listeners of the rating
        this.onRatingCallbacks.forEach(callback => callback(lane, rating));
        return rating;
    }
    
    /**
     * Update the combo based on the hit rating
     * @param rating The hit rating
     */
    private updateCombo(rating: HitRating) {
        // Update rating counts
        switch (rating) {
            case HitRating.PERFECT:
                this.combo.perfectCount++;
                this.combo.count++;
                break;
            case HitRating.GREAT:
                this.combo.goodCount++;
                this.combo.count = 0; // Reset combo on miss
                break;
            case HitRating.COOL:
                this.combo.okCount++;
                this.combo.count = 0; // Reset combo on miss
                break;
            case HitRating.MISS:
                this.combo.missCount++;
                this.combo.count = 0; // Reset combo on miss
                break;
        }
        
        // Update max combo
        if (this.combo.count > this.combo.maxCount) {
            this.combo.maxCount = this.combo.count;
        }
        
        // Store last rating
        this.combo.lastRating = rating;
        
        // Notify combo change listeners
        this.onComboChangeCallbacks.forEach(callback => callback(this.combo.count));
    }
    
    /**
     * Reset the combo and statistics
     */
    resetCombo() {
        this.combo = {
            count: 0,
            maxCount: 0,
            lastRating: HitRating.MISS,
            perfectCount: 0,
            goodCount: 0,
            okCount: 0,
            missCount: 0
        };
        
        // Notify combo change listeners
        this.onComboChangeCallbacks.forEach(callback => callback(0));
    }
    
    /**
     * Get the current combo
     */
    getCombo(): number {
        return this.combo.count;
    }
    
    /**
     * Get the max combo
     */
    getMaxCombo(): number {
        return this.combo.maxCount;
    }
    
    /**
     * Get the accuracy percentage
     * @returns Accuracy as a percentage (0-100)
     */
    getAccuracy(): number {
        const totalNotes = this.combo.perfectCount + this.combo.goodCount + this.combo.okCount + this.combo.missCount;
        if (totalNotes === 0) return 100; // No notes hit yet
        
        // Weight different ratings
        const weightedSum = (this.combo.perfectCount * 100) + (this.combo.goodCount * 80) + (this.combo.okCount * 50);
        return Math.round((weightedSum / (totalNotes * 100)) * 100);
    }
    
    /**
     * Get the counts of each rating
     */
    getRatingCounts(): { perfect: number, good: number, ok: number, miss: number } {
        return {
            perfect: this.combo.perfectCount,
            good: this.combo.goodCount,
            ok: this.combo.okCount,
            miss: this.combo.missCount
        };
    }
    
    /**
     * Get the total number of notes hit
     */
    getTotalNotes(): number {
        return this.combo.perfectCount + this.combo.goodCount + this.combo.okCount + this.combo.missCount;
    }
    
    /**
     * Register a callback for combo changes
     * @param callback Function to call when the combo changes
     */
    onComboChange(callback: (combo: number) => void) {
        this.onComboChangeCallbacks.push(callback);
    }
    
    /**
     * Remove a combo change callback
     * @param callback The callback to remove
     */
    offComboChange(callback: (combo: number) => void) {
        const index = this.onComboChangeCallbacks.indexOf(callback);
        if (index !== -1) {
            this.onComboChangeCallbacks.splice(index, 1);
        }
    }
    
    /**
     * Register a callback for rating events
     * @param callback Function to call when a rating is determined
     */
    onRating(callback: (lane: number, rating: HitRating) => void) {
        this.onRatingCallbacks.push(callback);
    }
    
    /**
     * Remove a rating callback
     * @param callback The callback to remove
     */
    offRating(callback: (lane: number, rating: HitRating) => void) {
        const index = this.onRatingCallbacks.indexOf(callback);
        if (index !== -1) {
            this.onRatingCallbacks.splice(index, 1);
        }
    }
    
    /**
     * Set the audio offset
     * @param offsetMs Offset in milliseconds
     */
    setAudioOffset(offsetMs: number) {
        this.audioOffset = offsetMs;
    }
    
    /**
     * Get the audio offset
     * @returns Offset in milliseconds
     */
    getAudioOffset(): number {
        return this.audioOffset;
    }
    
    /**
     * Set the hit windows
     * @param perfect Perfect hit window in seconds
     * @param good Good hit window in seconds
     * @param ok OK hit window in seconds
     */
    setHitWindows(perfect: number, good: number, ok: number) {
        this.perfectWindow = perfect;
        this.goodWindow = good;
        this.okWindow = ok;
    }
    
    /**
     * Check if a combo milestone has been reached
     * @param milestone The milestone to check (e.g., 50, 100, 200)
     * @returns Whether the milestone was just reached
     */
    isComboMilestone(milestone: number): boolean {
        return this.combo.count === milestone;
    }
    
    /**
     * Calculate a score based on performance
     * @returns Score value
     */
    calculateScore(): number {
        const comboBonus = Math.min(this.combo.maxCount / 10, 100); // Cap at 100
        const accuracyBonus = this.getAccuracy();
        
        // Calculate base score from rating counts
        const baseScore = (this.combo.perfectCount * 1000) + 
                         (this.combo.goodCount * 500) + 
                         (this.combo.okCount * 100);
        
        // Apply bonuses
        return Math.round(baseScore * (1 + (comboBonus / 100) + (accuracyBonus / 100)));
    }
} 