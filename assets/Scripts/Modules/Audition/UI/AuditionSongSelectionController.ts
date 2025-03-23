import { _decorator, Component, Node, Button, Label, ScrollView, Prefab, instantiate, Layout } from 'cc';
import { AuditionAudioManager } from '../Systems/AuditionAudioManager';
import { AuditionUIManager } from './AuditionUIManager';
import { AuditionGameplayController } from '../Systems/AuditionGameplayController';
const { ccclass, property } = _decorator;

/**
 * Interface for song data to be displayed
 */
interface SongItemData {
    id: string;
    title: string;
    artist: string;
    difficulty: number;
    unlocked: boolean;
    highScore: number;
}

/**
 * Controller for the Song Selection scene
 * Displays available songs and allows the player to select one to play
 */
@ccclass('AuditionSongSelectionController')
export class AuditionSongSelectionController extends Component {
    @property(Button)
    private backButton: Button = null;
    
    @property(ScrollView)
    private songListScrollView: ScrollView = null;
    
    @property(Node)
    private songListContent: Node = null;
    
    @property(Prefab)
    private songItemPrefab: Prefab = null;
    
    @property(Label)
    private songTitleLabel: Label = null;
    
    @property(Label)
    private artistLabel: Label = null;
    
    @property(Label)
    private difficultyLabel: Label = null;
    
    @property(Label)
    private bpmLabel: Label = null;
    
    @property(Label)
    private highScoreLabel: Label = null;
    
    @property(Button)
    private playButton: Button = null;
    
    @property
    private backgroundMusicPath: string = 'audition/audio/selection_music';
    
    @property
    private previewVolume: number = 0.5;
    
    @property
    private buttonSound: string = 'click';
    
    private selectedSongId: string = null;
    private previewTimer: number = null;
    
    onLoad() {
        // Setup UI
        AuditionUIManager.instance.showSongSelection();
        
        // Setup button events
        this.setupButtonEvents();
        
        // Load background music
        this.playBackgroundMusic();
    }
    
    start() {
        // Populate song list
        this.populateSongList();
        
        // Reset selection
        this.clearSongSelection();
    }
    
    /**
     * Setup button event listeners
     */
    private setupButtonEvents(): void {
        // Back button
        if (this.backButton) {
            this.backButton.node.on(Button.EventType.CLICK, this.onBackButtonClicked, this);
        }
        
        // Play button
        if (this.playButton) {
            this.playButton.node.on(Button.EventType.CLICK, this.onPlayButtonClicked, this);
            this.playButton.interactable = false; // Disabled until a song is selected
        }
    }
    
