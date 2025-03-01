import { _decorator, Component, Node, KeyCode, Input, EventKeyboard, input, Enum, ValueType } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Hotkey')
export class Hotkey extends Component {
    @property({type: [Enum(KeyCode)]})
    keys: KeyCode[] = [];

    private keyMap: Map<KeyCode, boolean> = new Map();

    onLoad() {
        this.keys.forEach(key => this.keyMap.set(key, false));
    }

    public getKeyString() {
        try {
            const keyStr = KeyCode[this.keys[0]];
            if (keyStr.length <= 2) return keyStr;
            const splitedStr = keyStr.split('_');
            return splitedStr[splitedStr.length - 1];
            }
        catch(e){
            return "";
        }
    }

    protected onEnable(): void {
        // Listen for key press and release events
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    protected onDisable() {
        // Remove event listeners when the component is destroyed
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event: EventKeyboard) {
        if (this.keyMap.has(event.keyCode)) {
            this.keyMap.set(event.keyCode, true);
             // Check if the key combination is pressed
             if (this.isKeyCombinationPressed()) {
                this.trigger();
            }
        }
    }

    onKeyUp(event: EventKeyboard) {
        if (this.keyMap.has(event.keyCode)) {
            this.keyMap.set(event.keyCode, false);
        }
    }

    isKeyCombinationPressed(): boolean {
        // Check if both Ctrl and S are pressed
        let isTrigger = true;
        this.keyMap.forEach((value, key) => {
            if (!value) {
                isTrigger = false;
            }
        })
        return isTrigger;
    }

    protected trigger() {
        
    }

}