import { _decorator, Component, Node, SkeletalAnimation } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AnimatorController')
export class AnimatorController extends Component {
    _anim:SkeletalAnimation = Object.create(null);
    _data = Object.create(null);
 
    init(data: any) {
        this._data = data;
        this._anim = this.getComponent(SkeletalAnimation);
    }
 
    play(name: string) {
        var anims = this._data[name];
        this._anim.play(anims[0]);
    }
}


