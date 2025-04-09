import { Color } from 'cc';
import { DEBUG } from 'cc/env';
import { APIFakeData } from '../Managers/APIFakeData';
import { BlindBoxModel, ClothingCategory, ClothingModel, InventoryItemModelBase, ItemRarity, RewardModel, RewardType } from '../Models/InventoryItemModel';
import { APIError } from '../Managers/APIManager';
import api from '../Managers/APIManager';

/**
 * Complete inventory data structure
 */
export interface InventoryData {
    clothing: {
        hair: ClothingModel[];
        shirt: ClothingModel[];
        pants: ClothingModel[];
        shoes: ClothingModel[];
    };
    blindBoxes: BlindBoxModel[];
    rewards: RewardModel[];
}

// Initialize fake data for testing
if (DEBUG) {
    // Hair items
    const hairItems = [
        {
            id: 'hair_1',
            name: 'Regular Hair',
            description: 'A normal hairstyle',
            iconPath: 'textures/inventory/hair_1',
            rarity: ItemRarity.Common,
            isOwned: true,
            isSelected: true,
            category: ClothingCategory.Hair,
            prefabPath: 'prefab/skins/hair_1',
        },
        {
            id: 'hair_2',
            name: 'Cool Hair',
            description: 'A cool hairstyle',
            iconPath: 'textures/inventory/hair_2',
            rarity: ItemRarity.Uncommon,
            isOwned: true,
            isSelected: false,
            category: ClothingCategory.Hair,
            prefabPath: 'prefab/skins/hair_2',
        },
        {
            id: 'hair_3',
            name: 'Punk Hair',
            description: 'A punk hairstyle',
            iconPath: 'textures/inventory/hair_3',
            rarity: ItemRarity.Rare,
            isOwned: false,
            isLocked: true,
            category: ClothingCategory.Hair,
            prefabPath: 'prefab/skins/hair_3',
        },
        {
            id: 'hair_4',
            name: 'Fancy Hair',
            description: 'A fancy hairstyle',
            iconPath: 'textures/inventory/hair_4',
            rarity: ItemRarity.Epic,
            isOwned: false,
            isLocked: true,
            category: ClothingCategory.Hair,
            prefabPath: 'prefab/skins/hair_4',
        }
    ] as ClothingModel[];

    // Shirt items
    const shirtItems = [
        {
            id: 'shirt_1',
            name: 'T-Shirt',
            description: 'A simple t-shirt',
            iconPath: 'textures/inventory/shirt_1',
            rarity: ItemRarity.Common,
            isOwned: true,
            isSelected: true,
            category: ClothingCategory.Shirt,
            prefabPath: 'prefab/skins/shirt_1',
        },
        {
            id: 'shirt_2',
            name: 'Hoodie',
            description: 'A cool hoodie',
            iconPath: 'textures/inventory/shirt_2',
            rarity: ItemRarity.Uncommon,
            isOwned: true,
            isSelected: false,
            category: ClothingCategory.Shirt,
            prefabPath: 'prefab/skins/shirt_2',
        },
        {
            id: 'shirt_3',
            name: 'Jacket',
            description: 'A stylish jacket',
            iconPath: 'textures/inventory/shirt_3',
            rarity: ItemRarity.Rare,
            isOwned: false,
            isLocked: true,
            category: ClothingCategory.Shirt,
            prefabPath: 'prefab/skins/shirt_3',
        },
        {
            id: 'shirt_4',
            name: 'Fancy Shirt',
            description: 'A fancy shirt',
            iconPath: 'textures/inventory/shirt_4',
            rarity: ItemRarity.Epic,
            isOwned: false,
            isLocked: true,
            category: ClothingCategory.Shirt,
            prefabPath: 'prefab/skins/shirt_4',
        }
    ] as ClothingModel[];
    
    // Pants items
    const pantsItems = [
        {
            id: 'pants_1',
            name: 'Jeans',
            description: 'Regular jeans',
            iconPath: 'textures/inventory/pants_1',
            rarity: ItemRarity.Common,
            isOwned: true,
            isSelected: true,
            category: ClothingCategory.Pants,
            prefabPath: 'prefab/skins/pants_1',
        },
        {
            id: 'pants_2',
            name: 'Shorts',
            description: 'Comfortable shorts',
            iconPath: 'textures/inventory/pants_2',
            rarity: ItemRarity.Uncommon,
            isOwned: true,
            isSelected: false,
            category: ClothingCategory.Pants,
            prefabPath: 'prefab/skins/pants_2',
        },
        {
            id: 'pants_3',
            name: 'Fancy Pants',
            description: 'Fancy pants',
            iconPath: 'textures/inventory/pants_3',
            rarity: ItemRarity.Rare,
            isOwned: false,
            isLocked: true,
            category: ClothingCategory.Pants,
            prefabPath: 'prefab/skins/pants_3',
        },
        {
            id: 'pants_4',
            name: 'Special Pants',
            description: 'Special edition pants',
            iconPath: 'textures/inventory/pants_4',
            rarity: ItemRarity.Epic,
            isOwned: false,
            isLocked: true,
            category: ClothingCategory.Pants,
            prefabPath: 'prefab/skins/pants_4',
        }
    ] as ClothingModel[];
    
    // Shoes items
    const shoesItems = [
        {
            id: 'shoes_1',
            name: 'Sneakers',
            description: 'Casual sneakers',
            iconPath: 'textures/inventory/shoes_1',
            rarity: ItemRarity.Common,
            isOwned: true,
            isSelected: true,
            category: ClothingCategory.Shoes,
            prefabPath: 'prefab/skins/shoes_1',
        },
        {
            id: 'shoes_2',
            name: 'Running Shoes',
            description: 'Made for speed',
            iconPath: 'textures/inventory/shoes_2',
            rarity: ItemRarity.Uncommon,
            isOwned: true,
            isSelected: false,
            category: ClothingCategory.Shoes,
            prefabPath: 'prefab/skins/shoes_2',
        },
        {
            id: 'shoes_3',
            name: 'Boots',
            description: 'Sturdy boots',
            iconPath: 'textures/inventory/shoes_3',
            rarity: ItemRarity.Rare,
            isOwned: false,
            isLocked: true,
            category: ClothingCategory.Shoes,
            prefabPath: 'prefab/skins/shoes_3',
        },
        {
            id: 'shoes_4',
            name: 'Fancy Shoes',
            description: 'Fancy footwear',
            iconPath: 'textures/inventory/shoes_4',
            rarity: ItemRarity.Epic,
            isOwned: false,
            isLocked: true,
            category: ClothingCategory.Shoes,
            prefabPath: 'prefab/skins/shoes_4',
        }
    ] as ClothingModel[];
    
    // Blind boxes
    const blindBoxItems = [
        {
            id: 'blindbox_1',
            name: 'Common Box',
            description: 'Contains common items',
            iconPath: 'textures/inventory/box_1',
            rarity: ItemRarity.Common,
            isOwned: true,
            boxType: 'common',
            rewardPool: ['hair_1', 'shirt_1', 'pants_1', 'shoes_1'],
            openCost: 100,
        },
        {
            id: 'blindbox_2',
            name: 'Rare Box',
            description: 'Contains rare items',
            iconPath: 'textures/inventory/box_2',
            rarity: ItemRarity.Rare,
            isOwned: true,
            boxType: 'rare',
            rewardPool: ['hair_2', 'shirt_2', 'pants_2', 'shoes_2'],
            openCost: 200,
        },
        {
            id: 'blindbox_3',
            name: 'Epic Box',
            description: 'Contains epic items',
            iconPath: 'textures/inventory/box_3',
            rarity: ItemRarity.Epic,
            isOwned: false,
            isLocked: true,
            boxType: 'epic',
            rewardPool: ['hair_3', 'shirt_3', 'pants_3', 'shoes_3'],
            openCost: 500,
        },
        {
            id: 'blindbox_4',
            name: 'Legendary Box',
            description: 'Contains legendary items',
            iconPath: 'textures/inventory/box_4',
            rarity: ItemRarity.Legendary,
            isOwned: false,
            isLocked: true,
            boxType: 'legendary',
            rewardPool: ['hair_4', 'shirt_4', 'pants_4', 'shoes_4'],
            openCost: 1000,
        }
    ] as BlindBoxModel[];
    
    // Rewards
    const rewardItems = [
        {
            id: 'reward_1',
            name: 'Daily Login',
            description: 'Reward for logging in today',
            iconPath: 'textures/inventory/reward_coin',
            rarity: ItemRarity.Common,
            isOwned: true,
            rewardType: RewardType.Coins,
            rewardValue: 100,
            claimed: false,
        },
        {
            id: 'reward_2',
            name: 'Achievement Reward',
            description: 'Completed 10 songs',
            iconPath: 'textures/inventory/reward_box',
            rarity: ItemRarity.Uncommon,
            isOwned: true,
            rewardType: RewardType.BlindBox,
            rewardValue: 1,
            claimed: true,
        },
        {
            id: 'reward_3',
            name: 'Special Event',
            description: 'Participated in the event',
            iconPath: 'textures/inventory/reward_shirt',
            rarity: ItemRarity.Rare,
            isOwned: true,
            rewardType: RewardType.ClothingItem,
            rewardValue: 1,
            claimed: false,
        }
    ] as RewardModel[];
    
    // Set up the complete inventory data
    APIFakeData['inventory'] = {
        clothing: {
            hair: hairItems,
            shirt: shirtItems,
            pants: pantsItems,
            shoes: shoesItems
        },
        blindBoxes: blindBoxItems,
        rewards: rewardItems
    } as InventoryData;
    
    // Keep the old data structure for backward compatibility
    APIFakeData['inventory/clothing'] = hairItems;
    APIFakeData['inventory/clothing/hair'] = hairItems;
    APIFakeData['inventory/clothing/shirt'] = shirtItems;
    APIFakeData['inventory/clothing/pants'] = pantsItems;
    APIFakeData['inventory/clothing/shoes'] = shoesItems;
    APIFakeData['inventory/blindboxes'] = blindBoxItems;
    APIFakeData['inventory/rewards'] = rewardItems;
}

