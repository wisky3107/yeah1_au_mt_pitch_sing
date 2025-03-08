import { _decorator, Component, Node, EventTouch, UITransform, Vec3, input, Input, EventMouse, UIOpacity, Sprite, Color, Camera } from 'cc';
import { TileManager } from './TileManager';
import { HitRating } from './Tile';
import { TapValidator } from './TapValidator';

const { ccclass, property } = _decorator;

// Interface for tracking touch data
interface TouchInfo {
    id: number;
    lane: number;
    startTime: number;
    position: Vec3;
    active: boolean;
    node: Node | null;
}

/**
 * InputManager for Magic Tiles 3
 * Handles touch/tap detection and validation
 */
@ccclass('InputManager')
export class InputManager extends Component {
    // Visual feedback nodes for taps
    @property([Node])
    tapFeedbackNodes: Node[] = [];

    // Hit line node for visualization
    @property(Node)
    hitLineNode: Node = null!;

    // Reference to the lane container
    @property(Node)
    laneContainer: Node = null!;

    // Reference to the tile manager
    @property(TileManager)
    tileManager: TileManager = null!;

    // Reference to the tap validator
    @property(TapValidator)
    tapValidator: TapValidator = null!;

    // Reference to the game camera
    @property(Camera)
    camera: Camera = null!;

    // Visual settings
    @property
    tapFeedbackDuration: number = 0.2;

    // Input processing state
    private isEnabled: boolean = true;

    // Lane information
    private laneWidth: number = 0;
    private laneCount: number = 4;
    private laneStartX: number = 0;

    // Touch tracking
    private activeTouches: Map<number, TouchInfo> = new Map();

    onLoad() {
        // Initialize lane information
        this.initLaneInfo();

        // Initialize tap feedback nodes
        this.initTapFeedback();

        // Register event listeners
        this.registerEvents();
    }

    /**
     * Initialize lane information
     */
    private initLaneInfo() {
        if (!this.laneContainer) {
            console.error("Lane container is not assigned to InputManager");
            return;
        }

        const transform = this.laneContainer.getComponent(UITransform);
        if (!transform) {
            console.error("Lane container doesn't have a UITransform component");
            return;
        }

        // Calculate lane width
        this.laneCount = 4; // Magic Tiles typically has 4 lanes
        this.laneWidth = transform.width / this.laneCount;
        this.laneStartX = 0.0;
    }

    /**
     * Initialize tap feedback visual elements
     */
    private initTapFeedback() {
        // Create tap feedback nodes if not provided
        if (this.tapFeedbackNodes.length < this.laneCount) {
            console.warn(`Need ${this.laneCount} tap feedback nodes, but only ${this.tapFeedbackNodes.length} were provided.`);

            // Create missing feedback nodes
            for (let i = this.tapFeedbackNodes.length; i < this.laneCount; i++) {
                const feedbackNode = new Node(`TapFeedback_${i}`);
                feedbackNode.parent = this.node;

                // Add visual components
                const sprite = feedbackNode.addComponent(Sprite);
                sprite.color = new Color(255, 255, 255, 120);

                // Add opacity component for fade effect
                const opacity = feedbackNode.addComponent(UIOpacity);
                opacity.opacity = 0;

                // Add to feedback nodes
                this.tapFeedbackNodes.push(feedbackNode);
            }
        }

        // Position tap feedback nodes
        for (let i = 0; i < this.laneCount; i++) {
            const feedbackNode = this.tapFeedbackNodes[i];
            const transform = feedbackNode.getComponent(UITransform) || feedbackNode.addComponent(UITransform);

            // Size the feedback to fill the lane
            transform.width = this.laneWidth * 0.9; // Slightly smaller than lane
            transform.height = 100; // Height of the feedback indicator

            // Position at the hit line position (should match where tiles are hit)
            const xPos = this.laneStartX + (i + 0.5) * this.laneWidth;
            const yPos = this.hitLineNode ? this.hitLineNode.position.y : 0;
            feedbackNode.position = new Vec3(xPos, yPos, 0);
        }
    }

