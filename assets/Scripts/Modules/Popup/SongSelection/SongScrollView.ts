import { _decorator, Prefab, Node } from 'cc';
import { ScrollAdapter } from '../../../Common/adapter/abstract/ScrollAdapter';
import { Holder } from '../../../Common/adapter/abstract/Holder';
import { View } from '../../../Common/adapter/abstract/View';
import { SongItem, SongItemData } from './SongItem';
import { IElement, WrapMode } from '../../../Common/adapter';

const { ccclass, property } = _decorator;

@ccclass('SongScrollView')
export class SongScrollView extends ScrollAdapter<SongItemData> {
    @property(Node)
    private songItemPrefab: Node = null;

    public getPrefab(): Node | Prefab {
        return this.songItemPrefab;
    }

    public getHolder(node: Node, code: string): Holder<SongItemData> {
        return new SongHolder(node, code, this);
    }

    public getView(): View<SongItemData> {
        return new SongView(this);
    }

    public initElement(element: IElement, data: SongItemData): void {
        // Configure element properties if needed
        element.wrapAfterMode = WrapMode.Auto;
    }

    public setData(data: SongItemData[]): void {
        this.modelManager.clear();
        this.modelManager.insert(data);
    }
}

// Holder implementation for song items
class SongHolder extends Holder<SongItemData> {
    private _item: SongItem = null;

    protected onCreated(): void {
        this._item = this.node.getComponent(SongItem);
    }

    protected onVisible(): void {
        this._item.show(this);
    }

    protected onDisable(): void {
        this._item.hide();
    }
}

// View implementation for song list
class SongView extends View<SongItemData> {

    protected onVisible(): void {
    }

    protected onDisable(): void {
        // Handle view being disabled
    }
}