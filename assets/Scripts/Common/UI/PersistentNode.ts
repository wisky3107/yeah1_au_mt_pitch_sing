import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PersistentNode')
export class PersistentNode extends Component {
    protected onLoad(): void {
        director.addPersistRootNode(this.node);
    }
}


