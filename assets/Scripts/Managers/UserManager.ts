
import { UserModel } from "../Models/UserModel";
import { GameManager } from "./GameManager";

export class UserManager {
    public static instance: UserManager = null;
    constructor() {
        UserManager.instance = this;
    }

    public userdata: UserModel = null;
    public setUserData(userdata: UserModel) {
        this.userdata = userdata;
    }

    //#region user base info

    public get id(): string {
        return this.userdata.id ?? "";
    }

    public get coins(): number {
        return this.userdata?.coin ?? 0;
    }

    public get characterId(): string {
        return "boy";
    }
}
const user = new UserManager();


