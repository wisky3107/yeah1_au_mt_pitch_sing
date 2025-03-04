import { _decorator, animation, CCBoolean, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AnimationGraph')
export class AnimationGraph extends Component {
    _graph: animation.AnimationController | undefined | null;

    @property(CCBoolean)
    isPose = false;

    start() {
        this._graph = this.getComponent(animation.AnimationController);
        if (this._graph === undefined || this._graph === null) {
            throw new Error(`${this.node.name} can not find AnimationController`);
        }
    }

    play(key: string, value: boolean | number) {
        this.setValue(key, value);
    }

    setValue(key: string, value: number | boolean) {
        if (this.isPose) {
            this._graph.setValue_experimental(key, value);
        } else {
            this._graph?.setValue(key, value);
        }
    }

    public setLayer(number: number, value: number) {
        this._graph.setLayerWeight(number, value);
    }

    update(deltaTime: number) {
    }

}


