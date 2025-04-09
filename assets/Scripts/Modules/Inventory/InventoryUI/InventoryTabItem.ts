import { _decorator, Button, Component, Label, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Represents a tab button in the inventory UI
 */
@ccclass('InventoryTabItem')
export class InventoryTabItem extends Component {
    @property(Node)
    private nodeSelected: Node = null;
    
    @property(Node)
    private nodeDeselected: Node = null;

    private index: number = 0;
    private tabName: string = '';
    private _callback: (index: number) => void = null;

    /**
     * Initialize the tab item
     * @param index Tab index
     * @param name Tab name
     * @param callback Selection callback
     */
    public init(index: number, name: string, callback: (index: number) => void): void {
        this.index = index;
        this.tabName = name;
        this._callback = callback;
        this.setSelected(false);
    }

    /**
     * Set the tab's selection state
     * @param selected Whether the tab is selected
     */
    public setSelected(selected: boolean): void {
        if (this.nodeSelected) {
            this.nodeSelected.active = selected;
        }
        if (this.nodeDeselected) {
            this.nodeDeselected.active = !selected;
        }
    }

    /**
     * Handle tab click
     */
    public onTouch_Tab(): void {
        if (this._callback) {
            this._callback(this.index);
        }
    }
} 