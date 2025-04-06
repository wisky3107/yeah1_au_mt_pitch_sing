import { _decorator, Component, Node, SkeletalAnimation, Prefab, instantiate, AnimationClip, AnimationState } from 'cc';
import { resourceUtil } from '../../Common/resourceUtil';
const { ccclass, property } = _decorator;

/**
 * Interface for skin data
 */
interface SkinData {
    skinType: string;
    prefab: string;
}

/**
 * Character component that handles character loading, animation and skin management
 */
@ccclass('Character')
export class Character extends Component {
    @property(SkeletalAnimation)
    private skeletalAnimation: SkeletalAnimation = null;

    private characterId: string = '';
    private isLoaded: boolean = false;
    private characterNode: Node = null;

    /**
     * Initialize the character with custom data
     * @param data Custom initialization data
     * @param characterId The ID of the character to load
     */
    public async init(data: any, characterId: string): Promise<void> {
        this.characterId = characterId;
        
        // Load the character prefab
        await this.loadCharacterPrefab();
        
        // Initialize with custom data if needed
        if (data) {
            // Handle custom initialization data here
        }
    }

    /**
     * Load the character prefab using resourceUtil
     */
    private loadCharacterPrefab(): Promise<void> {
        return new Promise((resolve, reject) => {
            resourceUtil.loadRes(`prefab/character/${this.characterId}`, Prefab, (err: any, prefab: Prefab) => {
                if (err) {
                    console.error(`Failed to load character prefab: ${this.characterId}`, err);
                    reject(err);
                    return;
                }

                // Instantiate the prefab
                this.characterNode = instantiate(prefab);
                this.node.addChild(this.characterNode);

                // Get the skeletal animation component
                this.skeletalAnimation = this.characterNode.getComponent(SkeletalAnimation);
                if (!this.skeletalAnimation) {
                    console.error(`No SkeletalAnimation component found in character: ${this.characterId}`);
                    reject(new Error('Missing SkeletalAnimation component'));
                    return;
                }

                this.isLoaded = true;
                resolve();
            });
        });
    }

    /**
     * Get the skeletal animation component
     * @returns The SkeletalAnimation component or null if not loaded
     */
    public getSkeletalAnimation(): SkeletalAnimation {
        return this.skeletalAnimation;
    }

    /**
     * Set character skins
     * @param skins Array of skin data to apply
     */
    public async setSkins(skins: SkinData[]): Promise<void> {
        if (!this.isLoaded) {
            console.error('Character not loaded yet');
            return;
        }

        for (const skin of skins) {
            await new Promise<void>((resolve, reject) => {
                resourceUtil.loadRes(`prefab/skins/${skin.prefab}`, Prefab, (err: any, skinPrefab: Prefab) => {
                    if (err) {
                        console.error(`Failed to load skin: ${skin.prefab}`, err);
                        reject(err);
                        return;
                    }

                    // Apply the skin to the character
                    // Implementation depends on your skin system
                    // This is a placeholder for the actual skin application logic
                    console.log(`Applying skin: ${skin.skinType} with prefab: ${skin.prefab}`);
                    resolve();
                });
            });
        }
    }

    /**
     * Play an animation with optional blend time
     * @param animName Name of the animation to play
     * @param blendTime Time to blend between animations (default: 0.3)
     */
    public playAnimation(animName: string, blendTime: number = 0.3): void {
        if (!this.isLoaded || !this.skeletalAnimation) {
            console.error('Character or animation component not loaded');
            return;
        }

        // Play the animation with crossfade
        this.skeletalAnimation.crossFade(animName, blendTime);
    }

    public createState(clip: AnimationClip, animName: string): void {
        this.skeletalAnimation.createState(clip, animName);
    }

    public getState(animName: string): AnimationState {
        return this.skeletalAnimation.getState(animName);
    }
}


