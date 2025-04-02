import { _decorator, Component, Node, Animation, AnimationClip } from 'cc';
import { KaraokeConstants } from './KaraokeConstants';
import { AnimationDetails } from '../Data/KaraokeTypes';

const { ccclass, property } = _decorator;

/**
 * Handles character animations for the Karaoke application
 */
@ccclass('KaraokeCharacterAnimator')
export class KaraokeCharacterAnimator extends Component {
    //#region Properties
    @property({ type: Node, tooltip: "Character model node", group: { name: "Character", id: "character" } })
    private characterNode: Node = null;

    @property({ type: Animation, tooltip: "Character animation component", group: { name: "Character", id: "character" } })
    private animationComponent: Animation = null;

    @property({ tooltip: "Transition time between animations in seconds", group: { name: "Animation", id: "animation" } })
    private transitionDuration: number = KaraokeConstants.ANIMATION_TRANSITION_TIME;

    @property({ tooltip: "Name of the idle animation", group: { name: "Animation", id: "animation" } })
    private idleAnimationName: string = KaraokeConstants.ANIMATION_IDLE;

    @property({ tooltip: "Name of the singing animation", group: { name: "Animation", id: "animation" } })
    private singingAnimationName: string = KaraokeConstants.ANIMATION_SINGING;
    //#endregion

    //#region State
    private currentAnimation: string = '';
    private isTransitioning: boolean = false;
    private availableAnimations: Set<string> = new Set();
    //#endregion

    //#region Lifecycle Methods
    onLoad() {
        // Initialize animations
        this.initializeAnimations();
    }

    start() {
        // Play idle animation by default
        this.playAnimation(this.idleAnimationName);
    }

    onDestroy() {
        // Clean up any resources
    }
    //#endregion

    //#region Initialization
    private initializeAnimations(): void {
        if (!this.animationComponent) {
            console.error('Animation component not found');
            return;
        }

        // Get all animation clips from the component
        const clips = this.animationComponent.clips;
        
        // Store animation names in set for quick access
        clips.forEach(clip => {
            if (clip) {
                this.availableAnimations.add(clip.name);
            }
        });

        // Log available animations
        console.log(`Initialized ${clips.length} animations for character`);
    }
    //#endregion

    //#region Animation Control
    /**
     * Play idle animation
     */
    public playIdle(): void {
        this.playAnimation(this.idleAnimationName);
    }

    /**
     * Play singing animation
     */
    public playSinging(): void {
        this.playAnimation(this.singingAnimationName);
    }

    /**
     * Play an animation by name with smooth transition
     * @param animationName Name of the animation to play
     * @param details Optional animation details
     */
    public playAnimation(animationName: string, details?: AnimationDetails): void {
        if (!this.animationComponent) return;
        
        // Skip if the same animation is already playing
        if (this.currentAnimation === animationName && !this.isTransitioning) return;
        // Store current animation
        this.currentAnimation = animationName;
        
        // Get or configure transition time
        const transitionTime = details?.transitionTime ?? this.transitionDuration;
        
        // Begin transition
        this.isTransitioning = true;
        
        // Check if animation exists first
        if (!this.hasAnimation(animationName)) {
            console.warn(`Animation '${animationName}' not found`);
            this.isTransitioning = false;
            return;
        }
        
        // Play animation with crossfade
        this.animationComponent.crossFade(animationName, transitionTime);
        
        // Set animation loop mode if needed
        const loop = details?.loop !== false;
        if (loop) {
            // Play the animation with loop option
            // Note: We simply call crossFade again which already handles looping in Cocos
            this.animationComponent.crossFade(animationName, transitionTime);
        }
        
        
        // Reset transition flag after transition completes
        setTimeout(() => {
            this.isTransitioning = false;
        }, transitionTime * 1000);
    }

    /**
     * Stop all animations
     */
    public stopAllAnimations(): void {
        if (!this.animationComponent) return;
        
        this.animationComponent.stop();
        this.currentAnimation = '';
        this.isTransitioning = false;
    }
    //#endregion

    //#region Utility Methods
    /**
     * Check if an animation exists
     * @param animationName Name of animation to check
     */
    public hasAnimation(animationName: string): boolean {
        return this.availableAnimations.has(animationName);
    }

    /**
     * Get the name of the currently playing animation
     */
    public getCurrentAnimation(): string {
        return this.currentAnimation;
    }

    /**
     * Check if an animation is currently playing
     * @param animationName Name of animation to check
     */
    public isAnimationPlaying(animationName: string): boolean {
        return this.currentAnimation === animationName && !this.isTransitioning;
    }
    //#endregion
} 