import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScrollViewBaseItem')
export class ScrollViewBaseItem extends Component {
    private onSelected: (item) => void;

    public init(data: any, onSelected: (item) => void) {
        this.onSelected = onSelected;
        //depend on data get sprite from tile controller
    }

    onTouch_Main() {
        this.onSelected?.(this);
    }
}
