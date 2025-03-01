import { _decorator, Component, easing, Node, Tween, tween, v3, Vec2, Vec3 } from 'cc';
import { EffectBase } from './EffectBase';
const { ccclass, property } = _decorator;

@ccclass('EffectMovingObject')
export class EffectMovingObject extends EffectBase {
    private data: { onEnd: Function, destination: Vec3 } = null;
    private movingValue: { value: number } = { value: 0 };
    private tweenValue: Tween<{ value: number }> = null;

    private startPoint: Vec3 = null;
    private endPoint: Vec3 = null;
    private controlPoint1: Vec3 = null;
    private controlPoint2: Vec3 = null;

    protected onDisable(): void {
        this.tweenValue?.stop();
    }

    public init(define: string, recycleMe: (effect: EffectBase) => void, data: any): void {
        super.init(define, recycleMe, data);
        this.data = data;

        this.startPoint = this.node.worldPosition.clone();
        this.endPoint = this.data.destination.clone();
        [this.controlPoint1, this.controlPoint2] = this.calculateControlPoints(this.startPoint, this.endPoint, 500.0);

        //effect 
        this.node.scale = Vec3.ZERO;
        const scaleTime = 0.25;
        const holdTime = 0.5;
        const movingTime = 0.75;

        //scale action
        tween(this.node)
            .to(scaleTime, { scale: v3(1.5, 1.5, 1.5) }, { easing: easing.backOut })
            .delay(holdTime)
            .to(movingTime, { scale: v3(0.5, 0.5, 0.5) }, { easing: easing.quartIn })
            .start();

        //moving action
        this.tweenValue = tween(this.movingValue)
            .delay(scaleTime + holdTime) //wait scale value
            .to(movingTime, { value: 1 }, { easing: easing.quartIn })
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

    private updatePosition() {
        if (!this.tweenValue) return;
        this.node.worldPosition = this.cubicBezierPoint(this.startPoint, this.controlPoint1, this.controlPoint2, this.endPoint, this.movingValue.value);
    }

    private cubicBezierPoint(startPoint: Vec3, controlPoint1: Vec3, controlPoint2: Vec3, endPoint: Vec3, t: number): Vec3 {
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

    private calculateControlPoints(startPoint: Vec3, endPoint: Vec3, factor: number): [Vec3, Vec3] {
        // Calculate direction vector from start to end
        const direction = endPoint.clone().subtract(startPoint).normalize();
        const perpendicular = new Vec3(-direction.y, direction.x);
        // Calculate control points based on the direction
        const controlPoint1 = startPoint.clone().add(perpendicular.clone().multiplyScalar(factor));
        const controlPoint2 = endPoint.clone().add(perpendicular.clone().multiplyScalar(factor));

        return [controlPoint1, controlPoint2];
    }

}


