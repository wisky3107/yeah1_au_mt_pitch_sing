import { Color } from 'cc';

/**
 * Base interface for all inventory items
 */
export interface InventoryItemModelBase {
    id: string;
    name: string;
    description?: string;
    iconPath: string;
    rarity: ItemRarity;
    isOwned: boolean;
    isSelected?: boolean;
    isLocked?: boolean;
}

/**
 * Interface for clothing items with category and character attachment point
 */
export interface ClothingModel extends InventoryItemModelBase {
    category: ClothingCategory;
    prefabPath: string;
    color?: Color;
}

/**
 * Interface for blind box items
 */
export interface BlindBoxModel extends InventoryItemModelBase {
    boxType: string;
    rewardPool: string[];
    openCost?: number;
}

/**
 * Interface for reward items (achievements, etc.)
 */
export interface RewardModel extends InventoryItemModelBase {
    rewardType: RewardType;
    rewardValue: number;
    claimed: boolean;
}

/**
 * Item rarity enum
 */
export enum ItemRarity {
    Common = 0,
    Uncommon = 1,
    Rare = 2,
    Epic = 3,
    Legendary = 4
}

/**
 * Clothing category enum
 */
export enum ClothingCategory {
    Hair = 0,
    Shirt = 1,
    Pants = 2,
    Shoes = 3
}

/**
 * Reward type enum
 */
export enum RewardType {
    Coins = 0,
    BlindBox = 1,
    ClothingItem = 2,
    Achievement = 3
}

/**
 * Inventory tab enum
 */
export enum InventoryTab {
    BlindBox = 0,
    Clothing = 1,
    Rewards = 2
} 