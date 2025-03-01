import { _decorator, Component, Label, Node } from 'cc';
import { Holder } from '../../../Common/adapter';
import { UIItemUser } from '../../../Common/UI/UIItemUser';
import { Utils } from '../../../Common/Utils';
import { ILeaderboardItem } from './ScrollviewLeaderboard';
import { UINumberByImages } from '../../../Common/UI/UINumberByImages';
const { ccclass, property } = _decorator;

export enum LeaderboardType {
    NONE,
    REF,
    SCORE,
    CASH
}

@ccclass('ScrollviewLeaderboard_Item')
export class ScrollviewLeaderboard_Item extends Component {
    @property(UIItemUser)
    user: UIItemUser = null;

    @property(Label)
    lbIslandLevel: Label = null;

    @property(Label)
    lbValue: Label = null;

    @property(Node)
    rank1: Node = null;

    @property(Node)
    rank2: Node = null;

    @property(Node)
    rank3: Node = null;

    @property(Node)
    rankNormal: Node = null;

    @property(Label)
    lbRank: Label = null;

    @property(UINumberByImages)
    productionRate: UINumberByImages = null;

    @property({ type: Node, group: { name: "ItemType", id: "2" } })
    nodeDiamond: Node = null;

    @property({ type: Node, group: { name: "ItemType", id: "2" } })
    nodeFriendInvited: Node = null;

    @property({ type: Node, group: { name: "ItemType", id: "2" } })
    nodeScore: Node = null;

    private data: ILeaderboardItem = null;
    show(holder: Holder) {
        this.setData(holder.data as ILeaderboardItem)
    }

    public setData(data: ILeaderboardItem) {
        this.data = data;
        this.user.setUserData(this.data?.user);
        this.lbIslandLevel.string = `Island Lv.${data?.user?.island_level ?? 0}`;
        if (this.data) {
            this.initRank(this.data.rank);
            this.initType();
            this.initIslandBonusRate();
        }
    }

    private getType(valueName: string) {
        if (valueName.indexOf("ref") >= 0) return LeaderboardType.REF;
        if (valueName.indexOf("score") >= 0) return LeaderboardType.SCORE;
        if (valueName.indexOf("diamond") >= 0) return LeaderboardType.CASH;
        if (valueName.indexOf("rate") >= 0) return LeaderboardType.CASH;
        return LeaderboardType.NONE;
    }

    private initIslandBonusRate() {
        if (!this.data.value2Name) return;
        if (!this.productionRate) return;
        const value2 = this.data.user[this.data.value2Name] ?? 0;
        this.productionRate.node.parent.active = value2 > 0;
        if (value2 > 0) {
            this.productionRate.setNumber(value2 * 100.0);
        }
    }

    private initType() {
        const type = this.getType(this.data.valueName);
        this.nodeScore.active = type === LeaderboardType.SCORE;
        this.nodeDiamond.active = type === LeaderboardType.CASH;
        this.nodeFriendInvited.active = type === LeaderboardType.REF;

        if (this.data.user) {
            const number = this.data?.user[this.data.valueName] ?? 0;
            let valueString = "";
            if (number != undefined) {
                switch (type) {
                    case LeaderboardType.NONE:
                        break;
                    case LeaderboardType.REF:
                        valueString = Utils.commaNumber(number);
                        break;
                    case LeaderboardType.SCORE:
                        valueString = Utils.commaNumber(number);
                        break;
                    case LeaderboardType.CASH:
                        valueString = Utils.formatNumber(number, 2);
                        break;
                }

                if (this.data.valueName.indexOf("rate") >= 0) {
                    valueString += "/s";
                }
            }

            this.lbValue.string = valueString;
        }
        else {
            this.lbValue.string = "0";
        }

    }

    private initRank(rank: number) {
        this.rank1.active = rank == 1;
        this.rank2.active = rank == 2;
        this.rank3.active = rank == 3;
        if (rank > 3) {
            this.rankNormal.active = true;
            this.lbRank.node.active = true;
            this.lbRank.string = rank.toString();
        } else {
            this.lbRank.node.active = false;
            this.rankNormal.active = rank == 0;
        }

    }

    hide() {
        this.user.setNullAvatar();
    }
}


