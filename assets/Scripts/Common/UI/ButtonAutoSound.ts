import { _decorator, Button, Component, EventHandler, Node } from 'cc';
import { EDITOR } from 'cc/env';
import { AudioManager } from '../audioManager';
const { ccclass, property } = _decorator;

@ccclass('ButtonAutoSound')
export class ButtonAutoSound extends Component {
    @property
    public audioName: string = "A_Click_Menu";

    protected onLoad(): void {
        if (EDITOR) return;
        const button = this.getComponent(Button);
        if (!button) return;

        let eventHandler = new EventHandler();
        eventHandler.target = this.node;
        eventHandler.component = "ButtonAutoSound";
        eventHandler.handler = "onButtonClicked";
        button.clickEvents.push(eventHandler);
    }

    onButtonClicked() {
        AudioManager.instance?.playSound(this.audioName);
    }
}


