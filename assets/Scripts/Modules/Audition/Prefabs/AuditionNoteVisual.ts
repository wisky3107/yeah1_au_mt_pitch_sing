import { _decorator, Component, Node, Sprite, Color, Tween, tween, Vec3, UIOpacity, Label, director } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Visual component for Audition Note prefabs
 * Handles visual appearance, effects, and animations for notes
 */
@ccclass('AuditionNoteVisual')
export class AuditionNoteVisual extends Component {
    // Visual components
    @property(Sprite)
    public noteSprite: Sprite = null;

    @property(Sprite)
    public glowSprite: Sprite = null;

    @property(UIOpacity)
    public opacity: UIOpacity = null;

    // Visual configuration
    @property
    private pulseSpeed: number = 1.0;

    @property
    private pulseIntensity: number = 0.2;

    // Colors for different note types
    @property(Color)
    private leftNoteColor: Color = new Color(79, 195, 247); // Light blue

    @property(Color)
    private rightNoteColor: Color = new Color(255, 112, 67); // Coral red

    // Colors for accuracy feedback
    @property(Color)
    private perfectColor: Color = new Color(120, 255, 120); // Bright green

    @property(Color)
    private goodColor: Color = new Color(255, 193, 7); // Amber

    @property(Color)
    private missColor: Color = new Color(211, 47, 47); // Red

    // Animation settings
    private hitAnimDuration: number = 0.2;
    private missAnimDuration: number = 0.4;
    private appearAnimDuration: number = 0.05;

    // State
    private activeTweens: Tween<any>[] = [];
    private originalScale: Vec3 = new Vec3(1, 1, 1);
    private isHit: boolean = false;

    onLoad() {
        // Store original scale
        if (this.node) {
            this.originalScale = this.node.getScale().clone();
        }

        // Set opacity component if not set
        if (!this.opacity) {
            this.opacity = this.getComponent(UIOpacity);
            if (!this.opacity) {
                this.opacity = this.addComponent(UIOpacity);
            }
        }
    }

    /**
     * Initialize the note's appearance based on type
     * @param type Note type
     */
    public initialize(): void {
        this.isHit = false;

        // Reset transforms
        this.node.setScale(this.originalScale);
        this.node.setRotation(0, 0, 0, 1);

        // Set opacity to full
        if (this.opacity) {
            this.opacity.opacity = 255;
        }

        // Play appear animation
        // this.playAppearAnimation();
    }

    /**
     * Play animation for when note appears
     */
    private playAppearAnimation(): void {
        if (!this.node) return;

        // Stop any existing animations
        this.stopAllTweens();

        // Reset scale
        this.node.setScale(0, 0, 1);

        // Animate scale and opacity
        const appearTween = tween(this.node)
            .to(this.appearAnimDuration, { scale: this.originalScale }, { easing: 'backOut' })
            .call(() => {
                this.startPulseAnimation();
            })
            .start();

        this.activeTweens.push(appearTween);
    }

    /**
     * Start the idle pulse animation
     */
    private startPulseAnimation(): void {
        if (!this.node || this.isHit) return;

        // Stop any existing animations
        this.stopAllTweens();

        // Create pulse animation
        const pulseTween = tween(this.node)
            .to(this.pulseSpeed / 2, {
                scale: new Vec3(
                    this.originalScale.x * (1 + this.pulseIntensity),
                    this.originalScale.y * (1 + this.pulseIntensity),
                    this.originalScale.z
                )
            }, { easing: 'sineInOut' })
            .to(this.pulseSpeed / 2, { scale: this.originalScale }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();

        this.activeTweens.push(pulseTween);
    }

    private stopAllTweens(): void {
        this.activeTweens.forEach(tween => tween.stop());
        this.activeTweens = [];
    }

    /**
     * Show hit effect based on accuracy
     * @param accuracyRating Accuracy rating of the hit
     */
    public showHitEffect(): void {
        if (!this.node) return;

        this.isHit = true;

        // Stop any existing animations
        this.stopAllTweens();

        // Play hit animation
        const targetScale = new Vec3(
            this.originalScale.x * 1.5,
            this.originalScale.y * 1.5,
            this.originalScale.z
        );

        const hitTween = tween(this.node)
            .to(this.hitAnimDuration / 3, { scale: targetScale }, { easing: 'quadOut' })
            .to(this.hitAnimDuration * 2 / 3, { scale: this.originalScale }, { easing: 'quadIn' })
            .start();

        this.activeTweens.push(hitTween);

        // Also animate opacity
        if (this.opacity) {
            const opacityTween = tween(this.opacity)
                .to(this.hitAnimDuration, { opacity: 50 })
                .start();

            this.activeTweens.push(opacityTween);
        }
    }

    /**
     * Show miss effect
     */
    public showMissEffect(): void {
        if (!this.node) return;

        this.isHit = true;

        // Stop any existing animations
        this.stopAllTweens();

        // Apply miss color to glow
        if (this.glowSprite) {
            this.glowSprite.color = this.missColor;
            this.glowSprite.node.active = true;
        }

        // Play miss animation - fade and move down slightly
        const endPosition = new Vec3(
            this.node.position.x,
            this.node.position.y - 50,
            this.node.position.z
        );

        const missTween = tween(this.node)
            .to(this.missAnimDuration, {
                position: endPosition,
                scale: new Vec3(
                    this.originalScale.x * 0.7,
                    this.originalScale.y * 0.7,
                    this.originalScale.z
                ),
            }, { easing: 'quadIn' })
            .call(() => {
                // Hide note after animation
                this.node.active = false;
            })
            .start();

        this.activeTweens.push(missTween);

        // Also animate opacity
        if (this.opacity) {
            const opacityTween = tween(this.opacity)
                .to(this.missAnimDuration, { opacity: 0 })
                .start();

            this.activeTweens.push(opacityTween);
        }
    }

    /**
     * Reset the note to its initial state
     */
    public reset(): void {
        // Stop any active animations
        this.stopAllTweens();

        // Reset transforms
        this.node.setScale(this.originalScale);
        this.node.setRotation(0, 0, 0, 1);

        // Reset opacity
        if (this.opacity) {
            this.opacity.opacity = 255;
        }

        // Reset glow
        if (this.glowSprite) {
            this.glowSprite.node.active = false;
        }

        this.isHit = false;
    }
} 