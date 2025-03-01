import { _decorator, Component, Label, Node } from 'cc';
import { Utils } from './Utils';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('UITimer')
@requireComponent(Label)
export class UITimer extends Component {
    private label: Label = null;
    protected onLoad(): void {
        this.label = this.getComponent(Label);
    }

    onEnable(): void {
        if (this.endTime > 0) {
            this.startCountingDown(this.endTime, this.callback);
        }
    }

    onDisable(): void {
        this.stopCountingEventDown();
    }

    private endTime: number = 0;
    private callback: Function = null;
    private scheduleCountingDown: number = -1;
    public startCountingDown(endTime: number, outOfTimeCallback: Function) {
        this.endTime = endTime;
        this.callback = outOfTimeCallback;

        let timeGap = endTime - Date.now();
        if (timeGap <= 0) {
            outOfTimeCallback?.();
            return;
        }
        let totalSeconds = Math.round(timeGap / 1000.0) + 1.0;
        const countDown = () => {
            if (--totalSeconds < 0) {
                outOfTimeCallback?.();
                return;
            }
            const timeStr = Utils.formatTimeForSecond(totalSeconds);
            if (this.label) {
                this.label.string = timeStr;
            }
            this.scheduleCountingDown = setTimeout(() => {
                countDown();
            }, 1000);
        };
        this.stopCountingEventDown();
        countDown();
    }

    private stopCountingEventDown() {
        clearTimeout(this.scheduleCountingDown);
    }
}


