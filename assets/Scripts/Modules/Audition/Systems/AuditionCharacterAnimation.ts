import { _decorator, Component, Node, Animation, AnimationState, Enum, Skeleton, Prefab, SkeletalAnimation, instantiate, AnimationClip } from 'cc';
import { AuditionAccuracyRating } from './AuditionBeatSystem';
import { AuditionCharacterAnimationData, SpecialStateType, AnimationState as DanceState } from './AuditionCharacterAnimationData';
import { AuditionGameManager } from '../Core/AuditionGameManager';
import { resourceUtil } from '../../../Common/resourceUtil';
const { ccclass, property } = _decorator;

/**
 * Input history record used for tracking sequences
 */
interface InputRecord {
    accuracyRating: AuditionAccuracyRating;
    timestamp: number;
}

/**
 * Character Animation System for Audition module
 * Manages character animations based on player performance
 */
@ccclass('AuditionCharacterAnimation')
export class AuditionCharacterAnimation extends Component {
    // Character model/sprite
    @property(Node)
    private character: Node = null;

    // Animation component
    @property(Animation)
    private animationController: Animation = null;

    // Animation configuration
    @property
    private transitionDuration: number = 0.2; // Duration for animation transitions

    @property
    private comboThreshold: number = 10; // Combo count to trigger combo animation

    @property
    private inputHistorySize: number = 20; // Number of recent inputs to track

    // Current state
    private currentAnimation: string = '';
    private currentCombo: number = 0;
    private isPlayingSpecial: boolean = false;
    private inputHistory: InputRecord[] = [];
    private isMale: boolean = true; // Default to male, should be set based on character selection

    public loadDanceData(songId: string) {
        if (!this.animationController && this.character) {
            this.animationController = this.character.getComponent(Animation);
        }
        return new Promise((resolve, reject) => {
            // Initialize animation controller if not set
            // Initialize dance move data
            AuditionCharacterAnimationData.initialize();
            const songDance = songId + '_Dance';
            AuditionCharacterAnimationData.loadDanceData(songDance)
                .then(() => {
                    // Get all animation names from the loaded dance data
                    const animNames = AuditionCharacterAnimationData.getAllAnimationNames();
                    console.log(`Loading ${animNames.length} dance animations for song: ${songId}`);
                    // Load all animations for this dance
                    return this.loadDanceAnims(animNames)
                })
                .then((clips) => {
                    console.log(`Successfully loaded ${clips.length} dance animations`);
                    this.setClips(clips);
                    this.playSpecialAnimation(SpecialStateType.FIRST_STAND);
                    resolve("success");
                }).catch((error) => {
                    console.error(`Failed to load dance: ${error}`);
                    reject(error);
                });;
        });
    }

    private setClips(clips: AnimationClip[]) {
        for (const clip of clips) {
            this.animationController.createState(clip, clip.name);
        }
    }

    public testLoadDanceAnim() {
        this.loadDanceAnim('Breakdance');
    }

    /**
     * Loads multiple dance animations by their names
     * @param animNames Array of animation names to load
     * @returns Promise that resolves with an array of loaded animation clips
     */
    public async loadDanceAnims(animNames: string[]): Promise<AnimationClip[]> {
        const clipPromises: Promise<AnimationClip>[] = [];

        // Create a promise for each animation name
        for (const animName of animNames) {
            clipPromises.push(this.loadDanceAnim(animName));
        }

        try {
            // Wait for all animations to load
            const clips = await Promise.all(clipPromises);
            return clips;
        } catch (error) {
            console.error('Failed to load multiple dance animations:', error);
            throw error;
        }
    }

