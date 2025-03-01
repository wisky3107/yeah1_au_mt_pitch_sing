import { _decorator, Component, EventHandheld, EventHandler, Node, Toggle } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property } = _decorator;

@ccclass('UIFastToggle')
export class UIFastToggle extends Toggle {
    @property([Node])
    nodes: Node[] = [];

    protected onLoad(): void {
        if (EDITOR) return;
        let eventHandler = new EventHandler();
        eventHandler.target = this.node;
        eventHandler.component = "UIFastToggle";
        eventHandler.handler = "updateNodesState";
        this.checkEvents.push(eventHandler);

        this.updateNodesState();
    }

    protected updateNodesState() {
        this.nodes.forEach(node => node.active = this.isChecked);
    }
}


