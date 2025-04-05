import { _decorator, Component, Node, Prefab, Label, Vec3, Color, tween, instantiate, UIOpacity, Camera, Animation, animation, easing, Tween, ParticleSystem2D } from 'cc';
import { HitRating } from '../UI/Tile';
import { MTAudioManager } from './MTAudioManager';
import { PoolManager } from '../../../Common/poolManager';

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
    @property(Animation)
    animScoreFeedBacks: Animation = null;

    // Individual feedback nodes
    @property({
        type: [Node],
        tooltip: "Feedback animation nodes in order: perfect, good, cool, miss"
    })
    feedbackNodes: Node[] = [];

    @property(ParticleSystem2D)
    particleSystemPerfectFragments: ParticleSystem2D = null!;
    // Combo label
    @property(Label)
    comboLabel: Label = null!;
    // Container for feedback elements
    @property(Node)
    feedbackContainer: Node = null!;

    // Camera for effects
    @property(Camera)
    gameCamera: Camera = null!;

    // Animation node for camera shake
    @property(Node)
    cameraShakeNode: Node = null!;

    @property(Label)
    lbMessage: Label = null!;

    @property(UIOpacity)
    opacityMessage: UIOpacity = null!;

    // Reference to the audio manager
    private audioManager: MTAudioManager = null!;

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
        this.audioManager = MTAudioManager.instance;

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
        let soundEffect: string = "";

        switch (rating) {
            case HitRating.PERFECT:
                soundEffect = this.perfectSoundEffect;
                this.showFeedback(FeedbackType.PERFECT);
                this.particleSystemPerfectFragments.resetSystem();
                break;
            case HitRating.GREAT:
                soundEffect = this.greatSoundEffect;
                this.showFeedback(FeedbackType.GREAT);
                break;
            case HitRating.COOL:
                soundEffect = this.coolSoundEffect;
                this.showFeedback(FeedbackType.COOL);
                break;
            case HitRating.MISS:
                soundEffect = this.missSoundEffect;
                this.showFeedback(FeedbackType.MISS);
                break;
        }

        // Play sound effect
        if (soundEffect) {
            this.audioManager.playSound(soundEffect);
        }
    }

    /**
     * Update the combo display
     * @param combo Current combo count
     */

    private comboTween: Tween<Node> = null;
    updateCombo(combo: number) {
        if (!this.comboLabel) return;

        // Update the combo label
        if (combo > 1) {
            this.comboLabel.string = `x${combo}`;
            this.comboLabel.node.active = true;

            // Animate the combo label
            if (this.comboTween) {
                this.comboTween.stop();
            }
            this.comboLabel.node.scale = new Vec3(0.0, 0.0, 0.0);
            this.comboTween = tween(this.comboLabel.node)
                .to(0.1, { scale: new Vec3(1.2, 1.2, 1) })
                .delay(0.5)
                .to(0.35, { scale: Vec3.ZERO }, { easing: easing.backIn })
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
    private _messageTween: Tween<UIOpacity> = null!;
    showMessage(message: string, duration: number = 2.0, fontSize: number = 80) {
        this.lbMessage.string = message;
        this.lbMessage.node.active = true;
        this.lbMessage.fontSize = fontSize;

        this.opacityMessage.opacity = 255;
        // Cancel any existing tween
        if (this._messageTween) {
            this._messageTween.stop();
        }

        // Fade in and out cycles based on duration, then disappear
        const cycleDuration = duration / 3; // Divide total duration by 3 cycles
        const fadeDuration = cycleDuration / 2; // Each fade in and out takes half of the cycle

        this._messageTween = tween(this.opacityMessage)
            // First cycle
            .to(fadeDuration, { opacity: 255 }, { easing: 'smooth' })
            .to(fadeDuration, { opacity: 100 }, { easing: 'smooth' })
            // Second cycle
            .to(fadeDuration, { opacity: 255 }, { easing: 'smooth' })
            .to(fadeDuration, { opacity: 100 }, { easing: 'smooth' })
            // Third cycle
            .to(fadeDuration, { opacity: 255 }, { easing: 'smooth' })
            .to(fadeDuration, { opacity: 100 }, { easing: 'smooth' })
            // Final fade out
            .to(fadeDuration, { opacity: 0 }, { easing: 'smooth' })
            .call(() => {
                this.lbMessage.node.active = false;
            })
            .start();

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