; import { _decorator, AudioSource, Component, Label, Node, Toggle, ToggleContainer } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { ScrollviewLeaderboard } from './ScrollviewLeaderboard';
import { ScrollviewLeaderboard_Item } from './ScrollviewLeaderboard_Item';
import { requestLeaderboard } from '../../../Managers/APIManager';
import { UIManager } from '../../../Common/uiManager';
import { AudioManager } from '../../../Common/audioManager';
import { LeaderboardModel, LeaderboardUserModel } from '../../../Models/LeaderboardModel';
import { Utils } from '../../../Common/Utils';
import { ClientEvent } from '../../../Common/ClientEvent';
import { GameConstant } from '../../../Constant/Constants';
import { GameManager } from '../../../Managers/GameManager';
const { ccclass, property } = _decorator;

@ccclass('PopupLeaderboard')
export class PopupLeaderboard extends PopupBase {
    @property(ScrollviewLeaderboard)
    svMain: ScrollviewLeaderboard = null;

    @property(ScrollviewLeaderboard_Item)
    myLeaderboardItem: ScrollviewLeaderboard_Item = null;

    @property(Toggle)
    tglLeague: Toggle = null;

    @property(Toggle)
    tglAll: Toggle = null;

    @property(Toggle)
    tglInvite: Toggle = null;

    @property(Toggle)
    tglEvent: Toggle = null;

    @property(Toggle)
    tglBattleShip: Toggle = null;

    @property(Toggle)
    tglFriend: Toggle = null;

    @property(Toggle)
    tglIslandRate: Toggle = null;

    @property(Label)
    lbEventRemainTime: Label = null;

    private onHided: Function = null;
    private clipSFX: AudioSource = null;
    private data: LeaderboardModel = null;

    show(data: any, callback?: () => void): void {
        this.visibleIndex = -1;
        super.show(data, callback);
        const { onHided } = data;
        this.onHided = onHided;
        this.requestData();
    }

    shown(): void {
        super.shown();
        this.clipSFX = AudioManager.instance.playSound("capybara_song")
    }

    private requestData() {
        requestLeaderboard((data, error) => {
            if (error) {
                UIManager.instance.showMessage({ message: error?.message });
                return;
            }
            this.data = data;
            GameManager.instance.setSeasonData(this.data.season_name);

            this.updateScrollViewData();
            this.updateRemainingEventTime();
        })
    }

    private updateScrollViewData() {
        if (!this.data) return;
        let appliedList = [];
        let myRank = 0;
        let rankName = "";
        let valueName = "";
        let value2Name = "";//now only use for island bonus rate

        let meData: LeaderboardUserModel = JSON.parse(JSON.stringify(this.data.me));
        if (this.tglLeague.isChecked) {
            appliedList = this.data.top_league;
            myRank = this.data.me.rank_league;
            rankName = "rank_league";
            valueName = "diamond";
            meData.ref = null;
        } else if (this.tglAll.isChecked) {
            appliedList = this.data.top_diamond;
            myRank = this.data.me.rank_diamond;
            rankName = "rank_diamond";
            valueName = "diamond";
            meData.ref = null;
        } else if (this.tglInvite.isChecked) {
            appliedList = this.data.top_ref;
            myRank = this.data.me.rank_ref;
            rankName = "rank_ref";
            valueName = "ref";
            value2Name = "island_bonus_rate_ref";
            meData.diamond = null;
        } else if (this.tglEvent.isChecked) {
            appliedList = this.data.top_ref_event;
            myRank = this.data.me.rank_ref_event;
            rankName = "rank_ref_event";
            valueName = "ref_event";
            meData.diamond = null;
        } else if (this.tglBattleShip.isChecked) {
            appliedList = this.data.top_battleship;
            myRank = this.data.me.rank_battleship;
            rankName = "rank_battleship";
            valueName = "score";
            value2Name = "island_bonus_rate_battleship";
            meData.diamond = null;
        } else if (this.tglFriend.isChecked) {
            appliedList = this.data.top_friend;
            myRank = this.data.me.rank_friend;
            rankName = "rank_friend";
            valueName = "score";
            meData.diamond = null;
        }
        else if (this.tglIslandRate.isChecked) {
            appliedList = this.data.top_island_rate;
            myRank = this.data.me.rank_island_rate;
            rankName = "rank_island_rate";
            valueName = "island_rate";
            meData.diamond = null;
        }

        this.svMain.setData(appliedList ?? [], myRank, 0, rankName, valueName, value2Name);
        this.myLeaderboardItem.node.active = myRank === 0;//rank 0 means out top
        if (myRank === 0) {
            this.myLeaderboardItem.setData({
                user: meData,
                rank: myRank,
                valueName: valueName,
                value2Name: value2Name,
                isMe: true,
            })
        }
    }

    hided(): void {
        super.hided();
        this.clipSFX?.stop();
        this.stopCountingEventDown();
    }

    doUImanagerHide(): void {
        super.doUImanagerHide(); // Hide
        this.onHided?.();
        AudioManager.instance.playSound("A_Boost_DeSelect");
    }

    private updateRemainingEventTime() {
        this.startEventCountingDown(this.data.remaining_time);
    }

    private scheduleEventCountingDown: number = -1;
    private startEventCountingDown(timeGap: number) {
        let totalSeconds = Math.round(timeGap / 1000.0) + 1.0;
        const countDown = () => {
            if (--totalSeconds < 0) {
                return;
            }
            const timeStr = Utils.formatTimeForSecond(totalSeconds);
            if (this.lbEventRemainTime) {
                this.lbEventRemainTime.string = timeStr;
            }
            ClientEvent.dispatchEvent(GameConstant.EVENT_NAME.SEASON_TIME_COUNT, timeStr);
            this.scheduleEventCountingDown = setTimeout(() => {
                countDown();
            }, 1000);
        };
        this.stopCountingEventDown();
        countDown();
    }

    private stopCountingEventDown() {
        clearTimeout(this.scheduleEventCountingDown);
    }

    //#region callbacks 

    public onToggle_Tab() {
        setTimeout(() => {
            this.updateScrollViewData();
        });
    }

    //#endregion
}


