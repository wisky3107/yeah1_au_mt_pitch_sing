import { _decorator, Component, Constraint, easing, Enum, EventKeyboard, input, Input, KeyCode, Node, NodeEventType, Tween, tween, TweenEasing, TweenSystem, UIOpacity, v2, v3, Vec2, Vec3, Widget } from 'cc';
import { VisiblePanel } from '../../Common/UI/VisiblePanel';
import { ViewBeginType } from '../../Constant/Defines';
import { EasingType, getEasingFunction } from '../easing';
import { AudioManager } from '../audioManager';
import { UIManager } from '../uiManager';
const { ccclass, property } = _decorator;

/**
 * Animation panel that provides customizable show/hide animations for UI panels
 * Supports position, scale, rotation, and opacity animations with various easing functions
 */
@ccclass('AnimationPanel')
export class AnimationPanel extends VisiblePanel {
    //#region Animation Settings
    @property({
        group: { name: "Animation Settings", id: "animation" },
        tooltip: "Enable to customize animation settings"
    })
    public isShowPopupsetting: boolean = false;

    @property({
        type: Enum(ViewBeginType),
        group: { name: "Animation Settings", id: "animation" },
        tooltip: "Initial state of the panel",
        visible() { return this.isShowPopupsetting }
    })
    beginType: ViewBeginType = ViewBeginType.NONE;

    @property({
        type: Vec3,
        group: { name: "Animation Settings", id: "animation" },
        tooltip: "Initial position of the panel",
        visible() { return this.isShowPopupsetting }
    })
    beginPosition: Vec3 = v3(0.0, 0.0, 0.0);

    //#region Show Animation Settings
    @property({
        group: { name: "Show Animation", id: "show" },
        tooltip: "Starting X position for show animation",
        visible() { return this.isShowPopupsetting }
    })
    private showFromPosX: number = -1080.0;

    @property({
        group: { name: "Show Animation", id: "show" },
        tooltip: "Starting Y position for show animation",
        visible() { return this.isShowPopupsetting }
    })
    private showFromPosY: number = 0.0;

    @property({
        group: { name: "Show Animation", id: "show" },
        tooltip: "Starting scale for show animation",
        visible() { return this.isShowPopupsetting }
    })
    private showFromScale: number = 1.0;

    @property({
        type: Enum(EasingType),
        group: { name: "Show Animation", id: "show" },
        tooltip: "Easing function for show animation",
        visible() { return this.isShowPopupsetting }
    })
    showEasingType: EasingType = EasingType.BackOut;

    //#endregion

    //#region Hide Animation Settings
    @property({
        group: { name: "Hide Animation", id: "hide" },
        tooltip: "Ending X position for hide animation",
        visible() { return this.isShowPopupsetting }
    })
    private hideToPosX: number = 1080.0;

    @property({
        group: { name: "Hide Animation", id: "hide" },
        tooltip: "Ending Y position for hide animation",
        visible() { return this.isShowPopupsetting }
    })
    private hideToPosY: number = 0.0;

    @property({
        group: { name: "Hide Animation", id: "hide" },
        tooltip: "Ending scale for hide animation",
        visible() { return this.isShowPopupsetting }
    })
    private hideToScale: number = 0.0;

    @property({
        type: Enum(EasingType),
        group: { name: "Hide Animation", id: "hide" },
        tooltip: "Easing function for hide animation",
        visible() { return this.isShowPopupsetting }
    })
    hideEasingType: EasingType = EasingType.BackIn;

    //#endregion

    //#region Additional Animation Settings
    @property({
        group: { name: "Additional Settings", id: "additional" },
        tooltip: "Duration of show animation in seconds",
        visible() { return this.isShowPopupsetting }
    })
    private showDuration: number = 0.35;

    @property({
        group: { name: "Additional Settings", id: "additional" },
        tooltip: "Duration of hide animation in seconds",
        visible() { return this.isShowPopupsetting }
    })
    private hideDuration: number = 0.25;

    @property({
        group: { name: "Additional Settings", id: "additional" },
        tooltip: "Enable rotation animation",
        visible() { return this.isShowPopupsetting }
    })
    private enableRotation: boolean = false;

