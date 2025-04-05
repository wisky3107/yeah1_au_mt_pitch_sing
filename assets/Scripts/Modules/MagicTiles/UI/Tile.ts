import { _decorator, Component, Node, Sprite, Color, tween, Vec3, UIOpacity, UITransform, Size, director, game } from 'cc';
import { NoteType, TrackNoteInfo } from '../Data/MTDefines';

const { ccclass, property } = _decorator;

// Status of a tile
export enum TileStatus {
    WAITING, // Waiting to be shown
    ACTIVE,  // Visible and moving
    HOLDING, // Currently being pressed
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

    @property(UITransform)
    transform: UITransform = null!;

    @property(UIOpacity)
    opacity: UIOpacity = null!;

    @property
    bufferHeight: number = 200; //perfect timming will higher than bottom by this amount

    @property(Node)
    nodeBeginning: Node = null!;

    @property({type: Node, group: {name: 'Long Press'}})
    nodeLongPress: Node = null!;

    @property({type: Node, group: {name: 'Long Press'}})
    nodeHoldEffect: Node = null!;

    @property({type: UITransform, group: {name: 'Long Press'}})
    holdEffectTransform: UITransform = null!;

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

    private holdRating: HitRating = HitRating.MISS;

    // New properties for direct movement
    private movementStartTime: number = 0;
    private movementDuration: number = 0;
    private movementStartY: number = 0;
    private movementTargetY: number = 0;
    private isMovementActive: boolean = false;

    // Reusable Vec3 object to reduce allocations
    private tempVec3: Vec3 = new Vec3();

    // Add properties for frame skipping
    private updatePriority: number = 0; // 0=every frame, 1=every other frame, etc.
    private frameCounter: number = 0;

    private holdRange: number = 0;

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

