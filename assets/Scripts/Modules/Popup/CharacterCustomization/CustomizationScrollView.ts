import { _decorator, ScrollView, Prefab, Node } from 'cc';
import { ScrollAdapter, Holder, View, IElement, WrapMode } from '../../../Common/adapter';
import { ICharacterFeature } from '../../../Models/CharacterCustomizationModel';
import { CustomizationItem } from './CustomizationItem';

const { ccclass, property } = _decorator;

@ccclass('CustomizationScrollView')
export class CustomizationScrollView extends ScrollAdapter<ICharacterFeature> {
    @property(Node)
    private itemPrefab: Node = null;

    public getView(): View<ICharacterFeature, ScrollAdapter<ICharacterFeature>> {
        return new CustomizationItemView(this);
    }

    public getHolder(node: Node, code: string): Holder<ICharacterFeature, ScrollAdapter<ICharacterFeature>> {
        return new CustomizationItemHolder(node, code, this);
    }

    public initElement(element: IElement, data: ICharacterFeature): void {
        element.wrapAfterMode = WrapMode.Auto;
    }

    public getPrefab(): Node | Prefab {
        return this.itemPrefab;
    }

    public updateItems(items: ICharacterFeature[]): void {
        this.modelManager.clear();
        this.modelManager.insert(items);
    }

    public updatePrefab(prefab: Node): void {
        this.itemPrefab = prefab;
    }
}

class CustomizationItemHolder extends Holder<ICharacterFeature> {
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

class CustomizationItemView extends View<ICharacterFeature> {
    protected onVisible(): void {
        // Handle view becoming visible
    }

    protected onDisable(): void {
        // Handle view being disabled
    }
} 