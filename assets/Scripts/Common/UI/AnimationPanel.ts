import { _decorator, Component, Constraint, easing, Enum, EventKeyboard, input, Input, KeyCode, Node, NodeEventType, Tween, tween, TweenEasing, TweenSystem, UIOpacity, v2, v3, Vec2, Vec3, Widget } from 'cc';
import { VisiblePanel } from '../../Common/UI/VisiblePanel';
import { ViewBeginType } from '../../Constant/Defines';
import { EasingType, getEasingFunction } from '../easing';
import { AudioManager } from '../audioManager';
import { UIManager } from '../uiManager';
const { ccclass, property } = _decorator;

@ccclass('AnimationPanel')
export class AnimationPanel extends VisiblePanel {

    @property({ group: ("AnimationSetting") })
    public isShowPopupsetting: boolean = false;

    @property({ type: Enum(ViewBeginType), group: ("AnimationSetting"), visible() { return this.isShowPopupsetting } })
    beginType: ViewBeginType = ViewBeginType.NONE;

    @property({ type: Vec3, group: ("AnimationSetting"), visible() { return this.isShowPopupsetting } })
    beginPosition: Vec3 = v3(0.0, 0.0, 0.0);

    @property({ group: ("AnimationSetting"), visible() { return this.isShowPopupsetting } })
    private showFromPosX: number = -1080.0;
    0
    @property({ group: ("AnimationSetting"), visible() { return this.isShowPopupsetting } })
    private hideToPosX: number = 1080.0;

    @property({ group: ("AnimationSetting"), visible() { return this.isShowPopupsetting } })
    private showFromPosY: number = 0.0;

    @property({ group: ("AnimationSetting"), visible() { return this.isShowPopupsetting } })
    private hideToPosY: number = 0.0;

    @property({ group: ("AnimationSetting"), visible() { return this.isShowPopupsetting } })
    private showFromScale: number = 1.0;

    @property({ group: ("AnimationSetting"), visible() { return this.isShowPopupsetting } })
    private hideToScale: number = 0.0;

    @property({ type: Enum(EasingType), group: ("AnimationSetting"), visible() { return this.isShowPopupsetting } })
    showEasingType: EasingType = EasingType.BackOut;

    @property({ type: Enum(EasingType), group: ("AnimationSetting"), visible() { return this.isShowPopupsetting } })
    hideEasingType: EasingType = EasingType.BackIn;

    @property({ type: VisiblePanel, group: ("AnimationSetting"), visible() { return this.isShowPopupsetting } })
    dimNode: VisiblePanel = null!;

    @property({ group: ("AnimationSetting") })
    public shownAudioName = "";

    public get isShowing(): boolean {
        return this.visibleIndex == 1;
    }

    protected onLoad(): void {
        this.node.setPosition(this.beginPosition);
        switch (this.beginType) {
            case ViewBeginType.NONE:
                this.visibleIndex = -1;
                break;
            case ViewBeginType.HIDE:
                this.visibleIndex = 0;
                this.setPanelVisible(false, 0.0);
                this.dimNode?.setPanelVisible(false, 0.0);
                break;
            case ViewBeginType.SHOW:
                this.visibleIndex = 1;
                this.setPanelVisible(true, 0.0);
                this.dimNode?.setPanelVisible(true, 0.0);
                break;
        }

    }

    opMain: UIOpacity = null!;
    visibleIndex = -1;
    visibleTween: Tween<Node> = null!;
    setAnimVisible(isVisible: boolean, callback: () => void = null, timeAction: number = 0.35) {
        if (this.visibleIndex == (isVisible ? 1 : 0)) {
            callback?.();
            return;
        };
        this.visibleIndex = isVisible ? 1 : 0;
        if (isVisible) {
            //do anim
            this.node.active = true;
            this.node.position = v3(this.showFromPosX, this.showFromPosY, 0.0);
            this.node.setScale(v3(this.showFromScale, this.showFromScale, this.showFromScale));
            this.visibleTween?.stop();
            this.visibleTween = tween(this.node)
                .to(timeAction, { scale: Vec3.ONE, position: Vec3.ZERO }, { easing: this.getEasingShowAnim() })
                .call(() => callback?.())
                .start();
            this.setDimBackground(true, timeAction, 0.15);
        }
        else {
            this.visibleTween?.stop();
            this.visibleTween = tween(this.node)
                .to(
                    timeAction,
                    { scale: v3(this.hideToScale, this.hideToScale, this.hideToScale), position: v3(this.hideToPosX, this.hideToPosY, 0.0) },
                    { easing: this.getEasingHideAnim() })
                .call(() => {
                    this.node.active = false;
                    callback?.();
                })
                .start();
            this.setDimBackground(false, 0.0, 0.1);
        }
        this.setPanelVisible(isVisible, timeAction * 1.2);
    }

    getEasingShowAnim() {
        return getEasingFunction(this.showEasingType);
    }

    getEasingHideAnim() {
        return getEasingFunction(this.hideEasingType);
    }

    scheduleDim: void = null!;
    setDimBackground(isDim: boolean, delay: number, time: number = 0.2) {
        if (this.dimNode == null) return;
        if (this.scheduleDim != null) {
            this.unschedule(this.scheduleDim);
        }
        this.scheduleDim = this.scheduleOnce(() => this.dimNode.setPanelVisible(isDim, time), delay);
    }

    show(data: any, callback?: () => void) {
        if (this.shownAudioName && this.visibleIndex != 1) { //only call when hidden
            AudioManager.instance.playSound(this.shownAudioName);
        }
        this.setAnimVisible(true, () => {
            this.shown();
            callback?.();
        });
    }

    doShow() {
        this.show(null, undefined);
    }

    doHide() {
        this.hide(undefined);
    }

    hide(callback?: () => void) {
        this.setAnimVisible(false, () => {
            this.hided();
            callback?.();
        }, 0.1);
    }

    shown() {

    }

    hided() {

    }

    //#region handle key down
    protected get isEscable() {
        return false;
    }
    private onKeyDown(event: EventKeyboard) {
        if (this.isEscable == false) return;
        if (event.keyCode === KeyCode.ESCAPE) {
            this.doHide();
        }
    }

    onTouch_Close() {
        this.doHide();
        // AudioManager.instance.playSound(GameConstant.SOUND_FILES.CLOSE);
    }
    //#endregion
}


