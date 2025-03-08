import { _decorator, Component, Node, Prefab, Label, Vec3, Color, tween, instantiate, UIOpacity, Camera, Animation, animation } from 'cc';
import { HitRating } from './Tile';
import { MagicTilesAudioManager } from './AudioManager';
import { PoolManager } from '../../Common/poolManager';

const { ccclass, property } = _decorator;

// Enum for feedback types
enum FeedbackType {
    PERFECT = 0,
    GREAT = 1,
    COOL = 2,
    MISS = 3
}

/**
 * FeedbackManager for Magic Tiles 3
 * Provides visual and auditory feedback for game events
 */
@ccclass('FeedbackManager')
export class FeedbackManager extends Component {
    // Prefabs for rating popups
    @property(Prefab)
    perfectPrefab: Prefab = null!;

    @property(Prefab)
    greatPrefab: Prefab = null!;

    @property(Prefab)
    coolPrefab: Prefab = null!;

    @property(Prefab)
    missPrefab: Prefab = null!;

    @property(Animation)
    animScoreFeedBacks: Animation = null;

    // Individual feedback nodes
    @property({
        type: [Node],
        tooltip: "Feedback animation nodes in order: perfect, good, cool, miss"
    })
    feedbackNodes: Node[] = [];

    // Combo label
    @property(Label)
    comboLabel: Label = null!;

    // Combo popup prefab
    @property(Prefab)
    comboPopupPrefab: Prefab = null!;

    // Container for feedback elements
    @property(Node)
    feedbackContainer: Node = null!;

    // Camera for effects
    @property(Camera)
    gameCamera: Camera = null!;

    // Animation node for camera shake
    @property(Node)
    cameraShakeNode: Node = null!;

    // Reference to the audio manager
    private audioManager: MagicTilesAudioManager = null!;

    // Mapping of sound effects for ratings
    @property
    perfectSoundEffect: string = "perfect";

    @property
    greatSoundEffect: string = "good";

    @property
    coolSoundEffect: string = "ok";

    @property
    missSoundEffect: string = "miss";

    @property
    comboSoundEffect: string = "combo";

    // Combo milestones for special feedback
    @property([Number])
    comboMilestones: number[] = [50, 100, 200, 300, 500];

    // Position offsets for lane feedback
    private lanePositions: Vec3[] = [];

    // Settings for feedback elements
    @property
    feedbackDuration: number = 0.7;

    @property
    feedbackScaleMultiplier: number = 1.5;

    // Add properties for score popup and message prefabs
    @property(Prefab)
    scorePopupPrefab: Prefab = null!;

    @property(Prefab)
    messagePopupPrefab: Prefab = null!;

    // For backward compatibility and easier reference
    get perfectAnimNode(): Node { return this.feedbackNodes[0]; }
    get goodNode(): Node { return this.feedbackNodes[1]; }
    get coolNode(): Node { return this.feedbackNodes[2]; }
    get missNode(): Node { return this.feedbackNodes[3]; }
    private feedbackAnimNames = ["perfect", "great", "cool", "miss"];

    // Private variables for custom pooling
    private _scorePopupPool: Node[] = [];
    private _messagePopupPool: Node[] = [];
    private _scorePopupTemplate: Node = null!;
    private _messagePopupTemplate: Node = null!;
    private _poolRoot: Node = null!;

