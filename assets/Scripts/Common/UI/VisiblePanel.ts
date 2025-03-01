import { _decorator, Component, Node, Tween, tween, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('VisiblePanel')
export class VisiblePanel extends Component {
    @property({type: Node, group: ("VisiblePanel")})
    indicator: Node = null;

    opMain: UIOpacity = null!;
    onVisibleChanged: (isOn) => void;
    private tweenOpacity: Tween<UIOpacity> = null;
    setPanelVisible(isVisible: boolean, timeAction: number = 0.35, isNodeDeactivable: boolean = true) {
        if (!this.opMain) {
            this.opMain = this.getComponent(UIOpacity);
            if (this.opMain == null) {
                this.opMain = this.addComponent(UIOpacity)!;
            }
        }
        if (timeAction <= 0.0) {
            this.opMain.opacity = isVisible ? 255.0 : 0.0;
        }

        if (isVisible && isNodeDeactivable) {
            this.node.active = true;
            if (this.indicator) this.indicator.active = true;
        }
        this.opMain.opacity = isVisible ? 0.0 : 255.0;
        this.tweenOpacity?.stop();
        this.tweenOpacity = tween(this.opMain)
            .to(timeAction, { opacity: isVisible ? 255.0 : 0.0 })
            .call(() => {
                if (!isVisible && isNodeDeactivable) {
                    this.node.active = false;
                    if (this.indicator) this.indicator.active = false;
                }
                this.visibleChanged(isVisible);
            })
            .start();
    }

    protected visibleChanged(isVisible: boolean) {
        this.onVisibleChanged?.(isVisible);
    }
}


