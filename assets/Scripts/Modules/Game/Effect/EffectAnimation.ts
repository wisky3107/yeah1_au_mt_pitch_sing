import { _decorator, Animation, Component, Node } from 'cc';
import { EffectBase } from './EffectBase';
import { EffectTime } from './EffectTime';
const { ccclass, property } = _decorator;

@ccclass('EffectAnimation')
export class EffectAnimation extends EffectTime {
    @property(Animation)
    public animMain: Animation = null;

    @property
    public animName: string = "";

    @property
    public delay: number = 0;

    protected onLoad(): void {
        this.animMain.node.active = false;
    }

    public init(define: string, recycleMe: (effect: EffectBase) => void, data: any): void {
        super.init(define, recycleMe, data);
        this.scheduleOnce(() => {
            this.animMain.play(this.animName);
        }, this.delay)
    }
}


