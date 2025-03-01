import { _decorator, Component, Node, Prefab, Vec3, instantiate, director, RigidBody, Enum, tween, v3, easing, SkeletalAnimation, AnimationState } from 'cc';
import { EDITOR } from 'cc/env';
import { ProjectileMath } from './ProjectileMath';
import { TrajectoryDrawer } from './TrajectoryDrawer';
import { VectorUtil } from './utils/VectorUtil';
import { Bullet } from './Bullet';
import { AudioManager } from '../../../Scripts/Common/audioManager';

const { ccclass, property } = _decorator;


enum Mode {
    FIXED_ALL = 1,
    FIXED_PITCH_ANGLE = 2,
    FIXED_VELOCITY = 3,
    UNFIXED = 4,
}


@ccclass('Cannon')
export class Cannon extends Component {
    @property({ type: Node, displayName: 'yawAxis', group: { name: 'Configs', id: '1' } })
    protected yawAxis: Node = null;

    @property({ type: Node, displayName: 'pitchAxis', group: { name: 'Configs', id: '1' } })
    protected pitchAxis: Node = null;

    @property({ type: Node, displayName: 'firePoint', group: { name: 'Configs', id: '1' } })
    protected firePoint: Node = null;

    @property({ type: Prefab, displayName: 'bulletPrefab', group: { name: 'model', id: '2' } })
    protected bulletPrefab: Prefab = null;

    @property({ type: Node, group: { name: 'model', id: '2' } })
    protected bulletContainer: Node = null;

    @property({ type: Enum(Mode), displayName: 'mode', group: { name: 'settings', id: '3' } })
    public mode: Mode = Mode.FIXED_PITCH_ANGLE;

    @property({ displayName: 'fixedPitchAngle', visible() { return (this.mode === Mode.FIXED_PITCH_ANGLE || this.mode === Mode.FIXED_ALL); }, group: { name: 'settings', id: '3' } })
    public fixedPitchAngle: number = -45;

    @property({ displayName: 'fixedVelocity', visible() { return (this.mode === Mode.FIXED_VELOCITY || this.mode === Mode.FIXED_ALL); }, group: { name: 'settings', id: '3' } })
    public fixedVelocity: number = 5;

    @property({ displayName: 'useSmallPitchAngle', visible() { return (this.mode === Mode.FIXED_VELOCITY); }, group: { name: 'settings', id: '3' } })
    public useSmallPitchAngle: boolean = false;

    @property({ type: TrajectoryDrawer, displayName: 'trajectoryDrawer', group: { name: 'trajectory', id: '4' } })
    protected trajectoryDrawer: TrajectoryDrawer = null;

    @property
    protected _showTrajectory: boolean = true;
    @property({ displayName: 'showTrajectory', visible() { return (this.trajectoryDrawer != null); }, group: { name: 'trajectory', id: '4' } })
    public get showTrajectory() {
        return this._showTrajectory;
    }
    public set showTrajectory(value) {
        this._showTrajectory = value;
        if (!EDITOR && this.trajectoryDrawer) {
            if (value) {
                this.curTargetPos && this.aim(this.curTargetPos);
            } else {
                this.trajectoryDrawer.clear();
            }
        }
    }

    protected velocity: number = 0;

    public get pitch() {
        return this.pitchAxis.eulerAngles.x;
    }
    protected set pitch(value: number) {
        this.pitchAxis.setRotationFromEuler(value, 0, 0);
    }

    public get yaw() {
        return this.yawAxis.eulerAngles.y;
    }
    protected set yaw(value: number) {
        this.yawAxis.setRotationFromEuler(0, value, 0);
    }

    protected get mainPosition() {
        return this.yawAxis.getWorldPosition();
    }

    protected get mainForward() {
        return this.yawAxis.parent.forward.negative();
    }

    protected get mainUp() {
        return this.yawAxis.up;
    }

    public static get Mode() {
        return Mode;
    }

    public curTargetPos: Vec3 = new Vec3(0, 0.753, -7.671);

    public rotateTo(pitch: number, yaw: number) {
        this.pitch = pitch;
        this.yaw = yaw;
    }