/**
 * Get the complete inventory data
 * @param callback Callback for response
 */
export function getInventory(
    callback: (data: InventoryData, error: APIError) => void
): void {
    const apiName = 'inventory';

    if (APIFakeData.isFakeData && DEBUG) {
        return callback?.(APIFakeData[apiName] as InventoryData, null);
    }

    api.request<InventoryData>(
        apiName,
        {
            method: 'GET',
            headers: api.getHeaders()
        },
        data => callback?.(data, null),
        error => callback?.(null, error)
    );
}

/**
 * Get clothing items by category
 * @param category The clothing category
 * @param callback Callback for response
 */
export function requestClothingByCategory(
    category: ClothingCategory,
    callback: (items: ClothingModel[], error: APIError) => void
): void {
    // For backward compatibility, first try to get from the unified inventory
    getInventory((data, error) => {
        if (error) {
            // Fall back to the individual endpoint
            const apiName = `inventory/clothing/${ClothingCategory[category].toLowerCase()}`;

            if (APIFakeData.isFakeData && DEBUG) {
                const items = APIFakeData[apiName] || [];
                return callback?.(items, null);
            }

            api.request<ClothingModel[]>(
                apiName,
                {
                    method: 'GET',
                    headers: api.getHeaders()
                },
                data => callback?.(data, null),
                error => callback?.([], error)
            );
            return;
        }

        // Extract the needed category from the unified data
        const categoryName = ClothingCategory[category].toLowerCase();
        const items = data.clothing[categoryName];
        callback?.(items || [], null);
    });
}

