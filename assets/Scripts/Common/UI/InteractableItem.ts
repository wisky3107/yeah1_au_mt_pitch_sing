import { _decorator, Component, EventTouch, Node, NodeEventType, random, rect, UITransform, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('InteractableItem')
export class InteractableItem extends Component {
    @property(Node)
    nodeTouch: Node = null;

    //#region interaction
    public onSelected: (data: any) => {} = null;
    public onStart: (data: any) => {} = null;
    public onDrag: (data: any) => {} = null;
    public onHover: (data: any) => {} = null;
    public onEndInteracted: (data: any) => {} = null;
    public isInteracting = false;

    private passThroughNode: Node = null;
    private dragCount: number = 0;

    public setInteractable(isInteractable: boolean, eventThroughNode: Node = null) {
        this.passThroughNode = eventThroughNode;
        const interactedNode = this.nodeTouch ?? this.node;
        if (isInteractable) {
            interactedNode.on(NodeEventType.TOUCH_END, this.onTouchEnd, this);
            interactedNode.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
            interactedNode.on(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
            interactedNode.on(NodeEventType.MOUSE_ENTER, this.onMouseHover, this);
            interactedNode.on(NodeEventType.MOUSE_LEAVE, this.onMouseLeave, this);
        }
        else {
            interactedNode.off(NodeEventType.TOUCH_END, this.onTouchEnd, this);
            interactedNode.off(NodeEventType.TOUCH_START, this.onTouchStart, this);
            interactedNode.off(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
            interactedNode.off(NodeEventType.MOUSE_ENTER, this.onMouseHover, this);
            interactedNode.off(NodeEventType.MOUSE_LEAVE, this.onMouseLeave, this);
        }
    }

    private interactNode: Node = null;
    private transform: UITransform = null;
    private getTransform() {
        if (this.transform == null) {
            this.interactNode = this.nodeTouch ?? this.node;
            this.transform = this.interactNode.getComponent(UITransform);
        }

        return this.transform;
    }

    public isContainsPosition(pos: Vec2): boolean {
        const nodeSize = this.getTransform().contentSize;
        const nodeRect = rect(this.interactNode.position.x - nodeSize.width / 2, this.interactNode.position.y - nodeSize.height / 2, nodeSize.width, nodeSize.height);
        return nodeRect.contains(pos);
    }

    private onTouchEnd(event: EventTouch) {
        if (this.dragCount <= 4) {
            this.onSelected?.(this)
        }
        this.dragCount = 0;
        this.isInteracting = false;
        this.checkPassThroughNode(NodeEventType.TOUCH_END, event);
        this.onEndInteracted?.(this);
    }

    private onTouchStart(event: EventTouch) {
        this.dragCount = 0;
        this.isInteracting = true;
        this.checkPassThroughNode(NodeEventType.TOUCH_START, event);
        this.onStart?.(this)
    }

    private onTouchMove(event: EventTouch) {
        this.dragCount++;
        this.checkPassThroughNode(NodeEventType.TOUCH_MOVE, event);
        if (this.dragCount >= 4) {
            this.onDrag?.(this)
        }
    }

    private onMouseHover(event: EventTouch) {
        this.checkPassThroughNode(NodeEventType.MOUSE_ENTER, event);
        this.onHover?.(this);
    }

    private onMouseLeave(event: EventTouch) {
        this.checkPassThroughNode(NodeEventType.MOUSE_ENTER, event);
        this.isInteracting = false;
        this.onEndInteracted?.(this);
    }

    private checkPassThroughNode(eventType: NodeEventType, event: EventTouch) {
        if (!this.passThroughNode) return;
        this.passThroughNode.emit(eventType, event);
    }

    //#endregion
}