    public aim(targetPos: Vec3) {
        this.curTargetPos.set(targetPos);

        const direction = Vec3.subtract(new Vec3, targetPos, this.mainPosition);
        const yawAngle = -VectorUtil.signedAngle(direction, this.mainForward, this.mainUp);

        let pitchAngle = NaN, time = NaN,
            velocity = NaN;
        let fixedTrajectoryDistance = false;
        switch (this.mode) {
            case Mode.FIXED_ALL: {
                pitchAngle = this.fixedPitchAngle;
                velocity = this.fixedVelocity;
                fixedTrajectoryDistance = true;
                break;
            }
            case Mode.FIXED_PITCH_ANGLE: {
                pitchAngle = this.fixedPitchAngle;
                velocity = this.calculateVelocity(targetPos, -pitchAngle);
                break;
            }
            case Mode.FIXED_VELOCITY: {
                velocity = this.fixedVelocity;
                const { angle1, angle2 } = this.calculateAngle(targetPos, velocity);
                if (!isNaN(angle1) && !isNaN(angle2)) {
                    if (this.useSmallPitchAngle) {
                        pitchAngle = -Math.min(angle1, angle2);
                    } else {
                        pitchAngle = -Math.max(angle1, angle2);
                    }
                } else {
                    fixedTrajectoryDistance = true;
                }
                break;
            }
            case Mode.UNFIXED: {
                const result = this.calculateWithMaxHeight(targetPos);
                pitchAngle = -result.angle;
                velocity = result.velocity;
                time = result.time;
                break;
            }
        }

        if (isNaN(pitchAngle)) {
            pitchAngle = this.pitch;
        }
        this.rotateTo(pitchAngle, yawAngle);

        if (!isNaN(velocity)) {
            this.velocity = velocity;
        }

        if (this.trajectoryDrawer) {
            this.drawTrajectory(targetPos, -this.pitch, this.velocity, fixedTrajectoryDistance);
        }

        return {
            time,
            velocity,
            pitchAngle
        }
    }

    //return time to target
    public fire(targetPos?: Vec3): { flyTime: number, bullet: Bullet } {
        let flyTime = 0.0;
        if (targetPos) {
            let { time } = this.aim(targetPos);
            flyTime = time;
        }
        const bullet = this.shoot(this.velocity);

        //do anim here
        tween(this.yawAxis)
            .to(0.1, { position: v3(0.0, -0.1, 0.035) })
            .to(0.35, { position: v3(0.0, 0.0, 0.0) }, { easing: easing.quartOut })
            .start();

        return { flyTime, bullet };
    }

    protected shoot(velocity: number): Bullet {
        const bulletNode = this.generateBullet();
        const direction = bulletNode.forward.negative();
        direction.multiplyScalar(velocity);
        const bullet = bulletNode.getComponent(Bullet);
        bullet.shootWithVelocity(direction);

        return bullet;
    }

    protected drawTrajectory(targetPos: Vec3, angle: number, velocity: number, fixedDistance: boolean) {
        const firePos = this.firePoint.getWorldPosition();
        if (fixedDistance) {
            const distance = ProjectileMath.calculateDisplacementAtMoment(angle, velocity, 2).x;
            this.trajectoryDrawer.draw(firePos, targetPos, angle, velocity, distance);
        } else {
            this.trajectoryDrawer.draw(firePos, targetPos, angle, velocity);
        }
    }

    protected generateBullet() {
        const node = instantiate(this.bulletPrefab);
        director.getScene().addChild(node);
        node.setWorldPosition(this.firePoint.getWorldPosition());
        node.setWorldRotation(this.firePoint.getWorldRotation());
        return node;
    }

    protected calculateDisplacement(targetPos: Vec3) {
        const firePos = this.firePoint.getWorldPosition(),
            direction = Vec3.subtract(new Vec3, targetPos, firePos);
        const vertical = direction.y;
        const horizontal = VectorUtil.projectOnPlane(direction, Vec3.UP).length();
        return { horizontal, vertical };
    }

    protected calculateVelocity(targetPos: Vec3, angle: number) {
        const { horizontal, vertical } = this.calculateDisplacement(targetPos);
        return ProjectileMath.calculateWithAngle(horizontal, vertical, angle);
    }

    protected calculateAngle(targetPos: Vec3, velocity: number) {
        const { horizontal, vertical } = this.calculateDisplacement(targetPos);
        return ProjectileMath.calculateWithVelocity(horizontal, vertical, velocity);
    }

    protected calculateWithMaxHeight(targetPos: Vec3) {
        const { horizontal, vertical } = this.calculateDisplacement(targetPos);
        const maxHeight = Math.max(0.5, vertical + (horizontal * 0.3));  // 最大高度
        return ProjectileMath.calculateWithMaxHeight(horizontal, vertical, maxHeight);
    }

    //#region animations

    @property({ type: [SkeletalAnimation], group: { name: "Animation", id: "5" } })
    shootAnimations: SkeletalAnimation[] = [];

    private shootAnimationState: AnimationState[] = [];
    public fireWithAnimation(pos: Vec3, onContact: Function) {
        this.shootAnimationState = [];
        this.shootAnimations.forEach(anim => {
            const state = anim.getState("Shoot");
            state.speed = 1.0;
            state.time = 0.0;
            state.play();
            this.shootAnimationState.push(state);
        })

        this.scheduleOnce(() => {
            const { flyTime, bullet } = this.fire(pos);
            this.scheduleOnce(() => {
                onContact?.(bullet);
            }, flyTime);

            AudioManager.instance.playSound("sfx_CannonWars_Shoot");
        }, 0.6);
    }

    //#endregion

}
