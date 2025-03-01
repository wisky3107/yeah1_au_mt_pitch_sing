import { Label, _decorator } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
const { ccclass, property } = _decorator;

@ccclass('PopupLoading')
export class PopupLoading extends PopupBase {
    @property(Label)
    lbDetail: Label = null;

    show(data: any, callback?: () => void): void {
        super.show(data, callback);
        const detail = data as string ?? "";
        this.lbDetail.string = detail;
    }

    public setLoadingDetail(detail: string){
        this.lbDetail.string = detail;
    }
}


