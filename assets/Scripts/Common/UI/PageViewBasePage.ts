import { _decorator, Component, Node } from 'cc';
import { PageViewBaseItem } from './PageViewBaseItem';
import { VesselModel } from '../../Models/VesselModel';
const { ccclass, property } = _decorator;

@ccclass('PageViewBasePage')
export class PageViewBasePage extends Component {
    items: PageViewBaseItem[] = [];
    itemData: VesselModel[] = [];

    onSelectItem: (item) => void;
    onCreatedItem: (item : PageViewBaseItem) => {};

    protected onLoad(): void {
        this.getChilds();
    }

    getChildNumber(): number  {
        if (this.items.length > 0) this.items.length;
        this.getChilds();
        return this.items.length; 
    }

    getChilds() {
        if (this.items.length > 0) return;
        this.items = this.getComponentsInChildren(PageViewBaseItem); 
    }

    public init(vessels: VesselModel[]) {
        this.getChilds();
        this.itemData = vessels;
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const isActive = i < vessels.length; 
            item.node.active = isActive;
            if (isActive) {
                let data = vessels[i];
                item.init(data, item => {
                    this.onSelectItem?.(item);
                })
                this.onCreatedItem?.(item);
            }
        }
    }
}


