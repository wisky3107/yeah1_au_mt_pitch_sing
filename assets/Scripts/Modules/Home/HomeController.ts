import { _decorator, Component, director, game, Node, Scene } from 'cc';
import { loadMidi } from '../../Common/MidiReader';
import { POPUP } from '../../Constant/PopupDefine';
import { UIManager } from '../../Common/uiManager';
import { SCENE_NAME } from '../../Constant/SceneDefine';
import { GameManager } from '../../Managers/GameManager';
import { PopupProcessLoading } from '../Popup/ProcessLoading/PopupProcessLoading';
import { SceneLoader } from '../../Common/SceneLoader';
import { GameType } from '../../Constant/GameDefine';
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
        UIManager.instance.showDialog(POPUP.SONG_SELECTION, [{ game: GameType.PITCH }]);
    }

    /**
     * Navigate to the Karaoke game scene
     */
    public onKaraokeGameClicked(): void {
        UIManager.instance.showDialog(POPUP.SONG_SELECTION, [{ game: GameType.KARAOKE }]);
    }

    /**
     * Navigate to the Magic Tiles game scene
     */
    public onMagicTilesGameClicked(): void {
        UIManager.instance.showDialog(POPUP.SONG_SELECTION, [{ game: GameType.MAGIC_TILE }]);
    }

    /**
     * Navigate to the Audition game scene
     */
    public onAuditionGameClicked(): void {
        UIManager.instance.showDialog(POPUP.SONG_SELECTION, [{ game: GameType.AUDITION }]);
    }

    //#endregion
}