import { _decorator, Component, input, Input, EventTouch, Camera, Vec2, PhysicsSystem, EventMouse, sys, Vec3, Tween, tween } from 'cc';
import { Cannon } from './Cannon';
import { Cursor } from './Cursor';

const { ccclass, property } = _decorator;

@ccclass('ProjectileController')
export class ProjectileController extends Component {

    @property({ type: Camera })
    protected camera: Camera = null!;

    @property({ type: Cannon })
    protected cannon: Cannon = null!;

    @property({ type: Cursor })
    protected cursor: Cursor = null!;

    public isActive = false;

    protected onLoad() {
        // this.registerEvent();
    }

    protected onDestroy() {
        // this.unregisterEvent();
    }

    protected update(dt: number): void {
        this.updateAimPosition(dt);
    }

    protected registerEvent() {
        if (sys.platform === sys.Platform.MOBILE_BROWSER) {
            input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
            input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        } else {
            input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
            input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
            input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        }
    }

    protected unregisterEvent() {
        if (sys.platform === sys.Platform.MOBILE_BROWSER) {
            input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
            input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        } else {
            input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
            input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
            input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        }
    }

    protected onTouchStart(event: EventTouch) {
        if (event.getAllTouches().length > 1) {
            return;
        }
        this.aimWithScreenPos(event.getLocation());
    }

    protected onTouchMove(event: EventTouch) {
        if (event.getAllTouches().length > 1) {
            return;
        }
        this.aimWithScreenPos(event.getLocation());
    }

    protected onTouchEnd(event: EventTouch) {
        if (event.getAllTouches().length > 0) {
            return;
        }
        this.aimWithScreenPos(event.getLocation());
        this.fire();
    }

    protected onMouseDown(event: EventMouse) {
        this.aimWithScreenPos(event.getLocation());
    }

    protected onMouseMove(event: EventMouse) {
        this.aimWithScreenPos(event.getLocation());
    }

    protected onMouseUp(event: EventMouse) {
        this.fire();
    }

    protected aimWithScreenPos(screenPos: Vec2) {
        if (!this.isActive) return;
        const ray = this.camera.screenPointToRay(screenPos.x, screenPos.y);
        if (!PhysicsSystem.instance.raycastClosest(ray)) {
            return;
        }

        const raycastClosest = PhysicsSystem.instance.raycastClosestResult;
        const hitPoint = raycastClosest.hitPoint;
        const hitNormal = raycastClosest.hitNormal;

        this.cannon.aim(hitPoint);
        this.cursor.set(hitPoint, hitNormal);
    }

    private aimValue: { value: number } = { value: 0 };
    private tweenAim: Tween<{ value: number }> = null;
    private beginAimPosition: Vec3 = null;
    private targetAimPosition: Vec3 = null;

    public aimToPosition(position: Vec3, duration: number = 0.0, callback: Function = null) {
        if (duration <= 0) {
            this.cannon.aim(position);
            this.cursor.set(position, Vec3.FORWARD);
            return;
        }

        this.aimValue.value = 0;
        this.beginAimPosition = this.cannon.curTargetPos.clone();
        this.targetAimPosition = position.clone();
        this.tweenAim?.stop();
        this.tweenAim = tween(this.aimValue)
            .to(duration, { value: 1.0 })
            .call(() => {
                this.tweenAim = null;
                this.cannon.aim(this.targetAimPosition);
                this.cursor.set(this.targetAimPosition, Vec3.FORWARD);
                callback?.();
            })
            .start();
    }

    private updateAimPosition(dt: number) {
        if (this.tweenAim === null) return;
        const aimPosition = Vec3.lerp(new Vec3(), this.beginAimPosition, this.targetAimPosition, this.aimValue.value);
        this.cannon.aim(aimPosition);
        this.cursor.set(aimPosition, Vec3.FORWARD);
    }

    public fire() {
        this.cannon.fire();
    }

}
