import { _decorator, Component, Node, EventTarget } from 'cc';
import { PitchConstants } from './PitchConstants';
const { ccclass, property } = _decorator;

/**
 * Timer for the Pitch Detection Game
 * Manages the 60-second countdown timer
 */
@ccclass('PitchTimer')
export class PitchTimer extends Component {

    // Event target for timer events
    private eventTarget: EventTarget = new EventTarget();

    // Timer properties
    @property
    private duration: number = PitchConstants.GAME_DURATION; // Default duration in seconds

    @property
    private warningTime1: number = PitchConstants.WARNING_TIME_1; // First warning time in seconds

    @property
    private warningTime2: number = PitchConstants.WARNING_TIME_2; // Second warning time in seconds

    // Timer state
    private isRunning: boolean = false;
    private isPaused: boolean = false;
    private startTime: number = 0;
    private pauseTime: number = 0;
    private pausedDuration: number = 0;
    private remainingTime: number = 0;
    private warningEmitted1: boolean = false;
    private warningEmitted2: boolean = false;

    /**
     * Start the timer
     * @param duration Optional custom duration in seconds
     */
    public startTimer(duration?: number): void {
        if (this.isRunning) return;

        // Set duration if provided
        if (duration !== undefined) {
            this.duration = duration;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.pausedDuration = 0;
        this.remainingTime = this.duration;
        this.warningEmitted1 = false;
        this.warningEmitted2 = false;

        console.log(`Timer started with duration: ${this.duration}s`);
    }

    /**
     * Pause the timer
     */
    public pauseTimer(): void {
        if (!this.isRunning || this.isPaused) return;

        this.isPaused = true;
        this.pauseTime = Date.now();

        console.log('Timer paused');
    }

    /**
     * Resume the timer
     */
    public resumeTimer(): void {
        if (!this.isRunning || !this.isPaused) return;

        this.isPaused = false;
        this.pausedDuration += Date.now() - this.pauseTime;

        console.log('Timer resumed');
    }

    /**
     * Stop the timer
     */
    public stopTimer(): void {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = false;

        console.log('Timer stopped');
    }

    /**
     * Reset the timer
     */
    public resetTimer(): void {
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.pausedDuration = 0;
        this.remainingTime = this.duration;
        this.warningEmitted1 = false;
        this.warningEmitted2 = false;

        console.log('Timer reset');
    }

    /**
     * Get the remaining time
     * @returns Remaining time in seconds
     */
    public getRemainingTime(): number {
        return this.remainingTime;
    }

    /**
     * Get the elapsed time
     * @returns Elapsed time in seconds
     */
    public getElapsedTime(): number {
        return this.duration - this.remainingTime;
    }

    /**
     * Get the progress percentage
     * @returns Progress percentage (0-1)
     */
    public getProgress(): number {
        return 1 - (this.remainingTime / this.duration);
    }

    /**
     * Set a custom duration
     * @param duration Duration in seconds
     */
    public setDuration(duration: number): void {
        if (this.isRunning) {
            console.warn('Cannot change duration while timer is running');
            return;
        }

        this.duration = duration;
        this.remainingTime = duration;
    }

    /**
     * Add time to the timer
     * @param seconds Seconds to add
     */
    public addTime(seconds: number): void {
        if (!this.isRunning) return;

        this.remainingTime += seconds;

        // Reset warning flags if time goes back above warning thresholds
        if (this.remainingTime > this.warningTime1) {
            this.warningEmitted1 = false;
        }

        if (this.remainingTime > this.warningTime2) {
            this.warningEmitted2 = false;
        }

        console.log(`Added ${seconds}s to timer. Remaining time: ${this.remainingTime.toFixed(1)}s`);
    }

    /**
     * Update method called every frame
     * @param dt Delta time
     */
    update(dt: number): void {
        if (!this.isRunning || this.isPaused) return;

        // Calculate remaining time
        const elapsed = (Date.now() - this.startTime - this.pausedDuration) / 1000;
        this.remainingTime = Math.max(0, this.duration - elapsed);

        // Check for time warnings
        if (!this.warningEmitted1 && this.remainingTime <= this.warningTime1) {
            this.warningEmitted1 = true;
            this.emit(PitchConstants.EVENTS.TIME_WARNING, this.remainingTime);
            console.log(`Time warning 1: ${this.remainingTime.toFixed(1)}s remaining`);
        }

        if (!this.warningEmitted2 && this.remainingTime <= this.warningTime2) {
            this.warningEmitted2 = true;
            this.emit(PitchConstants.EVENTS.TIME_WARNING, this.remainingTime);
            console.log(`Time warning 2: ${this.remainingTime.toFixed(1)}s remaining`);
        }

        // Check if time is up
        if (this.remainingTime <= 0) {
            this.isRunning = false;
            this.emit(PitchConstants.EVENTS.GAME_OVER);
            console.log('Time\'s up!');
        }
    }

    /**
     * Add a listener for timer events
     * @param eventName Event name
     * @param callback Callback function
     * @param target Target object
     */
    public on(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget.on(eventName, callback, target);
    }

    /**
     * Remove a listener for timer events
     * @param eventName Event name
     * @param callback Callback function
     * @param target Target object
     */
    public off(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget?.off(eventName, callback, target);
    }

    /**
     * Emit a timer event
     * @param eventName Event name
     * @param arg1 First argument
     * @param arg2 Second argument
     * @param arg3 Third argument
     * @param arg4 Fourth argument
     * @param arg5 Fifth argument
     */
    private emit(eventName: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any): void {
        this.eventTarget?.emit(eventName, arg1, arg2, arg3, arg4, arg5);
    }
}
