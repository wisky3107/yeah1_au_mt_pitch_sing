import { _decorator, Component, easing, Label, Node, Tween, tween, v3, Vec3 } from 'cc';
import { ClientEvent } from '../ClientEvent';
import { GameConstant } from '../../Constant/Constants';
import { UserManager } from '../../Managers/UserManager';
import { Utils } from '../Utils';
const { ccclass, property } = _decorator;

@ccclass('UICoins')
export class UICoins extends Component {
    @property(Node)
    nodeIcon: Node = null;

    public static uistacks: UICoins[] = [];
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

    public static get current(): UICoins {
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
        ClientEvent.on(GameConstant.EVENT_NAME.USERCOIN_UPDATED, this.updateData, this);
        UICoins.uistacks.push(this);
    }

    protected onDisable(): void {
        ClientEvent.off(GameConstant.EVENT_NAME.USERCOIN_UPDATED, this.updateData, this);
        UICoins.uistacks = UICoins.uistacks.filter(ui => ui != this);
        this.tweenMain?.stop();
        this.tweenMain = null;
    }

    private showCoins: { value: number } = { value: 0 };
    private tweenMain: Tween<{ value: number }> = null;
    public updateData() {
        const checkCoins = UserManager.instance.coins;
        this.tweenMain?.stop();
        this.tweenMain = tween(this.showCoins)
            .to(0.35, { value: checkCoins })
            .call(() => {
                this.tweenMain = null;
                this.labelMain.string = Utils.formatNumber(Math.round(this.showCoins?.value));;
            })
            .start();
    }

    protected update(dt: number): void {
        if (this.tweenMain == null) return;
        const checkShown = Utils.formatNumber(Math.round(this.showCoins?.value));
        if (this.labelMain.string == checkShown) return;
        this.labelMain.string = checkShown;
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


