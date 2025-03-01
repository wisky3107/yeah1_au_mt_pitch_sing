import { _decorator, Component, Node, Collider, ICollisionEvent, Vec3 } from 'cc';
import { EffectManger } from './EffectManger';
import { GameConstant } from '../../../Scripts/Constant/Constants';

const { ccclass, property } = _decorator;

@ccclass('Bullet')
export class Bullet extends Component {
    //#region simulate physic 
    private gravity: number = -18;
    private elapsedTime: number = 0;
    private initialVelocity: Vec3 = new Vec3(0, 0, 0);
    private initialPosition: Vec3 = new Vec3();

    shootWithVelocity(initialVelocity: Vec3) {
        // Initialize start time and initial position
        this.gravity = -GameConstant.GAME.PHYSIC_GRAVITY;
        this.elapsedTime = 0;
        this.initialVelocity = initialVelocity;
        this.initialPosition.set(this.node.position);
    }

    stop() {
        this.initialVelocity = Vec3.ZERO.clone();
    }

    update(deltaTime: number) {
        this.elapsedTime += deltaTime;
        // Calculate new position
        const newPos = this.calculatePosition(this.elapsedTime);

        // Update the position of the cannon shell
        this.node.setPosition(newPos);
    }

    calculatePosition(time: number): Vec3 {
        const newPos = new Vec3();

        // Calculate the x position
        newPos.x = this.initialPosition.x + this.initialVelocity.x * time;

        // Calculate the y position
        newPos.y = this.initialPosition.y + this.initialVelocity.y * time + 0.5 * this.gravity * time * time;

        // z position (optional, if you want 3D motion)
        newPos.z = this.initialPosition.z + this.initialVelocity.z * time;

        return newPos;
    }

    //#endregion

}
