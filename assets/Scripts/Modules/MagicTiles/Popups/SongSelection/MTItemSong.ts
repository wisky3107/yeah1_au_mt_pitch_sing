import { _decorator, Component, Node, Label, Button, Sprite } from 'cc';
import { MTSongModel } from 'db://assets/Scripts/Models/Songs/MTSongModel';
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

    private songData: MTSongModel = null;
    private selectionCallback: (song: MTSongModel) => void = null;

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
    public setSongData(songData: MTSongModel, callback: (song: MTSongModel) => void): void {
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
            this.difficultyLabel.string = `Difficulty: 'Medium'`;
        }

        // Load cover image if available
        if (this.coverSprite && songData.thumbnail) {
            // Cover image loading can be implemented here
        }
    }

    /**
     * Handler for when the song is selected
     */
    private onSongSelected(): void {
        if (this.selectionCallback && this.songData) {
            this.selectionCallback(this.songData);
        }
    }

    update(deltaTime: number) {

    }
}


