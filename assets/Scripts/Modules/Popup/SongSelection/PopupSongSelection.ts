import { _decorator, Component, Node, ToggleContainer, Toggle, Sprite, Prefab, instantiate, Label, AnimationClip, Game } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { SongModel, SongListResponse } from '../../../Models/Songs/SongModel';
import { GameManager } from '../../../Managers/GameManager';
import { resourceUtil } from '../../../Common/resourceUtil';
import { CharacterModel } from '../../Character/CharacterModel';
import { requestSongLists } from '../../../Network/SongAPI';
import { UIManager } from '../../../Common/uiManager';
import { SongScrollView } from './SongScrollView';
import { UIRunningLabel } from '../../../Common/UI/UIRunningLabel';
import { SceneLoader } from '../../../Common/SceneLoader';
import { SongItemData } from './SongItem';
import { GameType } from '../../../Constant/GameDefine';
const { ccclass, property } = _decorator;

enum TabType {
    ALL = "ALL",
    MALE = "MALE",
    FEMALE = "FEMALE",
    TBTN = "TBTN"  // Special category from image
}

@ccclass('PopupSongSelection')
export class PopupSongSelection extends PopupBase {
    @property(SongScrollView)
    private songList: SongScrollView = null;

    @property(ToggleContainer)
    private tabContainer: ToggleContainer = null;

    @property(Node)
    private characterNode: Node = null;

    @property(AnimationClip)
    private animationDefaultClip: AnimationClip = null;

    @property(UIRunningLabel)
    private lbDialog: UIRunningLabel = null;

    @property(Label)
    private lbGameName: Label = null;

    private currentType: TabType = TabType.ALL;
    private songData: SongItemData[] = [];
    private songListResponse: SongListResponse = null;
    private game: GameType = GameType.AUDITION;

    protected onLoad(): void {
        super.onLoad();
        this.initTabs();
        this.loadCharacterModel();
    }

    public show(data?: { game: GameType }, callback?: () => void): void {
        super.show(data);
        this.game = data.game;
        this.lbGameName.string = GameType.getGameName(this.game);
        this.lbDialog.setText("Chọn bài hát và\nbắt đầu chơi nào");

        UIManager.instance.setLoading(true);
        // Fetch song data from API
        requestSongLists((songListResponse, error) => {
            UIManager.instance.setLoading(false);
            if (error) {
                console.error('Failed to fetch song lists:', error);
                return;
            }

            this.songListResponse = songListResponse;

            // Reset to first tab and update song list
            if (this.tabContainer.toggleItems.length > 0) {
                this.tabContainer.toggleItems[0].isChecked = true;
                this.currentType = TabType.ALL;
                this.updateSongList();
            }
        });
    }

    protected onDestroy(): void {
        super.onDestroy();

        // Cleanup tab listeners
        this.tabContainer.toggleItems.forEach((toggle: Toggle) => {
            toggle.node.off(Toggle.EventType.TOGGLE);
        });
    }

    private initTabs(): void {
        // Setup tab listeners
        this.tabContainer.toggleItems.forEach((toggle: Toggle, index: number) => {
            toggle.node.on(Toggle.EventType.TOGGLE, (toggle: Toggle) => {
                if (!toggle.isChecked) return;

                const types = [TabType.ALL, TabType.MALE, TabType.FEMALE, TabType.TBTN];
                this.currentType = types[index];
                this.updateSongList();
            });
        });
    }

    private loadCharacterModel(): void {
        const fandomModel = GameManager.instance.getFandomModel();
        if (!fandomModel) return;

        const fandomName = fandomModel.getCurrentFandomCharacter().name.toLowerCase();
        // Load character sprite based on fandom model
        resourceUtil.loadRes(`prefab/character/${fandomName}`, Prefab, (err: any, prefab: Prefab) => {
            if (err) {
                console.error(`Failed to load character prefab: ${fandomName}`, err);
                return;
            }

            // Instantiate the prefab
            const characterModel = instantiate(prefab);
            this.characterNode.addChild(characterModel);
            const model = characterModel.getComponent(CharacterModel);
            if (!model) {
                console.error(`No CharacterModel component found in character: ${fandomName}`);
                return;
            }
            model.setUIMesh(this.node.layer);
            model.skeletalAnimation.createState(this.animationDefaultClip, 'idle');
            model.skeletalAnimation.play('idle');
        });
    }

    private updateSongList(): void {
        if (!this.songListResponse) return;

        let filteredSongs: SongModel[] = [];
        switch (this.currentType) {
            case TabType.ALL:
                // Combine all songs for the ALL tab
                filteredSongs = this.songListResponse.maleSongs.concat(
                    this.songListResponse.femaleSongs,
                    this.songListResponse.tbtnSongs
                );
                break;
            case TabType.MALE:
                filteredSongs = this.songListResponse.maleSongs;
                break;
            case TabType.FEMALE:
                filteredSongs = this.songListResponse.femaleSongs;
                break;
            case TabType.TBTN:
                filteredSongs = this.songListResponse.tbtnSongs;
                break;
        }

        this.songData = filteredSongs.map(song => ({
            gameName: this.lbGameName.string,
            song: song,
            callback: (song: SongItemData) => this.onSongSelected(song)
        }));
        this.songList.setData(this.songData);
    }

    private onSongSelected(song: SongItemData): void {
        // TODO: Implement song selection logic
        console.log(`Selected song: ${song.song.title}`);
        SceneLoader.instance.loadSceneAsync(this.game, GameType.getPopupLoading(this.game))
            .then(() => {
                this.doUImanagerHide();
            })
            .catch(error => SceneLoader.instance.handleSceneLoadError('Pitch Game', error));
    }
} 