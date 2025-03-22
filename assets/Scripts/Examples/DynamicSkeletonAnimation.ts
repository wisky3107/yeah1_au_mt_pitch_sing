/**
 * Example script to dynamically load and play a 3D animation clip in Cocos Creator.
 */
import { _decorator, Component, resources, AnimationClip, Animation } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DynamicAnimationClip')
export class DynamicAnimationClip extends Component {
    @property({ type: Animation })
    public animationComponent: Animation | null = null;

    start() {
        // Dynamically load animation clip.
        resources.load("3d/animation_clips/your_animation_clip", AnimationClip, (err, clip) => {
            if (err) {
                console.error("Failed to load animation clip:", err);
                return;
            }

            if (!clip) {
                console.warn("Animation clip not found at the specified path.");
                return;
            }

            if (!this.animationComponent) {
                console.error("Animation component is not assigned in the editor.");
                return;
            }

            this.animationComponent.addClip(clip);
            this.animationComponent.play('your_animation_clip'); // Play the loaded animation clip
        });
    }
}
