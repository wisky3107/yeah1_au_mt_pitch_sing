import { _decorator, Component, Node, ParticleSystem, ParticleSystem2D } from 'cc';
import { EffectBase } from './EffectBase';
import { AudioManager } from '../../../Common/audioManager';
const { ccclass, property } = _decorator;

@ccclass('EffectTime')
export class EffectTime extends EffectBase {
    @property
    public delayKillTime: number = 0;

    @property(ParticleSystem)
    public particleSystems: ParticleSystem[] = [];
    
    @property([ParticleSystem2D])
    public particleSystem2ds: ParticleSystem2D[] = [];

    public init(define: string, recycleMe: (effect: EffectBase) => void, data: any): void {
        super.init(define, recycleMe, data);

        this.particleSystems?.forEach(element => {
            element?.play();
        });

        this.particleSystem2ds?.forEach(element => {
            element.resetSystem();
        });
        
        this.scheduleOnce(() => {
            this.putToPool();
        }, this.delayKillTime)
    }
}


