import { _decorator, isDisplayStats, Node, Prefab, PrefabLink } from 'cc';
import { AlwaysScroll, Holder, IElement, Layer, ScrollAdapter, View } from '../../../Common/adapter';
import { ScrollviewLeaderboard_Item } from './ScrollviewLeaderboard_Item';
import { LeaderboardUserModel } from '../../../Models/LeaderboardModel';
import { ScrollviewLeaderboard_Tops } from './ScrollviewLeaderboard_Tops';
const { ccclass, property } = _decorator;

export interface ILeaderboardItem {
    user?: LeaderboardUserModel;
    rank?: number;
    isMe?: boolean;
    valueName?: string;
    value2Name?: string;
}

export interface ILeaderboardItemList {
    items: ILeaderboardItem[];
    season_time?: number,
}

@ccclass('ScrollviewLeaderboard')
export class ScrollviewLeaderboard extends ScrollAdapter {
    @property(Node) prefab: Node = null
    @property(Node) prefabTops: Node = null

    @property(Node) prefabBonusRate: Node = null
    @property(Node) prefabBonusRateTops: Node = null

    private myRank: number = -1;

    public getPrefab(data: any): Node | Prefab {
        if (data.items) {
            if (data.items[0] && data.items[0].value2Name) {
                return this.prefabBonusRateTops;
            }
            return this.prefabTops;
        }
        if (data.value2Name) {
            return this.prefabBonusRate;
        }
        return this.prefab
    }
    public getHolder(node: Node, code: string): Holder<any> {
        if (node.name.indexOf("Item - Tops") >= 0) {
            return new myListItemHolder(node, code, this);
        }
        return new myHolder(node, code, this)
    }

    public getView(): View<any> {
        return new myView(this)
    }

    public initElement(element: IElement, data: any): void {
        element.fixed = data.isMe;
        if (element.fixed) {
            element.layer = Layer.Medium;
        }
    }

    public setData(data: LeaderboardUserModel[], myRank: number, initIndex: number, applyRankName = "rank_diamond", valueName: string = "diamond", value2Name: string = ""): void {
        this.modelManager.clear();
        this.myRank = myRank;

        const finalData: any[] = [];
        const getLeaderboardData = (userInput: LeaderboardUserModel): ILeaderboardItem => {
            if (!userInput) return {
                user: null,
                rank: 0,
                isMe: false,
                valueName: valueName,
                value2Name: value2Name
            };
            return {
                user: userInput,
                rank: userInput[applyRankName],
                isMe: userInput[applyRankName] === myRank,
                valueName: valueName,
                value2Name: value2Name
            }
        }
        finalData.push({ items: [getLeaderboardData(data[0]), getLeaderboardData(data[1]), getLeaderboardData(data[2])] });
        for (let i = 3; i < data.length; i++) {
            finalData.push(getLeaderboardData(data[i]));
        }

        this.modelManager.insert(finalData);
        this.scrollManager.scrollToGroupIndex(0, initIndex);
    }

    public scrollTo(index: number): void {
        this.scrollManager.scrollToGroupIndex(0.25, index, AlwaysScroll.Auto);
    }
}

class myView extends View {

    protected onVisible(): void {
    }
    protected onDisable(): void {
    }
}

class myHolder extends Holder {
    _script: ScrollviewLeaderboard_Item = null
    protected onCreated(): void {
        this._script = this.node.getComponent(ScrollviewLeaderboard_Item)
    }
    protected onVisible(): void {
        this._script.show(this)
    }
    protected onDisable(): void {
        this._script.hide()
    }
}

class myListItemHolder extends Holder {
    _script: ScrollviewLeaderboard_Tops = null
    protected onCreated(): void {
        this._script = this.node.getComponent(ScrollviewLeaderboard_Tops)
    }
    protected onVisible(): void {
        this._script.show(this)
    }
    protected onDisable(): void {
        this._script.hide()
    }
}

