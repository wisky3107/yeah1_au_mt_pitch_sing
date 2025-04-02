import { _decorator, Component, director, Node } from 'cc';
import { SCENE_NAME } from '../../Constant/SceneDefine';
const { ccclass, property } = _decorator;

@ccclass('ButtonBackToHome')
export class ButtonBackToHome extends Component {
    /**
     * Navigate back to the Home scene when button is clicked
     */
    public onTouch_Home(): void {
        director.loadScene(SCENE_NAME.HOME);
    }
}


