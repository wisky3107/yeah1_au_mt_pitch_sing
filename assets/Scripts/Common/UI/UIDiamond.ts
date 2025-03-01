import { _decorator, Color, Component, easing, Label, Node, tween, Tween, v3, Vec3 } from 'cc';
import { ClientEvent } from '../ClientEvent';
import { GameConstant } from '../../Constant/Constants';
import { UserManager } from '../../Managers/UserManager';
import { Utils } from '../Utils';
const { ccclass, property } = _decorator;

@ccclass('UIDiamond')
export class UIDiamond extends Component {
    @property(Node)
    nodeIcon: Node = null;

    public static uistacks: UIDiamond[] = [];
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

    public static get current(): UIDiamond {
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
        ClientEvent.on(GameConstant.EVENT_NAME.USERDIAMOND_UPDATED, this.updateData, this);
        UIDiamond.uistacks.push(this);
    }

    protected onDisable(): void {
        ClientEvent.off(GameConstant.EVENT_NAME.USERDIAMOND_UPDATED, this.updateData, this);
        UIDiamond.uistacks = UIDiamond.uistacks.filter(ui => ui != this);
        this.tweenCurrent?.stop();
        this.tweenCurrent = null;
    }

    private setCoins(value: number) {
        if (this.labelMain == null) {
            this.labelMain = this.getComponent(Label);
        }
        this.labelMain.string = Utils.formatNumber(Math.round(value));
    }

    private showCurrent: { value: number } = { value: 0 };
    private tweenCurrent: Tween<{ value: number }> = null;
    public updateData() {
        const checkCoins = UserManager.instance.diamonds;

        this.tweenCurrent?.stop();
        this.tweenCurrent = tween(this.showCurrent)
            .to(0.35, { value: checkCoins })
            .call(() => {
                this.tweenCurrent = null;
                this.setCoins(UserManager.instance.diamonds);
            })
            .start();
    }

    protected update(dt: number): void {
        if (this.tweenCurrent == null) return;
        this.setCoins(this.showCurrent?.value);
    }

    private tweenNodeCoin: Tween<Node> = null;
    public doSpriteEffect() {
        if (!this.nodeIcon) return;
        this.nodeIcon.scale = v3(1.1, 1.1);
        this.tweenNodeCoin?.stop();
        this.tweenNodeCoin =
            tween(this.nodeIcon)
                .to(0.1, { scale: Vec3.ONE }, { easing: easing.linear })
                .start();
    }
}

