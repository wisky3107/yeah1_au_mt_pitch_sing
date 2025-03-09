import { _decorator, Component, Node, Sprite, Color, tween, Vec3, UIOpacity, UITransform, Size } from 'cc';
import { NoteType, TrackNoteInfo } from './MTDefines';

const { ccclass, property } = _decorator;

// Status of a tile
export enum TileStatus {
    WAITING, // Waiting to be shown
    ACTIVE,  // Visible and moving
    PRESSED, // Currently being pressed
    HIT,     // Successfully hit
    MISSED,  // Missed by the player
    EXPIRED  // Past its time and no longer relevant
}

// Performance rating for a hit
export enum HitRating {
    PERFECT,
    GREAT,
    COOL,
    MISS
}

/**
 * Tile component for Magic Tiles 3
 * Represents an individual tile in the game
 */
@ccclass('Tile')
export class Tile extends Component {
    @property(Sprite)
    background: Sprite = null!;

    @property(Sprite)
    highlight: Sprite = null!;

    @property(UITransform)
    transform: UITransform = null!;

    @property(UIOpacity)
    opacity: UIOpacity = null!;

    @property
    bufferHeight: number = 200; //perfect timming will higher than bottom by this amount

    // Colors for different tile states
    @property
    normalColor: Color = new Color(0, 0, 0, 255);

    @property
    holdColor: Color = new Color(50, 50, 200, 255);

    @property
    slideColor: Color = new Color(50, 200, 50, 255);

    @property
    hitColor: Color = new Color(200, 200, 200, 255);

    @property
    missColor: Color = new Color(200, 50, 50, 255);

    // Reference to the beatmap note data
    private noteData: TrackNoteInfo | null = null;

    // Current status of the tile
    private status: TileStatus = TileStatus.WAITING;

    // Position data
    private startY: number = 0;
    private targetY: number = 0;
    private lane: number = 0;
    private scrollSpeed: number = 0;

    // Timing data
    private spawnTime: number = 0;
    private hitTime: number = 0;
    private touchStartTime: number = 0;
    private touchEndTime: number = 0;

    // State flags
    private isTouching: boolean = false;
    private isLongPress: boolean = false;
    private isSliding: boolean = false;

    // UI animation tweens
    private moveTween: any = null;
    private scaleTween: any = null;
    private opacityTween: any = null;

    onLoad() {
        // Initialize Sprite and Transform references if not set in the inspector
        if (!this.background) {
            this.background = this.getComponent(Sprite)!;
        }

        if (!this.transform) {
            this.transform = this.getComponent(UITransform)!;
        }

        if (!this.opacity) {
            this.opacity = this.getComponent(UIOpacity)!;
        }

        // Initialize the highlight sprite
        if (!this.highlight) {
            const highlightNode = new Node('Highlight');
            highlightNode.parent = this.node;
            this.highlight = highlightNode.addComponent(Sprite);
            highlightNode.addComponent(UIOpacity).opacity = 0;

            // Ensure highlight covers the entire tile
            const highlightTransform = highlightNode.addComponent(UITransform);
            highlightTransform.width = this.transform.width;
            highlightTransform.height = this.transform.height;
            highlightTransform.anchorX = 0.5;
            highlightTransform.anchorY = 0.5;
        }
    }

