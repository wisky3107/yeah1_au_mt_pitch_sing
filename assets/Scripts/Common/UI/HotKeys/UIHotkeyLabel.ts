import { _decorator, Component, error, Label, Node } from 'cc';
import { Hotkey } from '../HotKey';
import { GameConstant } from '../../../Constant/Constants';
import { ClientEvent } from '../../ClientEvent';
import { StorageManager } from '../../storageManager';
const { ccclass, property } = _decorator;

@ccclass('UIHotkeyLabel')
export class UIHotkeyLabel extends Component {
    @property(Node)
    nodeMain: Node = null!;

    @property(Label) 
    lbMain: Label = null!;

    private hotkey: Hotkey = null!;
    protected onLoad(): void {
        this.hotkey = this.node.getComponent(Hotkey)!;
        if (!this.hotkey) {
            console.error("UIHotkeylabel the hotkey is null");
            return;
        }
        this.lbMain.string = this.hotkey.getKeyString();
        ClientEvent.on(GameConstant.EVENT_NAME.HOTKEY_STATE_CHANGED, this.updateHotKeyState, this);
        this.updateHotKeyState();
    }


    protected onDestroy(): void {
        ClientEvent.off(GameConstant.EVENT_NAME.HOTKEY_STATE_CHANGED, this.updateHotKeyState, this);
    }

    private updateHotKeyState() {
        const isOn = StorageManager.instance.getGlobalData(GameConstant.STORAGE_KEY.HOTKEY) ?? false;
        this.nodeMain.active = isOn;
    }
}


