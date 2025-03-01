import { _decorator, Component, instantiate, Node, Prefab, random } from 'cc';
const { ccclass, property } = _decorator;
@ccclass('ComponentPool')
export class ComponentPool<T extends Component> {
    private pool: T[];
    private factory: () => T;
    private parentNode: Node;

    constructor(factory: () => T, parentNode: Node) {
        this.pool = [];
        this.factory = factory;
        this.parentNode = parentNode;
    }

    init(size: number): void {
        for (let i = 0; i < size; i++) {
            let component = this.factory();
            component.node.parent = this.parentNode;
            this.put(component);
        }
    }

    get(): T {
        if (this.pool.length > 0) {
            let component = this.pool.pop() as T;
            component.node.active = true; // Reactivate the node
            return component;
        } else {
            let component = this.factory();
            component.node.parent = this.parentNode;
            return component;
        }
    }

    put(item: T): void {
        item.node.active = false; // Deactivate the node
        item.node.parent = this.parentNode;
        this.pool.push(item);
    }

    putAll(items: T[]): void {
        items.forEach(item => this.put(item));
    }

    clear(): void {
        this.pool.forEach(component => {
            component.node.destroy(); // Or any other cleanup logic specific to your components
        });
        this.pool = [];
    }
}