    onLoad() {
        this.audioManager = MagicTilesAudioManager.instance;

        // Initialize the combo label
        if (this.comboLabel) {
            this.comboLabel.string = "";
            this.comboLabel.node.active = false;
        }

        // Create container if not provided
        if (!this.feedbackContainer) {
            this.feedbackContainer = new Node("FeedbackContainer");
            this.feedbackContainer.parent = this.node;
        }
        
        // Preload object pools for better performance
        if (this.perfectPrefab) {
            PoolManager.instance.preloadPool(this.perfectPrefab, 10);
        }
        if (this.greatPrefab) {
            PoolManager.instance.preloadPool(this.greatPrefab, 10);
        }
        if (this.coolPrefab) {
            PoolManager.instance.preloadPool(this.coolPrefab, 10);
        }
        if (this.missPrefab) {
            PoolManager.instance.preloadPool(this.missPrefab, 5);
        }
        if (this.comboPopupPrefab) {
            PoolManager.instance.preloadPool(this.comboPopupPrefab, 3);
        }
        
        // Create and preload score popup prefab if needed
        if (!this.scorePopupPrefab) {
            // Create a score popup prefab dynamically
            this.createScorePopupPrefab();
        } else {
            PoolManager.instance.preloadPool(this.scorePopupPrefab, 1);
        }
        
        // Create and preload message popup prefab if needed
        if (!this.messagePopupPrefab) {
            // Create a message popup prefab dynamically
            this.createMessagePopupPrefab();
        } else {
            PoolManager.instance.preloadPool(this.messagePopupPrefab, 1);
        }
    }

    /**
     * Create a score popup prefab dynamically if one isn't provided
     */
    private createScorePopupPrefab() {
        // Since we can't create actual prefabs at runtime, we'll use a node as a template
        // and implement our own simple pooling for these specific nodes
        
        // Create a template node that we'll clone
        const scoreNode = new Node("ScorePopup");
        
        // Add label component
        const label = scoreNode.addComponent(Label);
        label.fontSize = 36;
        label.color = new Color(255, 255, 100, 255);
        
        // Add opacity component
        scoreNode.addComponent(UIOpacity);
        
        // Create a parent node for our pool if not exists
        if (!this._poolRoot) {
            this._poolRoot = new Node("PoolContainer");
            this._poolRoot.parent = this.node;
            this._poolRoot.active = false;
        }
        
        // Create a pool for score popups
        if (!this._scorePopupPool) {
            this._scorePopupPool = [];
        }
        
        // Pre-instantiate some nodes
        for (let i = 0; i < 10; i++) {
            const node = instantiate(scoreNode);
            node.parent = this._poolRoot;
            node.active = false;
            this._scorePopupPool.push(node);
        }
        
        // Store the template
        this._scorePopupTemplate = scoreNode;
        // The template itself should be parented to our pool root but inactive
        scoreNode.parent = this._poolRoot;
        scoreNode.active = false;
    }

    /**
     * Create a message popup prefab dynamically if one isn't provided
     */
    private createMessagePopupPrefab() {
        // Since we can't create actual prefabs at runtime, we'll use a node as a template
        // and implement our own simple pooling for these specific nodes
        
        // Create a template node that we'll clone
        const messageNode = new Node("Message");
        
        // Add label component
        const label = messageNode.addComponent(Label);
        label.fontSize = 48;
        label.color = new Color(255, 255, 255, 255);
        
        // Add opacity component
        messageNode.addComponent(UIOpacity);
        
        // Create a parent node for our pool if not exists
        if (!this._poolRoot) {
            this._poolRoot = new Node("PoolContainer");
            this._poolRoot.parent = this.node;
            this._poolRoot.active = false;
        }
        
        // Create a pool for message popups
        if (!this._messagePopupPool) {
            this._messagePopupPool = [];
        }
        
        // Pre-instantiate some nodes
        for (let i = 0; i < 3; i++) {
            const node = instantiate(messageNode);
            node.parent = this._poolRoot;
            node.active = false;
            this._messagePopupPool.push(node);
        }
        
        // Store the template
        this._messagePopupTemplate = messageNode;
        // The template itself should be parented to our pool root but inactive
        messageNode.parent = this._poolRoot;
        messageNode.active = false;
    }

    /**
     * Get a score popup node from our custom pool
     */
    private getScorePopupFromPool(): Node {
        let node: Node;
        
        if (this._scorePopupPool.length > 0) {
            // Get from pool
            node = this._scorePopupPool.pop()!;
        } else {
            // Create new if pool is empty
            node = instantiate(this._scorePopupTemplate);
        }
        
        node.active = true;
        return node;
    }

