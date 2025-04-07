import { _decorator, Component, director, Label, Node } from 'cc';
import { UIRunningLabel } from '../../Common/UI/UIRunningLabel';
import { UIManager } from '../../Common/uiManager';
import { POPUP } from '../../Constant/PopupDefine';
import { SCENE_NAME } from '../../Constant/SceneDefine';
const { ccclass, property } = _decorator;

@ccclass('OnboardingController')
export class OnboardingController extends Component {

    @property(UIRunningLabel)
    lbMessage: UIRunningLabel = null;

    protected start(): void {
        this.lbMessage.setText("Chào mừng bạn đến với chương trình Tân Binh Toàn Năng", 3.0);
        this.scheduleOnce(() => {
            this.lbMessage.setText("Hãy giới thiệu đôi chút về bạn nào!", 3.0);
        }, 5.0);

        // this.scheduleOnce(() => {
        UIManager.instance.showDialog(POPUP.CHARACTER_CUSTOMIZATION, [{
            onDone: () => {
                this.onDoneCharacterCustomization();
            }
        }]);
        // }, 8.0);
    }

    private onDoneCharacterCustomization() {
        director.loadScene(SCENE_NAME.HOME);
    }
}


