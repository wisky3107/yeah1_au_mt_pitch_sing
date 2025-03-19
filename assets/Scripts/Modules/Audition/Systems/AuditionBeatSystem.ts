import { _decorator, Component, Node, Vec3, Sprite, tween, math } from 'cc';
import { AuditionAudioManager } from './AuditionAudioManager';
import { AuditionInputHandler, AuditionInputType } from './AuditionInputHandler';
const { ccclass, property } = _decorator;

/**
 * Accuracy ratings for note hits
 */
export enum AuditionAccuracyRating {
    PERFECT,
    GOOD,
    MISS
}

/**
 * Beat System for Audition module
 * Manages single note movement and timing evaluation
 */
@ccclass('AuditionBeatSystem')
export class AuditionBeatSystem extends Component {
    // Note settings
    @property(Node)
    private note: Node = null;

    @property(Node)
    private targetZone: Node = null;

    @property(Node)
    private startNode: Node = null;

    @property(Node)
    private endNode: Node = null;

    @property(Sprite)
    private heartBeatSprite: Sprite = null;

    // Beat settings
    @property
    private bpm: number = 120;

    @property
    private beatsPerLoop: number = 4;

    // Timing windows for accuracy ratings (in milliseconds)
    @property
    private perfectWindow: number = 50;  // ±50ms for perfect hit

    @property
    private goodWindow: number = 100;    // ±100ms for good hit

    @property
    private missWindow: number = 150;    // ±150ms for miss

    // Game state
    private isPlaying: boolean = false;
    private timingWindows: Map<AuditionAccuracyRating, number> = new Map();
    private missPenaltyLoops: number = 0;
    private currentLoop: number = 0;
    private lastBeatTime: number = 0;
    private songDuration: number = 0;

    // Callback for scoring events
    private scoringCallback: (rating: AuditionAccuracyRating) => void = null;

    // Start and end positions for note movement
    private startX: number = -500;
    private endX: number = 500;
    private targetX: number = 0;
    private noteSpeed: number = 0; // Speed in units per second
    private noteDelay: number = 0; // Delay in seconds to hit target zone at right time

    // Heartbeat effect settings
    private heartbeatScale: number = 1.5;
    private heartbeatDuration: number = 0.1;
    private isHeartbeatAnimating: boolean = false;

    onLoad() {
        // Setup timing windows
        this.timingWindows.set(AuditionAccuracyRating.PERFECT, this.perfectWindow);
        this.timingWindows.set(AuditionAccuracyRating.GOOD, this.goodWindow);
        this.timingWindows.set(AuditionAccuracyRating.MISS, this.missWindow);

        this.startX = this.startNode.position.x;
        this.endX = this.endNode.position.x;
        this.targetX = this.targetZone.position.x;

        this.updateSpeed();

        // Make sure we have the note
        if (!this.note) {
            console.error('No note assigned to AuditionBeatSystem!');
            return;
        }

        // Set initial position
        this.note.position = new Vec3(this.startX, this.startNode.position.y, this.startNode.position.z);

        // Initialize heartbeat sprite if available
        if (this.heartBeatSprite) {
            this.heartBeatSprite.node.scale = new Vec3(1, 1, 1);
        }
    }

    private updateSpeed() {
        // Calculate note speed based on distance and timing
        const distance = this.endX - this.startX;
        const beatTime = (60000 / this.bpm) / 1000; // Convert to seconds
        const beatInterval = beatTime * this.beatsPerLoop;
        this.noteSpeed = distance / beatInterval;

        // Calculate delay needed to hit target zone at right time
        const distanceToEnd = this.endX - this.targetX;
        this.noteDelay = (distanceToEnd / distance) * beatInterval;
    }

    private getCurrentTime(): number {
        return AuditionAudioManager.instance.getCurrentTime() - this.noteDelay * 1000;
    }

    /**
     * Start the beat system
     */
    public startBeatSystem(bpm: number, songDuration: number): void {
        if (!this.note) return;
        this.bpm = bpm;
        this.updateSpeed();

        this.isPlaying = true;
        this.songDuration = songDuration;

        // Initialize lastBeatTime with current audio time
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            this.lastBeatTime = audioManager.getCurrentTime();
        } else {
            this.lastBeatTime = Date.now();
        }

        this.currentLoop = 0;
        this.missPenaltyLoops = 0;

        // Register input callback
        const inputHandler = AuditionInputHandler.instance;
        if (inputHandler) {
            inputHandler.registerInputCallback(AuditionInputType.SPACE,
                (time: number) => this.evaluateInput(time));
        }

