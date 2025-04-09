import { _decorator, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
import { InventoryItemModelBase, ItemRarity } from '../../../Models/InventoryItemModel';
import { resourceUtil } from '../../../Common/resourceUtil';
const { ccclass, property } = _decorator;

/**
 * Displays an inventory item in a scrollview
 */
@ccclass('InventoryItemView')
export class InventoryItemView extends Component {
    @property(Sprite)
    private sprIcon: Sprite = null;

    @property(Label)
    private lbName: Label = null;

    @property(Node)
    private nodeSelected: Node = null;

    @property(Node)
    private nodeLocked: Node = null;

    @property(Node)
    private nodeRarity: Node = null;

    private _itemData: InventoryItemModelBase = null;
    private _callback: (item: InventoryItemModelBase) => void = null;

    /**
     * Initialize the item view
     * @param item Item data
     * @param callback Selection callback
     */
    public init(item: InventoryItemModelBase, callback: (item: InventoryItemModelBase) => void): void {
        this._itemData = item;
        this._callback = callback;

        // Set item name
        if (this.lbName) {
            this.lbName.string = item.name;
        }

        // Load icon
        if (this.sprIcon && item.iconPath) {
            resourceUtil.loadRes(item.iconPath, SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    console.error('Failed to load item icon:', err);
                    return;
                }
                if (this.sprIcon && this.sprIcon.isValid) {
                    this.sprIcon.spriteFrame = spriteFrame;
                }
            });
        }

        // Set selection state
        if (this.nodeSelected) {
            this.nodeSelected.active = item.isSelected ?? false;
        }

        // Set locked state
        if (this.nodeLocked) {
            this.nodeLocked.active = item.isLocked ?? false;
        }

        // Set rarity indicator
        if (this.nodeRarity) {
            this.nodeRarity.active = true;
            this.updateRarityVisual(item.rarity);
        }
    }

    /**
     * Handle item click
     */
    public onTouch_Item(): void {
        if (this._itemData.isLocked) {
            return; // Don't allow selecting locked items
        }

        if (this._callback) {
            this._callback(this._itemData);
        }
    }

    /**
     * Update the selection state
     * @param selected Whether the item is selected
     */
    public setSelected(selected: boolean): void {
        if (this.nodeSelected) {
            this.nodeSelected.active = selected;
        }
        
        if (this._itemData) {
            this._itemData.isSelected = selected;
        }
    }

    /**
     * Update the visual representation of item rarity
     * @param rarity Item rarity level
     */
    private updateRarityVisual(rarity: ItemRarity): void {
        if (!this.nodeRarity) return;
        
        // You would implement this based on your UI design
        // For example, different colors or badges for different rarities
        switch(rarity) {
            case ItemRarity.Common:
                // Common rarity visual
                break;
            case ItemRarity.Uncommon:
                // Uncommon rarity visual
                break;
            case ItemRarity.Rare:
                // Rare rarity visual
                break;
            case ItemRarity.Epic:
                // Epic rarity visual
                break;
            case ItemRarity.Legendary:
                // Legendary rarity visual
                break;
        }
    }
} 