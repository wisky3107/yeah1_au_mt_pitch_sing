import { _decorator, Component, Node, Label, Button, Sprite, Color } from 'cc';
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
 * Component for song item prefabs in the song selection list
 */
@ccclass('AuditionSongItemComponent')
export class AuditionSongItemComponent extends Component {
    @property(Label)
    private titleLabel: Label = null;
    
    @property(Label)
    private artistLabel: Label = null;
    
    @property(Label)
    private difficultyLabel: Label = null;
    
    @property(Label)
    private highScoreLabel: Label = null;
    
    @property(Sprite)
    private lockIcon: Sprite = null;
    
    @property(Button)
    private selectButton: Button = null;
    
    @property(Node)
    private selectedIndicator: Node = null;
    
    // Song data
    private songId: string = '';
    private unlocked: boolean = false;
    
    // Callback for selection
    public onSelect: (songId: string) => void = null;
    
    /**
     * Setup the song item with data
     * @param data Song item data
     */
    public setup(data: SongItemData): void {
        this.songId = data.id;
        this.unlocked = data.unlocked;
        
        // Set labels
        if (this.titleLabel) {
            this.titleLabel.string = data.title;
        }
        
        if (this.artistLabel) {
            this.artistLabel.string = data.artist;
        }
        
        if (this.difficultyLabel) {
            // Display difficulty as stars
            let difficultyText = '';
            for (let i = 0; i < data.difficulty; i++) {
                difficultyText += '★';
            }
            this.difficultyLabel.string = difficultyText;
        }
        
        if (this.highScoreLabel) {
            this.highScoreLabel.string = data.highScore > 0 ? data.highScore.toString() : '-';
        }
        
        // Show/hide lock icon
        if (this.lockIcon) {
            this.lockIcon.node.active = !data.unlocked;
        }
        
        // Set button interactable
        if (this.selectButton) {
            this.selectButton.interactable = data.unlocked;
            this.selectButton.node.on(Button.EventType.CLICK, this.onButtonClicked, this);
        }
        
        // Hide selected indicator initially
        if (this.selectedIndicator) {
            this.selectedIndicator.active = false;
        }
    }
    
    /**
     * Handle button click
     */
    private onButtonClicked(): void {
        if (!this.unlocked) return;
        
        // Call selection callback
        if (this.onSelect) {
            this.onSelect(this.songId);
        }
        
        // Show selected indicator
        if (this.selectedIndicator) {
            this.selectedIndicator.active = true;
        }
    }
    
    /**
     * Set selected state
     * @param selected Whether this item is selected
     */
    public setSelected(selected: boolean): void {
        if (this.selectedIndicator) {
            this.selectedIndicator.active = selected;
        }
    }
} 