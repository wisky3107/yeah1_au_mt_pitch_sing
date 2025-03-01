import { _decorator, Component, Node } from 'cc';
import { ScrollViewBaseItem } from './ScrollViewBaseItem';
const { ccclass } = _decorator;

@ccclass('ScrollViewBaseLine')
export class ScrollViewBaseLine extends Component {
    items: ScrollViewBaseItem[] = [];
    itemData: any[] = [];

    onSelectItem: (item) => void;
    onCreatedItem: (item: ScrollViewBaseItem) => {};

    protected onLoad(): void {
        this.getChilds();
    }

    getChildNumber(): number {
        if (this.items.length > 0) this.items.length;
        this.getChilds();
        return this.items.length;
    }

    getChilds() {
        if (this.items.length > 0) return;
        this.items = this.getComponentsInChildren(ScrollViewBaseItem);
    }

    public init(items: any[]) {
        this.getChilds();
        this.itemData = items;
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            let isActive = i < items.length;
            if (isActive) {
                isActive = items[0] != null;
            }
            item.node.active = isActive;
            if (isActive) {
                let data = items[i];
                item.init(data, item => {
                    this.onSelectItem?.(item);
                })
                this.onCreatedItem?.(item);
            }
        }
    }
}


