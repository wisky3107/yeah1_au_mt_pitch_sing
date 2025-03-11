import { _decorator, Component, Node, Sprite, Color, tween, Vec3, UIOpacity } from 'cc';
import { AuditionNoteType } from './AuditionNotePool';
import { AuditionNoteVisual } from '../Prefabs/AuditionNoteVisual';
import { AuditionAccuracyRating } from './AuditionBeatSystem';
const { ccclass, property } = _decorator;

/**
 * Component attached to note objects in the rhythm game
 * Handles note appearance, movement, and hit effects
 */
@ccclass('AuditionNote')
export class AuditionNote extends Component {
    @property(AuditionNoteVisual)
    public noteVisual: AuditionNoteVisual = null;
    
    // Note properties
    private noteType: AuditionNoteType = AuditionNoteType.SPACE;
    private beatTime: number = 0;
    private speed: number = 1.0;
    private targetY: number = 0;
    private startY: number = 0;
    private isMoving: boolean = false;
    private noteId: number = -1;
    private moveAction: any = null;
    
    /**
     * Initialize note with properties
     * @param noteType Type of note
     * @param beatTime Time (ms) when the note should be hit
     * @param speed Movement speed multiplier
     * @param noteId Unique ID for the note
     */
    public initialize(noteType: AuditionNoteType, beatTime: number, speed: number, noteId: number): void {
        this.noteType = noteType;
        this.beatTime = beatTime;
        this.speed = speed;
        this.noteId = noteId;
        
        // Initialize visual component
        if (this.noteVisual) {
            this.noteVisual.initialize(noteType);
        } else {
            console.warn('Note visual component is not assigned!');
        }
        
        // The name could be updated to help with recycling identification
        switch (this.noteType) {
            case AuditionNoteType.LEFT:
                this.node.name = 'LeftNote';
                break;
            case AuditionNoteType.RIGHT:
                this.node.name = 'RightNote';
                break;
            case AuditionNoteType.SPACE:
                this.node.name = 'SpaceNote';
                break;
        }
    }
    
    /**
     * Begin note movement from start position to target
     * @param startY Starting Y position
     * @param targetY Target Y position
     * @param duration Movement duration in seconds
     */
    public startMovement(startY: number, targetY: number, duration: number): void {
        this.isMoving = true;
        this.startY = startY;
        this.targetY = targetY;
        
        // Stop any existing movement
        if (this.moveAction) {
            this.moveAction.stop();
        }
        
        // Set initial position
        this.node.setPosition(this.getXPosition(), startY, 0);
        
        // Start movement tween
        this.moveAction = tween(this.node)
            .to(duration, { position: new Vec3(this.getXPosition(), targetY, 0) }, { easing: 'linear' })
            .call(() => {
                // Note reached target, if not hit yet
                this.isMoving = false;
            })
            .start();
    }
    
    /**
     * Determine the X position based on note type
     */
    private getXPosition(): number {
        // This should be configured based on your track layout
        switch (this.noteType) {
            case AuditionNoteType.LEFT:
                return -150; // Left side position
            case AuditionNoteType.RIGHT:
                return 150;  // Right side position
            case AuditionNoteType.SPACE:
                return 0;    // Center position
        }
        return 0;
    }
    
    /**
     * Play hit animation when note is successfully hit
     * @param accuracyRating Accuracy rating of the hit
     */
    public playHitEffect(accuracyRating: AuditionAccuracyRating): void {
        // Stop movement
        if (this.moveAction) {
            this.moveAction.stop();
        }
        this.isMoving = false;
        
        // Use visual component to show hit effect
        if (this.noteVisual) {
            this.noteVisual.showHitEffect(accuracyRating);
        }
    }
    
    /**
     * Play miss animation when note is missed
     */
    public playMissEffect(): void {
        // Stop movement
        if (this.moveAction) {
            this.moveAction.stop();
        }
        this.isMoving = false;
        
        // Use visual component to show miss effect
        if (this.noteVisual) {
            this.noteVisual.showMissEffect();
        }
    }
    
    /**
     * Reset the note for reuse
     */
    public reset(): void {
        // Stop any movement
        if (this.moveAction) {
            this.moveAction.stop();
            this.moveAction = null;
        }
        
        this.isMoving = false;
        
        // Reset visual component
        if (this.noteVisual) {
            this.noteVisual.reset();
        }
        
        // Make sure node is active for next use
        this.node.active = true;
    }
    
    /**
     * Check if this note matches the given input type
     * @param inputType The input type to check against
     * @returns True if the note type matches the input type
     */
    public matchesInput(inputType: AuditionNoteType): boolean {
        return this.noteType === inputType;
    }
    
    /**
     * Get the beat time when this note should be hit
     * @returns Beat time in milliseconds
     */
    public getBeatTime(): number {
        return this.beatTime;
    }
    
    /**
     * Get the note's unique ID (for recycling)
     * @returns The note ID
     */
    public getNoteId(): number {
        return this.noteId;
    }
    
    /**
     * Check if the note is currently moving
     * @returns True if the note is moving
     */
    public isNoteMoving(): boolean {
        return this.isMoving;
    }
    
    /**
     * Get the Y-axis progress as a value between 0-1
     * @returns Progress value (0 = start, 1 = target)
     */
    public getProgressValue(): number {
        if (this.startY === this.targetY) return 1;
        
        const currentY = this.node.position.y;
        const totalDistance = this.targetY - this.startY;
        const traveledDistance = currentY - this.startY;
        
        return Math.max(0, Math.min(1, traveledDistance / totalDistance));
    }
    
    /**
     * Get the note type
     * @returns The note type
     */
    public getNoteType(): AuditionNoteType {
        return this.noteType;
    }
} 