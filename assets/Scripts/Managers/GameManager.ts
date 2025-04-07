; import { Game, game } from "cc";;
import { CurrentEnviroment, GameConstant } from "../Constant/Constants";
import { UserModel } from "../Models/UserModel";
import { FandomModel } from "../Models/FandomModel";

export class GameManager {
    public static instance: GameManager = null;
    constructor() {
        this.initGameEvents();
    }

    //#region listeners

    private initGameEvents() {
        game.on(Game.EVENT_HIDE, () => {
            if (CurrentEnviroment.LOG) console.log("GameManager: on game hided");
        })
    }

    //#endregion

    //#region init data
    public userInfo: UserModel = null;
    public isNeedToReload: boolean = false;
    public isShouldSync: boolean = true;
    public setUserInfo(userInfo: UserModel): void {
        this.userInfo = userInfo;
        this.isNeedToReload = false;
        this.isShouldSync = true;

    }

    //#endregion

    //#region FTUE

    public isFTUE: boolean = true;

    //#endregion

    // #region fandom
    public fandomModel: FandomModel = null;
    public setFandomModel(fandomModel: FandomModel): void {
        this.fandomModel = fandomModel;
    }

    public getFandomModel(): FandomModel {
        if (!this.fandomModel) {
            this.fandomModel = new FandomModel();
            console.error("GameManager: fandomModel is null");
        }
        return this.fandomModel;
    }
    //#endregion
}
GameManager.instance = new GameManager();   