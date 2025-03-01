import { _decorator, Component, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ObjectPoolData')
export class ObjectPoolData {
    @property(Prefab)
    prefab: Prefab = null;

    @property(Node)
    container: Node = null;
}


