import { _decorator, Component, Label, Node } from 'cc';
import { UICoins } from './UICoins';
import { UIAvatar } from '../UIAvatar';
import { UserModel } from '../../Models/UserModel';
import { UIName } from './UIName';
const { ccclass, property } = _decorator;

@ccclass('UIItemUser')
export class UIItemUser extends Component {

    @property({ type: UIName, group: { name: "User Info", id: "1" } })
    lbUserName: UIName = null;

    @property({ type: UIName, group: { name: "User Info", id: "1" } })
    lbUserUserName: UIName = null;

    @property({ type: UICoins, group: { name: "User Info", id: "1" } })
    lbCoins: UICoins = null;

    @property({ type: UIAvatar, group: { name: "User Info", id: "1" } })
    avatarUser: UIAvatar = null;


    public setUserData(user: UserModel) {
        if (!user) {
            this.lbUserName?.setName("");
            this.lbUserUserName?.setName("");
            this.avatarUser?.setData(null, null);
            return;
        }

        this.lbUserName?.setName((user?.first_name ?? "") + " " + (user?.last_name ?? ""));
        this.lbUserUserName?.setName("@" + (user?.username ?? ""));
        this.lbCoins?.updateData();
        this.avatarUser?.setData(user.photo_url, "");
    }

    public setFechtingData(placeholder: string = "loading...") {
        if (this.lbUserName) {
            this.lbUserName.setName(placeholder);
        }

        if (this.lbUserUserName) {
            this.lbUserUserName.setName(placeholder);
        }

        if (this.avatarUser) {
            this.avatarUser.setData("", "");
        }
    }

    public setNullAvatar() {
        if (this.avatarUser) {
            this.avatarUser.clear();
        }
    }
}