/**
 * Get all blind box items
 * @param callback Callback for response
 */
export function requestBlindBoxes(
    callback: (items: BlindBoxModel[], error: APIError) => void
): void {
    // For backward compatibility, first try to get from the unified inventory
    getInventory((data, error) => {
        if (error) {
            // Fall back to the individual endpoint
            const apiName = 'inventory/blindboxes';

            if (APIFakeData.isFakeData && DEBUG) {
                return callback?.(APIFakeData[apiName] || [], null);
            }

            api.request<BlindBoxModel[]>(
                apiName,
                {
                    method: 'GET',
                    headers: api.getHeaders()
                },
                data => callback?.(data, null),
                error => callback?.([], error)
            );
            return;
        }

        // Extract from the unified data
        callback?.(data.blindBoxes || [], null);
    });
}

/**
 * Get all reward items
 * @param callback Callback for response
 */
export function requestRewards(
    callback: (items: RewardModel[], error: APIError) => void
): void {
    // For backward compatibility, first try to get from the unified inventory
    getInventory((data, error) => {
        if (error) {
            // Fall back to the individual endpoint
            const apiName = 'inventory/rewards';

            if (APIFakeData.isFakeData && DEBUG) {
                return callback?.(APIFakeData[apiName] || [], null);
            }

            api.request<RewardModel[]>(
                apiName,
                {
                    method: 'GET',
                    headers: api.getHeaders()
                },
                data => callback?.(data, null),
                error => callback?.([], error)
            );
            return;
        }

        // Extract from the unified data
        callback?.(data.rewards || [], null);
    });
}

/**
 * Select/equip an item
 * @param itemId The ID of the item to select
 * @param category The category of the item
 * @param callback Callback for response
 */
