import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
import { assetRemoteUtil } from './assetRemoteUtil';
import { ImageLoader } from './ImageLoader';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('UIAvatar')
@requireComponent(Sprite)
export class UIAvatar extends Component {
    private sprite: Sprite = null;
    public data: string = null;
    private url: string = null;
    private id: string = null;
    private loadAvatarFunction: Function = null;

    protected onLoad(): void {
        this.sprite = this.getComponent(Sprite);
    }

    protected onDisable(): void {
        if (this.loadAvatarFunction) {
            assetRemoteUtil.removeListenAvatar(this.url, this.loadAvatarFunction);
        }
    }

    public setData(photo_url: string, id: string) {
        if (!this.sprite) return;
        this.sprite.spriteFrame = ImageLoader.instance.getAvatar(this.id);
        this.id = id;
        this.url = photo_url;

        this.loadAvatarFunction = this.onLoadedAvatar.bind(this);
        assetRemoteUtil.loadAndListenAvatar(photo_url, this.loadAvatarFunction);
    }

    onLoadedAvatar(sf: SpriteFrame) {
        this.sprite.spriteFrame = sf ?? ImageLoader.instance.getAvatar(this.id);
        this.loadAvatarFunction = null; // only load one per set data 
    }

    public clear() {
        this.sprite.spriteFrame = null;
    }
}


