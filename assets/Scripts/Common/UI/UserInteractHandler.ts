import { _decorator, Component, Event, EventMouse, EventTouch, Node, NodeEventType, RangedDirectionalLight, Vec2, warnID } from 'cc';
import { UserInteractEventType } from '../../Constant/Defines';
const { ccclass, property } = _decorator;

export class EventBase {
    public type: UserInteractEventType = UserInteractEventType.NONE;
    public data: any = null;
}

@ccclass('TouchController')
export class UserInteractHandler extends Component {
    @property(Node)
    listenerNode: Node = null;

    protected onLoad(): void {
        this.initInteracting();
    }

    protected onDestroy(): void {

    }

    //#region observer

    private listeners: { [key: string]: Function[] } = {};

    addListener(eventType: UserInteractEventType, listener: Function) {
        if (!this.listeners[eventType]) {
            this.listeners[eventType] = [];
        }
        this.listeners[eventType].push(listener);
    }

    removeListener(eventType: UserInteractEventType, listener: Function) {
        if (this.listeners[eventType]) {
            const index = this.listeners[eventType].indexOf(listener);
            if (index > -1) {
                this.listeners[eventType].splice(index, 1);
            }
        }
    }

    dispatchEvent(event: EventBase) {
        if (this.listeners[event.type]) {
            this.listeners[event.type].forEach(listener => listener(event.data));
        }
    }
    //#endregion

    //#region interacting
    initialDistance = null;
    startTouchPos = null;
    isTouchMoveTrigger = false;
    lastDragPos = null;
    
    public resetValues() {
        this.startTouchPos = null;
        this.initialDistance = null;
        this.lastDragPos = null;
    }

    private initInteracting() {
        this.listenerNode.on(NodeEventType.MOUSE_WHEEL, (event: EventMouse) => {
            const dispatchEvent: EventBase = new EventBase();
            dispatchEvent.type = UserInteractEventType.ZOOM;
            dispatchEvent.data = -event.getScrollY() / 10.0;
            this.dispatchEvent(dispatchEvent);
        }, this);

        this.listenerNode.on(NodeEventType.TOUCH_START, this.onTouchStart, this);
        this.listenerNode.on(NodeEventType.TOUCH_MOVE, this.onTouchMove, this);
        this.listenerNode.on(NodeEventType.TOUCH_END, this.onTouchEnd, this);
        this.listenerNode.on(NodeEventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.listenerNode.on(NodeEventType.MOUSE_ENTER, this.onHoverBackground, this);
    }

    private onHoverBackground(event: EventTouch) {
        const dispatchEvent: EventBase = new EventBase();
        dispatchEvent.type = UserInteractEventType.HOVER;
        this.dispatchEvent(dispatchEvent);
    }

    private onTouchStart(event: EventTouch) {
        if (event.getTouches().length === 2) {
            this.initialDistance = this.getDistanceBetweenTouches(event);
        }
        if (event.getTouches().length === 1) {
            this.startTouchPos = event.getTouches()[0].getLocation();
        }
        this.isTouchMoveTrigger = false;
    }

    private onTouchMove(event: EventTouch) {
        if (event.getTouches().length === 2) {
            const currentDistance = this.getDistanceBetweenTouches(event);
            const scale = currentDistance - this.initialDistance;
            // this.initialDistance = currentDistance;

            const dispatchEvent: EventBase = new EventBase();
            dispatchEvent.type = UserInteractEventType.ZOOM;
            let weight = -0.01;
            dispatchEvent.data = (scale) * weight;
            this.dispatchEvent(dispatchEvent);
            this.isTouchMoveTrigger= true;
        }
        else if (event.getTouches().length === 1) {
            const currentTouchPos = event.getTouches()[0].getLocation();
            const dispatchEvent: EventBase = new EventBase();
            dispatchEvent.type = UserInteractEventType.DRAG;
            dispatchEvent.data = { start: this.lastDragPos == null ? this.startTouchPos : this.lastDragPos, current: currentTouchPos };
            this.dispatchEvent(dispatchEvent);
            this.isTouchMoveTrigger = true;
            this.lastDragPos = currentTouchPos.clone();
        }
    }

    private onTouchEnd(event: EventTouch) {
        if (event.getTouches().length < 2) {
            this.initialDistance = null;
            this.lastDragPos = null;
            if (this.isTouchMoveTrigger == false) {
                const dispatchEvent: EventBase = new EventBase();
                dispatchEvent.type = UserInteractEventType.TOUCH;
                dispatchEvent.data = this.startTouchPos;
                this.dispatchEvent(dispatchEvent);
            }
        }

        if (event.getTouches().length === 0 && this.startTouchPos) {
            const endTouchPos = event.getTouches()[0].getLocation();
            if (Vec2.distance(endTouchPos, this.startTouchPos) > 100.0) {

                const dispatchEvent: EventBase = new EventBase();
                dispatchEvent.type = UserInteractEventType.SWIPE;
                dispatchEvent.data = { start: this.startTouchPos, end: endTouchPos }
                this.dispatchEvent(dispatchEvent);
            }
        }
        
        const dispatchEvent: EventBase = new EventBase();
        dispatchEvent.type = UserInteractEventType.END_INTERACTED;
        this.dispatchEvent(dispatchEvent);
        
        this.startTouchPos = null;
    }

    private getDistanceBetweenTouches(event: EventTouch): number {
        const touches = event.getTouches();
        const touch1 = touches[0].getLocation();
        const touch2 = touches[1].getLocation();
        return Vec2.distance(touch1, touch2);
    }

    //#endregion
}