    /**
     * Return a score popup node to our custom pool
     */
    private putScorePopupToPool(node: Node): void {
        if (!node) return;
        
        node.active = false;
        node.removeFromParent();
        this._scorePopupPool.push(node);
    }

    /**
     * Get a message popup node from our custom pool
     */
    private getMessagePopupFromPool(): Node {
        let node: Node;
        
        if (this._messagePopupPool.length > 0) {
            // Get from pool
            node = this._messagePopupPool.pop()!;
        } else {
            // Create new if pool is empty
            node = instantiate(this._messagePopupTemplate);
        }
        
        node.active = true;
        return node;
    }

    /**
     * Return a message popup node to our custom pool
     */
    private putMessagePopupToPool(node: Node): void {
        if (!node) return;
        
        node.active = false;
        node.removeFromParent();
        this._messagePopupPool.push(node);
    }

    /**
     * Set the positions for each lane
     * @param positions Array of position vectors for each lane
     */
    setLanePositions(positions: Vec3[]) {
        this.lanePositions = positions;
    }

    /**
     * Show rating feedback at a specific lane
     * @param lane Lane index
     * @param rating Hit rating
     */
    showRatingFeedback(lane: number, rating: HitRating) {
        // Get the position for this lane
        const position = this.getLanePosition(lane);

        // Get the appropriate prefab based on rating
        let prefab: Prefab | null = null;
        let soundEffect: string = "";

        switch (rating) {
            case HitRating.PERFECT:
                prefab = this.perfectPrefab;
                soundEffect = this.perfectSoundEffect;
                this.showFeedback(FeedbackType.PERFECT);
                break;
            case HitRating.GREAT:
                prefab = this.greatPrefab;
                soundEffect = this.greatSoundEffect;
                this.showFeedback(FeedbackType.GREAT);
                break;
            case HitRating.COOL:
                prefab = this.coolPrefab;
                soundEffect = this.coolSoundEffect;
                this.showFeedback(FeedbackType.COOL);
                break;
            case HitRating.MISS:
                prefab = this.missPrefab;
                soundEffect = this.missSoundEffect;
                this.showFeedback(FeedbackType.MISS);
                break;
        }

        // Play sound effect
        if (soundEffect) {
            this.audioManager.playSound(soundEffect);
        }

        // Show visual feedback
        if (prefab) {
            this.showFeedbackPrefab(prefab, position);
        }
    }

    /**
     * Show a feedback prefab at a specific position
     */
    private showFeedbackPrefab(prefab: Prefab, position: Vec3) {
        // Get node from pool instead of instantiating
        const feedbackNode = PoolManager.instance.getNode(prefab, this.feedbackContainer);
        feedbackNode.position = position;

        // Set up animations
        const opacity = feedbackNode.getComponent(UIOpacity) || feedbackNode.addComponent(UIOpacity);
        opacity.opacity = 255;

        // Reset scale
        feedbackNode.scale = new Vec3(1, 1, 1);

        // Scale and fade animation
        tween(feedbackNode)
            .to(this.feedbackDuration * 0.3, { scale: new Vec3(this.feedbackScaleMultiplier, this.feedbackScaleMultiplier, 1) })
            .to(this.feedbackDuration * 0.7, { position: new Vec3(position.x, position.y + 50, position.z) })
            .start();

        tween(opacity)
            .delay(this.feedbackDuration * 0.3)
            .to(this.feedbackDuration * 0.7, { opacity: 0 })
            .call(() => {
                // Return to pool instead of destroying
                PoolManager.instance.putNode(feedbackNode);
            })
            .start();
    }

