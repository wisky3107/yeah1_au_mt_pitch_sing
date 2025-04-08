import { _decorator, Component, director, Node, Scene } from 'cc';
import { loadMidi } from '../../Common/MidiReader';
import { POPUP } from '../../Constant/PopupDefine';
import { UIManager } from '../../Common/uiManager';
import { SCENE_NAME } from '../../Constant/SceneDefine';
import { GameManager } from '../../Managers/GameManager';
import { PopupProcessLoading } from '../Popup/ProcessLoading/PopupProcessLoading';
import { SceneLoader } from '../../Common/SceneLoader';
const { ccclass, property } = _decorator;

/**
 * Extends the Scene type to include loading progress
 */
interface SceneWithProgress extends Scene {
    _loadingProgress?: number;
}

@ccclass('HomeController')
export class HomeController extends Component {

    @property([Node])
    nodesAllBuilding: Node[] = [];

    @property(Node)
    nodeEvent: Node = null;

    @property(Node)
    nodeBlock: Node = null;

    start() {
        if (GameManager.instance.isFTUE) {
            this.processFTUE();
        }
    }

    public setBlock(isBlock: boolean): void {
        this.nodeBlock.active = isBlock;
    }

    //#region FTUE

    private processFTUE(): void {
        this.setBlock(true);
        this.step_FirstDialog()
            .then(() => this.step_HighlightMission())
            .then(() => this.step_HighlightBuilding())
            .then(() => {
                GameManager.instance.isFTUE = false;
                this.setBlock(false);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    private step_FirstDialog(): Promise<void> {
        return new Promise((resolve, reject) => {
            UIManager.instance.showDialog(POPUP.CHARACTER_DIALOG, [{
                message: 'Cùng mình tham quan một vòng ký túc xá nhé!',
                onDone: () => {
                    resolve();
                }
            }]);
        });
    }

    private step_HighlightMission(): Promise<void> {
        return new Promise((resolve, reject) => {
            UIManager.instance.showDialog(POPUP.HIGHLIGHT, [{
                message: 'Bấm vào đây để thực hiện các nhiệm vụ để thăng hạng',
                nodes: [this.nodeEvent],
                onDone: () => {
                    resolve();
                }
            }]);
        });
    }

    private step_HighlightBuilding(): Promise<void> {
        return new Promise((resolve, reject) => {
            UIManager.instance.showDialog(POPUP.HIGHLIGHT, [{
                message: 'Bấm vào các phòng để chơi game.',
                nodes: this.nodesAllBuilding,
                onDone: () => {
                    resolve();
                }
            }]);
        });
    }
    //#endregion

    //#region callbacks

    /**
     * Navigate to the Pitch game scene
     */
    public onPitchGameClicked(): void {
        SceneLoader.instance.loadSceneAsync(SCENE_NAME.PITCH, POPUP.PITCH_LOADING)
            .catch(error => SceneLoader.instance.handleSceneLoadError('Pitch Game', error));
    }

    /**
     * Navigate to the Karaoke game scene
     */
    public onKaraokeGameClicked(): void {
        SceneLoader.instance.loadSceneAsync(SCENE_NAME.KARAOKE, POPUP.KARAOKE_LOADING)
            .catch(error => SceneLoader.instance.handleSceneLoadError('Karaoke Game', error));
    }

    /**
     * Navigate to the Magic Tiles game scene
     */
    public onMagicTilesGameClicked(): void {
        SceneLoader.instance.loadSceneAsync(SCENE_NAME.MT, POPUP.MAGIC_TILE_LOADING)
            .catch(error => SceneLoader.instance.handleSceneLoadError('Magic Tiles Game', error));
    }

    /**
     * Navigate to the Audition game scene
     */
    public onAuditionGameClicked(): void {
        SceneLoader.instance.loadSceneAsync(SCENE_NAME.AUDITION, POPUP.AUDITION_LOADING)
            .catch(error => SceneLoader.instance.handleSceneLoadError('Audition Game', error));
    }

    //#endregion
}