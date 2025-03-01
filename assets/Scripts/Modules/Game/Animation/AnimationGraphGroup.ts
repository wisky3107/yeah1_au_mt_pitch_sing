import { _decorator, Component, Node } from 'cc';
import { AnimationGraph } from './AnimationGraph';
import { CurrentEnviroment } from '../../../Constant/Constants';
const { ccclass, property } = _decorator;

@ccclass('AnimationGraphGroup')
export class AnimationGraphGroup extends Component {
    _groups: AnimationGraph[] | undefined;

    private curActiveKey: string = "";
    __preload() {
        this._groups = this.getComponentsInChildren(AnimationGraph);
        if (this._groups === undefined || this._groups === null) {
            throw new Error(`${this.node.name} node not find AnimationGraph`);
        }
    }

    play(key: string, value: boolean | number) {
        if (this.curActiveKey === key) return;
        this.curActiveKey = key;
        try {
            for (let i = 0; i < this._groups!.length; i++) {
                this._groups![i].play(key, value);
            }
        }
        catch (e) {
            if (CurrentEnviroment.LOG) console.log(e);
        }
    }

    public setLayer(number: number, value: number) {
        for (let i = 0; i < this._groups!.length; i++) {
            this._groups![i].setLayer(number, value);
        }
    }
}


