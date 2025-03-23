import { Label, _decorator } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { UIManager } from '../../../Common/uiManager';
import { GameConstant } from '../../../Constant/Constants';
import { POPUP } from '../../../Constant/PopupDefine';
const { ccclass, property } = _decorator;

@ccclass('PopupMessage')
export class PopupMessage extends PopupBase {
    @property(Label)
    lbContent: Label = null;

    @property(Label)
    lbTitle: Label = null;

    @property(Label)
    lbButtonText: Label = null;

    private confirmCallback: Function = null;
    show(data: { message: string, buttonText?: string, buttonCallback?: Function, title?: string, }, callback?: () => void): void {
        super.show(data, callback);
        if (!data) return;
        this.confirmCallback = data.buttonCallback;
        this.lbContent.string = data.message;
        this.lbTitle.string = data.title ?? "";
        this.lbButtonText.string = data.buttonText ?? "OK";
    }

    public onTouch_Confirm() {
        this.confirmCallback?.();
        this.hide(() => {
            UIManager.instance.hideDialog(POPUP.MESSAGE);
        });
    }
}


