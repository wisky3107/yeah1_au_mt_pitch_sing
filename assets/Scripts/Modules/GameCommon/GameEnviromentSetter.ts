import { _decorator, Component, director, Label, Node, Sprite, labelAssembler, Socket, primitives } from 'cc';
import { CurrentEnviroment, GameConstant, setEnvi } from '../../Constant/Constants';
import { DEBUG } from 'cc/env';
import { setAPIManagerURL, setFakeData } from '../../Managers/APIManager';
import { PopupBase } from '../../Common/UI/PopupBase';
import { AudioManager } from '../../Common/audioManager';
import { UIManager } from '../../Common/uiManager';
import { EffectController } from './EffectController';
import { SCENE_NAME } from '../../Constant/SceneDefine';
import { POPUP } from '../../Constant/PopupDefine';
const { ccclass, property } = _decorator;

@ccclass('GameEnviromentSetter')
export class GameEnviromentSetter extends Component {
    @property
    public API: string = "";
    @property
    public LOG: boolean = false;

    @property
    public FAKEDATA: boolean = false;

    @property(Node)
    sckContainer: Node = null;

    @property(Sprite)
    sprtProcessBar: Sprite = null;

    @property(PopupBase)
    popupError: PopupBase = null;

    @property(Label)
    lbError: Label = null;

    private sceneName = SCENE_NAME.HOME;
    protected onLoad(): void {
        if (DEBUG) {
            this.LOG = true;
            // this.sceneName = GameConstant.SCENE_NAME.BATTLE_SHIP;//test battle ship
            if (this.FAKEDATA) {
                setFakeData();
            }
        }
        setEnvi({
            API: this.API,
            LOG: this.LOG,
        })

        //set secrect key 

        // let keyLabels = this.sckContainer.getComponentsInChildren(Label);
        // const encryptedData = keyLabels.shift().string;
        // const key = keyLabels.map(lb => lb.string).join("");

        // const CryptoJS: any = window["CryptoJS"];
        // var bytes = CryptoJS.AES.decrypt(encryptedData, key);
        // var original = bytes.toString(CryptoJS.enc.Utf8);
        // setKeyAuthen(original);

        // const converKey = "uqZLF8HAR467TdHcHoWkIkCOy89xlPV9";
        // const decryptedKey = CryptoJS.AES.encrypt(converKey, "631DB").toString();
        this.init();
        this.initGameProcess();
    }

    //#region process 

    init() {
        setAPIManagerURL(CurrentEnviroment.API);
    }

    initGameProcess() {
        Promise.all([this.step_ProcessData(), this.step_ProcessPreloadSceneAssets()])
            .then(results => {
                this.loadGame();
            })
            .catch(error => {
                this.showError(error);
            })
    }

    private retryCount = 0;
    retry() {
        if (++this.retryCount > 3) {
            this.lbError.string = "Please try again later!";
            return;
        }
        this.popupError.doHide();
        this.initGameProcess();
    }

    showError(errorMessage: string) {
        this.lbError.string = errorMessage;
        this.popupError.doShow();
    }

    step_ProcessData() {
        return new Promise((resolve, reject) => {
            this.step_initManagers()
                .then(res => {
                    resolve("success");
                })
                .catch(error => {
                    reject(error);
                })
        })
    }

    private step_initManagers() {
        return new Promise((resolve, rejet) => {
            AudioManager.instance = new AudioManager();
            UIManager.instance = new UIManager();
            EffectController.instance = new EffectController();
            resolve("success");
        })
    }

    step_ProcessPreloadSceneAssets() {
        return new Promise((resolve, reject) => {
            if (DEBUG) {
                resolve("done load scene")
                return;
            }

            director.preloadScene(this.sceneName, (completedCount, totalCount, item) => {
                if (this.sprtProcessBar) {
                    this.sprtProcessBar.fillRange = completedCount / totalCount * 0.95;
                }

            }, (error, asset) => {
                if (error) {
                    if (CurrentEnviroment.LOG) console.error(`Failed to preload scene ${this.sceneName}:`, error);
                    reject("Failed to load assets. Please retry. If retrying doesn't help, please clear the cache and try again.");
                    return;
                }
                // Load the scene after preloading is complete
                resolve("loaded assets done");
            });
        })
    }

    loadGame() {
        this.sprtProcessBar.fillRange = 1.0;
        if (CurrentEnviroment.LOG) console.log(`doneLoadAssets`);
        
        director.loadScene(this.sceneName, () => {
            if (CurrentEnviroment.LOG) console.log(`Scene ${this.sceneName} loaded successfully`);
        });
    }

    //#region callbacks

    onTouch_Retry() {
        this.retry();
    }

    //#endregion
    //#endregion

}