    /**
     * Update the combo display
     * @param combo Current combo count
     */
    updateCombo(combo: number) {
        if (!this.comboLabel) return;

        // Update the combo label
        if (combo > 1) {
            this.comboLabel.string = `${combo}`;
            this.comboLabel.node.active = true;

            // Animate the combo label
            tween(this.comboLabel.node)
                .to(0.1, { scale: new Vec3(1.2, 1.2, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .start();

            // Check for combo milestones
            if (this.isComboMilestone(combo)) {
                this.showComboMilestone(combo);
            }
        } else {
            this.comboLabel.string = "";
            this.comboLabel.node.active = false;
        }
    }

    /**
     * Check if a combo count is a milestone
     */
    private isComboMilestone(combo: number): boolean {
        return this.comboMilestones.indexOf(combo) >= 0;
    }

    /**
     * Show feedback for reaching a combo milestone
     */
    private showComboMilestone(combo: number) {
        // Play combo sound
        this.audioManager.playSound(this.comboSoundEffect);

        // Show combo popup if available
        if (this.comboPopupPrefab) {
            // Get from pool instead of instantiating
            const popupNode = PoolManager.instance.getNode(this.comboPopupPrefab, this.feedbackContainer);

            // Position in the center of the screen
            popupNode.position = new Vec3(0, 0, 0);
            
            // Reset scale
            popupNode.scale = new Vec3(1, 1, 1);

            // Update label if present
            const label = popupNode.getComponentInChildren(Label);
            if (label) {
                label.string = `${combo} COMBO!`;
            }

            // Animate the popup
            tween(popupNode)
                .to(0.2, { scale: new Vec3(1.5, 1.5, 1) })
                .to(0.2, { scale: new Vec3(1, 1, 1) })
                .delay(1)
                .to(0.3, { position: new Vec3(0, 100, 0) })
                .call(() => {
                    // Return to pool instead of destroying
                    PoolManager.instance.putNode(popupNode);
                })
                .start();

            // Trigger camera shake effect
            this.shakeCamera(0.2, combo / 300); // Intensity increases with combo
        }
    }

    /**
     * Shake the camera
     * @param duration Duration of the shake in seconds
     * @param intensity Intensity of the shake (0-1)
     */
    shakeCamera(duration: number, intensity: number = 0.5) {
        if (!this.gameCamera && !this.cameraShakeNode) return;

        // Use animation component if available
        if (this.cameraShakeNode) {
            const animation = this.cameraShakeNode.getComponent(Animation);
            if (animation) {
                animation.play();
                this.scheduleOnce(() => {
                    animation.stop();
                }, duration);
                return;
            }
        }

        // Manual camera shake as fallback
        const targetNode = this.cameraShakeNode || this.gameCamera.node;
        const originalPosition = targetNode.position.clone();

        // Maximum shake offset
        const maxOffset = 10 * intensity;

        // Create a sequence of random positions
        const shakeCount = Math.floor(duration / 0.05);
        let shakeTween = tween(targetNode);

        for (let i = 0; i < shakeCount; i++) {
            const offsetX = (Math.random() * 2 - 1) * maxOffset;
            const offsetY = (Math.random() * 2 - 1) * maxOffset;

            shakeTween = shakeTween.to(0.05, {
                position: new Vec3(
                    originalPosition.x + offsetX,
                    originalPosition.y + offsetY,
                    originalPosition.z
                )
            });
        }

        // Return to original position
        shakeTween.to(0.1, { position: originalPosition })
            .start();
    }

    /**
     * Show a score popup
     * @param score Score value
     * @param position Position to show the popup
     */
    showScorePopup(score: number, position: Vec3 = new Vec3(0, 0, 0)) {
        // Check if we have a prefab to use
        if (this.scorePopupPrefab) {
            // Get a node from the pool
            const scoreNode = PoolManager.instance.getNode(this.scorePopupPrefab, this.feedbackContainer);
            scoreNode.position = position;
            
            // Get the label component and update text
            const label = scoreNode.getComponent(Label);
            if (label) {
                label.string = `+${score}`;
            }
            
            // Reset opacity
            const opacity = scoreNode.getComponent(UIOpacity);
            if (opacity) {
                opacity.opacity = 255;
            }
            
            // Animate the score popup
            tween(scoreNode)
                .to(0.5, { position: new Vec3(position.x, position.y + 80, position.z) })
                .delay(0.2)
                .to(0.3, { position: new Vec3(position.x, position.y + 120, position.z) })
                .call(() => {
                    // Return to pool instead of destroying
                    PoolManager.instance.putNode(scoreNode);
                })
                .start();
        } else if (this._scorePopupTemplate) {
            // Use our custom pool if prefab is not available but we have a template
            const scoreNode = this.getScorePopupFromPool();
            scoreNode.parent = this.feedbackContainer;
            scoreNode.position = position;
            
            // Get the label component and update text
            const label = scoreNode.getComponent(Label);
            if (label) {
                label.string = `+${score}`;
            }
            
            // Reset opacity
            const opacity = scoreNode.getComponent(UIOpacity);
            if (opacity) {
                opacity.opacity = 255;
            }
            
            // Animate the score popup
            tween(scoreNode)
                .to(0.5, { position: new Vec3(position.x, position.y + 80, position.z) })
                .delay(0.2)
                .to(0.3, { position: new Vec3(position.x, position.y + 120, position.z) })
                .call(() => {
                    // Return to our custom pool
                    this.putScorePopupToPool(scoreNode);
                })
                .start();
        } else {
            // Fallback to the old method if no prefab or template is available
            // Create a label node
            const scoreNode = new Node("ScorePopup");
            scoreNode.parent = this.feedbackContainer;
            scoreNode.position = position;
    
            // Add label component
            const label = scoreNode.getComponent(Label) || scoreNode.addComponent(Label);
            label.string = `+${score}`;
            label.fontSize = 36;
            label.color = new Color(255, 255, 100, 255);
    
            // Animate the score popup
            tween(scoreNode)
                .to(0.5, { position: new Vec3(position.x, position.y + 80, position.z) })
                .delay(0.2)
                .to(0.3, { position: new Vec3(position.x, position.y + 120, position.z) })
                .call(() => {
                    scoreNode.removeFromParent();
                    scoreNode.destroy();
                })
                .start();
        }
    }

    /**
     * Get the position for a specific lane
     */
    private getLanePosition(lane: number): Vec3 {
        if (lane >= 0 && lane < this.lanePositions.length) {
            return this.lanePositions[lane];
        }

        // Default position at the center
        return new Vec3(0, 0, 0);
    }

    /**
     * Show a message in the center of the screen
     * @param message Text to display
     * @param duration How long to show the message
     */
    showMessage(message: string, duration: number = 2.0) {
        // Check if we have a prefab to use
        if (this.messagePopupPrefab) {
            // Get a node from the pool
            const messageNode = PoolManager.instance.getNode(this.messagePopupPrefab, this.feedbackContainer);
            messageNode.position = new Vec3(0, 0, 0);
            
            // Get the label component and update text
            const label = messageNode.getComponent(Label);
            if (label) {
                label.string = message;
            }
            
            // Get opacity component
            const opacity = messageNode.getComponent(UIOpacity);
            if (opacity) {
                opacity.opacity = 0;
            
                // Fade in and out
                tween(opacity)
                    .to(0.3, { opacity: 255 })
                    .delay(duration - 0.6)
                    .to(0.3, { opacity: 0 })
                    .call(() => {
                        // Return to pool instead of destroying
                        PoolManager.instance.putNode(messageNode);
                    })
                    .start();
            }
        } else if (this._messagePopupTemplate) {
            // Use our custom pool if prefab is not available but we have a template
            const messageNode = this.getMessagePopupFromPool();
            messageNode.parent = this.feedbackContainer;
            messageNode.position = new Vec3(0, 0, 0);
            
            // Get the label component and update text
            const label = messageNode.getComponent(Label);
            if (label) {
                label.string = message;
            }
            
            // Get opacity component
            const opacity = messageNode.getComponent(UIOpacity);
            if (opacity) {
                opacity.opacity = 0;
            
                // Fade in and out
                tween(opacity)
                    .to(0.3, { opacity: 255 })
                    .delay(duration - 0.6)
                    .to(0.3, { opacity: 0 })
                    .call(() => {
                        // Return to our custom pool
                        this.putMessagePopupToPool(messageNode);
                    })
                    .start();
            }
        } else {
            // Fallback to the old method if no prefab or template is available
            // Create a label node
            const messageNode = new Node("Message");
            messageNode.parent = this.feedbackContainer;
            messageNode.position = new Vec3(0, 0, 0);
    
            // Add label component
            const label = messageNode.getComponent(Label) || messageNode.addComponent(Label);
            label.string = message;
            label.fontSize = 80;
            label.color = new Color(255, 255, 255, 255);
    
            // Add opacity component for fade effect
            const opacity = messageNode.getComponent(UIOpacity) || messageNode.addComponent(UIOpacity);
            opacity.opacity = 0;
    
            // Fade in and out
            tween(opacity)
                .to(0.3, { opacity: 255 })
                .delay(duration - 0.6)
                .to(0.3, { opacity: 0 })
                .call(() => {
                    messageNode.removeFromParent();
                    messageNode.destroy();
                })
                .start();
        }
    }

    /**
     * Play haptic feedback if available
     * @param intensity Intensity of the feedback (0-1)
     */
    playHapticFeedback(intensity: number = 0.5) {
        // Check if vibration is available on the device
        if ('navigator' in globalThis && 'vibrate' in navigator) {
            // Duration based on intensity (10-100ms)
            const duration = Math.floor(10 + intensity * 90);
            navigator.vibrate(duration);
        }
    }

    // Replace any methods that use the individual nodes with the array access
    // For example, if there's a showPerfect method, it might look like:
    showFeedback(type: FeedbackType) {
        // Hide all feedback nodes first
        for (const node of this.feedbackNodes) {
            node.active = false;
        }

        // Show the requested feedback
        if (this.feedbackNodes[type]) {
            this.feedbackNodes[type].active = true;
            // Add any animation or other logic here
        }

        const animName = this.feedbackAnimNames[type];
        this.animScoreFeedBacks.play(animName);
    }

    // Then methods like showPerfect would become:
    showPerfect() {
        this.showFeedback(FeedbackType.PERFECT);
    }

    showGood() {
        this.showFeedback(FeedbackType.GREAT);
    }

    showCool() {
        this.showFeedback(FeedbackType.COOL);
    }

    showMiss() {
        this.showFeedback(FeedbackType.MISS);
    }

    /**
     * Clean up all resources when component is destroyed
     */
    onDestroy() {
        // Clean up custom pools
        if (this._scorePopupPool) {
            this._scorePopupPool.forEach(node => {
                if (node && node.isValid) {
                    node.destroy();
                }
            });
            this._scorePopupPool = [];
        }
        
        if (this._messagePopupPool) {
            this._messagePopupPool.forEach(node => {
                if (node && node.isValid) {
                    node.destroy();
                }
            });
            this._messagePopupPool = [];
        }
        
        // Clean up templates
        if (this._scorePopupTemplate && this._scorePopupTemplate.isValid) {
            this._scorePopupTemplate.destroy();
            this._scorePopupTemplate = null!;
        }
        
        if (this._messagePopupTemplate && this._messagePopupTemplate.isValid) {
            this._messagePopupTemplate.destroy();
            this._messagePopupTemplate = null!;
        }
        
        // Clean up pool root
        if (this._poolRoot && this._poolRoot.isValid) {
            this._poolRoot.destroy();
            this._poolRoot = null!;
        }
    }
}