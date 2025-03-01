import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { ScrollViewBaseItem } from './ScrollViewBaseItem';
import { ScrollViewBaseLine } from './ScrollViewBaseLine';
const { ccclass, property } = _decorator;

@ccclass('ScrollViewBase')
export class ScrollViewBase extends Component {
    @property(Node)
    content: Node = null;

    @property(Prefab)
    prefabLine: Prefab = null;

    onSelectedItem: (item: ScrollViewBaseItem) => {};
    onCreatedItem: (item: ScrollViewBaseItem) => {};

    private itemPerLine: number = 0;
    private firstLine:  ScrollViewBaseLine = null;
    private lines: ScrollViewBaseLine[] = [];
    private items = [];

    public init(items: any[]) {
        if (items.length <= 0) return;
        this.items = items;
        this.createFristLine();
        this.createLines();
        this.setLineData();
    }

    private createLines() {
        const needPage = Math.ceil(this.items.length / this.itemPerLine);
        for (let i = this.lines.length; i < needPage; i++) {
            this.createLine();
        }
    }

    private setLineData() {
        if (this.lines.length <= 0) return;
        let lineIndex = 0;
        let itemIndex = 0;

        const initLine = (line: ScrollViewBaseLine, data: any[]) => {
            line.node.active = true;
            line.onSelectItem = this.onLineSelectItem.bind(this);
            line.onCreatedItem = this.onLineCreateItem.bind(this);

            line.init(data);
        };

        for (let i = 0; i < this.items.length; i += this.itemPerLine) {
            let breakItems = this.items.slice(i, i + this.itemPerLine);
            initLine(this.lines[lineIndex], breakItems);
            itemIndex = i + breakItems.length;
            lineIndex++;
        }

        //last page
        if (itemIndex < this.items.length - 1) {
            let lastItems = this.items.slice(itemIndex, this.items.length);
            initLine(this.lines[lineIndex], lastItems);
        }

        //disable redundant page
        lineIndex++;
        for (let i = lineIndex; i < this.lines.length; i++) {
            this.lines[i].node.active = false;
        }
    }

    private createFristLine() {
        if (this.firstLine != null) return;
        this.firstLine = this.createLine();
        this.itemPerLine = this.firstLine?.getChildNumber();
    }

    private createLine(): ScrollViewBaseLine {
        const obj = instantiate(this.prefabLine);
        obj.parent = this.content;
        const script = obj.getComponent(ScrollViewBaseLine);
        this.lines.push(script);
        return script;
    }

    private onLineCreateItem(item: ScrollViewBaseItem) {
        this.onCreatedItem?.(item);
    }

    private onLineSelectItem(item: ScrollViewBaseItem) {
        this.onSelectedItem?.(item);
    }
}


