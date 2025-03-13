import { _decorator, Component, Node, instantiate, JsonAsset, director } from 'cc';
import { PopupBase } from 'db://assets/Scripts/Common/UI/PopupBase';
import { resourceUtil } from '../../../../Common/resourceUtil';
import { BeatmapManager } from '../../BeatmapManager';
import { MTItemSong } from './MTItemSong';
import { Beatmap, BeatmapMetadata } from '../../MTDefines';
import { GameplayManager, GameState } from '../../GameplayManager';
const { ccclass, property } = _decorator;

@ccclass('PopupMTSongSelection')
export class PopupMTSongSelection extends PopupBase {
    @property(Node)
    private contentNode: Node = null;

    @property(Node)
    private itemSongPrefab: Node = null;
    
    private beatmaps: Map<string, BeatmapMetadata> = new Map();
    private gameplayManager: GameplayManager = null;
    
    protected start(): void {
        // Find the GameplayManager
        this.gameplayManager = director.getScene().getComponentInChildren(GameplayManager);
        
        // Load all beatmap files from resources
        this.loadAllBeatmaps();
    }
    
    /**
     * Load all beatmap files from resources
     */
    private loadAllBeatmaps(): void {
        // Path to beatmaps folder
        const beatmapsPath = 'magic_tiles/beatmaps';
        
        // Use resourceUtil to load all JSON files in the beatmaps directory
        resourceUtil.loadAllResources(beatmapsPath, (assets) => {
            // Filter out only JsonAsset type resources
            const jsonAssets = assets.filter(asset => asset instanceof JsonAsset);
            
            // Process each beatmap
            jsonAssets.forEach(jsonAsset => {
                if (jsonAsset && jsonAsset.json) {
                    try {
                        const beatmapData = jsonAsset.json as Beatmap;
                        if (beatmapData && beatmapData.metadata) {
                            // Store the beatmap metadata
                            // Set the beatmap ID to the jsonAsset name
                            beatmapData.metadata.id = jsonAsset.name;
                            this.beatmaps.set(beatmapData.metadata.id, beatmapData.metadata);
                        }
                    } catch (error) {
                        console.error(`Failed to parse beatmap JSON: ${jsonAsset.name}`, error);
                    }
                }
            });
            
            // Create UI items for each beatmap
            this.createSongItems();
        });
    }
    
    /**
     * Create song items in the content node
     */
    private createSongItems(): void {
        // Clear existing content
        this.contentNode.removeAllChildren();
        
        // Create an item for each beatmap
        this.beatmaps.forEach((metadata) => {
            // Instantiate the song item prefab
            const itemNode = instantiate(this.itemSongPrefab);
            itemNode.active = true;
            const itemComponent = itemNode.getComponent(MTItemSong);
            
            if (itemComponent) {
                // Set the song data and callback
                itemComponent.setSongData(metadata, this.onSongSelected.bind(this));
                
                // Add to the content node
                this.contentNode.addChild(itemNode);
            }
        });
    }
    
    /**
     * Callback when a song is selected
     * @param songId The ID of the selected song
     */
    private onSongSelected(songId: string): void {


        if (!this.gameplayManager) {
            console.error('GameplayManager not found');
            return;
        }
        
        // Load the selected beatmap
        this.gameplayManager.LoadBeatMap(songId).then((success) => {
            if (success) {
                // Hide this popup
                this.hide();
            } else {
                console.error(`Failed to load beatmap: ${songId}`);
                // Could show an error message here
            }
        });
    }
}


