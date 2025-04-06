import { _decorator, Node, find, isValid, Component, Prefab, instantiate, CCString, } from "cc";
import { resourceUtil } from "./resourceUtil";
import { CurrentEnviroment, GameConstant } from "../Constant/Constants";
import { PopupLoading } from "../Modules/Popup/Loading/PopupLoading";
import { PopupBase } from "./UI/PopupBase";
import { POPUP } from "../Constant/PopupDefine";
const { ccclass, property } = _decorator;

export enum PopupLayer {
    LAYER_1 = "GlobalCanvas/Root/Layer1",
    LAYER_2 = "GlobalCanvas/Root/Layer2",
    LAYER_3 = "GlobalCanvas/Root/Layer3",
    LAYER_4 = "GlobalCanvas/Root/Layer4",
}

@ccclass("UIManager")
export class UIManager {
    public static instance: UIManager;

    preloadPrefabNames: string[] = [
        POPUP.LOADING,
        POPUP.MESSAGE
    ];

    private _dictSharedPanel: any = {}
    private _dictLoading: any = {}
    private _arrPopupDialog: any = []

    private layerNodeMap: Map<string, Node> = new Map<string, Node>();

    constructor() {
        this.preloadUIs();
    }

    private preloadUIs() {
        this.preloadPrefabNames.forEach(uiName => {
            this.preloadDialog(uiName, null);
        })
    }

    public isDialogVisible(panelPath: string) {
        if (!this._dictSharedPanel.hasOwnProperty(panelPath)) {
            return false;
        }

        let panel = this._dictSharedPanel[panelPath];

        return isValid(panel) && panel.active && isValid(panel.parent);
    }

    private getLayerNode(layer: string): Node {
        if (this.layerNodeMap.has(layer)) {
            const node = this.layerNodeMap.get(layer);
            if (isValid(node)) {
                return node;
            }
        }

        let node = find(layer);
        if (!node) {
            node = new Node();

            //split by / and get the last one
            const arr = layer.split('/');
            node.name = arr[arr.length - 1];
            node.parent = find("Game/Canvas");
        }

        this.layerNodeMap.set(layer, node);
        return node;
    }

    public showDialog(panelPath: string, args?: any, cb?: Function, panelPriority: number = -1, layer: string = PopupLayer.LAYER_1) {
        if (this._dictLoading[panelPath]) {
            return;
        }

        let idxSplit = panelPath.lastIndexOf('/');
        let scriptName = panelPath.slice(idxSplit + 1);

        if (!args) {
            args = [];
        }

        if (this._dictSharedPanel.hasOwnProperty(panelPath)) {
            let panel = this._dictSharedPanel[panelPath];
            if (isValid(panel) && isValid(panel.parent)) {
                try {
                    panel.parent = this.getLayerNode(layer);
                    panel.active = true;
                    let script = panel.getComponent(scriptName);
                    let script2 = panel.getComponent(scriptName.charAt(0).toUpperCase() + scriptName.slice(1));

                    if (script && script.show) {
                        script.show.apply(script, args);
                        cb && cb(script);
                    } else if (script2 && script2.show) {
                        script2.show.apply(script2, args);
                        cb && cb(script2);
                    } else {
                        throw `${scriptName}`;
                    }

                    return;
                }
                catch (e) {
                    this.showMessage({ message: "Error while showing dialog", title: "Error" });
                    return;
                }
            }
        }

        this.setLoading(true, 0.5);
        this._dictLoading[panelPath] = true;
        resourceUtil.createUI(panelPath, (error, node: Node) => {
            this.setLoading(false);

            if (error) return;
            let isCloseBeforeShow = false;
            if (!this._dictLoading[panelPath]) {
                isCloseBeforeShow = true;
            }

            this._dictLoading[panelPath] = false;

            if (panelPriority >= 0) {
                node.setSiblingIndex(panelPriority);
            }

            this._dictSharedPanel[panelPath] = node;

            let script: any = node.getComponent(scriptName);
            let script2: any = node.getComponent(scriptName.charAt(0).toUpperCase() + scriptName.slice(1));
            if (script && script.show) {
                script.show.apply(script, args);
                cb && cb(script);
            } else if (script2 && script2.show) {
                script2.show.apply(script2, args);
                cb && cb(script2);
            } else {
                throw `${scriptName}`;
            }

            if (isCloseBeforeShow) {
                this.hideDialog(panelPath);
            }
        }, null, layer);
    }

