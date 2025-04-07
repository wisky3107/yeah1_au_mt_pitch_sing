import { _decorator, Component, Label, Node } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { UIRunningLabel } from '../../../Common/UI/UIRunningLabel';
import { GameManager } from '../../../Managers/GameManager';
const { ccclass, property } = _decorator;

@ccclass('PopupCharacterDialog')
export class PopupCharacterDialog extends PopupBase {
    @property(UIRunningLabel)
    lbMessage: UIRunningLabel = null;

    @property(Label)
    lbFandomName: Label = null;

    private message: string = '';
    private onDone: Function = null;
    private isTextDone = false;

    show(data: { message: string, onDone: Function }, callback?: () => void): void {
        super.show(data, callback);
        this.message = data.message;
        this.onDone = data.onDone;

        const fandomModel = GameManager.instance.getFandomModel();
        const currentCharacter = fandomModel.getCurrentFandomCharacter();
        this.lbFandomName.string = currentCharacter.name;
    }

    shown(): void {
        super.shown();
        this.lbMessage.setText(this.message, 1.0, () => {
            this.isTextDone = true;
        });
    }

    onTouch_Popup(): void {
        if (this.isTextDone) {
            this.doUImanagerHide();
            this.onDone?.();
            this.onDone = null;
            return;
        }

        this.isTextDone = true;
        this.lbMessage.setText(this.message, 0.0);
    }
}


