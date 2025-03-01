import { DEBUG } from "cc/env";
import { APIFakeData, initFakeData } from "./APIFakeData";
import { CurrentEnviroment, GameConstant } from "../Constant/Constants";
import { UserModel } from "../Models/UserModel";
import { ClientEvent } from "../Common/ClientEvent";

class APIManager {
    private baseURL: string;
    private timeout: number;

    constructor() {
        this.baseURL = '';
        this.timeout = 30000;
    }

    MAX_RETAKE_TOKEN: number = 5;
    retakeTokenTimesThisSession: number = 0;
    retakeToken: () => Promise<boolean> = null!;
    onFailedCallback: (error: ResponseModelBase) => void = null;

    isLog = true;
    log = (content: any) => {
        if (this.isLog) {
            if (CurrentEnviroment.LOG) console.log("[API] : ", content);
        }
    };

    setBaseURL(url: string): void {
        this.baseURL = url;
    }

    setTimeout(milliseconds: number): void {
        this.timeout = milliseconds;
    }

    async request<T>(endpoint: string, config: RequestConfig, callback: (data: T) => void, failHandler: (error: ResponseModelBase) => void, key: string = null): Promise<void> {
        let data: T = null!;
        let isError = false;
        let resData = null;
        if (!key) {
            key = apiKey;
        }

        try {
            const response = await this.fetchWithRetry<T>(endpoint, config);
            if (!response.ok) throw {
                message: 'Network response was not ok',
                statusCode: 777
            };
            data = await response.json();
            this.log("data:" + data);
            resData = data as ResponseModelBase;
            if (resData.statusCode && resData.statusCode != 200) {
                isError = true;
                this.log("Server response ERROR:" + resData.message);
                failHandler(resData);
                this.onFailedCallback?.(resData);
            }
        } catch (error) {
            isError = true;
            this.log("ERROR:" + error);
            failHandler(error as ResponseModelBase);
            this.onFailedCallback?.(error as ResponseModelBase);
        }

        if (!isError) {
            //decrupt the data depend on the key 
            try {
                var bytes = CryptoJS.AES.decrypt(resData.data, key);
                var original = bytes.toString(CryptoJS.enc.Utf8);
                resData.data = JSON.parse(original);
            }
            catch (e) {
                this.log("resData: ERROR" + e);
            }

            callback(resData);
        }
    }

    private async fetchWithRetry<T>(endpoint: string, config: RequestConfig, retries: number = 3): Promise<Response> {
        let attempts = 0;
        while (attempts < retries) {
            try {
                const url = this.baseURL + endpoint;
                this.log("fetch " + url);
                const response = await this.timeoutPromise(fetch(url, config));
                if (response.status == 401 && this.retakeToken) {
                    this.log("try get new token");
                    if (++this.retakeTokenTimesThisSession <= this.MAX_RETAKE_TOKEN) { //limit number of called
                        let isSuccess = await this.retakeToken();
                        if (isSuccess) {
                            config.headers = headers();
                        }
                    }
                }
                if (response.ok) return response;
            } catch (error) {
                if (attempts === retries - 1) throw error;
            }
            attempts++;
            this.log("retry attemptes:" + attempts);
        }
        throw {
            message: 'All retries failed',
            statusCode: 666
        };
    }

    private timeoutPromise(fetchPromise: Promise<Response>): Promise<Response> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => reject(new Error('Request timed out')), this.timeout);
            fetchPromise.then(
                res => {
                    clearTimeout(timeoutId);
                    resolve(res);
                },
                err => {
                    clearTimeout(timeoutId);
                    reject(err);
                }
            );
        });
    }

}

interface RequestConfig {
    method: string;
    headers?: HeadersInit;
    body?: BodyInit;
}

interface ResponseModelBase {
    statusCode?: number;
    message?: string;
    error?: string;
}

let isFakeData = false;
if (isFakeData && DEBUG) {
    setFakeData();
}

export function setFakeData() {
    isFakeData = true;
    initFakeData();
}

const CryptoJS: any = window["CryptoJS"];
let token = "";
let authenKey = "";
let apiKey = "";
const api = new APIManager();
api.onFailedCallback = (error) => {
    // ClientEvent.dispatchEvent(GameConstant.EVENT_NAME.ON_API_FAILED, error);
}
setInterval(intervalPing, 300000); //ping every 5 minutes

export function intervalPing() {
    if (!token) return;
    // requestPing((data, error) => {
    //     if (error) {
    //         if (CurrentEnviroment.LOG) console.log("Ping ERROR");
    //         return;
    //     }
    //     if (CurrentEnviroment.LOG) console.log("Ping DONE");
    // });
}

export function setAPIManagerURL(url: string) {
    api.setBaseURL(url)
}

export function setKeyAuthen(key: string) {
    authenKey = key;
}

export function getApiKey() {
    return apiKey;
}

export function setApiKey(key: string) {
    apiKey = key;
}

export const headers = function () {
    return {
        "Authorization": "Bearer " + token,
        'Content-Type': 'application/json'
    }
}

const getConfig = function (): RequestConfig {
    return {
        method: 'GET',
        headers: headers()
    }
};

const encryptWithKey = function (apiName: string, encodedData: string, key: string = null) {
    if (!key) {
        key = apiKey;
    }

    const params = "data=" + encodeURIComponent(CryptoJS.AES.encrypt(encodedData, key).toString());
    return apiName + "?" + params;
}

const urlConfig = function (apiName: string, data: any = null, key: string = null): string {
    if (!data) {
        return apiName;
    }
    const encodedData = Object.keys(data)
        .filter(key => data[key] !== null) // Filter out keys with null values
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
        .join('&');

    if (CurrentEnviroment.LOG) console.log("encoded data: " + encodedData);
    return encryptWithKey(apiName, encodedData, key);
}

const postConfig = function (data: any = null, key: string = null): RequestConfig {
    if (!data) {
        return {
            method: 'POST',
            headers: headers()
        }
    }
    const encodedData = Object.keys(data)
        .filter(key => data[key] !== null) // Filter out keys with null values
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
        .join('&');
    if (CurrentEnviroment.LOG) console.log("encoded data: " + encodedData);
    return {
        method: 'POST',
        headers: headers(),
        body: encodedData
    }
};

const postConfigJson = function (data: any = null, key: string = ""): RequestConfig {
    if (!data) {
        return {
            method: 'POST',
            headers: headers()
        }
    }
    return {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
    }
};

export function setToken(input: string) {
    token = input;
}

export function getToken() {
    return "Bearer " + token;
}

export function getEncrypedToken() {
    return CryptoJS.AES.encrypt(getToken(), authenKey).toString()
}

export function updateApiKey(user: UserModel) {
}

export function requestUserInfo(callback: (data: any, error: ResponseModelBase) => void) {
    const apiName: string = "users/info";
    if (isFakeData && DEBUG) return callback?.(APIFakeData[apiName], null);
    api.request<{ data: any }>(
        apiName,
        postConfig(),
        res => {
            callback?.(res.data, null!);
        }, error => {
            callback?.(null!, error);
        });
}