    /**
     * Register touch and mouse event listeners
     */
    private registerEvents() {
        // Register touch events
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

        // Register mouse events for desktop
        // input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        // input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        // input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    /**
     * Unregister event listeners when component is destroyed
     */
    onDestroy() {
        // Unregister touch events
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

        // Unregister mouse events
        // input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        // input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        // input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    /**
     * Handle touch start event
     */
    private onTouchStart(event: EventTouch) {
        if (!this.isEnabled) return;

        const touches = event.getTouches();
        for (const touch of touches) {
            const touchLocation = touch.getLocation();
            const worldPos = this.convertToWorldSpace(touchLocation.x, touchLocation.y);

            // Determine which lane was touched
            const lane = this.getLaneFromPosition(worldPos.x);
            if (lane >= 0) {
                // Create touch info
                const touchInfo: TouchInfo = {
                    id: touch.getID(),
                    lane: lane,
                    startTime: Date.now() / 1000,
                    position: worldPos,
                    active: true,
                    node: this.tapFeedbackNodes[lane]
                };

                // Store touch info
                this.activeTouches.set(touch.getID(), touchInfo);

                // Show tap feedback
                this.showTapFeedback(lane);

                // Notify the tile manager and tap validator about the touch
                const gameTime = this.tileManager.getGameTime();
                const rating = this.tileManager.handleLaneTouch(lane, true);

                // Validate the tap
                this.tapValidator.validateTap(lane, gameTime, rating);
            }
        }
    }

    /**
     * Handle touch move event
     */
    private onTouchMove(event: EventTouch) {
        if (!this.isEnabled) return;

        const touches = event.getTouches();
        for (const touch of touches) {
            const touchID = touch.getID();
            if (this.activeTouches.has(touchID)) {
                const touchInfo = this.activeTouches.get(touchID)!;

                const touchLocation = touch.getLocation();
                const worldPos = this.convertToWorldSpace(touchLocation.x, touchLocation.y);

                // Update touch position
                touchInfo.position = worldPos;

                // Check if the touch moved to a different lane
                const newLane = this.getLaneFromPosition(worldPos.x);
                if (newLane >= 0 && newLane !== touchInfo.lane) {
                    // End touch in current lane
                    this.tileManager.handleLaneTouch(touchInfo.lane, false);

                    // Hide feedback in old lane
                    this.hideTapFeedback(touchInfo.lane);

                    // Update lane
                    touchInfo.lane = newLane;
                    touchInfo.node = this.tapFeedbackNodes[newLane];

                    // Show feedback in new lane
                    this.showTapFeedback(newLane);

                    // Start touch in new lane
                    const gameTime = this.tileManager.getGameTime();
                    const rating = this.tileManager.handleLaneTouch(newLane, true);

                    // Validate the tap
                    this.tapValidator.validateTap(newLane, gameTime, rating);
                }
            }
        }
    }

    /**
     * Handle touch end event
     */
    private onTouchEnd(event: EventTouch) {
        if (!this.isEnabled) return;

        const touches = event.getTouches();
        for (const touch of touches) {
            const touchID = touch.getID();
            if (this.activeTouches.has(touchID)) {
                const touchInfo = this.activeTouches.get(touchID)!;

                // Notify the tile manager about the touch end
                const gameTime = this.tileManager.getGameTime();
                const rating = this.tileManager.handleLaneTouch(touchInfo.lane, false);

                // Hide tap feedback
                this.hideTapFeedback(touchInfo.lane);

                // Remove from active touches
                this.activeTouches.delete(touchID);
            }
        }
    }

    /**
     * Handle touch cancel event
     */
    private onTouchCancel(event: EventTouch) {
        // Handle the same as touch end
        this.onTouchEnd(event);
    }

    /**
     * Handle mouse down event (for desktop)
     */
    private onMouseDown(event: EventMouse) {
        if (!this.isEnabled) return;

        const mouseLocation = event.getLocation();
        const worldPos = this.convertToWorldSpace(mouseLocation.x, mouseLocation.y);

        // Determine which lane was clicked
        const lane = this.getLaneFromPosition(worldPos.x);
        if (lane >= 0) {
            // Create touch info for mouse
            const touchInfo: TouchInfo = {
                id: 0, // Use 0 for mouse
                lane: lane,
                startTime: Date.now() / 1000,
                position: worldPos,
                active: true,
                node: this.tapFeedbackNodes[lane]
            };

            // Store touch info
            this.activeTouches.set(0, touchInfo);

            // Show tap feedback
            this.showTapFeedback(lane);

            // Notify the tile manager and tap validator about the touch
            const gameTime = this.tileManager.getGameTime();
            const rating = this.tileManager.handleLaneTouch(lane, true);

            // Validate the tap
            this.tapValidator.validateTap(lane, gameTime, rating);
        }
    }

    /**
     * Handle mouse move event (for desktop)
     */
    private onMouseMove(event: EventMouse) {
        if (!this.isEnabled || !this.activeTouches.has(0)) return;

        const touchInfo = this.activeTouches.get(0)!;

        const mouseLocation = event.getLocation();
        const worldPos = this.convertToWorldSpace(mouseLocation.x, mouseLocation.y);

        // Update touch position
        touchInfo.position = worldPos;

        // Check if the mouse moved to a different lane
        const newLane = this.getLaneFromPosition(worldPos.x);
        if (newLane >= 0 && newLane !== touchInfo.lane) {
            // End touch in current lane
            this.tileManager.handleLaneTouch(touchInfo.lane, false);

            // Hide feedback in old lane
            this.hideTapFeedback(touchInfo.lane);

            // Update lane
            touchInfo.lane = newLane;
            touchInfo.node = this.tapFeedbackNodes[newLane];

            // Show feedback in new lane
            this.showTapFeedback(newLane);

            // Start touch in new lane
            const gameTime = this.tileManager.getGameTime();
            const rating = this.tileManager.handleLaneTouch(newLane, true);

            // Validate the tap
            this.tapValidator.validateTap(newLane, gameTime, rating);
        }
    }

    /**
     * Handle mouse up event (for desktop)
     */
    private onMouseUp(event: EventMouse) {
        if (!this.isEnabled || !this.activeTouches.has(0)) return;

        const touchInfo = this.activeTouches.get(0)!;

        // Notify the tile manager about the touch end
        const gameTime = this.tileManager.getGameTime();
        const rating = this.tileManager.handleLaneTouch(touchInfo.lane, false);

        // Hide tap feedback
        this.hideTapFeedback(touchInfo.lane);

        // Remove from active touches
        this.activeTouches.delete(0);
    }

    /**
     * Show visual feedback for a tap in a lane
     */
    private showTapFeedback(lane: number) {
        if (lane < 0 || lane >= this.tapFeedbackNodes.length) return;

        const feedbackNode = this.tapFeedbackNodes[lane];
        const opacity = feedbackNode.getComponent(UIOpacity);

        // Reset opacity
        if (opacity) {
            opacity.opacity = 255;

            // Schedule fade out
            this.scheduleOnce(() => {
                this.hideTapFeedback(lane);
            }, this.tapFeedbackDuration);
        }
    }

    /**
     * Hide visual feedback for a tap in a lane
     */
    private hideTapFeedback(lane: number) {
        if (lane < 0 || lane >= this.tapFeedbackNodes.length) return;

        const feedbackNode = this.tapFeedbackNodes[lane];
        const opacity = feedbackNode.getComponent(UIOpacity);

        // Fade out
        if (opacity) {
            opacity.opacity = 0;
        }
    }

    /**
     * Convert screen coordinates to world space
     */
    private convertToWorldSpace(x: number, y: number): Vec3 {


        const camera = this.camera;
        if (!camera) {
            // Fallback to manual conversion if no camera is found
            const transform = this.node.getComponent(UITransform);
            if (!transform) return new Vec3(x, y, 0);

            const width = transform.width;
            const height = transform.height;

            // Convert to centered coordinates
            const worldX = x - width / 2;
            const worldY = y - height / 2;

            return new Vec3(worldX, worldY, 0);
        }

        // Create a Vec3 with the screen position
        const screenPos = new Vec3(x, y, 0);

        // Convert screen position to world position
        return camera.screenToWorld(screenPos);;
    }

    /**s
     * Get the lane index from a world position
     */
    private getLaneFromPosition(x: number): number {
        // Calculate which lane the x position falls into
        const relativeX = x - this.laneStartX;
        if (relativeX < 0 || relativeX >= this.laneWidth * this.laneCount) {
            return -1; // Outside the valid lane area
        }

        return Math.floor(relativeX / this.laneWidth);
    }

    /**
     * Enable or disable input processing
     */
    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;

        // Clear active touches when disabled
        if (!enabled) {
            this.activeTouches.clear();
            for (let i = 0; i < this.tapFeedbackNodes.length; i++) {
                this.hideTapFeedback(i);
            }
        }
    }

    /**
     * Check if input processing is enabled
     */
    isInputEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Get the active touch for a lane (if any)
     */
    getActiveTouchInLane(lane: number): TouchInfo | null {
        for (const [_, touchInfo] of this.activeTouches) {
            if (touchInfo.lane === lane) {
                return touchInfo;
            }
        }

        return null;
    }

    /**
     * Get the number of active touches
     */
    getActiveTouchCount(): number {
        return this.activeTouches.size;
    }
} 