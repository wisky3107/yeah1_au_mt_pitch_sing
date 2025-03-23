import { _decorator, Component, Node } from 'cc';
import { loadMidi } from '../../Common/MidiReader';
import { POPUP } from '../../Constant/PopupDefine';
import { UIManager } from '../../Common/uiManager';
const { ccclass, property } = _decorator;

@ccclass('HomeController')
export class HomeController extends Component {
    start() {
        console.log(window);
        UIManager.instance.showDialog(POPUP.MESSAGE);
    }

    update(deltaTime: number) {

    }

    //#region callbacks

    public onTouch_Test() {
    }

    //#endregion
}