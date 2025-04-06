import { _decorator, Component, Label, Node } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
const { ccclass, property } = _decorator;

@ccclass('PopupConfirm')
export class PopupConfirm extends PopupBase {
    @property(Label)
    lbContent: Label = null;

    @property(Label)
    lbTitle: Label = null;

    @property(Label)
    lbButtonText: Label = null;

    @property(Label)
    lbButtonText2: Label = null;

    private callback1: Function = null;
    private callback2: Function = null;
    show(data: {
        message: string,
        buttonText1?: string,
        buttonText2?: string,
        callback1?: Function,
        callback2?: Function,
        title?: string,
    }, callback?: () => void): void {
        super.show(data, callback);
        if (!data) return;
        this.callback1 = data.callback1;
        this.callback2 = data.callback2;

        this.lbContent.string = data.message;
        this.lbTitle.string = data.title ?? "";

        this.lbButtonText.string = data.buttonText1 ?? "Yes";
        this.lbButtonText2.string = data.buttonText2 ?? "No";
    }

    public onTouch_One() {
        this.callback1?.();
        this.doUImanagerHide();
    }

    public onTouch_Two() {
        this.callback2?.();
        this.doUImanagerHide();
    }
}


