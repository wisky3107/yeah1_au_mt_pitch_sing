import { _decorator, Component, EventTarget } from 'cc';
import { KaraokeConstants, FeedbackType } from './KaraokeConstants';
import { ScoreDetails, PitchDetectionResult } from '../Data/KaraokeTypes';

const { ccclass, property } = _decorator;

/**
 * Manages scoring for the Karaoke application
 */
@ccclass('KaraokeScoringSystem')
export class KaraokeScoringSystem extends Component {
    //#region Singleton
    private static _instance: KaraokeScoringSystem = null;
    private static eventTarget: EventTarget = new EventTarget();

    public static get instance(): KaraokeScoringSystem {
        return this._instance;
    }
    //#endregion

    //#region Properties
    @property({ tooltip: "Minimum time between score updates in seconds", group: { name: "Scoring", id: "scoring" } })
    private updateInterval: number = 0.5;
    //#endregion

    //#region Private Variables
    private validDuration: number = 0;
    private totalInteractionDuration: number = 0;
    private lastUpdateTime: number = 0;
    private currentTime: number = 0;
    private isRecording: boolean = false;
    private isPitchDetected: boolean = false;
    private isLyricActive: boolean = false;
    private updateTimer: number = null;
    //#endregion

    //#region Lifecycle Methods
    onLoad() {
        // Set up singleton instance
        if (KaraokeScoringSystem._instance !== null) {
            this.node.destroy();
            return;
        }

        KaraokeScoringSystem._instance = this;
    }

    start() {
        // Initialize score
        this.resetScore();
    }

    onDestroy() {
        // Clean up resources
        this.stopScoring();
    }
    //#endregion

    //#region Public Methods
    /**
     * Start score recording
     */
    public startScoring(): void {
        if (this.isRecording) return;
        
        this.isRecording = true;
        this.resetScore();
        this.lastUpdateTime = 0;
        
        // Start update timer
        this.updateTimer = setInterval(() => {
            this.updateScore();
        }, this.updateInterval * 1000);
        
        console.log('Score recording started');
    }

    /**
     * Stop score recording
     */
    public stopScoring(): void {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
        
        // Emit final score
        this.emitScoreUpdated();
        
        console.log('Score recording stopped');
    }

    /**
     * Update current time
     * @param time Current playback time in seconds
     */
    public updateTime(time: number): void {
        this.currentTime = time;
    }

    /**
     * Update pitch detection status
     * @param result Pitch detection result
     */
    public updatePitchDetection(result: PitchDetectionResult): void {
        this.isPitchDetected = result.detected;
    }

    /**
     * Update lyric active status
     * @param isActive Whether a lyric is currently active
     */
    public updateLyricStatus(isActive: boolean): void {
        this.isLyricActive = isActive;
    }

    /**
     * Reset score to initial state
     */
    public resetScore(): void {
        this.validDuration = 0;
        this.totalInteractionDuration = 0;
        this.emitScoreUpdated();
    }

    /**
     * Get current score
     * @returns Score details
     */
    public getScore(): ScoreDetails {
        return {
            validDuration: this.validDuration,
            totalInteractionDuration: this.totalInteractionDuration,
            score: this.calculateScore()
        };
    }

    /**
     * Get current score as a percentage (0-100)
     * @returns Score percentage
     */
    public getScorePercentage(): number {
        return this.calculateScore();
    }

    /**
     * Get current feedback type based on scoring
     * @returns Feedback type enum value
     */
    public getFeedbackType(): FeedbackType {
        // If no interaction yet
        if (this.totalInteractionDuration === 0) {
            return FeedbackType.IDLE;
        }
        
        const score = this.calculateScore();
        
        if (score >= 80) {
            return FeedbackType.PERFECT;
        } else if (score >= 40) {
            return FeedbackType.GOOD;
        } else {
            return FeedbackType.MISS;
        }
    }
    //#endregion

    //#region Private Methods
    private updateScore(): void {
        if (!this.isRecording) return;
        
        const deltaTime = this.updateInterval;
        
        // Update total interaction time if pitch is detected
        if (this.isPitchDetected) {
            this.totalInteractionDuration += deltaTime;
            
            // Update valid interaction time if lyric is active
            if (this.isLyricActive) {
                this.validDuration += deltaTime;
            }
        }
        
        // Emit score updated event periodically
        const timeSinceLastUpdate = this.currentTime - this.lastUpdateTime;
        if (timeSinceLastUpdate >= 1.0) { // Update score display every second
            this.emitScoreUpdated();
            this.lastUpdateTime = this.currentTime;
        }
    }

    private calculateScore(): number {
        if (this.totalInteractionDuration === 0) {
            return 0;
        }
        
        // Score formula: (valid duration / total interaction duration) * 100
        return Math.round((this.validDuration / this.totalInteractionDuration) * 100);
    }

    private emitScoreUpdated(): void {
        const scoreDetails = this.getScore();
        const feedbackType = this.getFeedbackType();
        
        KaraokeScoringSystem.emit(KaraokeConstants.EVENTS.SCORE_UPDATED, {
            score: scoreDetails,
            feedbackType
        });
    }
    //#endregion

    //#region Event Methods
    public static on(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget.on(eventName, callback, target);
    }

    public static off(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget.off(eventName, callback, target);
    }

    private static emit(eventName: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any): void {
        this.eventTarget.emit(eventName, arg1, arg2, arg3, arg4, arg5);
    }
    //#endregion
} 