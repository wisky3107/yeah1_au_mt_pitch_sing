import { _decorator, Component, Node, ScrollView, instantiate, Prefab, Label, Sprite, Button, UITransform, tween, Vec3, AudioSource, Tween, ProgressBar, Toggle, ToggleContainer, Layout, EventHandler } from 'cc';
import { BeatmapManager } from './BeatmapManager';
import { MagicTilesAudioManager } from './MagicTilesAudioManager';
import { MTGameplayManager } from './MTGameplayManager';
import { MTUIManager } from './MTUIManager';
import { BeatmapMetadata } from '../Data/MTDefines';

const { ccclass, property } = _decorator;

/**
 * Sorting methods for the song list
 */
enum SortMethod {
    ALPHABETICAL,
    DIFFICULTY,
    NEWEST,
    POPULARITY
}

/**
 * Difficulty level filter
 */
enum DifficultyFilter {
    ALL,
    EASY,
    MEDIUM,
    HARD,
    EXTREME
}

/**
 * SongSelectionManager for Magic Tiles 3
 * Handles song list display, filtering, sorting, and song preview
 */
@ccclass('SongSelectionManager')
export class SongSelectionManager extends Component {
    // UI Components
    @property(ScrollView)
    songListScrollView: ScrollView = null!;

    @property(Prefab)
    songItemPrefab: Prefab = null!;

    @property(Node)
    songItemContainer: Node = null!;

    @property(Node)
    songDetailsPanel: Node = null!;

    @property(ToggleContainer)
    difficultyToggles: ToggleContainer = null!;

    @property(ToggleContainer)
    sortMethodToggles: ToggleContainer = null!;

    @property(ProgressBar)
    previewProgressBar: ProgressBar = null!;

    @property(Node)
    noSongsMessage: Node = null!;

    @property(Label)
    searchResultsLabel: Label = null!;

    // Song Details elements
    @property(Sprite)
    songCoverImage: Sprite = null!;

    @property(Label)
    songTitleLabel: Label = null!;

    @property(Label)
    songArtistLabel: Label = null!;

    @property(Label)
    songBPMLabel: Label = null!;

    @property(Label)
    songDifficultyLabel: Label = null!;

    @property(Label)
    songDurationLabel: Label = null!;

    @property(Button)
    playButton: Button = null!;

    @property(Button)
    previewButton: Button = null!;

    // Manager references
    private beatmapManager: BeatmapManager = null!;
    private audioManager: MagicTilesAudioManager = null!;
    private gameplayManager: MTGameplayManager = null!;

    // State variables
    private loadedBeatmaps: BeatmapMetadata[] = [];
    private filteredBeatmaps: BeatmapMetadata[] = [];
    private selectedBeatmapId: string = '';
    private previewAudioId: string = '';
    private previewAS: AudioSource = null;
    private isPreviewPlaying: boolean = false;
    private previewUpdateTimer: number | null = null;

    // Filter and sort settings
    private currentSortMethod: SortMethod = SortMethod.ALPHABETICAL;
    private currentDifficultyFilter: DifficultyFilter = DifficultyFilter.ALL;
    private searchText: string = '';

    onLoad() {
        // Get references to managers
        this.beatmapManager = BeatmapManager.instance;
        this.audioManager = MagicTilesAudioManager.instance;

        // Initialize UI
        this.initializeUI();

        // Load beatmap index
        this.loadBeatmaps();
    }

    onDestroy() {
        // Stop any playing preview
        this.stopPreview();

        // Clear update timer
        if (this.previewUpdateTimer !== null) {
            clearInterval(this.previewUpdateTimer);
            this.previewUpdateTimer = null;
        }
    }

