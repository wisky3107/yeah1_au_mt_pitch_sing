import { _decorator, Component, Node, instantiate, JsonAsset, director } from 'cc';
import { PopupBase } from 'db://assets/Scripts/Common/UI/PopupBase';
import { MTItemSong } from './MTItemSong';
import { MTGameplayManager, GameState } from '../../Systems/MTGameplayManager';
import { MTSongModel } from 'db://assets/Scripts/Models/Songs/MTSongModel';
const { ccclass, property } = _decorator;

@ccclass('PopupMTSongSelection')
export class PopupMTSongSelection extends PopupBase {
    @property(Node)
    private contentNode: Node = null;

    @property(Node)
    private itemSongPrefab: Node = null;

    private gameplayManager: MTGameplayManager = null;

    //todo: that this songs list will get from server later
    private songs: MTSongModel[] = [
        {
            id: "DauCoLoiLam",
            title: "Dẫu có lỗi lầm - bestcut",
            artist: "ATVNCG",
            bpm: 95,
            difficulty: 3,
            level: 5,
            previewStart: 60000,
            previewEnd: 90000,
            audioPath: "magic_tiles/audios/DauCoLoiLam_ATVNCG_bestcut",
            midiPath: "magic_tiles/midis/DauCoLoiLam_ATVNCG_bestcut",
            backgroundImage: "magic_tiles/images/Perfect_EdSheeran_background",
            thumbnail: "magic_tiles/images/Perfect_EdSheeran_cover"
        },
        {
            id: "Lang",
            title: "Lặng",
            artist: "Rhymastic",
            bpm: 85,
            difficulty: 3,
            level: 5,
            previewStart: 60000,
            previewEnd: 90000,
            audioPath: "magic_tiles/audios/Lang_Rhymastic_ATVNCG",
            midiPath: "magic_tiles/midis/Lang_Rhymastic_ATVNCG",
            backgroundImage: "magic_tiles/images/Lang_background",
            thumbnail: "magic_tiles/images/Lang_cover"
        },
        {
            id: "DauCoLoiLamFull",
            title: "Đâu Có Lỗi Lầm",
            artist: "ATVNCG",
            bpm: 95,
            difficulty: 3,
            level: 5,
            previewStart: 60000,
            previewEnd: 90000,
            audioPath: "magic_tiles/audios/DauCoLoiLam_ATVNCG_Full",
            midiPath: "magic_tiles/midis/DauCoLoiLam_ATVNCG_Full",
            backgroundImage: "magic_tiles/images/DauCoLoiLam_background",
            thumbnail: "magic_tiles/images/DauCoLoiLam_cover"
        }, {
            id: "TrongCom",
            title: "Trống Cơm",
            artist: "ATVNCG",
            bpm: 100,
            difficulty: 4,
            level: 6,
            previewStart: 60000,
            previewEnd: 90000,
            audioPath: "magic_tiles/audios/TrongCom_ATVNCG",
            midiPath: "magic_tiles/midis/TrongCom_ATVNCG",
            backgroundImage: "magic_tiles/images/TrongCom_background",
            thumbnail: "magic_tiles/images/TrongCom_cover"
        },
        {
            id: "GiaNhu",
            title: "Giá Như",
            artist: "SOOBIN",
            bpm: 90,
            difficulty: 2,
            level: 4,
            previewStart: 60000,
            previewEnd: 90000,
            audioPath: "magic_tiles/audios/GiaNhu_SOOBIN_ATVNCG",
            midiPath: "magic_tiles/midis/GiaNhu_SOOBIN_ATVNCG",
            backgroundImage: "magic_tiles/images/GiaNhu_background",
            thumbnail: "magic_tiles/images/GiaNhu_cover"
        }
    ];

    protected start(): void {
        // Find the GameplayManager
        this.gameplayManager = director.getScene().getComponentInChildren(MTGameplayManager);

        // Load all beatmap files from resources
        this.createSongItems(this.songs);
    }

    /**
     * Create song items in the content node
     */
    private createSongItems(songs: MTSongModel[]): void {
        // Clear existing content
        this.contentNode.removeAllChildren();

        // Create an item for each beatmap
        songs.forEach((metadata) => {
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
    private onSongSelected(song: MTSongModel): void {
        if (!this.gameplayManager) {
            console.error('GameplayManager not found');
            return;
        }

        // Load the selected beatmap
        this.gameplayManager.loadSong(song).then((success) => {
            if (success) {
                // Hide this popup
                this.hide();
            } else {
                console.error(`Failed to load beatmap: ${song.id}`);
                // Could show an error message here
            }
        });
    }
}


