import { _decorator, Component, Node, Sprite } from 'cc';
import { AudioManager } from '../../Utils/audioManager';
import { GameConstant } from '../../Constant/Constants';
const { ccclass, property } = _decorator;

@ccclass('PageViewBaseItem')
export class PageViewBaseItem extends Component {
    private onSelected: (item) => void;
    
    public init(data: any, onSelected: (item) => void) {
        this.onSelected = onSelected;
        //depend on data get sprite from tile controller
    }   

    onTouch_Main() {
        this.onSelected?.(this);
        // AudioManager.instance.playSound(GameConstant.SOUND_FILES.CLICK);
    }
}


