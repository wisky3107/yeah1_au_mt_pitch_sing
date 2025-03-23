import { _decorator, Component, Node, SpriteFrame, MeshRenderer, randomRangeInt } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AuditionRandomBackground')
export class AuditionRandomBackground extends Component {
    @property([SpriteFrame])
    backgroundFrames: SpriteFrame[] = [];

    private meshRenderer: MeshRenderer = null;

    onLoad() {
        this.meshRenderer = this.getComponent(MeshRenderer);
        if (!this.meshRenderer) {
            console.error('MeshRenderer component not found on AuditionRandomBackground');
            return;
        }

        if (this.backgroundFrames.length > 0) {
            const randomIndex = randomRangeInt(0, this.backgroundFrames.length);
            const randomFrame = this.backgroundFrames[randomIndex];
            if (this.meshRenderer.material) {
                this.meshRenderer.material.setProperty('mainTexture', randomFrame.texture);
            }
        }
    }

    update(deltaTime: number) {
        
    }
}