    /**
     * Initialize the tile with note data
     * @param note The beatmap note data for this tile
     * @param lane The lane (column) this tile belongs to
     * @param startY The starting Y position for the tile
     * @param targetY The ending Y position for the tile
     */
    init(note: TrackNoteInfo, lane: number, startY: number, targetY: number, width: number, scrollSpeed: number, minHeight: number) {
        this.noteData = note;
        this.lane = lane;
        this.startY = startY;
        this.targetY = targetY;
        this.scrollSpeed = scrollSpeed;
        this.status = TileStatus.WAITING;

        // Reset state
        this.isTouching = false;
        this.touchStartTime = 0;
        this.touchEndTime = 0;

        // Position the tile
        this.node.position = new Vec3(0, startY, 0);

        // Set the correct color based on note type
        this.updateVisualByType();

        // Reset tweens
        if (this.moveTween) {
            this.moveTween.stop();
            this.moveTween = null;
        }

        if (this.scaleTween) {
            this.scaleTween.stop();
            this.scaleTween = null;
        }

        if (this.opacityTween) {
            this.opacityTween.stop();
            this.opacityTween = null;
        }

        // Reset opacity
        this.opacity.opacity = 255;

        const noteHeight = note.duration * scrollSpeed;
        // Set a minimum height to ensure visibility
        this.transform.contentSize = new Size(width, Math.max(noteHeight, minHeight));
        this.transform.node.position = new Vec3(0, -this.bufferHeight, 0);

        // Set the height based on note duration for hold notes
        if (note.type === NoteType.HOLD && note.duration > 0) {
            this.isLongPress = true;
            // Calculate height based on duration and scroll speed
        } else {
            this.isLongPress = false;
            // Reset height to default (square) for regular notes
        }


        if (note.type === NoteType.SLIDE) {
            this.isSliding = true;
        } else {
            this.isSliding = false;
        }

        // Make the node active
        this.node.active = true;
    }

    /**
     * Start the tile's movement
     * @param duration How long the movement should take in seconds
     */
    startMovement(duration: number, gametime: number) {
        this.status = TileStatus.ACTIVE;
        this.spawnTime = Date.now() / 1000;
        console.log("Start movement", this.noteData.time, gametime, gametime - this.noteData.time);

        // Calculate a position that's beyond the target position based on the increased duration
        // This will make the tile continue moving past the target position
        const targetPosY = this.targetY - ((duration * this.scrollSpeed) - (this.startY - this.targetY));

        // Create and start the movement tween
        this.moveTween = tween(this.node)
            .to(duration, { position: new Vec3(0, targetPosY, 0) }, {
                easing: 'linear',
                // No onComplete callback - TileManager will handle miss detection
            })
            .start();
    }

    /**
     * Update the tile's movement when scroll speed changes
     * @param newDuration New duration for completing the movement
     * @param progressPct Current progress percentage (0-1)
     */
    updateMovement(newDuration: number, progressPct: number) {
        // If we have an active movement tween, stop it
        if (this.moveTween) {
            this.moveTween.stop();
        }

        // If the tile is already hit or missed, no need to update
        if (this.status !== TileStatus.ACTIVE && this.status !== TileStatus.PRESSED) {
            return;
        }

        // Calculate a position that's beyond the target position based on the increased duration
        const targetPosY = this.targetY - ((newDuration * this.scrollSpeed) - (this.startY - this.targetY));

        // Create and start a new tween from the current position to the target
        this.moveTween = tween(this.node)
            .to(newDuration, { position: new Vec3(0, targetPosY, 0) }, {
                easing: 'linear',
                // No onComplete callback - TileManager will handle miss detection
            })
            .start();
    }

    /**
     * Update the tile's visual appearance based on its type
     */
    private updateVisualByType() {
        if (!this.noteData) return;

        switch (this.noteData.type) {
            case NoteType.TAP:
                this.background.color = this.normalColor;
                break;
            case NoteType.HOLD:
                this.background.color = this.holdColor;
                break;
            case NoteType.SLIDE:
                this.background.color = this.slideColor;
                break;
        }
    }

    /**
     * Handle the tile being tapped
     * @param time The current game time
     * @returns The hit rating for this tap
     */
    tap(time: number): HitRating {
        if (!this.noteData || this.status !== TileStatus.ACTIVE) {
            return HitRating.MISS;
        }

        // Record the touch start time
        this.touchStartTime = time;
        this.isTouching = true;

        // Calculate accuracy
        const expectedTime = this.noteData.time;
        const timeDiff = Math.abs(time - expectedTime);

        let rating: HitRating;

        // Determine hit rating based on timing accuracy
        if (timeDiff < 0.05) { // Within 50ms
            rating = HitRating.PERFECT;
        } else if (timeDiff < 0.2) { // Within 100ms
            rating = HitRating.GREAT;
        } else if (timeDiff < 0.3) { // Within 150ms
            rating = HitRating.COOL;
        } else {
            rating = HitRating.MISS;
        }

        // If this is a regular tap note or we missed, finish the hit process
        if (this.noteData.type === NoteType.TAP || rating === HitRating.MISS) {
            this.completeHit(rating);
        }
        console.log("Tap rating", rating, timeDiff);

        return rating;
    }

