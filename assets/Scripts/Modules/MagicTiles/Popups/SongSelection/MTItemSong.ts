import { _decorator, Component, Node, Label, Button, Sprite } from 'cc';
import { BeatmapMetadata } from '../../MTDefines';
import { PopupMTSongSelection } from './PopupMTSongSelection';
const { ccclass, property } = _decorator;

@ccclass('MTItemSong')
export class MTItemSong extends Component {
    @property(Label)
    private songNameLabel: Label = null;
    
    @property(Label)
    private artistLabel: Label = null;
    
    @property(Label)
    private difficultyLabel: Label = null;
    
    @property(Button)
    private selectButton: Button = null;
    
    @property(Sprite)
    private coverSprite: Sprite = null;
    
    private songData: BeatmapMetadata = null;
    private selectionCallback: (songId: string) => void = null;
    
    protected start(): void {
        // Set up button event
        if (this.selectButton) {
            this.selectButton.node.on('click', this.onSongSelected, this);
        }
    }
    
    /**
     * Set the song data for this item
     * @param songData The metadata of the song to display
     * @param callback The callback to invoke when this song is selected
     */
    public setSongData(songData: BeatmapMetadata, callback: (songId: string) => void): void {
        this.songData = songData;
        this.selectionCallback = callback;
        
        // Update UI elements
        if (this.songNameLabel) {
            this.songNameLabel.string = songData.title || 'Unknown Title';
        }
        
        if (this.artistLabel) {
            this.artistLabel.string = songData.artist || 'Unknown Artist';
        }
        
        if (this.difficultyLabel) {
            this.difficultyLabel.string = `Difficulty: ${songData.difficultyName || 'Medium'}`;
        }
        
        // Load cover image if available
        if (this.coverSprite && songData.coverImage) {
            // Cover image loading can be implemented here
        }
    }
    
    /**
     * Handler for when the song is selected
     */
    private onSongSelected(): void {
        if (this.selectionCallback && this.songData) {
            this.selectionCallback(this.songData.id);
        }
    }

    update(deltaTime: number) {
        
    }
}