    @property({
        group: { name: "Additional Settings", id: "additional" },
        tooltip: "Starting rotation for show animation (in degrees)",
        visible() { return this.isShowPopupsetting && this.enableRotation }
    })
    private showFromRotation: number = -45;

    @property({
        group: { name: "Additional Settings", id: "additional" },
        tooltip: "Ending rotation for hide animation (in degrees)",
        visible() { return this.isShowPopupsetting && this.enableRotation }
    })
    private hideToRotation: number = 45;

    @property({
        group: { name: "Additional Settings", id: "additional" },
        tooltip: "Enable opacity animation",
        visible() { return this.isShowPopupsetting }
    })
    private enableOpacity: boolean = true;

    @property({
        group: { name: "Additional Settings", id: "additional" },
        tooltip: "Starting opacity for show animation (0-255)",
        visible() { return this.isShowPopupsetting && this.enableOpacity }
    })
    private showFromOpacity: number = 0;

    @property({
        group: { name: "Additional Settings", id: "additional" },
        tooltip: "Ending opacity for hide animation (0-255)",
        visible() { return this.isShowPopupsetting && this.enableOpacity }
    })
    private hideToOpacity: number = 0;

    //#endregion

    //#region Background Settings
    @property({
        type: VisiblePanel,
        group: { name: "Background Settings", id: "background" },
        tooltip: "Background panel that dims when this panel is shown",
        visible() { return this.isShowPopupsetting }
    })
    dimNode: VisiblePanel = null!;

    @property({
        group: { name: "Background Settings", id: "background" },
        tooltip: "Duration of background dim animation in seconds",
        visible() { return this.isShowPopupsetting }
    })
    private dimDuration: number = 0.2;

    //#endregion

    //#region Audio Settings
    @property({
        group: { name: "Audio Settings", id: "audio" },
        tooltip: "Sound effect to play when panel is shown"
    })
    public shownAudioName = "";

    //#endregion

    //#region Internal Properties
    public opMain: UIOpacity = null!;
    private visibleIndex = -1;
    private visibleTween: Tween<Node> = null!;
    private scheduleDim: void = null!;
    //#endregion

    //#region Public Properties
    public get isShowing(): boolean {
        return this.visibleIndex == 1;
    }
    //#endregion

    //#region Lifecycle Methods
    protected onLoad(): void {
        this.node.setPosition(this.beginPosition);
        switch (this.beginType) {
            case ViewBeginType.NONE:
                this.visibleIndex = -1;
                break;
            case ViewBeginType.HIDE:
                this.setAnimVisible(false, null, this.hideDuration);
                this.dimNode?.setPanelVisible(false, 0.0);
                break;
            case ViewBeginType.SHOW:
                this.setAnimVisible(true, null, this.showDuration);
                this.dimNode?.setPanelVisible(true, 0.0);
                break;
            case ViewBeginType.INSTANCE_SHOW:
                this.setAnimVisible(true, null, 0.02);
                this.dimNode?.setPanelVisible(true, 0.0);
                break;
            case ViewBeginType.INSTANCE_HIDE:
                this.setAnimVisible(false, null, 0.02);
                this.dimNode?.setPanelVisible(false, 0.0);
                break;
        }
    }
    //#endregion

    //#region Animation Methods
    setAnimVisible(isVisible: boolean, callback: () => void = null, timeAction: number = 0.35) {
        if (this.visibleIndex == (isVisible ? 1 : 0)) {
            callback?.();
            return;
        }
        this.visibleIndex = isVisible ? 1 : 0;

        if (isVisible) {
            this.showAnimation(callback, timeAction);
        } else {
            this.hideAnimation(callback, timeAction);
        }
    }

