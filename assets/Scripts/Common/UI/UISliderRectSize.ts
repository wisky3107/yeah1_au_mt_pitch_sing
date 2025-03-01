import { _decorator, Component, Node, UITransform } from 'cc';
import { UISlider } from './UISlider';
const { ccclass, property } = _decorator;

@ccclass('UISliderRectSize')
export class UISliderRectSize extends UISlider {
    @property(UITransform)
    transSlider: UITransform = null;

    @property(UITransform)
    transMain: UITransform = null;

    private originalWidth: number = 0.0;

    public start(): void {
        this.originalWidth = this.transSlider.width;
        super.start();
    }

    updateSpriteFiller(value: number): void {
        this.transMain.width = value * this.originalWidth;
    }
}
