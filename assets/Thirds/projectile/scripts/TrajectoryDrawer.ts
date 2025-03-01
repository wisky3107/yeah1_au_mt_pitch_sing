import { _decorator, Component, Node, Vec3, Prefab, instantiate, Color, MeshRenderer, Quat, NodePool } from 'cc';
import { ProjectileMath } from './ProjectileMath';
import { VectorUtil } from './utils/VectorUtil';

const { ccclass, property } = _decorator;

@ccclass('TrajectoryDrawer')
export class TrajectoryDrawer extends Component {

    @property({ type: Prefab, displayName: 'prefab' })
    protected prefab: Prefab = null;

    @property({ displayName: 'fixedQuantity' })
    protected fixedQuantity: boolean = false;

    @property({ visible() { return this.fixedQuantity; }, displayName: 'quantity' })
    protected quantity: number = 20;

    protected points: Node[] = [];

    protected nodePool: NodePool = new NodePool;

    protected tempVec3: Vec3 = new Vec3;

    protected tempQuat: Quat = new Quat;

    public draw(startPos: Vec3, targetPos: Vec3, angle: number, velocity: number, fixedDistance?: number, maxDistance: number = 10.0) {
        const direction = Vec3.subtract(new Vec3, targetPos, startPos);
        const directionOnPlane = VectorUtil.projectOnPlane(direction, Vec3.UP);
        const distance = (fixedDistance != undefined) ? fixedDistance : directionOnPlane.length();
        // if (distance >= maxDistance) return;
        const time = ProjectileMath.calculateTotalTime(distance, angle, velocity);
        let count: number;
        if (this.fixedQuantity) {
            count = Math.ceil(this.quantity);
        } else {
            count = Math.max(8, Math.ceil(distance * 3));
        }
        const interval = time / count;

        this.producePoints(count);

        const forward = directionOnPlane.normalize();
        const points = this.points, tempVec3 = this.tempVec3, tempQuat = this.tempQuat;
        for (let i = 0; i < count; i++) {
            const node = points[i];
            node.active = true;

            const time = (i + 1) * interval;
            const { x, y } = ProjectileMath.calculateDisplacementAtMoment(angle, velocity, time);
            const position = startPos.clone();
            position.add(tempVec3.set(forward).multiplyScalar(x));
            position.add(tempVec3.set(Vec3.UP).multiplyScalar(y));
            node.setWorldPosition(position);

            const rotation = Quat.fromViewUp(tempQuat, forward, Vec3.UP);
            const pitch = -ProjectileMath.calculateAngleAtMoment(angle, velocity, time, true);
            Quat.rotateX(rotation, rotation, pitch);
            node.setWorldRotation(rotation);
        }
    }

    public clear() {
        this.producePoints(0);
    }

    public setColor(color: Color) {
        let renderer: MeshRenderer = this.prefab.data.getComponent(MeshRenderer);
        if (!renderer) {
            renderer = this.prefab.data.getComponentInChildren(MeshRenderer)
        }
        if (renderer) {
            renderer.sharedMaterial.setProperty('mainColor', color);
        }
    }

    protected producePoints(quantity: number) {
        const points = this.points;
        if (points.length < quantity) {
            let diff = quantity - points.length;
            while (diff > 0) {
                points.push(this.getPoint());
                diff--;
            }
        } else if (points.length > quantity) {
            let diff = points.length - quantity;
            while (diff > 0) {
                this.putPoint(points.pop());
                diff--;
            }
        }
    }
 
    protected getPoint() {
        let node: Node;
        if (this.nodePool.size() > 0) {
            node = this.nodePool.get();
        } else {
            node = instantiate(this.prefab);
        }
        node.setParent(this.node);
        return node;
    }
    protected putPoint(node: Node) {
        if (this.nodePool.size() < 50) {
            this.nodePool.put(node);
        } else {
            node.destroy();
        }
    }

}
