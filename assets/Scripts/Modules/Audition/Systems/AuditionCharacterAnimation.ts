import { _decorator, Component, Node, Animation, Prefab, SkeletalAnimation, instantiate, AnimationClip } from 'cc';
import { AuditionAccuracyRating } from './AuditionBeatSystem';
import { AuditionCharacterAnimationData, SpecialStateType, DanceAnimationState } from './AuditionCharacterAnimationData';
import { resourceUtil } from '../../../Common/resourceUtil';
import { Character } from '../../Character/Character';
import { UserManager } from '../../../Managers/UserManager';
import { CharacterAnimationUtils } from '../../GameCommon/CharacterAnimationUtils';
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
    @property(Character)
    private character: Character = null;

    // Animation configuration
    @property
    private transitionDuration: number = 0.2; // Duration for animation transitions

    @property
    private comboThreshold: number = 10; // Combo count to trigger combo animation

    @property
    private inputHistorySize: number = 20; // Number of recent inputs to track

    // Current state
    private currentCombo: number = 0;
    private inputHistory: InputRecord[] = [];
    private isMale: boolean = true; // Default to male, should be set based on character selection
    private animMap: Map<string, AnimationClip> = new Map();
    private animNames: string[] = [];
    private allDanceStates: DanceAnimationState[] = [];
    private currentDanceIndex: number = 0;
    private musicSpeed: number = 1.0; // Speed multiplier based on music BPM

    public loadDanceData(songId: string) {

        return new Promise((resolve, reject) => {
            
            // Initialize animation controller if not set
            // Initialize dance move data
            AuditionCharacterAnimationData.initialize();
            const songDance = songId + '_Dance';
            Promise.all([
                this.character.init(null, UserManager.instance.characterId),
                AuditionCharacterAnimationData.loadDanceData(songDance),
            ])
                .then(() => {
                    // Get all animation names from the loaded dance data
                    this.animNames = AuditionCharacterAnimationData.getAllAnimationNames();
                    // Log all animation names that will be loaded
                    console.log("Animation names to be loaded:");
                    this.animNames.forEach((animName, index) => {
                        console.log(`${index + 1}. ${animName}`);
                    });
                    console.log(`Loading ${this.animNames.length} dance animations for song: ${songId}`);
                    // Load all animations for this dance
                    return CharacterAnimationUtils.getInstance().loadMultipleAnimations(this.animNames);
                })
                .then((clips) => {
                    console.log(`Successfully loaded ${clips.length} dance animations`);
                    this.setClips(clips, this.animNames);
                    this.allDanceStates = AuditionCharacterAnimationData.getAllDanceStates();
                    this.currentDanceIndex = -1;
                    this.playSpecialAnimation(SpecialStateType.FIRST_STAND);
                    resolve("success");
                }).catch((error) => {
                    console.error(`Failed to load dance: ${error}`);
                    reject(error);
                });;
        });
    }

    private setClips(clips: AnimationClip[], animNames: string[]) {
        for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            const animName = animNames[i];
            this.character.createState(clip, animName);
        }
    }

    /**
     * Set character gender
     * @param isMale Whether the character is male
     */
    public setGender(isMale: boolean): void {
        this.isMale = isMale;
    }

    /**
     * React to player input with appropriate animation
     * @param accuracyRating Accuracy rating of the hit
     * @param combo Current combo
     */
    public reactToInput(accuracyRating: AuditionAccuracyRating, combo: number): void {
        console.log(`reactToInput: ${accuracyRating} ${combo}`);
        // Update combo count
        this.currentCombo = combo;

        // Record input for sequence detection
        this.recordInput(accuracyRating);

        // Handle miss animation if accuracy is poor
        if (accuracyRating === AuditionAccuracyRating.MISS) {
            this.playMissAnimation();
            this.nextDanceState();
            return;
        }

        // Continue with regular dance sequence
        this.playNextDanceState();
    }

    private nextDanceState() {
        this.currentDanceIndex = ++this.currentDanceIndex % this.allDanceStates.length;
    }

    /**
     * Play the next dance state in sequence
     */
    private playNextDanceState(): void {
        this.nextDanceState();
        const currentStateName = this.allDanceStates[this.currentDanceIndex].transitions[0].srcState;
        this.playAnimation(currentStateName, this.allDanceStates[this.currentDanceIndex], 1.0);
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

        this.playAnimation(state.motion, state, state.speed, callback);
    }

    /**
     * Play a miss animation
     */
    private playMissAnimation(): void {
        const state = AuditionCharacterAnimationData.getSpecialState(SpecialStateType.MISS);
        // TODO: Implement miss animation logic
        // This should play a brief "miss" animation and then return to the current dance state
        this.playAnimation(state.motion, state, state.speed);
    }

    /**
     * Set the music speed multiplier based on BPM
     * @param bpm The current music BPM
     */
    public setMusicSpeed(bpm: number): void {
        // Assuming standard BPM is 120, adjust speed accordingly
        this.musicSpeed = bpm / 100.0;
    }

    /**
     * Play an animation with optional speed and callback
     */
    private playAnimation(animationName: string, danceState: DanceAnimationState, speed: number = 1.0, callback?: () => void): void {
        if (!this.character) return;

        const state = this.character.getState(animationName);
        if (!state) {
            console.error(`Animation state not found: ${animationName}`);
            return;
        }

        // Apply both the dance state speed and music speed
        state.speed = speed * this.musicSpeed;
        // Get the dance state to determine exit time for blending
        if (danceState && danceState.transitions && danceState.transitions.length > 0) {
            // Use the exit time from the first transition as blend time
            const exitTime = danceState.transitions[0].exitTime || 0.95;
            this.character.playAnimation(animationName, exitTime);
            // state.play();
        } else {
            // Default play without blend time if no transition data
            this.character.playAnimation(animationName, 0.3);
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
     * Reset to idle animation
     */
    public resetToIdle(): void {
        this.currentCombo = 0;
        this.inputHistory = [];
        this.playSpecialAnimation(SpecialStateType.FIRST_STAND);
    }
} 