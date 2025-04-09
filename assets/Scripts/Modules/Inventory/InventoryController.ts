import { _decorator, Component, Node, Prefab, instantiate, Label } from 'cc';
import { Character } from '../Character/Character';
import { AnimationPanel } from '../../Common/UI/AnimationPanel';
import { InventoryTabItem } from './InventoryUI/InventoryTabItem';
import { BlindBoxModel, ClothingCategory, ClothingModel, InventoryTab, RewardModel, InventoryItemModelBase } from '../../Models/InventoryItemModel';
import { UserManager } from '../../Managers/UserManager';
import { claimReward, getInventory, InventoryData, openBlindBox, requestBlindBoxes, requestClothingByCategory, requestRewards, selectItem } from '../../Network/InventoryAPI';
import { InventoryBlindBoxScrollView } from './InventoryUI/InventoryBlindBoxScrollView';
import { InventoryClothingScrollView } from './InventoryUI/InventoryClothingScrollView';
import { InventoryRewardScrollView } from './InventoryUI/InventoryRewardScrollView';
const { ccclass, property } = _decorator;

/**
 * Main controller for the inventory system
 * Handles tab switching, item display, and character customization
 */
@ccclass('InventoryController')
export class InventoryController extends Component {
    // Tab components
    @property([InventoryTabItem])
    private tabItems: InventoryTabItem[] = [];

    // Content panels
    @property(AnimationPanel)
    private panelBlindBox: AnimationPanel = null;

    @property(AnimationPanel)
    private panelClothing: AnimationPanel = null;

    @property(AnimationPanel)
    private panelReward: AnimationPanel = null;

    // Scroll views for each tab
    @property(InventoryBlindBoxScrollView)
    private blindBoxScrollView: InventoryBlindBoxScrollView = null;

    @property(InventoryClothingScrollView)
    private clothingScrollView: InventoryClothingScrollView = null;

    @property(InventoryRewardScrollView)
    private rewardScrollView: InventoryRewardScrollView = null;

    // Clothing category tabs
    @property([InventoryTabItem])
    private categoryTabs: InventoryTabItem[] = [];

    // Character preview
    @property(Character)
    private characterPreview: Character = null;

    // Private properties
    private _currentTab: InventoryTab = InventoryTab.BlindBox;
    private _currentClothingCategory: ClothingCategory = ClothingCategory.Hair;
    private _clothingItems: Map<ClothingCategory, ClothingModel[]> = new Map();
    private _blindBoxItems: BlindBoxModel[] = [];
    private _rewardItems: RewardModel[] = [];
    private _inventoryData: InventoryData = null;

    /**
     * Component initialization
     */
    protected async onLoad(): Promise<void> {
        this.initTabs();
        this.initCategoryTabs();
        this.initScrollViews();
        await this.initCharacterPreview();
        this.loadInventoryData();
    }

    /**
     * Initialize main tab buttons
     */
    private initTabs(): void {
        if (!this.tabItems || this.tabItems.length === 0) return;
        
        // Initialize each tab with its index and callback
        this.tabItems.forEach((tabItem, index) => {
            tabItem.init(index, null, this.handleTabSelected.bind(this));
        });
        
        // Select first tab by default
        this.selectTab(InventoryTab.BlindBox);
    }

    /**
     * Initialize clothing category tabs
     */
    private initCategoryTabs(): void {
        if (!this.categoryTabs || this.categoryTabs.length === 0) return;
        
        // Initialize each category tab with its index and callback
        this.categoryTabs.forEach((tabItem, index) => {
            tabItem.init(index, null, this.handleCategorySelected.bind(this));
        });
        
        // Select first category by default
        this.selectClothingCategory(ClothingCategory.Hair);
    }

    /**
     * Initialize scroll views for each tab
     */
    private initScrollViews(): void {
        if (this.blindBoxScrollView) {
            this.blindBoxScrollView.init(this.handleBlindBoxSelected.bind(this));
        }
        
        if (this.clothingScrollView) {
            this.clothingScrollView.init(this.handleClothingItemSelected.bind(this));
        }
        
        if (this.rewardScrollView) {
            this.rewardScrollView.init(this.handleRewardSelected.bind(this));
        }
    }

    /**
     * Initialize character preview
     */
    private async initCharacterPreview(): Promise<void> {
        if (this.characterPreview) {
            // Initialize character with user's current selected character
            const characterId = UserManager.instance.characterId;
            await this.characterPreview.init(null, characterId);
        }
    }

