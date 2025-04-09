import { _decorator, ScrollView, Prefab, Node } from 'cc';
import { ScrollAdapter, Holder, View, IElement, WrapMode } from '../../../Common/adapter';
import { CharacterFeature } from '../../../Models/CharacterCustomizationModel';
import { CustomizationItem } from './CustomizationItem';

const { ccclass, property } = _decorator;

@ccclass('CustomizationScrollView')
export class CustomizationScrollView extends ScrollAdapter<CharacterFeature> {
    @property(Node)
    private itemPrefab: Node = null;

    public getView(): View<CharacterFeature, ScrollAdapter<CharacterFeature>> {
        return new CustomizationItemView(this);
    }

    public getHolder(node: Node, code: string): Holder<CharacterFeature, ScrollAdapter<CharacterFeature>> {
        return new CustomizationItemHolder(node, code, this);
    }

    public initElement(element: IElement, data: CharacterFeature): void {
        element.wrapAfterMode = WrapMode.Auto;
    }

    public getPrefab(): Node | Prefab {
        return this.itemPrefab;
    }

    public updateItems(items: CharacterFeature[]): void {
        this.modelManager.clear();
        this.modelManager.insert(items);
    }

    public updatePrefab(prefab: Node): void {
        this.itemPrefab = prefab;
    }
}

class CustomizationItemHolder extends Holder<CharacterFeature> {
    private item: CustomizationItem = null;

    protected onCreated(): void {
        this.item = this.node.getComponent(CustomizationItem);
    }

    protected onVisible(): void {
        this.item.show(this);
    }

    protected onDisable(): void {
        this.item.hide();
    }
}

class CustomizationItemView extends View<CharacterFeature> {
    protected onVisible(): void {
        // Handle view becoming visible
    }

    protected onDisable(): void {
        // Handle view being disabled
    }
} 