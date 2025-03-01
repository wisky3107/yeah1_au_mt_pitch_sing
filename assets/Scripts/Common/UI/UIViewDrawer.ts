import { _decorator, Component, easing, Enum, Node, tween, v3, Vec3, Vec4 } from 'cc';
import { ViewBeginType } from '../../Constant/Defines';
import { GameConstant } from '../../Constant/Constants';
import { AudioManager } from '../audioManager';
const { ccclass, property } = _decorator;

export enum DrawerDirectionType {
    HORIZONTAL,
    VERTICAL,
}

@ccclass('UIViewDrawer')
export class UIViewDrawer extends Component {
    @property({ type: Enum(ViewBeginType) })
    beginType: ViewBeginType = ViewBeginType.HIDE;

    @property({ type: Enum(DrawerDirectionType) })
    direction: DrawerDirectionType = DrawerDirectionType.HORIZONTAL;

    @property(Vec3)
    beginPosition: Vec3 = v3(0.0, 0.0, 0.0);

    @property(Node)
    drawerIndicator: Node = null!;

    @property([Node])
    nodeVisibles: Node[] = [];

    @property
    public hidePosX: number = 0;

    @property
    public showPosX: number = 0;

    private visibleIndex = -1;
    public get isShowing() {
        return this.visibleIndex == 1;
    }

    private setPosition(input: Vec3, value: number): Vec3 {
        switch (this.direction) {
            case DrawerDirectionType.HORIZONTAL:
                input.x = value;
                break;
            case DrawerDirectionType.VERTICAL:
                input.y = value;
                break;
        }
        return input;
    }

    private addPosition(input: Vec3, value: number): Vec3 {
        switch (this.direction) {
            case DrawerDirectionType.HORIZONTAL:
                input.x += value;
                break;
            case DrawerDirectionType.VERTICAL:
                input.y += value;
                break;
        }
        return input;
    }

    protected onLoad(): void {
        switch (this.beginType) {
            case ViewBeginType.NONE:
                break;
            case ViewBeginType.HIDE:
                this.nodeVisibles.forEach(node => node.active = false);
                let hidePos = this.beginPosition.clone();
                this.setPosition(hidePos, this.hidePosX)
                this.node.setPosition(hidePos);
                if (this.drawerIndicator) {
                    this.drawerIndicator.angle = 0.0;
                }
                this.visibleIndex = 0;
                break;
            case ViewBeginType.SHOW:
                this.node.setPosition(this.beginPosition);
                this.nodeVisibles.forEach(node => node.active = true);
                if (this.drawerIndicator) {
                    this.drawerIndicator.angle = 180.0;
                }
                this.visibleIndex = 1;
                break;
        }
    }

    public setDrawerVisible(isVisible: boolean, callback: () => void = null!, timeAction: number = 0.2) {
        if (this.visibleIndex == (isVisible ? 1 : 0)) return;
        this.visibleIndex = isVisible ? 1 : 0;
        if (isVisible) {
            this.nodeVisibles.forEach(node => node.active = true);
        }
        let targetPos = this.node.position.clone();
        this.setPosition(targetPos, isVisible ? this.showPosX : this.hidePosX);
        tween(this.node).stop();
        tween(this.node)
            .to(timeAction, { position: targetPos }, { easing: easing.quartOut })
            .call(() => {
                if (isVisible == false) {
                    this.nodeVisibles.forEach(node => node.active = false);
                }
                callback?.();
            })
            .start();

        //drawer indicator
        const indicatorAngle = isVisible ? 180.0 : 0.0;
        if (this.drawerIndicator) {
            tween(this.drawerIndicator).stop();
            tween(this.drawerIndicator)
                .to(timeAction, { angle: indicatorAngle }, { easing: easing.backOut })
                .start();
        }
    }

    show(data: any, callback: Function = null!) {
        this.setDrawerVisible(true, () => {
            this.shown();
            callback?.();
        });

        AudioManager.instance.playSound(GameConstant.SOUND_FILES.SLIDE_IN);
    }

    doShow() {
        this.show(null);
    }

    doHide() {
        this.hide();
    }

    hide(callback: Function = null!) {
        this.setDrawerVisible(false, () => {
            this.hided();
            callback?.();
        });
        AudioManager.instance.playSound(GameConstant.SOUND_FILES.SLIDE_OUT);
    }

    shown() {

    }

    hided() {

    }

    onTouch_ShowHide() {
        if (this.visibleIndex == 1) {
            this.doHide();
        } else {
            this.doShow();
        }
    }
}


