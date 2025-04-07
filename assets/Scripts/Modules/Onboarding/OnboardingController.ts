import { _decorator, Component, Label, Node } from 'cc';
import { UIRunningLabel } from '../../Common/UI/UIRunningLabel';
import { UIManager } from '../../Common/uiManager';
import { POPUP } from '../../Constant/PopupDefine';
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
            UIManager.instance.showDialog(POPUP.CHARACTER_CUSTOMIZATION);
        // }, 8.0);
    }
}


