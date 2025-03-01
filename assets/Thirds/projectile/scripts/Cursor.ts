import { _decorator, Component, Node, Vec3, Quat } from 'cc';
import { EDITOR } from 'cc/env';
import { VectorUtil } from './utils/VectorUtil';

const { ccclass, property } = _decorator;

@ccclass('Cursor')
export class Cursor extends Component {

    @property
    protected _adaptToSurface: boolean = false;
    @property({ displayName: 'adaptToSurface' })
    public get adaptToSurface() {
        return this._adaptToSurface;
    }
    public set adaptToSurface(value) {
        this._adaptToSurface = value;
        if (!EDITOR && !value) {
            this.node.setWorldRotation(Quat.fromEuler(new Quat, 0, 0, 0));
        }
    }

    @property({ type: Node, displayName: 'referNode', visible() { return this.adaptToSurface; } })
    public referNode: Node = null;

    protected tempVec3: Vec3 = new Vec3();

  
    protected tempQuat: Quat = new Quat();

    public set(position: Vec3, normal?: Vec3) {
        this.node.setWorldPosition(position);

        if (this.adaptToSurface && normal) {
            const referPos = this.referNode?.getWorldPosition() ?? Vec3.ZERO;
            const direction = Vec3.subtract(this.tempVec3, position, referPos);
            const forward = VectorUtil.projectOnPlane(direction, normal).normalize();
            const rotation = Quat.fromViewUp(this.tempQuat, forward, normal);
            this.node.setWorldRotation(rotation);
        }
    }

}
