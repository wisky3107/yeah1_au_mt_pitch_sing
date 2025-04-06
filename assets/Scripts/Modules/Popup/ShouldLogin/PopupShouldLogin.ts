import { _decorator, Component, Node } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
const { ccclass, property } = _decorator;

@ccclass('PopupShouldLogin')
export class PopupShouldLogin extends PopupBase {
    
    //#region callback of play now and login 
    onTouch_PlayNow() {
        this.doUImanagerHide();
    }

    onTouch_Login() {
        this.doUImanagerHide();
    }

    //#endregion
}

