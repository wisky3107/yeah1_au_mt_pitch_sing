import { _decorator, Component, error, instantiate, math, Node, Prefab, Vec3, Vec4 } from 'cc';
import { EffectBase } from './Effect/EffectBase';
import { ComponentPool } from '../../Common/ComponentPool';
import { resourceUtil } from '../../Common/resourceUtil';
import { CurrentEnviroment, GameConstant } from '../../Constant/Constants';
const { ccclass, property } = _decorator;

@ccclass('EffectController')
export class EffectController extends Component {

    //#region singletons
    public static instance: EffectController = null;
    //#endregion
    preloadPrefabNames: string[] = [];

    protected onLoad(): void {
        EffectController.instance = this;
        this.initPool();
        this.preloadEffects();
    }
    protected onDestroy(): void {
        EffectController.instance = null;
    }

    @property(Node)
    uiEffectContainer: Node = null;

    protected start(): void {
        let points = [
            { x: 10, y: 10 },
            { x: 300, y: 300 },
            { x: 200, y: 100 },
            { x: 100, y: 100 },
        ];

        this.initPool();
    }

    //#endregion pooling

    private preloadEffects() {
        this.preloadPrefabNames.forEach(effect => {
            if (this.effectPoolMap.has(effect) == false) {
                resourceUtil.loadEffectRes(effect).then((prefab: Prefab) => {
                    this.effectPoolMap.set(effect, this.createPool<EffectBase>(prefab, this.uiEffectContainer, EffectBase));
                }).catch(error => {
                    if (CurrentEnviroment.LOG) console.error(error, effect)
                })
            }
        })
    }

    private initPool() {
    }

    protected createPool<T extends Component>(prefab: Prefab, container: Node, componentClass: new () => T, initValue: number = 1): ComponentPool<T> | null {
        if (!prefab || !container) return null;

        let retVal = new ComponentPool<T>(
            (): T => {
                const obj = instantiate(prefab);
                const component = obj.getComponent(componentClass);
                if (!component) {
                    console.warn("Component of the specified class not found in prefab.");
                    return null;
                }
                return component;
            }, container);

        retVal.init(initValue);
        return retVal;
    }

    //#endregion

    //#region effects

    private effectPoolMap: Map<string, ComponentPool<EffectBase>> = new Map();

    public putEffects(effects: EffectBase[], define: string) {
        this.effectPoolMap.get(define)?.putAll(effects);
    }

    public spawnResourceEffectAt(
        pos: Vec3,
        effect: string,
        parent: Node = null,
        data: any = null,
        cb: Function = () => { }) {
        let spawnEffect = () => {
            const objEffect = this.effectPoolMap?.get(effect)?.get();
            const define = effect;
            if (parent != null) {
                objEffect.node.parent = parent;
            }
            objEffect.node.setWorldPosition(pos);
            setTimeout(() => {
                objEffect.init(
                    define,
                    (effect) => {
                        this.effectPoolMap?.get(define)?.put(effect);
                    },
                    data);

                cb?.(objEffect);
            });
        }
        if (this.effectPoolMap.has(effect) == false) {
            resourceUtil.loadEffectRes(effect).then((prefab: Prefab) => {
                this.effectPoolMap.set(effect, this.createPool<EffectBase>(prefab, this.uiEffectContainer, EffectBase));
                spawnEffect();
            }).catch(error => {
                if (CurrentEnviroment.LOG) console.error(error, effect)
                cb?.(null, "could not find the effect prefab");
            })
        }
        else {
            spawnEffect();
        }
    }


    //#endregion
}


