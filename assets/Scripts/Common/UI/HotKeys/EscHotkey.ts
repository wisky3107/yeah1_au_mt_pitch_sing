import { _decorator, Button, Component, KeyCode, Node } from 'cc';
import { ButtonHotKey } from './ButtonHotKey';
const { ccclass, property } = _decorator;

@ccclass('EscHotkey')
export class EscHotkey extends ButtonHotKey {
    public static escIndex = -1;
    private index = 0;
    onLoad(): void {
        this.keys = [KeyCode.ESCAPE]; //forse set to esc button
        super.onLoad();
    }
    protected onEnable(): void {
        EscHotkey.escIndex += 1;
        this.index = EscHotkey.escIndex;
        super.onEnable();
    }

    protected onDisable(): void {
        EscHotkey.escIndex -= 1;
        this.index = -1;
        super.onDisable();
    }

    protected trigger(): void {
        if (EscHotkey.escIndex < 0) return;
        if (this.index != EscHotkey.escIndex) return;
        super.trigger();
    }
}


