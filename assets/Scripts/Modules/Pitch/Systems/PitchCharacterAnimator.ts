import { _decorator, Component, Node } from 'cc';
import { PitchConstants, MusicalNote, PitchAccuracy } from './PitchConstants';
import { Character } from '../../Character/Character';
import { UserManager } from '../../../Managers/UserManager';
import { CharacterAnimationUtils } from '../../GameCommon/CharacterAnimationUtils';

const { ccclass, property } = _decorator;

/**
 * Character Animator for the Pitch Detection Game
 * Controls the 3D character's animations based on detected notes
 */
@ccclass('PitchCharacterAnimator')
export class PitchCharacterAnimator extends Component {
    @property({ type: Character, tooltip: "Character component", group: { name: "Character", id: "character" } })
    private character: Character = null;

    @property({ tooltip: "Transition time between animations in seconds", group: { name: "Animation", id: "animation" } })
    private transitionDuration: number = 0.3;

    @property({ tooltip: "Name of the idle animation", group: { name: "Animation", id: "animation" } })
    private idleAnimationName: string = "idle";

    // Current state
    private currentNote: MusicalNote = null;
    private isAnimating: boolean = false;
    private isInitialized: boolean = false;

    onLoad() {
        this.initialize();
    }

    /**
     * Initialize the character and load animations
     */
    private async initialize(): Promise<void> {
        if (!this.character) {
            console.error('Character component not found');
            return;
        }

        try {
            // Initialize character with user's selected character
            await this.character.init(null, UserManager.instance.characterId);

            // Get all animation names
            const animationNames = [
                this.idleAnimationName,
                ...Object.keys(PitchConstants.NOTE_ANIMATIONS).map(key => PitchConstants.NOTE_ANIMATIONS[key as unknown as MusicalNote])
            ];

            // Load all animations
            const clips = await CharacterAnimationUtils.getInstance().loadMultipleAnimations(animationNames);
            
            // Apply animations to character
            await CharacterAnimationUtils.getInstance().applyAnimationsToCharacter(this.character, clips);

            this.isInitialized = true;
            console.log('Pitch character animations initialized');

            // Play idle animation initially
            this.playIdleAnimation();
        } catch (error) {
            console.error('Failed to initialize pitch character animations:', error);
        }
    }

    /**
     * Play animation for a specific note
     * @param note Musical note
     * @param accuracy Detection accuracy
     */
    public playNoteAnimation(note: MusicalNote, accuracy: PitchAccuracy): void {
        if (!this.isInitialized || !this.character) return;

        const animationName = PitchConstants.NOTE_ANIMATIONS[note];
        if (!animationName) {
            console.warn(`Animation not found for note ${PitchConstants.NOTE_NAMES[note]}`);
            return;
        }

        // Skip if already playing this note animation
        if (this.currentNote === note && this.isAnimating) return;

        this.currentNote = note;
        this.isAnimating = true;

        // Play animation with crossfade
        this.character.playAnimation(animationName, this.transitionDuration);

        console.log(`Playing animation for note ${PitchConstants.NOTE_NAMES[note]}`);

        // Get animation state to handle completion
        const state = this.character.getState(animationName);
        if (state) {
            state.once('finished', () => {
                this.isAnimating = false;
                this.playIdleAnimation();
            });
        }
    }

    /**
     * Play idle animation
     */
    public playIdleAnimation(): void {
        if (!this.isInitialized || !this.character) return;

        this.currentNote = null;
        this.isAnimating = false;

        // Play idle animation with crossfade
        this.character.playAnimation(this.idleAnimationName, this.transitionDuration);

        console.log('Playing idle animation');
    }

    /**
     * Play a special animation (e.g., for game start/end)
     * @param animationName Animation name
     * @param loop Whether to loop the animation
     * @param callback Callback function when animation completes
     */
    public async playSpecialAnimation(animationName: string, loop: boolean = false, callback?: () => void): Promise<void> {
        if (!this.isInitialized || !this.character) return;

        try {
            // Load the special animation
            const clip = await CharacterAnimationUtils.getInstance().loadAnimationClip(animationName);
            
            // Apply the animation to the character
            await CharacterAnimationUtils.getInstance().applyAnimationsToCharacter(this.character, [clip]);

            this.currentNote = null;
            this.isAnimating = true;

            // Play the animation
            this.character.playAnimation(animationName, this.transitionDuration);

            console.log(`Playing special animation: ${animationName}`);

            // Handle animation completion
            const state = this.character.getState(animationName);
            if (state && !loop) {
                state.once('finished', () => {
                    this.isAnimating = false;
                    if (callback) callback();
                    this.playIdleAnimation();
                });
            }
        } catch (error) {
            console.error(`Failed to play special animation ${animationName}:`, error);
            this.playIdleAnimation();
        }
    }

    /**
     * Stop all animations and return to idle
     */
    public stopAllAnimations(): void {
        if (!this.isInitialized || !this.character) return;

        this.isAnimating = false;
        this.currentNote = null;
        this.playIdleAnimation();

        console.log('All animations stopped');
    }

    /**
     * Check if an animation is currently playing
     * @returns True if an animation is playing
     */
    public isAnimationPlaying(): boolean {
        return this.isAnimating;
    }

    /**
     * Get the current note being animated
     * @returns Current note or null if idle
     */
    public getCurrentNote(): MusicalNote | null {
        return this.currentNote;
    }
}
