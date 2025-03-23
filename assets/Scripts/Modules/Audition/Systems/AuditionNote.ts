import { _decorator, Component, Node, Sprite, Color, tween, Vec3, UIOpacity, director } from 'cc';
import { AuditionNoteType } from './AuditionNotePool';
import { AuditionAccuracyRating } from './AuditionBeatSystem';
import { AuditionNoteVisual } from '../Prefabs/AuditionNoteVisual';
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
    private noteType: AuditionNoteType = AuditionNoteType.LEFT;
    private beatTime: number = 0;
    private targetY: number = 0;
    private startY: number = 0;
    private isMoving: boolean = false;
    private noteId: number = -1;

    /**
     * Initialize note with properties
     * @param noteType Type of note
     * @param beatTime Time (ms) when the note should be hit
     * @param noteId Unique ID for the note
     */
    public initialize(noteType: AuditionNoteType, beatTime: number, noteId: number): void {
        this.noteType = noteType;
        this.beatTime = beatTime;
        this.noteId = noteId;

        // Initialize visual component
        if (this.noteVisual) {
            this.noteVisual.initialize();
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
        }
    }

    /**
     * Play hit animation when note is successfully hit
     * @param accuracyRating Accuracy rating of the hit
     */
    public playHitEffect(accuracyRating: AuditionAccuracyRating): void {
        // Stop movement
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
     * Get the note's unique ID (for recycling)
     * @returns The note ID
     */
    public getNoteId(): number {
        return this.noteId;
    }

    /**
     * Get the note type
     * @returns The note type
     */
    public getNoteType(): AuditionNoteType {
        return this.noteType;
    }
} 