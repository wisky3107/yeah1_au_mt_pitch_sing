import { _decorator, Component, Node, sp, Sprite, Tween, tween, v3, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UICashAnimation')
export class UICashAnimation extends Component {
    private posY: number[] = [];
    private sprites: Sprite[] = [];
    private tweens: Tween<Node>[] = [];

    protected init(): void {
        this.sprites = this.getComponentsInChildren(Sprite);
        this.sprites.forEach(sprite => {
            this.posY.push(sprite.node.position.y);
            this.tweens.push(null);
        })
    }

    public setVisible(isVisible: boolean, time: number, callback: Function, toStackNumber: number = -1) {
        if (this.sprites.length <= 0) {
            this.init();
        }

        if (toStackNumber < 0) {
            toStackNumber = this.sprites.length;
        }
        else {
            toStackNumber = Math.min(this.sprites.length, toStackNumber);
        }

        if (isVisible) {
            this.sprites.forEach(sprt => sprt.node.position = Vec3.ZERO);

            const timePerStack = time / toStackNumber;
            for (let i = 0; i < toStackNumber; i++) {
                const timeAnim = i * timePerStack;
                const index = i;
                this.sprites[index].node.active = true;
                if (time <= 0.0) {
                    this.sprites[index].node.position = v3(0.0, this.posY[index]);
                    continue;
                }
                this.tweens[index]?.stop();
                this.tweens[index] = tween(this.sprites[index].node)
                    .to(timeAnim, { position: v3(0.0, this.posY[index]) })
                    .call(() => {
                        if (index == toStackNumber - 1) {
                            callback?.();
                        }
                    })
                    .start();
            }
        }
        else {
            for (let i = 0; i < this.sprites.length; i++) {
                const index = i;
                if (time <= 0.0) {
                    this.sprites[index].node.active = false;
                    continue;
                }
                this.tweens[index]?.stop();
                this.tweens[index] = tween(this.sprites[index].node)
                    .to(time, { position: Vec3.ZERO })
                    .call(() => {
                        this.sprites[index].node.active = false;
                        if (index == this.sprites.length - 1) {
                            callback?.();
                        }
                    })
                    .start();
            }
        }
    }
}


