import { _decorator, Component, Node, Slider, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UISlider')
export class UISlider extends Slider {

    @property(Sprite)
    spriteFiller: Sprite = null;

    @property([Node])
    objectsOff: Node[] = [];

    @property([Node])
    objectsOn: Node[] = [];

    start() {
        this.node.on('slide', this.onSliderChange, this);
        this.onSliderChange();
    }

    onSliderChange() {
        const value = this.progress;
        this.updateSpriteFiller(value);
        this.updateObjects(value);
    }
    
    updateSpriteFiller(value: number) {
        if (this.spriteFiller) {
            // Assuming the sprite filler is scaled based on the slider value
            this.spriteFiller.node.setScale(value, 1, 1);
        }
    }

    updateObjects(value: number) {
        const isZero = value === 0;

        // Toggle visibility of objects in the first array
        for (let obj of this.objectsOff) {
            obj.active = isZero;
        }

        // Toggle visibility of objects in the second array
        for (let obj of this.objectsOn) {
            obj.active = !isZero;
        }
    }
}