    /**
     * Play background music for the selection screen
     */
    private playBackgroundMusic(): void {
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.loadSong(this.backgroundMusicPath)
                .then(() => {
                    audioManager.playSong();
                })
                .catch(error => {
                    console.error('Failed to load selection music:', error);
                });
        }
    }
    
    /**
     * Populate the song list from available songs
     */
    private populateSongList(): void {
        // Clear existing content
        if (this.songListContent) {
            this.songListContent.removeAllChildren();
        }
        
        // Get songs from game manager
        const gameManager = AuditionGameplayController.instance;
        if (!gameManager) return;
        
        const availableSongs = gameManager.getAvailableSongs();
        const unlockedSongs = gameManager.getUnlockedSongs();
        
        // Create a song item for each song
        availableSongs.forEach(song => {
            if (this.songItemPrefab) {
                const songItem = instantiate(this.songItemPrefab);
                
                // Set song item data
                const songNameLabel = songItem.getChildByName('SongName')?.getComponent(Label);
                if (songNameLabel) {
                    songNameLabel.string = song.title;
                }
                
                // Set difficulty stars
                const difficultyNode = songItem.getChildByName('Difficulty');
                if (difficultyNode) {
                    const difficultyStars = difficultyNode.children;
                    for (let i = 0; i < difficultyStars.length; i++) {
                        difficultyStars[i].active = i < song.difficulty;
                    }
                }
                
                // Set locked status
                const lockedIcon = songItem.getChildByName('LockedIcon');
                if (lockedIcon) {
                    lockedIcon.active = !gameManager.isSongUnlocked(song.id);
                }
                
                // Set high score
                const highScoreLabel = songItem.getChildByName('HighScore')?.getComponent(Label);
                if (highScoreLabel) {
                    const highScore = gameManager.getHighScore(song.id);
                    highScoreLabel.string = highScore > 0 ? `High Score: ${highScore}` : '';
                }
                
                // Add click event
                const button = songItem.getComponent(Button);
                if (button) {
                    const isUnlocked = gameManager.isSongUnlocked(song.id);
                    button.interactable = isUnlocked;
                    
                    if (isUnlocked) {
                        button.node.on(Button.EventType.CLICK, () => {
                            this.onSongSelected(song.id);
                        });
                    }
                }
                
                // Add to list
                this.songListContent.addChild(songItem);
            }
        });
        
        // Update layout
        const layout = this.songListContent.getComponent(Layout);
        if (layout) {
            layout.updateLayout();
        }
    }
    
    /**
     * Handle song selection
     * @param songId The selected song ID
     */
    private onSongSelected(songId: string): void {
        AuditionAudioManager.instance.playSound(this.buttonSound);
        
        this.selectedSongId = songId;
        
        // Update UI with song details
        const gameManager = AuditionGameplayController.instance;
        if (!gameManager) return;
        
        const selectedSong = gameManager.getAvailableSongs().find(song => song.id === songId);
        if (!selectedSong) return;
        
        // Update song details
        if (this.songTitleLabel) {
            this.songTitleLabel.string = selectedSong.title;
        }
        
        if (this.artistLabel) {
            this.artistLabel.string = selectedSong.artist;
        }
        
        if (this.difficultyLabel) {
            this.difficultyLabel.string = `Difficulty: ${selectedSong.difficulty}`;
        }
        
        if (this.bpmLabel) {
            this.bpmLabel.string = `BPM: ${selectedSong.bpm}`;
        }
        
        if (this.highScoreLabel) {
            const highScore = gameManager.getHighScore(songId);
            this.highScoreLabel.string = highScore > 0 ? `High Score: ${highScore}` : 'No records yet';
        }
        
        // Enable play button
        if (this.playButton) {
            this.playButton.interactable = true;
        }
        
        // Play song preview
        this.playPreview(selectedSong);
    }
    
    /**
     * Play a preview of the selected song
     * @param song The song data
     */
    private playPreview(song: any): void {
        const audioManager = AuditionAudioManager.instance;
        if (!audioManager) return;
        
        // Stop any current preview
        this.stopPreview();
        
        // Load and play the song preview
        audioManager.loadSong(song.audioPath)
            .then(() => {
                audioManager.setMusicVolume(this.previewVolume);
                // Play from preview start time
                audioManager.playSong(song.previewStart);
                
                // Set a timer to stop the preview at the end time
                const previewDuration = song.previewEnd - song.previewStart;
                this.previewTimer = setTimeout(() => {
                    this.stopPreview();
                    this.playBackgroundMusic();
                }, previewDuration);
            })
            .catch(error => {
                console.error('Failed to play song preview:', error);
            });
    }
    
    /**
     * Stop the current preview
     */
    private stopPreview(): void {
        // Clear preview timer
        if (this.previewTimer) {
            clearTimeout(this.previewTimer);
            this.previewTimer = null;
        }
        
        // Stop audio
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.stopSong();
        }
    }
    
    /**
     * Clear song selection
     */
    private clearSongSelection(): void {
        this.selectedSongId = null;
        
        // Reset UI
        if (this.songTitleLabel) {
            this.songTitleLabel.string = 'Select a Song';
        }
        
        if (this.artistLabel) {
            this.artistLabel.string = '';
        }
        
        if (this.difficultyLabel) {
            this.difficultyLabel.string = '';
        }
        
        if (this.bpmLabel) {
            this.bpmLabel.string = '';
        }
        
        if (this.highScoreLabel) {
            this.highScoreLabel.string = '';
        }
        
        // Disable play button
        if (this.playButton) {
            this.playButton.interactable = false;
        }
    }
    
    /**
     * Handle back button click
     */
    private onBackButtonClicked(): void {
        AuditionAudioManager.instance.playSound(this.buttonSound);
    }
    
    /**
     * Handle play button click
     */
    private onPlayButtonClicked(): void {
        if (!this.selectedSongId) return;
        
        AuditionAudioManager.instance.playSound(this.buttonSound);
    }
    
    onDestroy() {
        // Stop preview
        this.stopPreview();
        
        // Stop background music
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.stopSong();
        }
    }
} 