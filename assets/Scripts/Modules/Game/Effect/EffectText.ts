import { _decorator, Color, Component, Label, Node, Sprite } from 'cc';
import { EffectTime } from './EffectTime';
import { EffectBase } from './EffectBase';
import { tween } from 'cc';
import { Vec3 } from 'cc';
import { v3 } from 'cc';
import { UIOpacity } from 'cc';
import { easing } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EffectText')
export class EffectText extends EffectTime {
    @property(Label)
    lbMain: Label = null;

    @property(UIOpacity)
    opMain: UIOpacity = null;

    public init(define: string, recycleMe: (effect: EffectBase) => void, data: any): void {
        super.init(define, recycleMe, data);
        const { text, color, time, size, distance } = data;

        //init values 
        this.lbMain.string = text ?? "NULL";
        this.lbMain.color = color ?? Color.WHITE;
        this.lbMain.fontSize = size ?? 60;

        this.node.scale = v3(1.2, 1.2);
        this.opMain.opacity = 255;
        const animTime = time ?? 0.5;
        const moveDistance = distance ?? 100.0;

        tween(this.node)
            .to(animTime, { scale: Vec3.ONE }, { easing: easing.quadIn })
            .start();

        tween(this.node)
            .by(animTime, { worldPosition: v3(0.0, moveDistance, 0.0) }, { easing: easing.quadIn })
            .start();

        tween(this.opMain)
            .to(animTime, { opacity: 0 }, { easing: easing.quartIn })
            .start();
    }
}