    public preloadDialog(uiName: string, callback?: Function) {
        this._dictLoading[uiName] = true;
        resourceUtil.preloadUI(uiName, (error, node: Node) => {
            if (error) {
                callback?.(error);
                return;
            }

            this._dictLoading[uiName] = false;
            this._dictSharedPanel[uiName] = node;
            node.parent = null;
            callback?.(null);
        });
    }

    public hideDialog(panelPath: string, callback?: Function) {
        if (this._dictSharedPanel.hasOwnProperty(panelPath)) {
            let panel = this._dictSharedPanel[panelPath];
            if (panel && isValid(panel)) {
                let ani = panel.getComponent('animationUI');
                if (ani) {
                    ani.close(() => {
                        panel.parent = null;
                        if (callback && typeof callback === 'function') {
                            callback();
                        }
                    });
                } else {
                    panel.parent = null;
                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                }
            } else if (callback && typeof callback === 'function') {
                callback();
            }
        }

        this._dictLoading[panelPath] = false;
    }

    public hidePopup(panelPath: string, callback?: Function) {
        if (this._dictSharedPanel.hasOwnProperty(panelPath)) {
            let panel = this._dictSharedPanel[panelPath];
            if (panel && isValid(panel)) {
                let popup = panel.getComponent(PopupBase);
                if (popup) {
                    popup.hide(() => {
                        panel.parent = null;
                        if (callback && typeof callback === 'function') {
                            callback();
                        }
                    });
                } else {
                    panel.parent = null;
                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                }

            } else if (callback && typeof callback === 'function') {
                callback();
            }
        }

        this._dictLoading[panelPath] = false;
    }

    public pushToPopupSeq(panelPath: string, scriptName: string, param: any) {
        let popupDialog = {
            panelPath: panelPath,
            scriptName: scriptName,
            param: param,
            isShow: false
        };

        this._arrPopupDialog.push(popupDialog);

        this._checkPopupSeq();
    }

    public insertToPopupSeq(index: number, panelPath: string, param: any) {
        let popupDialog = {
            panelPath: panelPath,
            param: param,
            isShow: false
        };

        this._arrPopupDialog.splice(index, 0, popupDialog);
    }

    public shiftFromPopupSeq(panelPath: string) {
        this.hideDialog(panelPath, () => {
            if (this._arrPopupDialog[0] && this._arrPopupDialog[0].panelPath === panelPath) {
                this._arrPopupDialog.shift();
                this._checkPopupSeq();
            }
        })
    }

    private _checkPopupSeq() {
        if (this._arrPopupDialog.length > 0) {
            let first = this._arrPopupDialog[0];

            if (!first.isShow) {
                this.showDialog(first.panelPath, first.param);
                this._arrPopupDialog[0].isShow = true;
            }
        }
    }

    //#region message popup
    public showMessage(data: { message: string, buttonText?: string, buttonCallback?: Function, title?: string, }) {
        this.showDialog(POPUP.MESSAGE, [data], (script: any) => {
        }, 9999, PopupLayer.LAYER_4);
    }
    //#endregion

    //#region blocking

    private blockNode: Node = null;
    public setBlock(isBlock: boolean) {
        if (!this.blockNode) {
            this.blockNode = find("GlobalCanvas/Block");
        }
        this.blockNode.active = isBlock;
        this.blockNode.setSiblingIndex(999);
    }

    //#endregion

    //#region loading

    private delayTimeoutDefine: number = 0;
    private popupLoading: PopupLoading = null;
    private popupLoadingData: any = null;
    public setLoading(isVisible: boolean, delay: number = 2.0, data: any = null) {
        clearTimeout(this.delayTimeoutDefine);
        if (isVisible) {
            this.setBlock(true);
            this.popupLoadingData = data;
            if (this.popupLoading) {
                this.popupLoading.setLoadingDetail(data);
                return;
            }
            this.delayTimeoutDefine = setTimeout(() => {
                this
                    .showLoading();
            }, delay * 1000.0);
        }
        else {
            clearTimeout(this.delayTimeoutDefine);
            this.setBlock(false)
            this.hidePopup(POPUP.LOADING);
            this.popupLoading = null;
            this.popupLoadingData = null;
        }
    }

    private showLoading() {
        this.showDialog(POPUP.LOADING, [this.popupLoadingData], (script) => {
            this.popupLoading = script as PopupLoading;
        }, 1, PopupLayer.LAYER_3);
    }

    //#endregion

}
