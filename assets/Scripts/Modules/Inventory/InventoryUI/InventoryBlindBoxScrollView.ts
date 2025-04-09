import { _decorator, Component, Node, Prefab } from 'cc';
import { ScrollAdapter, Holder, View, IElement } from '../../../Common/adapter';
import { BlindBoxModel } from '../../../Models/InventoryItemModel';
const { ccclass, property } = _decorator;

/**
 * BlindBox item holder class
 */
class BlindBoxHolder extends Holder<BlindBoxModel> {
    private _item: any = null; // Replace with your actual item component

    protected onCreated(): void {
        this._item = this.node.getComponent('InventoryItemView');
    }

    protected onVisible(): void {
        if (this._item && this.data) {
            // Use a custom init method since onItemSelected isn't available directly on adapter
            this._item.init(this.data, (item: BlindBoxModel) => {
                if (this.adapter && typeof (this.adapter as any).onItemSelected === 'function') {
                    (this.adapter as any).onItemSelected(item);
                }
            });
        }
    }

    protected onDisable(): void {
        // Clean up when recycled
    }
}

/**
 * Custom view class for BlindBox scroll view
 */
class BlindBoxView extends View<BlindBoxModel> {
    protected onVisible(): void {
        // Handle view becoming visible
    }

    protected onDisable(): void {
        // Handle view being disabled
    }
}

/**
 * BlindBox scroll view implementation
 */
@ccclass('InventoryBlindBoxScrollView')
export class InventoryBlindBoxScrollView extends ScrollAdapter<BlindBoxModel> {
    @property(Prefab)
    private itemPrefab: Prefab = null;

    // Animation duration for scrolling
    private duration: number = 0.3;

    private _onItemSelected: (item: BlindBoxModel) => void = null;

    /**
     * Initialize the scroll view
     * @param onItemSelected Callback when an item is selected
     */
    public init(onItemSelected: (item: BlindBoxModel) => void): void {
        this._onItemSelected = onItemSelected;
    }

    /**
     * Get the prefab for an item
     */
    public getPrefab(data: BlindBoxModel): Node | Prefab {
        return this.itemPrefab;
    }

    /**
     * Create holder for item management
     */
    public getHolder(node: Node, code: string): Holder<BlindBoxModel> {
        return new BlindBoxHolder(node, code, this);
    }

    /**
     * Create view for scroll management
     */
    public getView(): View<BlindBoxModel> {
        return new BlindBoxView(this);
    }

    /**
     * Initialize element properties
     */
    public initElement(element: IElement, data: BlindBoxModel): void {
        // Set up element properties like wrap modes if needed
    }

    /**
     * Set items to display
     */
    public setItems(items: BlindBoxModel[]): void {
        this.modelManager.clear();
        if (items && items.length > 0) {
            this.modelManager.insert(items);
        }
    }

    /**
     * Update an item in the list
     */
    public updateItem(item: BlindBoxModel): void {
        for (let i = 0; i < this.modelManager.length; i++) {
            const model = this.modelManager.get(i);
            if (model && model.data.id === item.id) {
                model.data = item;
                this.modelManager.update();
                break;
            }
        }
    }

    /**
     * Callback when an item is selected
     */
    public onItemSelected(item: BlindBoxModel): void {
        if (this._onItemSelected) {
            this._onItemSelected(item);
        }
    }

    /**
     * Scroll to a specific item
     */
    public scrollToItem(itemId: string): void {
        for (let i = 0; i < this.modelManager.length; i++) {
            const model = this.modelManager.get(i);
            if (model && model.data.id === itemId) {
                this.scrollManager.scrollToModelIndex(this.duration, i);
                break;
            }
        }
    }
} 