    // Load prefab with SkeletalAnimation component and play animation
    public async loadDanceAnim(animName: string): Promise<AnimationClip> {
        return new Promise((resolve, reject) => {
            // Load the prefab that contains SkeletalAnimation component
            resourceUtil.loadRes(`audition/anims/${animName}`, Prefab, (err, prefabAsset) => {
                if (err) {
                    console.error('Failed to load character as  nimation prefab:', err);
                    reject(err);
                    return;
                }

                try {
                    // Instantiate the prefab to access its components
                    const prefabNode = instantiate(prefabAsset);

                    // Get the SkeletalAnimation component from the prefab
                    const skeletalAnimation: SkeletalAnimation = prefabNode.getComponent(SkeletalAnimation);

                    if (!skeletalAnimation) {
                        console.error(`No SkeletalAnimation component found in prefab: ${animName}`);
                        this.node.destroy();
                        reject(new Error('Missing SkeletalAnimation component'));
                        return;
                    }

                    // Get animation clips from the skeletal animation
                    const clips = skeletalAnimation.clips;

                    if (!clips || clips.length === 0) {
                        console.error(`No animation clips found in prefab: ${animName}`);
                        this.node.destroy();
                        reject(new Error('No animation clips found'));
                        return;
                    }

                    // Set the clips to our animation controller
                    // if (this.animationController) {
                    //     // Add each clip to the animation controller
                    //     for (const clip of clips) {
                    //         if (clip) {
                    //             // Check if the clip already exists in the controller
                    //             if (!this.animationController.getState(clip.name)) {
                    //                 this.animationController.createState(clip, clip.name);
                    //             }
                    //         }
                    //     }

                    //     // Play the first animation clip
                    //     if (clips[0]) {
                    //         this.animationController.play(clips[0].name);
                    //     }
                    // } else {
                    //     console.error('Animation controller not initialized');
                    //     reject(new Error('Animation controller not initialized'));
                    // }

                    // Destroy the instantiated prefab node as we no longer need it
                    prefabNode.destroy();
                    console.log(`Successfully loaded and setup animation prefab: ${animName}`);
                    resolve(clips[0]);//return to clips index 0
                } catch (error) {
                    console.error('Error processing animation prefab:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Set character gender
     * @param isMale Whether the character is male
     */
    public setGender(isMale: boolean): void {
        this.isMale = isMale;
    }

    /**
     * Start the dance sequence
     */
    public startDanceSequence(): void {
        // Play gender-specific start animation
        const startAnim = this.isMale ? SpecialStateType.BOY_START : SpecialStateType.GIRL_START;
        this.playSpecialAnimation(startAnim, () => {
            // After start animation, transition to dance start
            this.playSpecialAnimation(SpecialStateType.DANCE_START, () => {
                // Start the regular dance sequence
                this.playNextDanceState();
            });
        });
    }

    /**
     * React to player input with appropriate animation
     * @param accuracyRating Accuracy rating of the hit
     * @param combo Current combo
     */
    public reactToInput(accuracyRating: AuditionAccuracyRating, combo: number): void {
        // Update combo count
        this.currentCombo = combo;

        // Record input for sequence detection
        this.recordInput(accuracyRating);

        // If we're in a special animation, don't process input
        if (this.isPlayingSpecial) return;

        // Handle miss animation if accuracy is poor
        if (accuracyRating === AuditionAccuracyRating.MISS) {
            this.playMissAnimation();
            return;
        }

        // Continue with regular dance sequence
        this.playNextDanceState();
    }

    /**
     * Play the next dance state in sequence
     */
    private playNextDanceState(): void {
        const currentState = AuditionCharacterAnimationData.getDanceState(this.currentAnimation);
        if (!currentState) {
            // If no current state, start from default
            const defaultState = AuditionCharacterAnimationData.getDefaultState();
            this.playAnimation(defaultState);
            return;
        }

        // Find next transition
        const nextTransition = currentState.transitions[0];
        if (nextTransition) {
            this.playAnimation(nextTransition.destState);
        }
    }

    /**
     * Play a special animation
     * @param type Special animation type
     * @param callback Optional callback when animation completes
     */
    private playSpecialAnimation(type: SpecialStateType, callback?: () => void): void {
        const state = AuditionCharacterAnimationData.getSpecialState(type);
        if (!state) {
            console.error(`Special animation state not found: ${type}`);
            return;
        }

        this.isPlayingSpecial = true;
        this.playAnimation(state.motion, state.speed, callback);
    }

    /**
     * Play a miss animation
     */
    private playMissAnimation(): void {
        // TODO: Implement miss animation logic
        // This should play a brief "miss" animation and then return to the current dance state
    }

    /**
     * Play an animation with optional speed and callback
     */
    private playAnimation(animationName: string, speed: number = 1.0, callback?: () => void): void {
        if (!this.animationController) return;

        const state = this.animationController.getState(animationName);
        if (!state) {
            console.error(`Animation state not found: ${animationName}`);
            return;
        }

        state.speed = speed;
        // Get the dance state to determine exit time for blending
        const danceState = AuditionCharacterAnimationData.getDanceState(animationName);
        if (danceState && danceState.transitions && danceState.transitions.length > 0) {
            // Use the exit time from the first transition as blend time
            const exitTime = danceState.transitions[0].exitTime || 0.95;
            state.play();
        } else {
            // Default play without blend time if no transition data
            state.play();
        }
        

        if (callback) {
            state.on('finished', callback, this);
        }
    }

    /**
     * Record an input for sequence detection
     */
    private recordInput(accuracyRating: AuditionAccuracyRating): void {
        // Add to history
        this.inputHistory.push({
            accuracyRating: accuracyRating,
            timestamp: Date.now()
        });

        // Limit history size
        if (this.inputHistory.length > this.inputHistorySize) {
            this.inputHistory.shift();
        }
    }

    /**
     * End the dance sequence with appropriate ending animation
     * @param isWinner Whether the player won
     */
    public endDanceSequence(isWinner: boolean): void {
        // Determine which ending animation to play based on gender and result
        let endType: SpecialStateType;
        if (this.isMale) {
            endType = isWinner ? SpecialStateType.END2 : SpecialStateType.END1;
        } else {
            endType = isWinner ? SpecialStateType.END4 : SpecialStateType.END3;
        }

        this.playSpecialAnimation(endType, () => {
            // After ending animation, transition to last stand
            this.playSpecialAnimation(SpecialStateType.LAST_STAND);
        });
    }

    /**
     * Check if a special animation is currently playing
     */
    public isPlayingSpecialAnimation(): boolean {
        return this.isPlayingSpecial;
    }

    /**
     * Get the current animation name
     */
    public getCurrentAnimation(): string {
        return this.currentAnimation;
    }

    /**
     * Reset to idle animation
     */
    public resetToIdle(): void {
        this.currentCombo = 0;
        this.isPlayingSpecial = false;
        this.inputHistory = [];
        this.playSpecialAnimation(SpecialStateType.FIRST_STAND);
    }
} 