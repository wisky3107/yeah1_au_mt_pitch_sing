import { _decorator, Component, director, Node } from 'cc';
import { loadMidi } from '../../Common/MidiReader';
import { POPUP } from '../../Constant/PopupDefine';
import { UIManager } from '../../Common/uiManager';
import { SCENE_NAME } from '../../Constant/SceneDefine';
const { ccclass, property } = _decorator;

@ccclass('HomeController')
export class HomeController extends Component {
    start() {

    }

    update(deltaTime: number) {

    }

    //#region callbacks

    /**
     * Navigate to the Pitch game scene
     */
    public onPitchGameClicked(): void {
        director.loadScene(SCENE_NAME.PITCH);
    }

    /**
     * Navigate to the Karaoke game scene
     */
    public onKaraokeGameClicked(): void {
        director.loadScene(SCENE_NAME.KARAOKE);
    }

    /**
     * Navigate to the Magic Tiles game scene
     */
    public onMagicTilesGameClicked(): void {
        director.loadScene(SCENE_NAME.MT);
    }

    /**
     * Navigate to the Audition game scene
     */
    public onAuditionGameClicked(): void {
        director.loadScene(SCENE_NAME.AUDITION);
    }

    //#endregion
}