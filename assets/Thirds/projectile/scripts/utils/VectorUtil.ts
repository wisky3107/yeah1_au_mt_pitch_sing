import { Vec3 } from "cc";

const rad2Deg = 180 / Math.PI;
const deg2Rad = Math.PI / 180;
const tempVec3 = new Vec3();

export class VectorUtil {

    public static projectOnPlane(vector: Vec3, planeNormal: Vec3) {

        const projectionLength = Vec3.dot(vector, planeNormal);
        const vectorOnPlane = tempVec3.set(planeNormal).multiplyScalar(projectionLength);
        return Vec3.subtract(new Vec3, vector, vectorOnPlane);
    }

    public static signedAngle(a: Vec3, b: Vec3, axis: Vec3) {
        const aOnAxisPlane = VectorUtil.projectOnPlane(a, axis);
        const bOnAxisPlane = VectorUtil.projectOnPlane(b, axis);
        const aNormalized = aOnAxisPlane.normalize();
        const bNormalized = bOnAxisPlane.normalize();
        const abNormal = Vec3.cross(new Vec3, aNormalized, bNormalized).normalize();

        const sign = Vec3.dot(abNormal, axis);
        const radian = Math.acos(Vec3.dot(aNormalized, bNormalized));
        return radian * sign * rad2Deg;
    }
}
