import { _decorator, CCInteger, Component, Label, Node, Tween } from 'cc';
import { Utils } from '../Utils';
const { ccclass, property } = _decorator;

@ccclass('UIName')
export class UIName extends Label {
    @property(CCInteger)
    limitChar: number = 15;

    public setName(value: string) {
        const headTailCount = Math.round((this.limitChar - 3) / 2.0);
        this.string = Utils.truncateString(value, this.limitChar, headTailCount, headTailCount);
    }
}


