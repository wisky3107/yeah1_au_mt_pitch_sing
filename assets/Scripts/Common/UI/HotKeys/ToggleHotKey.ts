import { _decorator, Component, Node, Toggle } from 'cc';
import { Hotkey } from '../HotKey';
const { ccclass, property } = _decorator;

@ccclass('ToggleHotKey')
export class ToggleHotKey extends Hotkey {
    private toggle: Toggle = null;
    onLoad(): void {
        super.onLoad();
        this.toggle = this.getComponent(Toggle);
    }

    protected trigger(): void {
        super.trigger();
        if (this.toggle) {
            this.toggle.isChecked = !this.toggle.isChecked;
            this.toggle.checkEvents.forEach(event => {
                event.emit(null);
            });
        }
    }
}


