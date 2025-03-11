import { _decorator, Component, Node, Sprite, Color, Tween, tween, Vec3, UIOpacity, Label } from 'cc';
import { AuditionNoteType } from '../Systems/AuditionNotePool';
import { AuditionAccuracyRating } from '../Systems/AuditionBeatSystem';
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
    
    @property(Label)
    public keyLabel: Label = null;
    
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
    
    @property(Color)
    private spaceNoteColor: Color = new Color(255, 235, 59); // Yellow
    
    // Colors for accuracy feedback
    @property(Color)
    private perfectColor: Color = new Color(120, 255, 120); // Bright green
    
    @property(Color)
    private goodColor: Color = new Color(255, 193, 7); // Amber
    
    @property(Color)
    private missColor: Color = new Color(211, 47, 47); // Red
    
    // Animation settings
    @property
    private hitAnimDuration: number = 0.3;
    
    @property
    private missAnimDuration: number = 0.4;
    
    @property
    private appearAnimDuration: number = 0.2;
    
    // State
    private noteType: AuditionNoteType = AuditionNoteType.LEFT;
    private activeTween: Tween<any> = null;
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
    
    start() {
        // Start pulse animation
        this.startPulseAnimation();
    }
    
    /**
     * Initialize the note's appearance based on type
     * @param type Note type
     */
    public initialize(type: AuditionNoteType): void {
        this.noteType = type;
        this.isHit = false;
        
        // Reset transforms
        this.node.setScale(this.originalScale);
        this.node.setRotation(0, 0, 0, 1);
        
        // Set opacity to full
        if (this.opacity) {
            this.opacity.opacity = 255;
        }
        
        // Apply color based on note type
        if (this.noteSprite) {
            switch (type) {
                case AuditionNoteType.LEFT:
                    this.noteSprite.color = this.leftNoteColor;
                    if (this.keyLabel) this.keyLabel.string = '←';
                    break;
                case AuditionNoteType.RIGHT:
                    this.noteSprite.color = this.rightNoteColor;
                    if (this.keyLabel) this.keyLabel.string = '→';
                    break;
                case AuditionNoteType.SPACE:
                    this.noteSprite.color = this.spaceNoteColor;
                    if (this.keyLabel) this.keyLabel.string = '↑';
                    break;
            }
        }
        
        // Play appear animation
        this.playAppearAnimation();
    }
    
    /**
     * Play animation for when note appears
     */
    private playAppearAnimation(): void {
        if (!this.node) return;
        
        // Stop any existing animations
        if (this.activeTween) {
            this.activeTween.stop();
        }
        
        // Reset scale
        this.node.setScale(0, 0, 1);
        
        // Animate scale and opacity
        this.activeTween = tween(this.node)
            .to(this.appearAnimDuration, { scale: this.originalScale }, { easing: 'backOut' })
            .call(() => {
                this.startPulseAnimation();
            })
            .start();
    }
    
    /**
     * Start the idle pulse animation
     */
    private startPulseAnimation(): void {
        if (!this.node || this.isHit) return;
        
        // Stop any existing animations
        if (this.activeTween) {
            this.activeTween.stop();
        }
        
        // Create pulse animation
        this.activeTween = tween(this.node)
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
    }
    
    /**
     * Show hit effect based on accuracy
     * @param accuracyRating Accuracy rating of the hit
     */
    public showHitEffect(accuracyRating: AuditionAccuracyRating): void {
        if (!this.node) return;
        
        this.isHit = true;
        
        // Stop any existing animations
        if (this.activeTween) {
            this.activeTween.stop();
        }
        
        // Set color based on accuracy
        let hitColor: Color;
        switch (accuracyRating) {
            case AuditionAccuracyRating.PERFECT:
                hitColor = this.perfectColor;
                break;
            case AuditionAccuracyRating.GOOD:
                hitColor = this.goodColor;
                break;
            default:
                hitColor = this.missColor;
        }
        
        // Apply hit color to glow
        if (this.glowSprite) {
            this.glowSprite.color = hitColor;
            this.glowSprite.node.active = true;
        }
        
        // Play hit animation
        const targetScale = new Vec3(
            this.originalScale.x * 1.5,
            this.originalScale.y * 1.5,
            this.originalScale.z
        );
        
        this.activeTween = tween(this.node)
            .to(this.hitAnimDuration / 3, { scale: targetScale }, { easing: 'quadOut' })
            .to(this.hitAnimDuration * 2/3, { scale: new Vec3(0, 0, 1) }, { easing: 'quadIn' })
            .call(() => {
                // Hide note after animation
                this.node.active = false;
            })
            .start();
        
        // Also animate opacity
        if (this.opacity) {
            tween(this.opacity)
                .to(this.hitAnimDuration, { opacity: 0 })
                .start();
        }
    }
    
    /**
     * Show miss effect
     */
    public showMissEffect(): void {
        if (!this.node) return;
        
        this.isHit = true;
        
        // Stop any existing animations
        if (this.activeTween) {
            this.activeTween.stop();
        }
        
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
        
        this.activeTween = tween(this.node)
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
        
        // Also animate opacity
        if (this.opacity) {
            tween(this.opacity)
                .to(this.missAnimDuration, { opacity: 0 })
                .start();
        }
    }
    
    /**
     * Reset the note to its initial state
     */
    public reset(): void {
        // Stop any active animations
        if (this.activeTween) {
            this.activeTween.stop();
            this.activeTween = null;
        }
        
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