import { _decorator, Component, EventHandle, EventHandler, Node, Toggle, view } from 'cc';
import { VisiblePanel } from './VisiblePanel';
import { CurrentEnviroment, GameConstant } from '../../Constant/Constants';
import { AudioManager } from '../audioManager';
const { ccclass, property } = _decorator;

@ccclass('ToggleData')
export class ToggleData {
    @property(Toggle)
    toggle: Toggle = null!;

    @property([VisiblePanel])
    visibleViews: VisiblePanel[] = [];

    updateVisible() {
        this.visibleViews.forEach(view => view?.setPanelVisible(this.toggle.isChecked, 0.25, true));
    }
}

@ccclass('UIToggleGroups')
export class UIToggleGroups extends Component {
    @property([ToggleData])
    data: ToggleData[] = [];

    @property(Toggle)
    default: Toggle = null!;

    @property
    private isAllowOffAll = false;
    private activeToggle: Toggle = null!;
    protected onLoad(): void {
        this.init();
    }

    private init() {
        this.data.forEach(tgl => {
            let eventHandler = new EventHandler();
            eventHandler.target = this.node;
            eventHandler.component = "UIToggleGroups";
            eventHandler.handler = "onToggleChanged";
            tgl.toggle.checkEvents.push(eventHandler);
        })

        if (this.default) {
            this.default.isChecked = true;
            this.onToggleChanged(this.default);
        }
    }

    onToggleChanged(toggle: Toggle) {
        if (this.isAllowOffAll == false) {

        }
        if (this.activeToggle == toggle) {
            return;
        }
        if (toggle.isChecked) {
            this.activeToggle = toggle;
            this.activeToggle.interactable = false;
        }
        if (CurrentEnviroment.LOG) console.log("onToggleChanged" + toggle);
        if (toggle.isChecked) {
            this.data.forEach(data => {
                if (data.toggle != toggle) {
                    data.toggle.isChecked = false;
                    data.toggle.interactable = true;
                }
                data.updateVisible();
            })
        }

        // AudioManager.instance.playSound(GameConstant.SOUND_FILES.TAB_SWITCH);
    }

    public updateToggles() {
        this.data.forEach(tgl => {
            tgl.updateVisible();
        })
    }
}