        if (this.nodeHoldEffect && !this.holdEffectTransform) {
            this.holdEffectTransform = this.nodeHoldEffect.getComponent(UITransform)!;
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
        this.holdRange = 0;

        // Reset state
        this.isTouching = false;
        this.touchStartTime = 0;
        this.touchEndTime = 0;

        // Position the tile
        this.node.position = new Vec3(0, startY, 0);

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

        this.background.color = this.normalColor;
        this.opacity.opacity = 255;

        const noteHeight = note.duration * scrollSpeed;
        // Set a minimum height to ensure visibility
        this.transform.contentSize = new Size(width, Math.max(noteHeight, minHeight));
        this.transform.node.position = new Vec3(0, -this.bufferHeight, 0);
        this.nodeBeginning.active = false;
        // Set the height based on note duration for hold notes
        if (note.type === NoteType.HOLD && note.duration > 0) {
            this.isLongPress = true;
            this.setLongPressNodeActive(true);
            if (this.nodeHoldEffect) {
                this.nodeHoldEffect.active = false;
            }
            if (this.holdEffectTransform) {
                this.holdEffectTransform.height = 0;
            }
            // Calculate height based on duration and scroll speed
        } else {
            this.isLongPress = false;
            this.setLongPressNodeActive(false);
            
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

    public setBeginningNodeActive(active: boolean) {
        this.nodeBeginning.active = active;
    }

    public setLongPressNodeActive(active: boolean) {
        this.nodeLongPress.active = active;
    }

    public getTileHeight(): number {
        return this.transform.contentSize.height;
    }

    public setBufferHeight(height: number) {
        this.bufferHeight = height;
        this.transform.node.position = new Vec3(0, -this.bufferHeight, 0);
    }

    /**
     * Start the tile's movement using direct position updates
     * @param duration How long the movement should take in seconds
     * @param gameTime Current game time
     */
    startMovement(duration: number, gameTime: number) {
        this.status = TileStatus.ACTIVE;
        this.spawnTime = Date.now() / 1000;

        // Calculate a position that's beyond the target position
        const targetPosY = this.targetY - ((duration * this.scrollSpeed) - (this.startY - this.targetY));

        // Store movement parameters for direct updates
        this.movementStartTime = gameTime;
        this.movementDuration = duration;
        this.movementStartY = this.node.position.y;
        this.movementTargetY = targetPosY;
        this.isMovementActive = true;

        // Stop any existing tween
        if (this.moveTween) {
            this.moveTween.stop();
            this.moveTween = null;
        }
    }

    /**
     * Set the update priority based on distance from target
     * @param priority 0=update every frame, 1=every other frame, etc.
     */
    setUpdatePriority(priority: number) {
        this.updatePriority = priority;
    }

    /**
     * Built-in update method that will be called every frame
     */
    update(dt: number) {
        // Skip updates based on priority
        if (this.updatePriority > 0) {
            this.frameCounter = (this.frameCounter + 1) % (this.updatePriority + 1);
            if (this.frameCounter !== 0) return;
        }

        // Handle direct movement if active
        if (this.isMovementActive) {
            this.updateTileMovement();
        }

        // Update hold effect if holding
        if (this.status === TileStatus.HOLDING && this.isLongPress && this.nodeHoldEffect) {
            this.updateHoldEffect(dt);
        }
    }

    /**
     * Update the tile position directly
     * @returns The calculated new Y position
     */
    private updateTileMovement(): number {
        // Get current game time from audio manager
        const currentTime = this.calculateCurrentTime();
        const elapsedTime = currentTime - this.movementStartTime;
        const progress = Math.min(1.0, elapsedTime / this.movementDuration);

        // Linear interpolation for position
        const newY = this.movementStartY + (this.movementTargetY - this.movementStartY) * progress;

        // Reuse Vec3 object to reduce garbage collection
        this.tempVec3.set(0, newY, 0);
        this.node.position = this.tempVec3;

        // If movement complete, stop updates
        if (progress >= 1.0) {
            this.isMovementActive = false;
        }

        return newY;
    }

    /**
     * Get the current time for movement calculations
     * In a real implementation, this would use a reference to the audio manager
     */
    private calculateCurrentTime(): number {
        // In a real implementation, get this from the audio manager
        // For now, we'll use a simple approximation
        return Date.now() / 1000 - this.spawnTime + this.movementStartTime;
    }

    /**
     * Update the tile's visual appearance based on its type
     */
    // private updateVisualByType() {
    //     if (!this.noteData) return;

    //     switch (this.noteData.type) {
    //         case NoteType.TAP:
    //             this.background.color = this.normalColor;
    //             break;
    //         case NoteType.HOLD:
    //             this.background.color = this.holdColor;
    //             break;
    //         case NoteType.SLIDE:
    //             this.background.color = this.slideColor;
    //             break;
    //     }
    // }


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

        // Get framerate compensation factor from director
        // This helps adjust timing windows for low FPS devices
        const dt = game.deltaTime
        const targetFrameTime = 1 / 60; // Target is 60fps

        // Calculate a compensation factor based on current frame time vs target frame time
        // Cap the compensation to avoid extreme values
        const fpsCompensationFactor = Math.min(Math.max(dt / targetFrameTime, 1.0), 3.0);

        // Apply compensation to timing windows
        const perfectWindow = 0.1 * fpsCompensationFactor;
        const greatWindow = 0.3 * fpsCompensationFactor;
        const coolWindow = 0.5 * fpsCompensationFactor;

        let rating: HitRating;

        // Determine hit rating based on timing accuracy with adjusted windows
        if (timeDiff < perfectWindow) { // Perfect window adjusted for fps
            rating = HitRating.PERFECT;
        } else if (timeDiff < greatWindow) { // Great window adjusted for fps
            rating = HitRating.GREAT;
        } else if (timeDiff < coolWindow) { // Cool window adjusted for fps
            rating = HitRating.COOL;
        } else {
            rating = HitRating.MISS;
        }

        // If this is a regular tap note or we missed, finish the hit process
        if (this.noteData.type === NoteType.TAP) {
            this.completeHit(rating);
        }
        else if (this.noteData.type === NoteType.HOLD) {
            this.triggerLongPress(rating);
        }

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

            // Get framerate compensation factor from director
            const dt = game.deltaTime;
            const targetFrameTime = 1 / 60; // Target is 60fps
            const fpsCompensationFactor = Math.min(Math.max(dt / targetFrameTime, 1.0), 2.0);

            let rating: HitRating = HitRating.COOL;

            // Determine rating based on how closely the hold duration matches expected
            // Adjust thresholds based on FPS compensation factor
            const durationRatio = actualDuration / expectedDuration;
            const perfectThreshold = 0.95 / fpsCompensationFactor;
            const greatThreshold = 0.8 / fpsCompensationFactor;

            if (durationRatio >= perfectThreshold) {
                rating = HitRating.PERFECT;
            } else if (durationRatio >= greatThreshold) {
                rating = HitRating.GREAT;
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

        // // Stop the movement tween
        // if (this.moveTween) {
        //     this.moveTween.stop();
        // }

        // Play hit animation
        this.playHitAnimation();
    }

    private triggerLongPress(rating: HitRating) {
        if (rating === HitRating.MISS) {
            this.miss();
            return;
        }

        this.status = TileStatus.HOLDING;
        this.holdRating = rating;
        // Set holdRange based on the distance between current position and target position
        this.holdRange = Math.abs(this.node.position.y - this.targetY);
        
        // Initialize hold effect
        if (this.nodeHoldEffect) {
            this.nodeHoldEffect.active = true;
            if (this.holdEffectTransform) {
                const currentSize = this.holdEffectTransform.contentSize;
                this.holdEffectTransform.contentSize = new Size(currentSize.width, 0);
            }
        }

        this.background.color = this.holdColor;
    }

    /**
     * Play the animation for a successful hit
     */
    private playHitAnimation() {
        // Change color to hit color
        this.background.color = this.normalColor;
        this.opacity.opacity = 100;
        // this.background.color = this.hitColor;

        // Scale and fade out
        // this.scaleTween = tween(this.node.scale)
        //     .to(0.1, new Vec3(1.2, 1.2, 1.2))
        //     .to(0.1, new Vec3(1.0, 1.0, 1.0))
        //     .start();

        // this.opacityTween = tween(this.opacity)
        //     .to(0.1, { opacity: 100 })
        //     // .call(() => {
        //     //     this.node.active = false;
        //     // })
        //     .start();
    }

    /**
     * Handle a missed tile
     */
    static missCount: number = 0;
    miss() {
        this.status = TileStatus.MISSED;
        Tile.missCount++;

        // Change color to miss color
        this.background.color = this.missColor;

        // Fade out
        this.opacityTween = tween(this.opacity)
            .to(0.3, { opacity: 100 })
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
        this.holdRange = 0;

        // Hide nodes
        if (this.nodeHoldEffect) {
            this.nodeHoldEffect.active = false;
        }

        // Clean up direct movement
        this.isMovementActive = false;

        // Hide the node
        this.node.active = false;
    }

    /**
     * Update the hold effect position and size
     * @param dt Delta time
     */
    private updateHoldEffect(dt: number) {
        if (!this.isTouching) return;

        // Increase holdRange by scrollSpeed
        this.holdRange = Math.min(this.holdRange + this.scrollSpeed * dt, this.transform.contentSize.height - this.bufferHeight);
        
        // Activate hold effect node if not already active
        if (!this.nodeHoldEffect.active) {
            this.nodeHoldEffect.active = true;
        }
        
        // Update hold effect position
        const effectPos = this.nodeHoldEffect.position;
        const finalHoldPosition = this.holdRange + this.bufferHeight;
        // Create a new Vec3 instead of modifying the y property directly
        this.nodeHoldEffect.position = new Vec3(effectPos.x, finalHoldPosition, effectPos.z);
        
        // Update hold effect height
        if (this.holdEffectTransform) {
            const currentSize = this.holdEffectTransform.contentSize;
            this.holdEffectTransform.contentSize = new Size(currentSize.width, finalHoldPosition);
        }
    }
} 