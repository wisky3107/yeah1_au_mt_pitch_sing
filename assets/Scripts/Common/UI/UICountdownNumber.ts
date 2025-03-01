import { _decorator, CCBoolean, math, Sprite } from 'cc';
import { UINumberLabel } from './UINumberLabel';
const { ccclass, property } = _decorator;

@ccclass('UICountdownNumber')
export class UICountdownNumber extends UINumberLabel {
    @property(Sprite)
    sprtProgress: Sprite = null;

    @property(CCBoolean)
    isProgressSpriteRevert: boolean = false;

    private startValue: number = 0;
    public onRoundNumberCallback: Function = null;

    public startCountdownFrom(value: number, callback: Function = null, format: string = "", onRoundNumberCallback: Function = null) {
        this.startValue = value;

        this.onRoundNumberCallback = onRoundNumberCallback;
        this.lastRoundNumberCall = 0;
        
        this.showValue.value = value;
        this.setNumber(0, value, true, callback, format, 0);
    }

    protected update(dt: number): void {
        super.update(dt);

        if (this.sprtProgress) {
            let fillAmount = math.clamp(this.showValue.value / this.startValue, 0.0, 1.0);
            if (this.isProgressSpriteRevert) {
                fillAmount = 1.0 - fillAmount;
            }
            this.sprtProgress.fillRange = fillAmount;
        }

        this.checkCallRoundNumber();
    }

    private lastRoundNumberCall = 0;
    protected checkCallRoundNumber() {
        const checkRound = Math.round(this.showValue.value);
        if (checkRound != this.lastRoundNumberCall) {
            this.lastRoundNumberCall = checkRound;
            this.onRoundNumberCallback?.(this.lastRoundNumberCall);
        }
    }
}
