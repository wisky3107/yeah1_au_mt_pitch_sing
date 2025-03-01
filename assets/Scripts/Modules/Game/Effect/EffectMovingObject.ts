import { _decorator, Color, Component, easing, Label, Node, random, randomRangeInt, settings, Sprite, SpriteFrame, Tween, tween, v3, Vec2, Vec3 } from 'cc';
import { EffectBase } from './EffectBase';
const { ccclass, property } = _decorator;

@ccclass('EffectMovingObject')
export class EffectMovingObject extends EffectBase {
    @property(Sprite)
    sprtMain: Sprite = null;

    @property(Label)
    lbMain: Label = null;

    @property(Node)
    nodeFollow: Node = null;

    protected data: { onEnd: Function, destination: Vec3, spriteFrame: SpriteFrame, text: string, text2: string } = null;
    protected movingValue: { value: number } = { value: 0 };
    protected tweenValue: Tween<{ value: number }> = null;

    protected startPoint: Vec3 = null;
    protected endPoint: Vec3 = null;
    protected controlPoint1: Vec3 = null;
    protected controlPoint2: Vec3 = null;

    public scaleTime = 0.05;
    public holdTime = 0.15;
    public movingTime = 0.23;
    public finalScale = 0.5;

    protected onDisable(): void {
        this.tweenValue?.stop();
    }

    public init(define: string, recycleMe: (effect: EffectBase) => void, data: any): void {
        super.init(define, recycleMe, data);
        this.data = data;
        this.movingValue.value = 0;

        const setText = (text: string, scaleValue: number = 1.0) => {
            if (this.lbMain) {
                this.lbMain.string = text ?? "";
                this.lbMain.node.scale = v3(scaleValue * 1.5, scaleValue * 1.5);
                tween(this.lbMain.node)
                    .to(0.2, { scale: v3(scaleValue, scaleValue) })
                    .start();
            }
        }

        //inti uis
        if (this.sprtMain && this.data.spriteFrame) {
            this.sprtMain.spriteFrame = this.data.spriteFrame;
        }

        this.startPoint = this.node.worldPosition.clone();
        this.endPoint = this.data.destination.clone();
        [this.controlPoint1, this.controlPoint2] = this.calculateControlPoints(this.startPoint, this.endPoint, randomRangeInt(100.0, 250.0) * (random() >= 0.5 ? 1.0 : -1.0));

        //text effect 
        setText(this.data?.text ?? "");
        if (this.data.text2) {
            this.scheduleOnce(() => {
                setText(this.data.text2, 1.5);
            }, this.scaleTime + this.holdTime / 2.0)
        }

        this.doEffectSpriteMain();
        this.doEffectMoving();
    }

    public getTotalTime(): number {
        return this.scaleTime + this.holdTime + this.movingTime;
    }

    public setActive(isActive: boolean) {
        this.node.active = isActive;

        if (this.nodeFollow) {
            this.nodeFollow.active = false;
        }
    }

    public setParentForFollowNode(parent: Node) {
        if (this.nodeFollow) {
            this.nodeFollow.parent = parent;
            this.nodeFollow.setSiblingIndex(99);
        }
    }

    public doEffectSpriteMain() {
        //scale action
        //effect 
        this.node.scale = Vec3.ZERO;
        tween(this.node)
            .to(this.scaleTime, { scale: v3(1.5, 1.5, 1.5) }, { easing: easing.backOut })
            .delay(this.holdTime)
            .to(this.movingTime, { scale: v3(this.finalScale, this.finalScale, this.finalScale) }, { easing: easing.quartIn })
            .start();
    }

    public doEffectFade() {
        // const beginColor = this.sprtMain.color.clone();
        // beginColor.a = 255.0;

        // const endColor = beginColor.clone();
        // endColor.a = 0.0;

        // this.sprtMain.color = beginColor;
        // tween(this.sprtMain)
        // .delay(this.holdTime + this.scaleTime)
        // .to(this.movingTime, { color: endColor }, { easing: easing.quartIn })
        // .start();
    }

    public doEffectMoving() {
        //moving action
        this.tweenValue = tween(this.movingValue)
            .delay(this.scaleTime + this.holdTime) //wait scale value
            .call(() => {
                //enable follow if have
                if (this.nodeFollow) {
                    this.nodeFollow.active = true;
                }
            })
            .to(this.movingTime, { value: 1 }, { easing: easing.quartIn })
            .call(() => {
                this.movingValue.value = 1;
                this.tweenValue = null;
                this.data.onEnd?.();
                this.putToPool();
            })
            .start();
    }

    protected update(dt: number): void {
        this.updatePosition();
    }

    protected updatePosition() {
        if (!this.tweenValue) return;
        this.node.worldPosition = this.cubicBezierPoint(this.startPoint, this.controlPoint1, this.controlPoint2, this.endPoint, this.movingValue.value);
        if (this.nodeFollow) {
            this.nodeFollow.worldPosition = this.node.worldPosition;
        }
    }

    protected cubicBezierPoint(startPoint: Vec3, controlPoint1: Vec3, controlPoint2: Vec3, endPoint: Vec3, t: number): Vec3 {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        const p = new Vec3();
        p.set(
            uuu * startPoint.x + 3 * uu * t * controlPoint1.x + 3 * u * tt * controlPoint2.x + ttt * endPoint.x,
            uuu * startPoint.y + 3 * uu * t * controlPoint1.y + 3 * u * tt * controlPoint2.y + ttt * endPoint.y,
            uuu * startPoint.z + 3 * uu * t * controlPoint1.z + 3 * u * tt * controlPoint2.z + ttt * endPoint.z
        );

        return p;
    }

    protected calculateControlPoints(startPoint: Vec3, endPoint: Vec3, factor: number): [Vec3, Vec3] {
        // Calculate direction vector from start to end
        const direction = endPoint.clone().subtract(startPoint).normalize();
        const perpendicular = new Vec3(-direction.y, direction.x);
        // Calculate control points based on the direction
        const controlPoint1 = startPoint.clone().add(perpendicular.clone().multiplyScalar(factor));
        const controlPoint2 = endPoint.clone().add(perpendicular.clone().multiplyScalar(factor));

        return [controlPoint1, controlPoint2];
    }

}