    /**
     * Load all inventory data from the service
     */
    private loadInventoryData(): void {
        // Load all inventory data at once for efficiency
        getInventory((data, error) => {
            if (error) {
                console.error('Failed to load inventory data:', error);
                // Fall back to individual API calls
                this.loadIndividualInventoryData();
                return;
            }
            
            // Store the complete inventory data
            this._inventoryData = data;
            
            // Populate the individual data structures for compatibility
            this.populateDataFromInventory();
            
            // Update the current tab content
            this.updateTabContent();
        });
    }
    
    /**
     * Load inventory data using individual API calls (fallback method)
     */
    private loadIndividualInventoryData(): void {
        // Load blind box items
        requestBlindBoxes((items, error) => {
            if (error) {
                console.error('Failed to load blind boxes:', error);
                return;
            }
            this._blindBoxItems = items;
            if (this._currentTab === InventoryTab.BlindBox) {
                this.blindBoxScrollView.setItems(items);
            }
        });

        // Load clothing items for each category
        for (let category = 0; category < 4; category++) {
            requestClothingByCategory(category, (items, error) => {
                if (error) {
                    console.error(`Failed to load clothing items for category ${category}:`, error);
                    return;
                }
                this._clothingItems.set(category, items);
                
                // Update clothing scroll view if this is the current category
                if (this._currentTab === InventoryTab.Clothing && 
                    this._currentClothingCategory === category) {
                    this.clothingScrollView.setItems(items);
                }
            });
        }

        // Load reward items
        requestRewards((items, error) => {
            if (error) {
                console.error('Failed to load rewards:', error);
                return;
            }
            this._rewardItems = items;
            if (this._currentTab === InventoryTab.Rewards) {
                this.rewardScrollView.setItems(items);
            }
        });
    }
    
    /**
     * Populate the individual data structures from the complete inventory data
     */
    private populateDataFromInventory(): void {
        if (!this._inventoryData) return;
        
        // Populate blindbox items
        this._blindBoxItems = this._inventoryData.blindBoxes || [];
        
        // Populate clothing items for each category
        const categories = [
            { key: ClothingCategory.Hair, name: 'hair' },
            { key: ClothingCategory.Shirt, name: 'shirt' },
            { key: ClothingCategory.Pants, name: 'pants' },
            { key: ClothingCategory.Shoes, name: 'shoes' }
        ];
        
        for (const category of categories) {
            const items = this._inventoryData.clothing[category.name] || [];
            this._clothingItems.set(category.key, items);
        }
        
        // Populate reward items
        this._rewardItems = this._inventoryData.rewards || [];
    }

    /**
     * Handle main tab selection
     */
    private handleTabSelected(tabIndex: number): void {
        this.selectTab(tabIndex as InventoryTab);
    }

    /**
     * Handle clothing category tab selection
     */
    private handleCategorySelected(categoryIndex: number): void {
        this.selectClothingCategory(categoryIndex as ClothingCategory);
    }

    /**
     * Select a main tab
     */
    private selectTab(tab: InventoryTab): void {
        this._currentTab = tab;
        
        // Update tab visuals
        this.tabItems.forEach((item, index) => {
            item.setSelected(index === tab);
        });
        
        // Show/hide appropriate panels
        this.panelBlindBox.setAnimVisible(tab === InventoryTab.BlindBox);
        this.panelClothing.setAnimVisible(tab === InventoryTab.Clothing);
        this.panelReward.setAnimVisible(tab === InventoryTab.Rewards);
        
        // Update content based on selected tab
        this.updateTabContent();
    }

    /**
     * Select a clothing category tab
     */
    private selectClothingCategory(category: ClothingCategory): void {
        this._currentClothingCategory = category;
        
        // Update category tab visuals
        this.categoryTabs.forEach((item, index) => {
            item.setSelected(index === category);
        });
        
        // Update clothing scroll view with items from selected category
        if (this._clothingItems.has(category)) {
            this.clothingScrollView.setItems(this._clothingItems.get(category));
        }
    }

    /**
     * Update the content of the current tab
     */
    private updateTabContent(): void {
        switch (this._currentTab) {
            case InventoryTab.BlindBox:
                this.blindBoxScrollView.setItems(this._blindBoxItems);
                break;
                
            case InventoryTab.Clothing:
                // Update with items from current clothing category
                if (this._clothingItems.has(this._currentClothingCategory)) {
                    this.clothingScrollView.setItems(this._clothingItems.get(this._currentClothingCategory));
                }
                break;
                
            case InventoryTab.Rewards:
                this.rewardScrollView.setItems(this._rewardItems);
                break;
        }
    }