    /**
     * Initialize UI components
     */
    private initializeUI() {
        // Hide song details panel initially
        if (this.songDetailsPanel) {
            this.songDetailsPanel.active = false;
        }

        // Set up sort toggles
        if (this.sortMethodToggles) {
            // TODO: Setup toggle event handlers
        }

        // Set up difficulty toggles
        if (this.difficultyToggles) {
            // TODO: Setup toggle event handlers
        }

        // Initialize no songs message
        if (this.noSongsMessage) {
            this.noSongsMessage.active = false;
        }

        // Initialize search results label
        if (this.searchResultsLabel) {
            this.searchResultsLabel.node.active = false;
        }
    }

    /**
     * Load all available beatmaps
     */
    private async loadBeatmaps() {
        try {
            // Show loading indicator
            MTUIManager.instance.showLoadingScreen(true);

            // Load beatmap index
            this.loadedBeatmaps = await this.beatmapManager.loadBeatmapIndex();

            // Apply current filters and sorting
            this.applyFiltersAndSort();

            // Hide loading indicator
            MTUIManager.instance.showLoadingScreen(false);

        } catch (error) {
            console.error("Failed to load beatmaps:", error);

            // Hide loading indicator
            MTUIManager.instance.showLoadingScreen(false);

            // Show error message
            MTUIManager.instance.showPopup("Failed to load song list. Please try again later.", "Error");
        }
    }

    /**
     * Refresh the song list UI with current data
     */
    refreshSongList() {
        // Clear existing song items
        if (this.songItemContainer) {
            this.songItemContainer.removeAllChildren();
        }

        // Show no songs message if list is empty
        if (this.filteredBeatmaps.length === 0) {
            if (this.noSongsMessage) {
                this.noSongsMessage.active = true;
            }
            return;
        } else {
            if (this.noSongsMessage) {
                this.noSongsMessage.active = false;
            }
        }

        // Show search results count if searching
        if (this.searchText && this.searchResultsLabel) {
            this.searchResultsLabel.string = `Found ${this.filteredBeatmaps.length} results for "${this.searchText}"`;
            this.searchResultsLabel.node.active = true;
        } else if (this.searchResultsLabel) {
            this.searchResultsLabel.node.active = false;
        }

        // Create song item for each beatmap
        this.filteredBeatmaps.forEach((beatmap, index) => {
            this.createSongItem(beatmap, index);
        });

        // Update layout
        const layout = this.songItemContainer.getComponent(Layout);
        if (layout) {
            layout.updateLayout();
        }
    }

