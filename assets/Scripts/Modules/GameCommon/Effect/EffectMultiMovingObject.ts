import { _decorator, randomRange, SpriteFrame, tween, v3, Vec3 } from 'cc';
import { EffectBase } from './EffectBase';
import { EffectMovingObject } from './EffectMovingObject';
import { AudioManager } from '../../../Common/audioManager';
const { ccclass, property } = _decorator;

@ccclass('EffectMultiMovingObject')
export class EffectMultiMovingObject extends EffectBase {
    @property([EffectMovingObject])
    childs: EffectMovingObject[] = [];

    @property
    public soundEachEmitterReached: string = "";

    protected data = null;
    private isInited: boolean = false;

    public init(
        define: string,
        recycleMe: (effect: EffectBase) => void,
        data: {
            number: number,
            spriteFrame: SpriteFrame,
            start: Vec3,
            end: Vec3,
            duration: number,
            spreadDistance: number,
            onEachObject: Function,
            onEnd: Function,
            randomDuration?: number,
            isRandomRotation?: boolean,
        }
    ): void {
        super.init(define, recycleMe, data);

        this.data = data;
        if (!data.randomDuration) {
            data.randomDuration = 0.0;
        }

        if (!this.isInited) {
            this.isInited = true;
            if (this.childs.length <= 0) {
                this.childs = this.node.getComponentsInChildren(EffectMovingObject);
                this.childs.forEach(child => child.setParentForFollowNode(this.node));
            }
        }

        for (let i = 0; i < this.childs.length; i++) {
            const isActive = i < data.number;
            const randomMovingTimeRatio = randomRange(0.3, 0.65);
            const randomScaleTimeRatio = randomRange(0.1, 0.3);
            const randomHoldTimeRatio = 1.0 - randomMovingTimeRatio - randomScaleTimeRatio;

            this.childs[i].setActive(isActive);
            if (isActive) {
                const childNode = this.childs[i];
                const duration = randomRange(data.duration - data.randomDuration, data.duration + data.randomDuration)
                childNode.movingTime = randomMovingTimeRatio * duration;
                childNode.scaleTime = randomScaleTimeRatio * duration;
                let holdTime = randomHoldTimeRatio * duration;
                childNode.holdTime = 0;

                if (data.spreadDistance <= 0) {
                    childNode.movingTime += holdTime;
                    childNode.movingTime += childNode.scaleTime;
                    childNode.scaleTime = 0;
                    holdTime = 0;
                }

                childNode.finalScale = 0.0;
                if (childNode.sprtMain) {
                    childNode.sprtMain.node.active = true;
                    if (this.data.isRandomRotation) {
                        childNode.sprtMain.node.angle = randomRange(0.0, 360.0);
                    }
                }
                if (data.spriteFrame && childNode.sprtMain) {
                    childNode.sprtMain.spriteFrame = data.spriteFrame;
                }

                //move random around 
                childNode.node.position = Vec3.ZERO;
                tween(childNode.node)
                    .to(holdTime, { position: v3(randomRange(-data.spreadDistance, data.spreadDistance), randomRange(-data.spreadDistance, data.spreadDistance)) })
                    .call(() => {
                        //start moving for childs
                        childNode.init(
                            "",
                            null,
                            {
                                onEnd: () => {
                                    if (childNode.sprtMain) {
                                        childNode.sprtMain.node.active = false;
                                    }
                                    data.onEachObject?.(childNode)
                                    if (this.soundEachEmitterReached) {
                                        AudioManager.instance.playSound(this.soundEachEmitterReached);
                                    }
                                },
                                destination: data.end,
                                spriteFrame: data.spriteFrame,
                                text: "",
                                text2: ""
                            });
                    })
                    .start();
            }
        }


        this.scheduleOnce(() => {
            data.onEnd?.();
        }, data.duration + data.randomDuration);

        this.scheduleOnce(() => {
            this.putToPool();
        }, (data.duration + data.randomDuration) * 1.5);
    }
}