    /**
     * Handle blind box item selection
     */
    private handleBlindBoxSelected(item: BlindBoxModel): void {
        console.log('Blind box selected:', item.id);
        // Implement blind box opening logic here
        if (item.isOwned && !item.isLocked) {
            openBlindBox(item.id, (receivedItem, error) => {
                if (error) {
                    console.error('Failed to open blind box:', error);
                    return;
                }
                
                if (receivedItem) {
                    console.log('Received item from blind box:', receivedItem.id);
                    // Show reward animation or popup here
                    
                    // Update item in the appropriate category if it's a clothing item
                    if ('category' in receivedItem) {
                        const clothingItem = receivedItem as ClothingModel;
                        this.updateClothingItem(clothingItem);
                    }
                }
            });
        }
    }

    /**
     * Handle clothing item selection
     */
    private handleClothingItemSelected(item: ClothingModel): void {
        console.log('Clothing item selected:', item.id);
        
        if (item.isOwned && !item.isLocked) {
            // Equip the selected item
            selectItem(item.id, item.category, (success, error) => {
                if (error) {
                    console.error('Failed to select item:', error);
                    return;
                }
                
                if (success) {
                    console.log('Item equipped:', item.id);
                    this.updateCharacterAppearance(item);
                }
            });
        }
    }

    /**
     * Handle reward item selection
     */
    private handleRewardSelected(item: RewardModel): void {
        console.log('Reward selected:', item.id);
        
        if (item.isOwned && !item.claimed) {
            // Claim the reward
            claimReward(item.id, (success, error) => {
                if (error) {
                    console.error('Failed to claim reward:', error);
                    return;
                }
                
                if (success) {
                    console.log('Reward claimed:', item.id);
                    // Update the reward item to show as claimed
                    item.claimed = true;
                    this.rewardScrollView.updateItem(item);
                    
                    // Show claim animation or popup here
                }
            });
        }
    }

    /**
     * Update a clothing item in the inventory
     */
    private updateClothingItem(item: ClothingModel): void {
        if (this._clothingItems.has(item.category)) {
            const items = this._clothingItems.get(item.category);
            const index = items.findIndex(i => i.id === item.id);
            
            if (index !== -1) {
                items[index] = item;
            } else {
                items.push(item);
            }
            
            // Update the scroll view if this category is currently visible
            if (this._currentTab === InventoryTab.Clothing && 
                this._currentClothingCategory === item.category) {
                this.clothingScrollView.setItems(items);
            }
        }
        
        // Update in the complete inventory data if available
        if (this._inventoryData && this._inventoryData.clothing) {
            const categoryName = ClothingCategory[item.category].toLowerCase();
            const categoryItems = this._inventoryData.clothing[categoryName];
            
            if (categoryItems) {
                const index = categoryItems.findIndex(i => i.id === item.id);
                if (index !== -1) {
                    categoryItems[index] = item;
                } else {
                    categoryItems.push(item);
                }
            }
        }
    }

    /**
     * Update character appearance with the selected item
     */
    private updateCharacterAppearance(item: ClothingModel): void {
        if (!this.characterPreview) return;
        
        // Update selection status for all items in this category
        if (this._clothingItems.has(item.category)) {
            const items = this._clothingItems.get(item.category);
            
            items.forEach(i => {
                i.isSelected = i.id === item.id;
            });
            
            // Update the scroll view if this category is currently visible
            if (this._currentTab === InventoryTab.Clothing && 
                this._currentClothingCategory === item.category) {
                this.clothingScrollView.setItems(items);
            }
        }
        
        // Update selection in the complete inventory data if available
        if (this._inventoryData && this._inventoryData.clothing) {
            const categoryName = ClothingCategory[item.category].toLowerCase();
            const categoryItems = this._inventoryData.clothing[categoryName];
            
            if (categoryItems) {
                categoryItems.forEach(i => {
                    i.isSelected = i.id === item.id;
                });
            }
        }
        
        // Apply the selected item to the character
        this.characterPreview.setSkins([{
            skinType: ClothingCategory[item.category].toLowerCase(),
            prefab: item.prefabPath
        }]);
    }
}