        console.log('Beat system started');
    }

    /**
     * Stop the beat system
     */
    public stopBeatSystem(): void {
        this.isPlaying = false;

        // Unregister input callback
        const inputHandler = AuditionInputHandler.instance;
        if (inputHandler) {
            inputHandler.unregisterInputCallback(AuditionInputType.SPACE,
                (time: number) => this.evaluateInput(time));
        }

        console.log('Beat system stopped');
    }

    /**
     * Set callback for scoring events
     * @param callback Function to call when notes are hit/missed
     */
    public setScoreCallback(callback: (rating: AuditionAccuracyRating) => void): void {
        this.scoringCallback = callback;
    }

    /**
     * Update method called every frame
     * @param dt Delta time since last frame
     */
    update(dt: number): void {
        if (!this.isPlaying || !this.note) return;

        const audioManager = AuditionAudioManager.instance;
        if (!audioManager) return;

        const currentTime = this.getCurrentTime();
        const beatTime = (60000 / this.bpm);
        const beatInterval = beatTime * this.beatsPerLoop;

        // Check if it's time for the next beat
        if (currentTime - this.lastBeatTime >= beatInterval) {
            this.lastBeatTime = Math.round(currentTime / beatInterval) * beatInterval;
            this.currentLoop++;
            this.missPenaltyLoops--;
        }

        // Move note using speed-based movement based on audio time with delay
        const timeSinceLastBeat = (currentTime - this.lastBeatTime) / 1000; // Convert to seconds
        const adjustedTime = Math.max(0, timeSinceLastBeat);
        const newX = this.startX + (this.noteSpeed * adjustedTime);
        this.note.position = new Vec3(newX, this.note.position.y, this.note.position.z);

        // Visualize heartbeat effect based on proximity to beat time
        if (this.heartBeatSprite) {
            // Calculate how close we are to the next beat
            const normalizedPosition = (currentTime % beatTime);
            const scale = Math.max(1.0, (1.0 - normalizedPosition / beatTime) * 2.0);
            // Apply scale to note
            this.heartBeatSprite.node.setScale(new Vec3(scale, 1.0, 1.0));

            // Set alpha based on beat proximity
            const alpha = Math.max(0.5, 1.0 - normalizedPosition / beatTime);
            // Apply alpha to heartbeat sprite
            const color = this.heartBeatSprite.color.clone();
            color.a = alpha * 255;
            this.heartBeatSprite.color = color;
        }
    }

    /**
     * 
     * Evaluate player input against note timing
     * @param time Time of input
     */
    private evaluateInput(time: number): void {
        if (!this.isPlaying || this.missPenaltyLoops > 0) return;

        const audioManager = AuditionAudioManager.instance;
        if (!audioManager) return;

        const currentTime = this.getCurrentTime();
        const beatInterval = (60000 / this.bpm) * this.beatsPerLoop;
        const timeSinceLastBeat = currentTime - this.lastBeatTime;

        // Calculate how close to the target the note is
        const targetProgress = 1.0; // Note should be at target when beat occurs
        const currentProgress = (timeSinceLastBeat) / (beatInterval - this.noteDelay * 1000);
        const distanceFromTarget = Math.abs(targetProgress - currentProgress);

        // Determine accuracy rating
        let accuracyRating: AuditionAccuracyRating;
        if (distanceFromTarget <= this.timingWindows.get(AuditionAccuracyRating.PERFECT) / beatInterval) {
            accuracyRating = AuditionAccuracyRating.PERFECT;
        } else if (distanceFromTarget <= this.timingWindows.get(AuditionAccuracyRating.GOOD) / beatInterval) {
            accuracyRating = AuditionAccuracyRating.GOOD;
        } else {
            accuracyRating = AuditionAccuracyRating.MISS;
            this.missPenaltyLoops = 3; // Apply 3 loop penalty for miss
        }

        // Call scoring callback
        if (this.scoringCallback) {
            this.scoringCallback(accuracyRating);
        }

        console.log(`Input evaluated: ${AuditionAccuracyRating[accuracyRating]}, Combo: ${this.currentCombo}`);
    }

    /**
     * Get the current BPM
     * @returns Current BPM
     */
    public getBPM(): number {
        return this.bpm;
    }

    /**
     * Set the BPM
     * @param bpm New BPM value
     */
    public setBPM(bpm: number): void {
        this.bpm = Math.max(60, Math.min(200, bpm));
        console.log(`BPM set to ${this.bpm}`);
    }

    /**
     * Get the number of beats per loop
     * @returns Current beats per loop
     */
    public getBeatsPerLoop(): number {
        return this.beatsPerLoop;
    }

    /**
     * Set the number of beats per loop
     * @param beats New number of beats per loop
     */
    public setBeatsPerLoop(beats: number): void {
        this.beatsPerLoop = Math.max(1, Math.min(8, beats));
        console.log(`Beats per loop set to ${this.beatsPerLoop}`);
    }
} 