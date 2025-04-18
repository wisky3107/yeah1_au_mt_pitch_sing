import { _decorator, Component, Label, Node, tween, Tween } from 'cc';
import { Utils } from '../Utils';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('UINumberLabelComponent')
@requireComponent(Label)
export class UINumberLabelComponent extends Component {
    protected showValue: { value: number } = { value: 0 };
    protected tweenMain: Tween<{ value: number }> = null;
    protected isReformatNumber: boolean = false;
    protected decimalNumberCount: number = 0;
    protected format: string = ""; //have to look like "(value)" the value will be replaced
    protected label: Label = null;

    protected onLoad(): void {
        this.label = this.node.getComponent(Label);
    }

    protected getNumber(input: number): string {
        if (!this.isReformatNumber) return Utils.toFixed(input, 3);
        return Utils.formatNumber(this.showValue.value, this.decimalNumberCount, this.decimalNumberCount);
    }

    protected getString(input: number) {
        let number = this.getNumber(input);
        if (!this.format) return number;
        return this.format.replace("value", number);
    }

    onDisable(): void {
        this.stop();
    }

    public setNumber(
        value: number,
        duration: number = 0.35,
        isReformatNumber = true,
        callback: Function = null,
        format: string = "",
        decimalNumberCount: number = 2) {
        this.isReformatNumber = isReformatNumber;
        this.decimalNumberCount = decimalNumberCount;
        this.format = format;
        this.tweenMain?.stop();

        if (duration <= 0) {
            this.showValue.value = duration;
            this.label.string = this.getString(this.showValue.value);
            return;
        }
        this.tweenMain = tween(this.showValue)
            .to(duration, { value: value })
            .call(() => {
                this.tweenMain = null;
                this.label.string = this.getString(this.showValue.value);
                callback?.();
            })
            .start();
    }

    public stop() {
        this.tweenMain?.stop();
        this.tweenMain = null;
    }

    protected update(dt: number): void {
        if (this.tweenMain == null) return;
        const checkShown = this.getString(this.showValue.value);
        if (this.label.string == checkShown) return;
        this.label.string = checkShown;
    }
}

