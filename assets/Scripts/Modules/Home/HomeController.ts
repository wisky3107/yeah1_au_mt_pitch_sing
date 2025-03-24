import { _decorator, Component, director, Node } from 'cc';
import { loadMidi } from '../../Common/MidiReader';
import { POPUP } from '../../Constant/PopupDefine';
import { UIManager } from '../../Common/uiManager';
import { SCENE_NAME } from '../../Constant/SceneDefine';
const { ccclass, property } = _decorator;

@ccclass('HomeController')
export class HomeController extends Component {
    start() {
        UIManager.instance.showDialog(POPUP.MESSAGE, [{
            title: "Hello",
            message: "This is a test message",
            buttonText: "OK",
            buttonCallback: () => {
                director.loadScene(SCENE_NAME.AUDITION);
            }
        }]);

    }

    update(deltaTime: number) {

    }

    //#region callbacks

    public onTouch_Test() {
    }

    //#endregion
}