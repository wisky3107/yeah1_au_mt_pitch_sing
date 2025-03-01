import { _decorator, Component, EventHandler, Toggle } from 'cc';
import { EDITOR } from 'cc/env';
import { AudioManager } from '../audioManager';
const { ccclass, property } = _decorator;

@ccclass('ToggleAutoSound')
export class ToggleAutoSound extends Component {
    @property
    public onAudioName: string = "sfx_lobby_ui_01";
    @property
    public offAudioName: string = "sfx_lobby_ui_01_Low";

    private toggle: Toggle = null!;
    protected onLoad(): void {
        if (EDITOR) return;
        this.toggle = this.getComponent(Toggle) as Toggle;
        if (!this.toggle) return;

        let eventHandler = new EventHandler();
        eventHandler.target = this.node;
        eventHandler.component = "ToggleAutoSound";
        eventHandler.handler = "onToggleChanged";
        this.toggle.checkEvents.push(eventHandler);
    }

    onToggleChanged() {
        if (!this.toggle) return;
        AudioManager.instance.playSound(this.toggle.isChecked ? this.onAudioName : this.offAudioName);
    }
}


