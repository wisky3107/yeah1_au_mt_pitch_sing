import { _decorator, sys, log, native } from "cc";
import { Utils } from "../Common/Utils";

const { ccclass, property } = _decorator;

@ccclass("StorageManager")
export class StorageManager {
    private static _instance: StorageManager;

    public static get instance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new StorageManager();
        this._instance.start();
        return this._instance;
    }

    private _jsonData: { [key: string]: any } = {};
    private _path: any = null;
    private KEY_CONFIG: string = 'coindfo';
    private _markSave: boolean = false;
    private _saveTimer: number = -1;

    start() {
        this._jsonData = {
            "userId": "",
        };

        this._path = this._getConfigPath();

        var content;
        if (sys.isNative) {
            var valueObject = native.fileUtils.getValueMapFromFile(this._path);
            content = valueObject[this.KEY_CONFIG];
        } else {
            content = sys.localStorage.getItem(this.KEY_CONFIG);
        }

        if (content && content.length) {
            if (content.startsWith('@')) {
                content = content.substring(1);
                content = Utils.decrypt(content);
            }

            try {
                var jsonData = JSON.parse(content);
                this._jsonData = jsonData;
            } catch (excepaiton) {

            }
        }

        // this._saveTimer = setInterval(() => {
        //     this.scheduleSave();
        // }, 5000);
    }

    /**
     * @param {string}key  
     * @param {any}value  
     */
    setConfigDataWithoutSave(key: string, value: any) {
        let account: string = this._jsonData.userId;
        if (this._jsonData[account]) {
            this._jsonData[account][key] = value;
        } else {
            console.error("no account can not save");
        }
    }

  /**
     * @param {string}key  
     * @param {any}value  
     */
    setConfigData (key: string, value: any) {
        this.setConfigDataWithoutSave(key, value);
        this._markSave = true; 
    }

    /**
     * @param {string} key 
     * @returns 
     */
    getConfigData(key: string) {
        let account: string = this._jsonData.userId;
        if (this._jsonData[account]) {
            var value = this._jsonData[account][key];
            return value ? value : "";
        } else {
            log("no account can not load");
            return "";
        }
    }

    //remove global data
    public removeGlobalData(input: string) {
        delete this._jsonData[input];
        return;
        //create new json data have all they keys except the key
        const newJsonData = Object.keys(this._jsonData).reduce((acc, key) => {
            if (key !== input) {
                acc[key] = this._jsonData[key];
            }
            return acc;
        }, {});
        this._jsonData = newJsonData;
    }

    /**
     * @param {string} key 
     * @param {any}value  
     * @returns 
     */
    public setGlobalData(key: string, value: any) {
        this._jsonData[key] = value;
        this.save();
    }

    /**
     * 
     * @param {string} key 
     * @returns 
     */
    public getGlobalData(key: string) {
        return this._jsonData[key];
    }

    /**
     * @param {string} userId 
     * @returns 
     */
    public setUserId(userId: string) {
        this._jsonData.userId = userId;
        if (!this._jsonData[userId]) {
            this._jsonData[userId] = {};
        }

        this.save();
    }

    /**
     * @returns {string}
     */
    public getUserId() {
        return this._jsonData.userId;
    }

    /**
     * @returns 
     */
    public scheduleSave() {
        if (!this._markSave) {
            return;
        }

        this.save();
    }

    public markModified() {
        this._markSave = true;
    }

    
    public save() {
        var str = JSON.stringify(this._jsonData);
        let zipStr = '@' + Utils.encrypt(str);
        this._markSave = false;
        if (!sys.isNative) {
            var ls = sys.localStorage;
            ls.setItem(this.KEY_CONFIG, zipStr);
            return;
        }
        var valueObj: any = {};
        valueObj[this.KEY_CONFIG] = zipStr;
        native.fileUtils.writeValueMapToFile(valueObj, this._getConfigPath());
    }

    /**
     * @returns 
     */
    private _getConfigPath() {

        let platform: any = sys.platform;

        let path: string = "";

        if (platform === sys.OS.WINDOWS) {
            path = "src/conf";
        } else if (platform === sys.OS.LINUX) {
            path = "./conf";
        } else {
            if (sys.isNative) {
                path = native.fileUtils.getWritablePath();
                path = path + "conf";
            } else {
                path = "src/conf";
            }
        }

        return path;
    }
}
