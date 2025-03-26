import { _decorator, Component, Node, EventTarget } from 'cc';
import { PitchConstants, GameState } from './PitchConstants';
const { ccclass, property } = _decorator;

/**
 * Timer system for the Pitch Detection Game
 * Manages the 60-second countdown and time warnings
 */
@ccclass('PitchTimer')
export class PitchTimer extends Component {
    // Event target for timer events
    private static eventTarget: EventTarget = new EventTarget();

    // Timer properties
    private startTime: number = 0;
    private elapsedTime: number = 0;
    private remainingTime: number = PitchConstants.GAME_DURATION;
    private isRunning: boolean = false;
    private isPaused: boolean = false;
    private pauseStartTime: number = 0;
    private totalPausedTime: number = 0;
    
    // Warning flags to ensure warnings are only triggered once
    private firstWarningTriggered: boolean = false;
    private secondWarningTriggered: boolean = false;

    /**
     * Start the timer
     */
    public startTimer(): void {
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.remainingTime = PitchConstants.GAME_DURATION;
        this.isRunning = true;
        this.isPaused = false;
        this.totalPausedTime = 0;
        
        // Reset warning flags
        this.firstWarningTriggered = false;
        this.secondWarningTriggered = false;
        
        console.log('Timer started');
    }

    /**
     * Pause the timer
     */
    public pauseTimer(): void {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        this.pauseStartTime = Date.now();
        console.log('Timer paused');
    }

    /**
     * Resume the timer
     */
    public resumeTimer(): void {
        if (!this.isRunning || !this.isPaused) return;
        
        this.totalPausedTime += Date.now() - this.pauseStartTime;
        this.isPaused = false;
        console.log('Timer resumed');
    }

    /**
     * Stop the timer
     */
    public stopTimer(): void {
        this.isRunning = false;
        this.isPaused = false;
        console.log('Timer stopped');
    }

    /**
     * Reset the timer
     */
    public resetTimer(): void {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.remainingTime = PitchConstants.GAME_DURATION;
        this.isRunning = false;
        this.isPaused = false;
        this.totalPausedTime = 0;
        
        // Reset warning flags
        this.firstWarningTriggered = false;
        this.secondWarningTriggered = false;
        
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
        return this.elapsedTime;
    }

    /**
     * Check if the timer is running
     * @returns True if the timer is running
     */
    public isTimerRunning(): boolean {
        return this.isRunning && !this.isPaused;
    }

    /**
     * Check if the timer is paused
     * @returns True if the timer is paused
     */
    public isTimerPaused(): boolean {
        return this.isRunning && this.isPaused;
    }

    /**
     * Add a listener for timer events
     * @param eventName Event name
     * @param callback Callback function
     * @param target Target object
     */
    public static on(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget.on(eventName, callback, target);
    }

    /**
     * Remove a listener for timer events
     * @param eventName Event name
     * @param callback Callback function
     * @param target Target object
     */
    public static off(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget.off(eventName, callback, target);
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
    private static emit(eventName: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any): void {
        this.eventTarget.emit(eventName, arg1, arg2, arg3, arg4, arg5);
    }

    update(dt: number): void {
        if (!this.isRunning || this.isPaused) return;
        
        // Calculate elapsed and remaining time
        const now = Date.now();
        this.elapsedTime = (now - this.startTime - this.totalPausedTime) / 1000;
        this.remainingTime = Math.max(0, PitchConstants.GAME_DURATION - this.elapsedTime);
        
        // Check for time warnings
        if (!this.firstWarningTriggered && this.remainingTime <= PitchConstants.WARNING_TIME_1) {
            this.firstWarningTriggered = true;
            PitchTimer.emit(PitchConstants.EVENTS.TIME_WARNING, PitchConstants.WARNING_TIME_1);
            console.log(`First time warning: ${PitchConstants.WARNING_TIME_1}s remaining`);
        }
        
        if (!this.secondWarningTriggered && this.remainingTime <= PitchConstants.WARNING_TIME_2) {
            this.secondWarningTriggered = true;
            PitchTimer.emit(PitchConstants.EVENTS.TIME_WARNING, PitchConstants.WARNING_TIME_2);
            console.log(`Second time warning: ${PitchConstants.WARNING_TIME_2}s remaining`);
        }
        
        // Check for timer completion
        if (this.remainingTime <= 0) {
            this.isRunning = false;
            PitchTimer.emit(PitchConstants.EVENTS.GAME_OVER);
            console.log('Timer completed');
        }
    }
}
