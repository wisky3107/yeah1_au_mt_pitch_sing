; import { Game, game } from "cc";;
import { CurrentEnviroment, GameConstant } from "../Constant/Constants";
import { UserModel } from "../Models/UserModel";

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
}
GameManager.instance = new GameManager();   