import { _decorator, Button, Component, Node } from 'cc';
import { Hotkey } from '../HotKey';
const { ccclass, property } = _decorator;

@ccclass('ButtonHotKey')
export class ButtonHotKey extends Hotkey {
    private button: Button = null;
    onLoad(): void {
        super.onLoad();
        this.button = this.getComponent(Button);
    }

    protected trigger(): void {
        super.trigger();
        if (this.button) {
            this.button.clickEvents.forEach(event => {
                event.emit(null);
            });
        }
    }
}


