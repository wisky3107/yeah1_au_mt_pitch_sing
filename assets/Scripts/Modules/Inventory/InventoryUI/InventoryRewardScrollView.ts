import { _decorator, Component, Node, Prefab } from 'cc';
import { ScrollAdapter, Holder, View, IElement } from '../../../Common/adapter';
import { RewardModel } from '../../../Models/InventoryItemModel';
const { ccclass, property } = _decorator;

/**
 * Reward item holder class
 */
class RewardHolder extends Holder<RewardModel> {
    private _item: any = null; // Replace with your actual item component

    protected onCreated(): void {
        this._item = this.node.getComponent('InventoryItemView');
    }

    protected onVisible(): void {
        if (this._item && this.data) {
            // Use a custom init method since onItemSelected isn't available directly on adapter
            this._item.init(this.data, (item: RewardModel) => {
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
 * Custom view class for Reward scroll view
 */
class RewardView extends View<RewardModel> {
    protected onVisible(): void {
        // Handle view becoming visible
    }

    protected onDisable(): void {
        // Handle view being disabled
    }
}

/**
 * Reward scroll view implementation
 */
@ccclass('InventoryRewardScrollView')
export class InventoryRewardScrollView extends ScrollAdapter<RewardModel> {
    @property(Node)
    private itemPrefab: Node = null;

    // Animation duration for scrolling
    private duration: number = 0.3;

    private _onItemSelected: (item: RewardModel) => void = null;

    /**
     * Initialize the scroll view
     * @param onItemSelected Callback when an item is selected
     */
    public init(onItemSelected: (item: RewardModel) => void): void {
        this._onItemSelected = onItemSelected;
    }

    /**
     * Get the prefab for an item
     */
    public getPrefab(data: RewardModel): Node | Prefab {
        return this.itemPrefab;
    }

    /**
     * Create holder for item management
     */
    public getHolder(node: Node, code: string): Holder<RewardModel> {
        return new RewardHolder(node, code, this);
    }

    /**
     * Create view for scroll management
     */
    public getView(): View<RewardModel> {
        return new RewardView(this);
    }

    /**
     * Initialize element properties
     */
    public initElement(element: IElement, data: RewardModel): void {
        // Set up element properties like wrap modes if needed
    }

    /**
     * Set items to display
     */
    public setItems(items: RewardModel[]): void {
        this.modelManager.clear();
        if (items && items.length > 0) {
            this.modelManager.insert(items);
        }
    }

    /**
     * Update an item in the list
     */
    public updateItem(item: RewardModel): void {
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
    public onItemSelected(item: RewardModel): void {
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