import { _decorator, Component, Node, DynamicAtlasManager, Label } from 'cc';
import { ILeaderboardItem, ILeaderboardItemList } from './ScrollviewLeaderboard';
import { Holder } from '../../../Common/adapter';
import { ScrollviewLeaderboard_Item } from './ScrollviewLeaderboard_Item';
import { ClientEvent } from '../../../Common/ClientEvent';
import { GameConstant } from '../../../Constant/Constants';
import { GameManager } from '../../../Managers/GameManager';
const { ccclass, property } = _decorator;

@ccclass('ScrollviewLeaderboard_Tops')
export class ScrollviewLeaderboard_Tops extends Component {
    @property([ScrollviewLeaderboard_Item])
    items: ScrollviewLeaderboard_Item[] = [];

    @property(Label)
    lbTimer: Label = null;
    
    @property(Label)
    lbSeasonName: Label = null;

    private data: ILeaderboardItemList = null;
    show(holder: Holder) {
        this.data = holder.data as ILeaderboardItemList;
        for (let i = 0; i < this.items.length; i++) {
            const itemData = this.data?.items[i] ?? null;
            this.items[i].setData(itemData);
        }

        this.lbSeasonName.string = GameManager.instance.seasonName;
        ClientEvent.on(GameConstant.EVENT_NAME.SEASON_TIME_COUNT, this.onSeasonTimeCountingDown, this);
    }

    hide() {
        ClientEvent.off(GameConstant.EVENT_NAME.SEASON_TIME_COUNT, this.onSeasonTimeCountingDown, this);
    }

    private onSeasonTimeCountingDown(data: any) {
        if (this.lbTimer) {
            this.lbTimer.string = data as string;
        }
    }
}


