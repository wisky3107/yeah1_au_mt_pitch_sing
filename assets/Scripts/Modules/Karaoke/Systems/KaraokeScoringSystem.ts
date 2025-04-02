import { _decorator, Component, EventTarget, randomRangeInt } from 'cc';
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

    //#region Private Variables
    private validDuration: number = 0;
    private totalInteractionDuration: number = 0; // Total duration of all lyrics from start to end
    private isRecording: boolean = false;
    private isPitchDetected: boolean = false;
    private isLyricActive: boolean = false;
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


        console.log('Score recording started');
    }

    /**
     * Stop score recording
     */
    public stopScoring(): void {
        if (!this.isRecording) return;

        this.isRecording = false;

        // Emit final score
        this.emitScoreUpdated();

        console.log('Score recording stopped');
    }

    /**
     * Update current time
     * @param time Current playback time in seconds
     */
    public updateTime(time: number): void {
    }

    /**
     * Update pitch detection status
     * @param result Pitch detection result
     */
    public updatePitchDetection(result: PitchDetectionResult): void {
        if (!this.isRecording) return;

        this.isPitchDetected = result.detected;
        if (this.isPitchDetected && this.isLyricActive) {
            this.validDuration += KaraokeConstants.PITCH_DETECTION_INTERVAL_MS / 1000.0 * 1.3; //assume that in one sentence the dim sound has 30% of the word sound
            console.log("valid duration: " + this.validDuration);
        }
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
     * Update total duration of all lyrics
     * @param duration Total duration of all lyrics in seconds
     */
    public setTotalLyricsDuration(duration: number): void {
        this.totalInteractionDuration = duration;
    }
    //#endregion

    private calculateScore(): number {
        // Score formula: (valid duration / total lyrics duration) * 100
        return Math.round(Math.min(this.validDuration / this.totalInteractionDuration, 1.0) * 100) - randomRangeInt(0, 10);//add random score number
    }

    private emitScoreUpdated(): void {
        const scoreDetails = this.getScore();

        KaraokeScoringSystem.emit(KaraokeConstants.EVENTS.SCORE_UPDATED, {
            score: scoreDetails,
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