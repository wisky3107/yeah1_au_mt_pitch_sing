import { _decorator, Component, Node, Animation, AnimationClip } from 'cc';
import { KaraokeConstants } from './KaraokeConstants';
import { AnimationDetails } from '../Data/KaraokeTypes';
import { Character } from '../../Character/Character';
import { UserManager } from '../../../Managers/UserManager';
import { CharacterAnimationUtils } from '../../GameCommon/CharacterAnimationUtils';

const { ccclass, property } = _decorator;

/**
 * Handles character animations for the Karaoke application
 */
@ccclass('KaraokeCharacterAnimator')
export class KaraokeCharacterAnimator extends Component {
    //#region Properties
    @property({ type: Character, tooltip: "Character model node", group: { name: "Character", id: "character" } })
    private character: Character = null;

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
    //#endregion

    //#region Lifecycle Methods
    onLoad() {
        // Initialize animations
        this.initialize();
    }

    start() {
        // Play idle animation by default
    }

    onDestroy() {
        // Clean up any resources
    }
    //#endregion

    //#region Initialization
    private initialize(): void {
        if (!this.character) {
            console.error('Animation component not found');
            return;
        }

        this.character
            .init(null, UserManager.instance.characterId)
            .then(() => CharacterAnimationUtils.getInstance().loadMultipleAnimations([this.idleAnimationName, this.singingAnimationName]))
            .then((clips) => CharacterAnimationUtils.getInstance().applyAnimationsToCharacter(this.character, clips))
            .then(() => {
                // Log available animations
                console.log(`Initialized animations for character`);
                this.playAnimation(this.idleAnimationName);
            })
            .catch((error) => {
                console.error(`Failed to initialize character animations: ${error}`);
            });

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
        if (!this.character) return;

        // Skip if the same animation is already playing
        if (this.currentAnimation === animationName && !this.isTransitioning) return;
        // Store current animation
        this.currentAnimation = animationName;

        // Get or configure transition time
        const transitionTime = details?.transitionTime ?? this.transitionDuration;

        // Begin transition
        this.isTransitioning = true;

        // Play animation with crossfade
        this.character.playAnimation(animationName, transitionTime);

        // Set animation loop mode if needed
        const loop = details?.loop !== false;
        if (loop) {
            // Play the animation with loop option
            // Note: We simply call crossFade again which already handles looping in Cocos
            this.character.playAnimation(animationName, transitionTime);
        }


        // Reset transition flag after transition completes
        setTimeout(() => {
            this.isTransitioning = false;
        }, transitionTime * 1000);
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