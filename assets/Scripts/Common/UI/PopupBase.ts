import { _decorator, v3 } from 'cc';
import { UIManager } from '../uiManager';
import { AnimationPanel } from './AnimationPanel';
import { AudioManager } from '../audioManager';
const { ccclass } = _decorator;

@ccclass('PopupBase')
export class PopupBase extends AnimationPanel {
    protected onLoad(): void {
        //override this cause we use the onLoad of animation panel
    }

    public doUImanagerHide() {
        this.hide(() => {
            UIManager.instance.hideDialog(this.node.name);
        })
    }
}