    /**
     * Create a song item in the list
     */
    private createSongItem(beatmap: BeatmapMetadata, index: number) {
        if (!this.songItemPrefab || !this.songItemContainer) return;

        // Create item from prefab
        const songItem = instantiate(this.songItemPrefab);
        songItem.parent = this.songItemContainer;

        // Set item data
        const titleLabel = songItem.getChildByName("TitleLabel")?.getComponent(Label);
        const artistLabel = songItem.getChildByName("ArtistLabel")?.getComponent(Label);
        const difficultyLabel = songItem.getChildByName("DifficultyLabel")?.getComponent(Label);
        const coverImage = songItem.getChildByName("CoverImage")?.getComponent(Sprite);

        if (titleLabel) {
            titleLabel.string = beatmap.title;
        }

        if (artistLabel) {
            artistLabel.string = beatmap.artist;
        }

        if (difficultyLabel) {
            difficultyLabel.string = `${beatmap.difficultyName} (Lv.${beatmap.level})`;
        }

        if (coverImage && beatmap.coverImage) {
            // TODO: Load cover image from resources
            // resources.load(beatmap.coverImage, SpriteFrame, (err, spriteFrame) => {
            //     if (!err && spriteFrame) {
            //         coverImage.spriteFrame = spriteFrame;
            //     }
            // });
        }

        // Highlight if this is the selected song
        if (beatmap.id === this.selectedBeatmapId) {
            const background = songItem.getChildByName("Background")?.getComponent(Sprite);
            if (background) {
                background.color.set(200, 200, 255, 255);
            }
        }

        // Add click event
        songItem.on(Node.EventType.TOUCH_END, () => {
            this.onSongItemClicked(beatmap.id);
        });

        // Stagger animation
        songItem.scale = new Vec3(0.9, 0.9, 1);

        tween(songItem)
            .delay(index * 0.05)
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    /**
     * Handle song item click
     */
    private onSongItemClicked(beatmapId: string) {
        // Stop any playing preview
        this.stopPreview();

        // Select this beatmap
        this.selectedBeatmapId = beatmapId;

        // Show song details
        this.showSongDetails(beatmapId);

        // Update list to reflect selection
        this.refreshSongList();
    }

    /**
     * Show song details in the details panel
     */
    private async showSongDetails(beatmapId: string) {
        if (!this.songDetailsPanel) return;

        // Load beatmap data
        const beatmap = await this.beatmapManager.loadBeatmapInfo(beatmapId);
        if (!beatmap) {
            console.error(`Failed to load beatmap details for ID: ${beatmapId}`);
            return;
        }

        // Show the details panel
        this.songDetailsPanel.active = true;

        // Set details
        if (this.songTitleLabel) {
            this.songTitleLabel.string = beatmap.metadata.title;
        }

        if (this.songArtistLabel) {
            this.songArtistLabel.string = beatmap.metadata.artist;
        }

        if (this.songBPMLabel) {
            this.songBPMLabel.string = `${beatmap.metadata.bpm} BPM`;
        }

        if (this.songDifficultyLabel) {
            this.songDifficultyLabel.string = `${beatmap.metadata.difficultyName} (Lv.${beatmap.metadata.level})`;
        }

        if (this.songDurationLabel) {
            // Format duration as MM:SS
            const totalSeconds = beatmap.notes.length > 0
                ? beatmap.notes[beatmap.notes.length - 1].time
                : 0;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = Math.floor(totalSeconds % 60);
            // Use string formatting instead of padStart which may not be available
            this.songDurationLabel.string = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
        }

        if (this.songCoverImage && beatmap.metadata.coverImage) {
            // TODO: Load cover image from resources
            // resources.load(beatmap.metadata.coverImage, SpriteFrame, (err, spriteFrame) => {
            //    if (!err && spriteFrame) {
            //        this.songCoverImage.spriteFrame = spriteFrame;
            //    }
            // });
        }

        // Enable play button
        if (this.playButton) {
            this.playButton.interactable = true;
        }

        // Enable preview button
        if (this.previewButton) {
            this.previewButton.interactable = true;
        }

        // Animation
        this.songDetailsPanel.scale = new Vec3(0.9, 0.9, 1);
        tween(this.songDetailsPanel)
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    /**
     * Start song preview
     */
    startPreview() {
        if (!this.selectedBeatmapId) return;

        // Get selected beatmap
        const beatmap = this.beatmapManager.getActiveBeatmap();
        if (!beatmap) return;

        // Stop any existing preview
        this.stopPreview();

        // Start preview from preview section
        const previewStart = beatmap.metadata.preview?.start || 0;
        this.previewAS = this.audioManager.playSound(beatmap.metadata.audioPath, 0.8);

        // Set as playing
        this.isPreviewPlaying = true;

        // Update button state
        if (this.previewButton) {
            const buttonLabel = this.previewButton.node.getChildByName("Label")?.getComponent(Label);
            if (buttonLabel) {
                buttonLabel.string = "Stop";
            }
        }

        // Start progress update
        this.previewUpdateTimer = setInterval(() => {
            this.updatePreviewProgress();
        }, 100) as unknown as number;
    }

    /**
     * Stop song preview
     */
    stopPreview() {
        if (this.previewAudioId && this.isPreviewPlaying) {
            this.previewAS.stop();
            this.isPreviewPlaying = false;

            // Update button state
            if (this.previewButton) {
                const buttonLabel = this.previewButton.node.getChildByName("Label")?.getComponent(Label);
                if (buttonLabel) {
                    buttonLabel.string = "Preview";
                }
            }

            // Clear update timer
            if (this.previewUpdateTimer !== null) {
                clearInterval(this.previewUpdateTimer);
                this.previewUpdateTimer = null;
            }

            // Reset progress bar
            if (this.previewProgressBar) {
                this.previewProgressBar.progress = 0;
            }
        }
    }

    /**
     * Toggle preview play/stop
     */
    togglePreview() {
        if (this.isPreviewPlaying) {
            this.stopPreview();
        } else {
            this.startPreview();
        }
    }

    /**
     * Update preview progress bar
     */
    private updatePreviewProgress() {
        if (!this.isPreviewPlaying || !this.previewProgressBar) return;

        // Get audio source and update progress
        const audioSource = this.previewAS;
        if (audioSource) {
            const duration = audioSource.duration;
            const currentTime = audioSource.currentTime;

            if (duration > 0) {
                this.previewProgressBar.progress = currentTime / duration;
            }

            // Check if preview finished
            if (currentTime >= duration) {
                this.stopPreview();
            }
        }
    }

    /**
     * Apply filters and sorting to the beatmap list
     */
    private applyFiltersAndSort() {
        if (!this.loadedBeatmaps.length) return;

        // Start with all beatmaps
        this.filteredBeatmaps = [...this.loadedBeatmaps];

        // Apply difficulty filter
        if (this.currentDifficultyFilter !== DifficultyFilter.ALL) {
            this.filteredBeatmaps = this.filteredBeatmaps.filter(beatmap => {
                // Map difficulty level to filter
                const level = beatmap.level;

                switch (this.currentDifficultyFilter) {
                    case DifficultyFilter.EASY:
                        return level <= 3;
                    case DifficultyFilter.MEDIUM:
                        return level > 3 && level <= 6;
                    case DifficultyFilter.HARD:
                        return level > 6 && level <= 9;
                    case DifficultyFilter.EXTREME:
                        return level > 9;
                    default:
                        return true;
                }
            });
        }

        // Apply search filter
        if (this.searchText) {
            const searchLower = this.searchText.toLowerCase();
            this.filteredBeatmaps = this.filteredBeatmaps.filter(beatmap => {
                return beatmap.title.toLowerCase().includes(searchLower) ||
                    beatmap.artist.toLowerCase().includes(searchLower);
            });
        }

        // Apply sorting
        switch (this.currentSortMethod) {
            case SortMethod.ALPHABETICAL:
                this.filteredBeatmaps.sort((a, b) => a.title.localeCompare(b.title));
                break;

            case SortMethod.DIFFICULTY:
                this.filteredBeatmaps.sort((a, b) => a.level - b.level);
                break;

            case SortMethod.NEWEST:
                // Assuming newer songs have higher IDs for now
                this.filteredBeatmaps.sort((a, b) => b.id.localeCompare(a.id));
                break;

            case SortMethod.POPULARITY:
                // TODO: Implement popularity sorting when we have play count data
                break;
        }

        // Refresh the UI
        this.refreshSongList();
    }

    /**
     * Set the current sorting method
     */
    setSortMethod(method: number) {
        this.currentSortMethod = method;
        this.applyFiltersAndSort();
    }

    /**
     * Set the current difficulty filter
     */
    setDifficultyFilter(filter: number) {
        this.currentDifficultyFilter = filter;
        this.applyFiltersAndSort();
    }

    /**
     * Set search text
     */
    setSearchText(text: string) {
        this.searchText = text;
        this.applyFiltersAndSort();
    }

    /**
     * Start playing the selected song
     */
    playSong() {
        if (!this.selectedBeatmapId) return;

        // Stop any preview
        this.stopPreview();

        // Get gameplay manager
        if (!this.gameplayManager) {
            const gameplayManagerNode = this.node.parent?.getChildByName("GameplayManager");
            if (gameplayManagerNode) {
                this.gameplayManager = gameplayManagerNode.getComponent(MTGameplayManager)!;
            }
        }

        if (!this.gameplayManager) {
            console.error("GameplayManager not found");
            return;
        }

        // Start the game with selected beatmap
        this.gameplayManager.LoadBeatMap(this.selectedBeatmapId);
    }
} 