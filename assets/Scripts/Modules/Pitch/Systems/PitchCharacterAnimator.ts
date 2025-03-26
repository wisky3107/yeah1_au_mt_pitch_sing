import { _decorator, Component, Node, Animation, SkeletalAnimation, AnimationClip, resources } from 'cc';
import { PitchConstants, MusicalNote, PitchAccuracy } from './PitchConstants';
import { resourceUtil } from '../../../Common/resourceUtil';
const { ccclass, property } = _decorator;

/**
 * Character Animator for the Pitch Detection Game
 * Controls the 3D character's animations based on detected notes
 */
@ccclass('PitchCharacterAnimator')
export class PitchCharacterAnimator extends Component {
    // Character model
    @property(Node)
    private characterNode: Node = null;
    
    // Animation component
    @property(Animation)
    private animationComponent: Animation = null;
    
    @property(SkeletalAnimation)
    private skeletalAnimation: SkeletalAnimation = null;
    
    // Animation properties
    @property
    private transitionDuration: number = 0.3; // Duration for animation transitions
    
    // Current state
    private currentNote: MusicalNote = null;
    private isAnimating: boolean = false;
    private animationClips: Map<MusicalNote, AnimationClip> = new Map();
    private idleAnimationClip: AnimationClip = null;
    
    // Animation names
    private readonly IDLE_ANIMATION: string = 'Idle';
    
    onLoad() {
        // Initialize animation component if not set
        if (!this.animationComponent && this.characterNode) {
            this.animationComponent = this.characterNode.getComponent(Animation);
        }
        
        if (!this.skeletalAnimation && this.characterNode) {
            this.skeletalAnimation = this.characterNode.getComponent(SkeletalAnimation);
        }
    }
    
    start() {
        // Load animation clips
        this.loadAnimationClips();
    }
    
    /**
     * Load animation clips for each note
     */
    private loadAnimationClips(): void {
        // Load idle animation
        resourceUtil.loadRes(`pitch/animations/${this.IDLE_ANIMATION}`, AnimationClip, (err, clip) => {
            if (err) {
                console.error(`Failed to load idle animation: ${err}`);
                return;
            }
            
            this.idleAnimationClip = clip;
            this.registerAnimationClip(this.IDLE_ANIMATION, clip);
            console.log('Idle animation loaded');
            
            // Play idle animation initially
            this.playIdleAnimation();
        });
        
        // Load note animations
        for (let i = 0; i < 7; i++) {
            const note = i as MusicalNote;
            const animationName = PitchConstants.NOTE_ANIMATIONS[note];
            
            resourceUtil.loadRes(`pitch/animations/${animationName}`, AnimationClip, (err, clip) => {
                if (err) {
                    console.error(`Failed to load animation for note ${PitchConstants.NOTE_NAMES[note]}: ${err}`);
                    return;
                }
                
                this.animationClips.set(note, clip);
                this.registerAnimationClip(animationName, clip);
                console.log(`Animation for note ${PitchConstants.NOTE_NAMES[note]} loaded`);
            });
        }
    }
    
    /**
     * Register an animation clip with the animation component
     * @param name Animation name
     * @param clip Animation clip
     */
    private registerAnimationClip(name: string, clip: AnimationClip): void {
        if (!this.animationComponent) return;
        
        // Check if the animation state already exists
        if (!this.animationComponent.getState(name)) {
            this.animationComponent.createState(clip, name);
        }
    }
    
    /**
     * Play animation for a specific note
     * @param note Musical note
     * @param accuracy Detection accuracy
     */
    public playNoteAnimation(note: MusicalNote, accuracy: PitchAccuracy): void {
        if (!this.animationComponent || note === null) return;
        
        const animationName = PitchConstants.NOTE_ANIMATIONS[note];
        const animationState = this.animationComponent.getState(animationName);
        
        if (!animationState) {
            console.warn(`Animation state not found for note ${PitchConstants.NOTE_NAMES[note]}`);
            return;
        }
        
        // Skip if already playing this note animation
        if (this.currentNote === note && this.isAnimating) return;
        
        this.currentNote = note;
        this.isAnimating = true;
        
        // Play animation with crossfade
        this.animationComponent.crossFade(animationName, this.transitionDuration);
        
        console.log(`Playing animation for note ${PitchConstants.NOTE_NAMES[note]}`);
        
        // Set up callback to return to idle when animation completes
        animationState.once('finished', () => {
            this.isAnimating = false;
            this.playIdleAnimation();
        });
    }
    
    /**
     * Play idle animation
     */
    public playIdleAnimation(): void {
        if (!this.animationComponent) return;
        
        const animationState = this.animationComponent.getState(this.IDLE_ANIMATION);
        
        if (!animationState) {
            console.warn('Idle animation state not found');
            return;
        }
        
        this.currentNote = null;
        this.isAnimating = false;
        
        // Play idle animation with crossfade
        this.animationComponent.crossFade(this.IDLE_ANIMATION, this.transitionDuration);
        
        console.log('Playing idle animation');
    }
    
    /**
     * Play a special animation (e.g., for game start/end)
     * @param animationName Animation name
     * @param loop Whether to loop the animation
     * @param callback Callback function when animation completes
     */
    public playSpecialAnimation(animationName: string, loop: boolean = false, callback?: () => void): void {
        if (!this.animationComponent) return;
        
        resourceUtil.loadRes(`pitch/animations/${animationName}`, AnimationClip, (err, clip) => {
            if (err) {
                console.error(`Failed to load special animation ${animationName}: ${err}`);
                return;
            }
            
            this.registerAnimationClip(animationName, clip);
            
            const animationState = this.animationComponent.getState(animationName);
            
            if (!animationState) {
                console.warn(`Special animation state not found: ${animationName}`);
                return;
            }
            
            this.currentNote = null;
            this.isAnimating = true;
            
            // Set loop property
            animationState.wrapMode = loop ? 2 : 1; // 1 = Normal, 2 = Loop
            
            // Play animation with crossfade
            this.animationComponent.crossFade(animationName, this.transitionDuration);
            
            console.log(`Playing special animation: ${animationName}`);
            
            // Set up callback when animation completes
            if (!loop && callback) {
                animationState.once('finished', callback);
            }
        });
    }
    
    /**
     * Stop all animations and return to idle
     */
    public stopAllAnimations(): void {
        if (!this.animationComponent) return;
        
        this.animationComponent.stop();
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
