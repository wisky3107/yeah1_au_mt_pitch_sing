import { _decorator } from 'cc';
import { UIManager } from '../uiManager';
import { AnimationPanel } from './AnimationPanel';
const { ccclass} = _decorator;

@ccclass('PopupBase')
export class PopupBase extends AnimationPanel {
    public doUImanagerHide() {
        this.hide(() => {
            UIManager.instance.hideDialog(this.node.name);
        })
    }
}
