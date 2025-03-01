import { _decorator, Component,  createDefaultPipeline,  math,  Root,  screen, v2, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIScaler')
export class UIScaler extends Component {
    @property
    public maxValue: number = 1.0;
    @property
    public minValue: number = 0.5;

    protected onLoad(): void {
        const designres = v2(1080.0, 1920.0);
        const baseRatio = designres.x / designres.y;        
        const curRatio = screen.windowSize.width / screen.windowSize.height;
        const scaleRatio = math.clamp(curRatio / baseRatio, this.minValue, this.maxValue);
        this.node.setScale(v3(scaleRatio, scaleRatio, scaleRatio));
    }
}


