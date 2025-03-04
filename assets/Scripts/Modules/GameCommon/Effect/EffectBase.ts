import { _decorator, Component, Node } from 'cc';
import { AudioManager } from '../../../Common/audioManager';
const { ccclass, property } = _decorator;

@ccclass('EffectBase')
export class EffectBase extends Component {
    public define: string = "";
    protected recycleMe: (effect: EffectBase) => void = null;

    @property
    public sound: string = "";

    public init(define: string, recycleMe: (effect: EffectBase) => void, data: any) {
        this.define = define;
        this.recycleMe = recycleMe;

        if (this.sound) {
            AudioManager.instance.playSound(this.sound);
        }
    }

    public putToPool() {
        this?.recycleMe?.(this);
    }
}