    /**
     * Handle the tile being released (for hold notes)
     * @param time The current game time
     * @returns The hit rating after release
     */
    release(time: number): HitRating {
        if (!this.isTouching || !this.isLongPress || !this.noteData) {
            return HitRating.MISS;
        }

        this.touchEndTime = time;
        this.isTouching = false;

        // For hold notes, check if held for the correct duration
        if (this.noteData.type === NoteType.HOLD) {
            const expectedDuration = this.noteData.duration;
            const actualDuration = this.touchEndTime - this.touchStartTime;

            let rating: HitRating;

            // Determine rating based on how closely the hold duration matches expected
            const durationRatio = actualDuration / expectedDuration;

            if (durationRatio >= 0.95) {
                rating = HitRating.PERFECT;
            } else if (durationRatio >= 0.8) {
                rating = HitRating.GREAT;
            } else if (durationRatio >= 0.6) {
                rating = HitRating.COOL;
            } else {
                rating = HitRating.MISS;
            }

            this.completeHit(rating);
            return rating;
        }

        return HitRating.MISS;
    }

    /**
     * Complete the hit process with the given rating
     * @param rating The hit rating to apply
     */
    private completeHit(rating: HitRating) {
        if (rating === HitRating.MISS) {
            this.miss();
            return;
        }

        // Update status
        this.status = TileStatus.HIT;

        // Stop the movement tween
        if (this.moveTween) {
            this.moveTween.stop();
        }

        // Play hit animation
        this.playHitAnimation();
    }

    /**
     * Play the animation for a successful hit
     */
    private playHitAnimation() {
        // Change color to hit color
        this.background.color = this.hitColor;

        // Flash the highlight
        const highlightOpacity = this.highlight.getComponent(UIOpacity)!;
        highlightOpacity.opacity = 180;

        // Scale and fade out
        this.scaleTween = tween(this.node.scale)
            .to(0.1, new Vec3(1.2, 1.2, 1.2))
            .to(0.1, new Vec3(1.0, 1.0, 1.0))
            .start();

        this.opacityTween = tween(this.opacity)
            .to(0.3, { opacity: 0 })
            .call(() => {
                this.node.active = false;
            })
            .start();
    }

    /**
     * Handle a missed tile
     */
    static missCount: number = 0;
    miss() {
        this.status = TileStatus.MISSED;
        Tile.missCount++;
        console.log("Missed tile", Tile.missCount);

        // Change color to miss color
        this.background.color = this.missColor;

        // Fade out
        this.opacityTween = tween(this.opacity)
            .to(0.3, { opacity: 0 })
            .call(() => {
                this.node.active = false;
            })
            .start();
    }

    /**
     * Get the current note data
     */
    getNote(): TrackNoteInfo | null {
        return this.noteData;
    }

    /**
     * Get the current status of the tile
     */
    getStatus(): TileStatus {
        return this.status;
    }

    /**
     * Get the lane this tile is in
     */
    getLane(): number {
        return this.lane;
    }

    /**
     * Check if this tile is a long press type
     */
    isLongPressType(): boolean {
        return this.isLongPress;
    }

    /**
     * Check if this tile is a slide type
     */
    isSlideType(): boolean {
        return this.isSliding;
    }

    /**
     * Reset and recycle the tile
     */
    recycle() {
        // Stop all tweens
        if (this.moveTween) {
            this.moveTween.stop();
            this.moveTween = null;
        }

        if (this.scaleTween) {
            this.scaleTween.stop();
            this.scaleTween = null;
        }

        if (this.opacityTween) {
            this.opacityTween.stop();
            this.opacityTween = null;
        }

        // Reset properties
        this.status = TileStatus.WAITING;
        this.noteData = null;
        this.isTouching = false;
        this.isLongPress = false;
        this.isSliding = false;

        // Hide the node
        this.node.active = false;
    }
} 