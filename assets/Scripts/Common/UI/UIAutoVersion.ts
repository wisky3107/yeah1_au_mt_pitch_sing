import { _decorator, Component, Label, Node } from 'cc';
import { EDITOR } from 'cc/env';
import { Utils } from '../Utils';
const { ccclass, property } = _decorator;

@ccclass('UIAutoVersion')
export class UIAutoVersion extends Component {
    @property(Label)
    lbVersion: Label = null;

    protected start(): void {
        const propertyData = {};
    }

    public onFocusInEditor(): void {
        if (EDITOR) {
            this.lbVersion.string = Utils.formatDate(new Date(), 'yyyyMMddhhmmss');
        }
    }
}