    private showAnimation(callback: () => void, timeAction: number) {
        this.node.active = true;
        
        this.node.position = v3(this.showFromPosX, this.showFromPosY, 0.0);
        this.node.setScale(v3(this.showFromScale, this.showFromScale, this.showFromScale));

        if (this.enableRotation) {
            this.node.setRotationFromEuler(0, 0, this.showFromRotation);
        }

        if (this.enableOpacity) {
            this.opMain = this.getComponent(UIOpacity) || this.addComponent(UIOpacity);
            this.opMain.opacity = this.showFromOpacity;
        }


        if (timeAction === 0) {
            this.node.position = this.beginPosition;
            this.node.setScale(Vec3.ONE);
            if (this.enableRotation) {
                this.node.setRotationFromEuler(0, 0, 0);
            }
            if (this.enableOpacity) {
                this.opMain.opacity = 255;
            }
            callback?.();
        } else {
            this.visibleTween?.stop();
            this.visibleTween = tween(this.node);

            // Position animation
            this.visibleTween.to(timeAction, { position: this.beginPosition }, { easing: this.getEasingShowAnim() });

            // Scale animation
            this.visibleTween.to(timeAction, { scale: Vec3.ONE }, { easing: this.getEasingShowAnim() });

            // Rotation animation
            if (this.enableRotation) {
                this.visibleTween.to(timeAction, { eulerAngles: new Vec3(0, 0, 0) }, { easing: this.getEasingShowAnim() });
            }

            // Opacity animation
            if (this.enableOpacity) {
                tween(this.opMain)
                    .to(timeAction, { opacity: 255 }, { easing: this.getEasingShowAnim() })
                    .start();
            }

            this.visibleTween.call(() => callback?.()).start();
        }
        this.setDimBackground(true, timeAction, this.dimDuration);
    }

    private hideAnimation(callback: () => void, timeAction: number) {
        if (timeAction === 0) {
            this.node.position = v3(this.hideToPosX, this.hideToPosY, 0.0);
            this.node.setScale(v3(this.hideToScale, this.hideToScale, this.hideToScale));
            if (this.enableRotation) {
                this.node.setRotationFromEuler(0, 0, this.hideToRotation);
            }
            if (this.enableOpacity) {
                this.opMain.opacity = this.hideToOpacity;
            }
            this.node.active = false;
            callback?.();
        } else {
            this.visibleTween?.stop();
            this.visibleTween = tween(this.node);

            // Position animation
            this.visibleTween.to(timeAction, { position: v3(this.hideToPosX, this.hideToPosY, 0.0) }, { easing: this.getEasingHideAnim() });

            // Scale animation
            this.visibleTween.to(timeAction, { scale: v3(this.hideToScale, this.hideToScale, this.hideToScale) }, { easing: this.getEasingHideAnim() });

            // Rotation animation
            if (this.enableRotation) {
                this.visibleTween.to(timeAction, { eulerAngles: new Vec3(0, 0, this.hideToRotation) }, { easing: this.getEasingHideAnim() });
            }

            // Opacity animation
            if (this.enableOpacity) {
                tween(this.opMain)
                    .to(timeAction, { opacity: this.hideToOpacity }, { easing: this.getEasingHideAnim() })
                    .start();
            }

            this.visibleTween.call(() => {
                this.node.active = false;
                callback?.();
            }).start();
        }
        this.setDimBackground(false, 0.0, this.dimDuration);
    }

    getEasingShowAnim() {
        return getEasingFunction(this.showEasingType);
    }

    getEasingHideAnim() {
        return getEasingFunction(this.hideEasingType);
    }

    setDimBackground(isDim: boolean, delay: number, time: number = 0.2) {
        if (this.dimNode == null) return;
        if (this.scheduleDim != null) {
            this.unschedule(this.scheduleDim);
        }
        this.scheduleDim = this.scheduleOnce(() => this.dimNode.setPanelVisible(isDim, time), delay);
    }
    //#endregion

    //#region Public Interface
    show(data: any, callback?: () => void) {
        if (this.shownAudioName && this.visibleIndex != 1) {
            AudioManager.instance.playSound(this.shownAudioName);
        }
        this.setAnimVisible(true, () => {
            this.shown();
            callback?.();
        }, this.showDuration);
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
        }, this.hideDuration);
    }

    shown() {
        // Override in derived classes
    }

    hided() {
        // Override in derived classes
    }
    //#endregion

    //#region Input Handling
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
    }
    //#endregion
}


