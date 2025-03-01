import { _decorator, Component, Node, ParticleSystem } from 'cc';
import { EffectBase } from './EffectBase';
const { ccclass, property } = _decorator;

@ccclass('EffectParticle')
export class EffectParticle extends EffectBase {
    @property(ParticleSystem)
    public particleSystems: ParticleSystem[] = [];

    public init(define: string, recycleMe: (effect: EffectBase) => void, data: any): void {
        super.init(define, recycleMe, data);
        this.particleSystems?.forEach(element => {
            element?.play();
        });
    }

    public stopParticle(delayKill: number = 4) {
        this.particleSystems?.forEach(element => {
            element?.stopEmitting();
        });

        this.scheduleOnce(() => {
            this.putToPool();
        }, delayKill)
    }
}