export function selectItem(
    itemId: string,
    category: ClothingCategory,
    callback: (success: boolean, error: APIError) => void
): void {
    const apiName = 'inventory/use_item';

    if (APIFakeData.isFakeData && DEBUG) {
        // Update selected state in the unified fake data as well
        const categoryName = ClothingCategory[category].toLowerCase();
        const fakeData = APIFakeData['inventory'] as InventoryData;
        
        if (fakeData && fakeData.clothing && fakeData.clothing[categoryName]) {
            // Unselect all items in this category
            fakeData.clothing[categoryName].forEach(item => {
                item.isSelected = false;
            });
            
            // Select the specified item
            const item = fakeData.clothing[categoryName].find(item => item.id === itemId);
            if (item) {
                item.isSelected = true;
            }
            
            // Also update in individual category data
            const individualCategoryData = APIFakeData[`inventory/clothing/${categoryName}`] as ClothingModel[];
            if (individualCategoryData) {
                individualCategoryData.forEach(item => {
                    item.isSelected = item.id === itemId;
                });
            }
        }
        
        return callback?.(true, null);
    }

    api.request<{ success: boolean }>(
        apiName,
        {
            method: 'POST',
            headers: api.getHeaders(),
            body: JSON.stringify({ itemId, category })
        },
        data => callback?.(data.success, null),
        error => callback?.(false, error)
    );
}

/**
 * Open a blind box
 * @param boxId The ID of the blind box to open
 * @param callback Callback for response
 */
export function openBlindBox(
    boxId: string,
    callback: (item: InventoryItemModelBase, error: APIError) => void
): void {
    const apiName = 'inventory/open-box';

    if (APIFakeData.isFakeData && DEBUG) {
        // Get the box from the unified data
        const fakeData = APIFakeData['inventory'] as InventoryData;
        const box = fakeData.blindBoxes.find(b => b.id === boxId);
        
        if (!box || !box.isOwned) {
            return callback?.(null, { statusCode: 404, message: 'Box not found or not owned' });
        }
        
        // Get a random item from the reward pool
        const randomIndex = Math.floor(Math.random() * box.rewardPool.length);
        const rewardItemId = box.rewardPool[randomIndex];
        
        // Find the item in one of the clothing categories
        const categories = ['hair', 'shirt', 'pants', 'shoes'];
        let receivedItem: InventoryItemModelBase = null;
        
        for (const cat of categories) {
            if (fakeData.clothing[cat]) {
                const item = fakeData.clothing[cat].find(i => i.id === rewardItemId);
                if (item) {
                    item.isOwned = true;
                    item.isLocked = false;
                    receivedItem = item;
                    
                    // Update in individual data as well
                    const individualData = APIFakeData[`inventory/clothing/${cat}`] as ClothingModel[];
                    if (individualData) {
                        const individualItem = individualData.find(i => i.id === rewardItemId);
                        if (individualItem) {
                            individualItem.isOwned = true;
                            individualItem.isLocked = false;
                        }
                    }
                    
                    break;
                }
            }
        }
        
        return callback?.(receivedItem, null);
    }

    api.request<{ item: InventoryItemModelBase }>(
        apiName,
        {
            method: 'POST',
            headers: api.getHeaders(),
            body: JSON.stringify({ boxId })
        },
        data => callback?.(data.item, null),
        error => callback?.(null, error)
    );
}

/**
 * Claim a reward
 * @param rewardId The ID of the reward to claim
 * @param callback Callback for response
 */
export function claimReward(
    rewardId: string,
    callback: (success: boolean, error: APIError) => void
): void {
    const apiName = 'inventory/claim-reward';

    if (APIFakeData.isFakeData && DEBUG) {
        // Update in unified data
        const fakeData = APIFakeData['inventory'] as InventoryData;
        const reward = fakeData.rewards.find(r => r.id === rewardId);
        
        if (!reward || reward.claimed) {
            return callback?.(false, { statusCode: 400, message: 'Reward not found or already claimed' });
        }
        
        reward.claimed = true;
        
        // Update in individual data as well
        const individualRewards = APIFakeData['inventory/rewards'] as RewardModel[];
        if (individualRewards) {
            const individualReward = individualRewards.find(r => r.id === rewardId);
            if (individualReward) {
                individualReward.claimed = true;
            }
        }
        
        return callback?.(true, null);
    }

    api.request<{ success: boolean }>(
        apiName,
        {
            method: 'POST',
            headers: api.getHeaders(),
            body: JSON.stringify({ rewardId })
        },
        data => callback?.(data.success, null),
        error => callback?.(false, error)
    );
} 