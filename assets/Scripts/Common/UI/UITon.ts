import { _decorator, Component, easing, Label, Node, tween, Tween, v3, Vec3 } from 'cc';
import { ClientEvent } from '../ClientEvent';
import { GameConstant } from '../../Constant/Constants';
import { UserManager } from '../../Managers/UserManager';
import { AnimationPanel } from './AnimationPanel';
import { Utils } from '../Utils';
const { ccclass, property } = _decorator;

@ccclass('UITon')
export class UITon extends Component {
    @property(Node)
    nodeIcon: Node = null;

    @property(AnimationPanel)
    nodePanel: AnimationPanel = null;

    public static uistacks: UITon[] = [];
    public static get position(): Vec3 {
        try {
            return this.uistacks[this.uistacks.length - 1].node.worldPosition;
        }
        catch (error) {
            return new Vec3(0, 0, 0);
        }
    }

    public static get iconPosition(): Vec3 {
        try {
            return this.uistacks[this.uistacks.length - 1].nodeIcon.worldPosition;
        }
        catch (error) {
            return new Vec3(0, 0, 0);
        }
    }

    public static get current(): UITon {
        try {
            return this.uistacks[this.uistacks.length - 1];
        }
        catch (error) {
            return null;
        }
    }

    private labelMain: Label = null;
    protected onEnable(): void {
        if (this.labelMain == null) {
            this.labelMain = this.getComponent(Label);
        }
        ClientEvent.on(GameConstant.EVENT_NAME.USERTON_UPDATED, this.updateData, this);
        UITon.uistacks.push(this);
    }

    protected onDisable(): void {
        ClientEvent.off(GameConstant.EVENT_NAME.USERTON_UPDATED, this.updateData, this);
        UITon.uistacks = UITon.uistacks.filter(ui => ui != this);
        this.tweenMain?.stop();
    }

    private showValue: { value: number } = { value: 0 };
    private tweenMain: Tween<{ value: number }> = null;
    public updateData() {
        const checkCoins = UserManager.instance.tons;
        this.setPanelVisible(checkCoins > 0);
        this.tweenMain?.stop();
        this.tweenMain = tween(this.showValue)
            .to(0.35, { value: checkCoins })
            .call(() => {
                this.tweenMain = null;
                this.setTextValue(checkCoins);
            })
            .start();
    }

    public setPanelVisible(isVisible: boolean) {
        return;
        this.nodePanel.setAnimVisible(isVisible);
        if (!isVisible) {
            this.labelMain.string = "";
        }
    }

    private setTextValue(value: number) {
        this.labelMain.string = Utils.toFixed(value, 3)
    }

    protected update(dt: number): void {
        if (this.tweenMain == null) return;
        this.setTextValue(this.showValue.value);
    }

    private tweenNodeCoin: Tween<Node> = null;
    public doSpriteEffect() {
        if (!this.nodeIcon) return;
        this.nodeIcon.scale = v3(1.1, 1.1);
        this.tweenNodeCoin?.stop();
        this.tweenNodeCoin =
            tween(this.nodeIcon)
                .to(0.15, { scale: Vec3.ONE }, { easing: easing.backIn })
                .start();
    }
}


