import { _decorator, Component, Label, Node, Sprite, Button, tween, Vec3, Color, AudioSource, Tween } from 'cc';
import { SongModel } from '../../../Models/Songs/SongModel';
import { Holder } from '../../../Common/adapter/abstract/Holder';
import { AudioManager } from '../../../Common/audioManager';
import { resourceUtil } from '../../../Common/resourceUtil';
import { ClientEvent } from '../../../Common/ClientEvent';
import { EVENT_NAME } from '../../../Constant/ClientEventDefine';
const { ccclass, property } = _decorator;


export class SongItemData {
    public gameName: string;
    public song: SongModel;
    public callback: (song: SongItemData) => void;
}


@ccclass('SongItem')
export class SongItem extends Component {
    @property(Label)
    private labelTitle: Label = null;

    @property(Label)
    private labelArtist: Label = null;

    @property(Sprite)
    private spriteThumb: Sprite = null;

    @property(Button)
    private btnPlay: Button = null;

    @property(Node)
    private lockNode: Node = null;

    @property(Label)
    private labelUnlock: Label = null;

    private data: SongItemData = null;
    private isPlaying: boolean = false;

    private previewAudioId: number = -1;
    private previewSource: AudioSource = null;

    public show(holder: Holder<SongItemData>): void {
        this.data = holder.data;

        // Update UI
        this.labelTitle.string = this.data.song.title;
        this.labelArtist.string = this.data.song.artist;

        // Load thumbnail
        if (this.data.song.thumbnail) {

            //todo load thumbnail
            // resourceUtil.loadSpriteFrame(this._currentSong.thumbnail, (err, spriteFrame) => {
            //     if (!err && this.spriteThumb) {
            //         this.spriteThumb.spriteFrame = spriteFrame;
            //     }
            // });
        }

        // Update lock state
        this.lockNode.active = this.data.song.isLocked;
        if (this.data.song.isLocked && this.data.song.unlockCondition) {
            this.labelUnlock.string = this.data.song.unlockCondition;
        }
    }

    private previewTween: Tween<Node> = null;

    onEnable() {
        // Listen for other song previews
        ClientEvent.on(EVENT_NAME.SONG_PREVIEW, this.handleOtherSongPreview, this);
    }

    onDisable() {
        // Clean up event listeners
        ClientEvent.off(EVENT_NAME.SONG_PREVIEW, this.handleOtherSongPreview, this);
    }

    private handleOtherSongPreview(songId: string) {
        // If another song started playing and we're currently playing, stop our preview
        if (this.isPlaying && this.data.song.id !== songId) {
            this.stopPreview();
        }
    }

    private stopPreview() {
        this.isPlaying = false;
        this.previewSource?.stop();
        this.previewTween?.stop();
        this.btnPlay.node.scale = Vec3.ONE;
    }

    private onTouch_Preview(): void {
        if (!this.isPlaying) {
            // Start preview
            this.isPlaying = true;

            // Notify other song items that we're starting a preview
            ClientEvent.dispatchEvent(EVENT_NAME.SONG_PREVIEW, this.data.song.id);

            this.previewSource = AudioManager.instance.playPreviewSong(
                SongModel.getMusicPath(this.data.song),
                this.data.song.previewStart,
                this.data.song.previewEnd,
                () => {
                    this.stopPreview();
                }
            );

            // Stop any existing tween
            this.previewTween?.stop();

            // Animate button with looping punch scale
            this.previewTween = tween(this.btnPlay.node)
                .to(0.2, { scale: new Vec3(1.1, 1.1, 1) })
                .to(0.2, { scale: Vec3.ONE })
                .union()
                .repeatForever()
                .start();
        } else {
            // Stop preview
            this.stopPreview();
        }
    }

    public hide(): void {
        // Cleanup
        if (this.isPlaying) {
            this.stopPreview();
        }
        this.btnPlay.node.off(Button.EventType.CLICK, this.onTouch_Preview, this);
    }

    public onTouch_Play(): void {
        if (this.data.song.isLocked) return;
        if (this.data.callback) {
            this.data.callback(this.data);
        }
    }
} 