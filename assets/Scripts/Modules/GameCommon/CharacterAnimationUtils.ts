import { _decorator, AnimationClip, Prefab, instantiate, SkeletalAnimation } from 'cc';
import { resourceUtil } from '../../Common/resourceUtil';
import { Character } from '../Character/Character';

/**
 * Utility class for handling character animations
 */
export class CharacterAnimationUtils {
    private static instance: CharacterAnimationUtils = null;
    private animationCache: Map<string, AnimationClip> = new Map();

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): CharacterAnimationUtils {
        if (!CharacterAnimationUtils.instance) {
            CharacterAnimationUtils.instance = new CharacterAnimationUtils();
        }
        return CharacterAnimationUtils.instance;
    }

    /**
     * Load an animation clip by name
     * @param animName Name of the animation to load
     * @returns Promise resolving to the loaded AnimationClip
     */
    public async loadAnimationClip(animName: string): Promise<AnimationClip> {
        // Check cache first
        if (this.animationCache.has(animName)) {
            return this.animationCache.get(animName);
        }

        return new Promise((resolve, reject) => {
            resourceUtil.loadRes(`animations/${animName}`, Prefab, (err, prefabAsset) => {
                if (err) {
                    console.error('Failed to load animation prefab:', animName);
                    reject(err);
                    return;
                }

                try {
                    const prefabNode = instantiate(prefabAsset);
                    const skeletalAnimation = prefabNode.getComponent(SkeletalAnimation);

                    if (!skeletalAnimation || !skeletalAnimation.clips.length) {
                        prefabNode.destroy();
                        reject(new Error(`No valid animation found in prefab: ${animName}`));
                        return;
                    }

                    const clip = skeletalAnimation.clips[0];
                    clip.name = animName;

                    // Cache the clip
                    this.animationCache.set(animName, clip);

                    prefabNode.destroy();
                    resolve(clip);
                } catch (error) {
                    console.error('Error processing animation prefab:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Load multiple animation clips
     * @param animNames Array of animation names to load
     * @returns Promise resolving to array of loaded AnimationClips
     */
    public async loadMultipleAnimations(animNames: string[]): Promise<AnimationClip[]> {
        const promises = animNames.map(name => this.loadAnimationClip(name));
        return Promise.all(promises);
    }

    /**
     * Apply animations to a character
     * @param character Target character
     * @param animClips Animation clips to apply
     */
    public async applyAnimationsToCharacter(character: Character, animClips: AnimationClip[]): Promise<void> {
        if (!character || !character.getSkeletalAnimation()) {
            throw new Error('Invalid character or missing SkeletalAnimation component');
        }

        for (const clip of animClips) {
            character.createState(clip, clip.name);
        }
    }

    /**
     * Play an animation on a character with crossfade
     * @param character Target character
     * @param animName Name of the animation to play
     * @param blendTime Crossfade duration in seconds
     */
    public playAnimation(character: Character, animName: string, blendTime: number = 0.3): void {
        if (!character) {
            console.error('Invalid character provided');
            return;
        }

        character.playAnimation(animName, blendTime);
    }

    /**
     * Clear the animation cache
     */
    public clearCache(): void {
        this.animationCache.clear();
    }

    /**
     * Remove a specific animation from cache
     * @param animName Name of the animation to remove
     */
    public removeFromCache(animName: string): void {
        this.animationCache.delete(animName);
    }
}

// Export a singleton instance
export const characterAnimationUtils = CharacterAnimationUtils.getInstance();
