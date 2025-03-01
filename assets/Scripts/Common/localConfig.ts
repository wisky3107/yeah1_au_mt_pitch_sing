import { _decorator, resources } from "cc";
import { CSVManager } from "./csvManager";
import { resourceUtil } from "./resourceUtil";
const { ccclass, property } = _decorator;

@ccclass("LocalConfig")
export class LocalConfig {
    /* class member could be defined like this */
    private static _instance: LocalConfig;
    private _csvManager: CSVManager = new CSVManager();

    static get instance () {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new LocalConfig();
        return this._instance;
    }

    private _callback: Function = new Function();
    private _currentLoad: number = 0;
    private _cntLoad: number = 0;

    public loadConfig (cb: Function) {
        this._callback = cb;
        this._loadCSV();
    }

    private _loadCSV () {
        resources.loadDir("datas", (err: any, assets) => {
            if (err) {
                return;
            }

            let arrCsvFiles = assets.filter((item: any) => {
                return item._native !== ".md";
            })

            this._cntLoad = arrCsvFiles.length;

            if (arrCsvFiles.length) {
                arrCsvFiles.forEach((item, index, array) => {
                    resourceUtil.getTextData(item.name, (content: any) => {
                        this._csvManager.addTable(item.name, content);
                        this._tryToCallbackOnFinished();
                    });
                });
            } else {
                this._tryToCallbackOnFinished();
            }
        })
    }

    queryOne (tableName: string, key: string, value: any) {
        return this._csvManager.queryOne(tableName, key, value);
    }

    queryByID (tableName: string, ID: string) {
        return this._csvManager.queryByID(tableName, ID);
    }


    getTable (tableName: string) {
        return this._csvManager.getTable(tableName);
    }

    getTableArr (tableName: string) {
        return this._csvManager.getTableArr(tableName);
    }


    queryAll (tableName: string, key: string, value: any) {
        return this._csvManager.queryAll(tableName, key, value);
    }

    queryIn (tableName: string, key: string, values: any[]) {
        return this._csvManager.queryIn(tableName, key, values);
    }

    queryByCondition (tableName: string, condition: any) {
        return this._csvManager.queryByCondition(tableName, condition);
    }

    private _tryToCallbackOnFinished () {
        if (this._callback) {
            this._currentLoad++;
            if (this._currentLoad >= this._cntLoad) {
                this._callback();
            }
        }
    }
}
