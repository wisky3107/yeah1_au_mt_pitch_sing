import { CharacterCustomizationModel, CharacterGender } from "../Models/CharacterCustomizationModel";
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


    //#region character customization
    private _characterCustomization: CharacterCustomizationModel = null;

    public get id(): string {
        return this.userdata.id ?? "";
    }

    public get coins(): number {
        return this.userdata?.coin ?? 0;
    }

    public get characterId(): string {
        return CharacterGender.Male;
    }

    public getCharacterCustomization(): CharacterCustomizationModel {
        return this._characterCustomization;
    }

    public setCharacterCustomization(data: any) {
        const customization = new CharacterCustomizationModel();
        Object.assign(customization, data);
        this._characterCustomization = customization;
    }

    //#endregion

}
const user = new UserManager();


