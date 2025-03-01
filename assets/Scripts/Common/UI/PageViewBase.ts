import { _decorator, Component, instantiate, math, Node, Prefab } from 'cc';
import { PageViewBasePage } from './PageViewBasePage';
import { PageViewBaseItem } from './PageViewBaseItem';
const { ccclass, property } = _decorator;

@ccclass('PageViewBase')
export class PageViewBase extends Component {
    @property(Node)
    content: Node = null;

    @property(Prefab)
    prefabPageView: Prefab = null;

    onSelectedItem: (item: PageViewBaseItem) => {};
    onCreatedItem: (item: PageViewBaseItem) => {};

    private itemPerPage: number = 0;
    private firstPage: PageViewBasePage = null;
    private pages: PageViewBasePage[] = [];
    private items = [];

    public init(items: any[]) {
        if (items.length <= 0) return;
        this.items = items;
        this.createFristPage();
        this.createPages();
        this.setPageData();
    }

    private createPages() {
        const needPage = Math.ceil(this.items.length / this.itemPerPage);
        for (let i = this.pages.length; i < needPage; i++) {
            this.createPage();
        }
    }

    private setPageData() {
        if (this.pages.length <= 0) return;
        let pageIndex = 0;
        let itemIndex = 0;

        const initPage = (page: PageViewBasePage, data: any[]) => {
            page.node.active = true;
            page.onSelectItem = this.onPageSelectItem.bind(this);
            page.onCreatedItem = this.onPageCreateItem.bind(this);
            
            page.init(data);
        };

        for (let i = 0; i < this.items.length; i += this.itemPerPage) {
            let breakItems = this.items.slice(i, i + this.itemPerPage);
            initPage(this.pages[pageIndex], breakItems);
            itemIndex = i + breakItems.length;
            pageIndex++;
        }

        //last page
        if (itemIndex < this.items.length - 1) {
            let lastItems = this.items.slice(itemIndex, this.items.length);
            initPage(this.pages[pageIndex], lastItems);
        }

        //disable redundant page
        pageIndex++;
        for (let i = pageIndex; i < this.pages.length; i++) {
            this.pages[i].node.active = false;
        }
    }

    private createFristPage() {
        if (this.firstPage != null) return;
        this.firstPage = this.createPage();
        this.itemPerPage = this.firstPage?.getChildNumber();
    }

    private createPage(): PageViewBasePage {
        const obj = instantiate(this.prefabPageView);
        obj.parent = this.content;
        const script = obj.getComponent(PageViewBasePage);
        this.pages.push(script);
        return script;
    }

    private onPageCreateItem(item: PageViewBaseItem) {
        this.onCreatedItem?.(item);
    }

    private onPageSelectItem(item: PageViewBaseItem) {
        this.onSelectedItem?.(item);
    }
}


