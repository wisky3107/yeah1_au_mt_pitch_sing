
Number.prototype["clamp"] = function (min: number, max: number) {
    return Math.min(Math.max(this.valueOf(), min), max);
};

Number.prototype["pingPong"] = function (min: number, max: number) {
    const offset = max - min;
    // Use this.valueOf() to get the number value of 'this'
    const finalValue = (this.valueOf() - min) / offset;
    const beforeDot = Math.floor(finalValue);
    const afterDot = finalValue - beforeDot;
    const retVal = beforeDot % 2 === 0 ? min + (offset * afterDot) : max - (offset * afterDot);
    return retVal;
}

Number.prototype["randomInt"] = function (min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

Array.prototype["shuffle"] = function () {
    for (let i = this.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this[i], this[j]] = [this[j], this[i]];
    }
    return this;
}

Array.prototype["distinct"] = function () {
    return this.filter(
        (thing, i, arr) => arr.findIndex(t => t.id === thing.id) === i
    );
}

Array.prototype["randomElement"] = function () {
    if (this.length <= 0) return null;
    return this[Math.floor(Math.random() * this.length)];
}

import { Vec3, _decorator } from "cc";
const { ccclass, property } = _decorator;

@ccclass("util")
export class Utils {
    public static formatNumber(num: number, noAbbDecimals: number = 0, fixedValue: number = 2): string {
        if (!num) return '0';
        const abbreviations = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qua', 'Qui', 'Sx', 'Sp', 'Oc', 'No', 'Vi', 'Dv', 'Tv', 'Qaa', 'Qaq', 'Qap', 'Qaop', 'Qit']; // Add more as needed
        let index = 0;
        while (num >= 1000) {
            num /= 1000;
            index++;
            if (index >= abbreviations.length - 1) break;
        }
        if (index == 0) {
            return this.toFixed(num, noAbbDecimals);
        }
        const roundedNum = this.toFixed(num, fixedValue);
        return `${roundedNum.replace(".", ",")}${abbreviations[index]}`;
        // return `${roundedNum.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${abbreviations[index]}`;
    }

    public static toFixed(input: number, decimalPlaces: number): string {
        const fixedStr = input.toFixed(decimalPlaces);
        return fixedStr.replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');
    }

    public static commaNumber(num: number): string {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    public static mapAbbreviationToWord(abbreviation: string): string {
        const abbreviationMap: { [key: string]: string } = {
            '': ' ',
            'K': 'Thousand',
            'M': 'Million',
            'B': 'Billion',
            'T': 'Trillion',
            'Qa': 'Quadrillion',
            'Qi': 'Quintillion',
            'Sx': 'Sextillion',
            'Sp': 'Septillion',
            'Oc': 'Octillion',
            'No': 'Nonillion',
            'Dc': 'Decillion',
            'Ud': 'Undecillion',
            'Dd': 'Duodecillion',
            'Td': 'Tredecillion',
            'Qua': 'Quattuordecillion',
            'Qui': 'Quindecillion',
            'Vi': 'Sexdecillion',
            'Dv': 'Septendecillion',
            'Tv': 'Octodecillion',
            'Qaa': 'Novemdecillion',
            'Qaq': 'Vigintillion',
            'Qap': 'Unvigintillion',
            'Qaop': 'Duovigintillion',
            'Qit': 'Tresvigintillion'
        };

        return abbreviationMap[abbreviation] || '';
    }

    public static getTokenParam() {
        return this.getUrlkeyValue("tk");
    }

    public static getRefreshTokenParam() {
        return this.getUrlkeyValue("rtk");
    }

    public static getDeviceKeyParam() {
        return this.getUrlkeyValue("dk");
    }

    public static getIdPasswordUrl(): { username: string, password: string } {
        return { username: this.getUrlkeyValue("username"), password: this.getUrlkeyValue("password") };
    }

    public static getUrlkeyValue = function (key: string): string {
        var urlStr = window.location.href;
        var url = new URL(urlStr);
        if (url.searchParams.has(key)) {
            var code = url.searchParams.get(key);
            return code as string;
        }
        return "";
    }

    public static getAngle = (input: number) => {
        if (input < 0.0) return 360.0 + input % 360.0;
        if (input > 360.0) return input % 360.0;
        return input;
    }

    public static WaitFor(condition: Function, callback: Function) {
        if (!condition()) {
            setTimeout(this.WaitFor.bind(null, condition, callback), 100); /* this checks the flag every 100 milliseconds*/
        } else {
            callback();
        }
    }

    public static getPointText = (point: number, bonus: number): string => {
        if (bonus <= 0) return point + "";
        return `${point}(<color=green>${bonus}</color>)`;
    }

    public static getGuildShortName = (guildName: string) => {
        const splited: string[] = guildName.split(" ");
        let retVal = "";
        splited.forEach(str => retVal += str[0]);
        return retVal.toUpperCase();
    }

    public static capitalizeWords = (input: string): string => {
        // Convert the input string to lowercase and then capitalize the first character of each word
        return input.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }

    public static loadScript(url: string, callback?: () => void) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        if (callback) {
            // Execute the callback once the script has loaded
            script.onload = callback;
        }

        // Append the script tag to the document's <head> or <body>
        document.head.appendChild(script);
    }
    public static clone(sObj: any) {
        if (sObj === null || typeof sObj !== "object") {
            return sObj;
        }

        let s: { [key: string]: any } = {};
        if (sObj.constructor === Array) {
            s = [];
        }

        for (let i in sObj) {
            if (sObj.hasOwnProperty(i)) {
                s[i] = this.clone(sObj[i]);
            }
        }

        return s;
    }

    /**
     * @param { any} srcObj  
     * @returns 
     */
    public static objectToArray(srcObj: { [key: string]: any }) {

        let resultArr: any[] = [];

        // to array
        for (let key in srcObj) {
            if (!srcObj.hasOwnProperty(key)) {
                continue;
            }

            resultArr.push(srcObj[key]);
        }

        return resultArr;
    }
    /**
     * 
     * @param { any} srcObj 
     * @param { string} objectKey 
     * @returns 
     */
    public static arrayToObject(srcObj: any, objectKey: string) {

        let resultObj: { [key: string]: any } = {};

        // to object
        for (var key in srcObj) {
            if (!srcObj.hasOwnProperty(key) || !srcObj[key][objectKey]) {
                continue;
            }

            resultObj[srcObj[key][objectKey]] = srcObj[key];
        }

        return resultObj;
    }

    /**
     * @param {arrany} weightArr 
     * @param {number} totalWeight 
     * @returns 
     */
    public static getWeightRandIndex(weightArr: [], totalWeight: number) {
        let randWeight: number = Math.floor(Math.random() * totalWeight);
        let sum: number = 0;
        for (var weightIndex: number = 0; weightIndex < weightArr.length; weightIndex++) {
            sum += weightArr[weightIndex];
            if (randWeight < sum) {
                break;
            }
        }

        return weightIndex;
    }

    /**
     * @param {Number} n   
     * @param {Number} m    
     * @returns {Array}    
     */
    public static getRandomNFromM(n: number, m: number) {
        let array: any[] = [];
        let intRd: number = 0;
        let count: number = 0;

        while (count < m) {
            if (count >= n + 1) {
                break;
            }

            intRd = this.getRandomInt(0, n);
            var flag = 0;
            for (var i = 0; i < count; i++) {
                if (array[i] === intRd) {
                    flag = 1;
                    break;
                }
            }

            if (flag === 0) {
                array[count] = intRd;
                count++;
            }
        }

        return array;
    }

    /**
     * @param {Number} min 
     * @param {Number} max 
     * @returns 
     */
    public static getRandomInt(min: number, max: number) {
        let r: number = Math.random();
        let rr: number = r * (max - min + 1) + min;
        return Math.floor(rr);
    }

    /**
     * @param {string} render 
     * @returns 
     */
    public static getStringLength(render: string) {
        let strArr: string = render;
        let len: number = 0;
        for (let i: number = 0, n = strArr.length; i < n; i++) {
            let val: number = strArr.charCodeAt(i);
            if (val <= 255) {
                len = len + 1;
            } else {
                len = len + 2;
            }
        }

        return Math.ceil(len / 2);
    }

    /**
     * @param obj
     */
    public static isEmptyObject(obj: any) {
        let result: boolean = true;
        if (obj && obj.constructor === Object) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    result = false;
                    break;
                }
            }
        } else {
            result = false;
        }

        return result;
    }

    /**
     * @param {Object|Number} dateValue 
     * @returns {boolean}
     */
    public static isNewDay(dateValue: any) {
        var oldDate: any = new Date(dateValue);
        var curDate: any = new Date();

        var oldYear = oldDate.getYear();
        var oldMonth = oldDate.getMonth();
        var oldDay = oldDate.getDate();
        var curYear = curDate.getYear();
        var curMonth = curDate.getMonth();
        var curDay = curDate.getDate();

        if (curYear > oldYear) {
            return true;
        } else {
            if (curMonth > oldMonth) {
                return true;
            } else {
                if (curDay > oldDay) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @param {object}o 
     * @returns 
     */
    public static getPropertyCount(o: Object) {
        var n, count = 0;
        for (n in o) {
            if (o.hasOwnProperty(n)) {
                count++;
            }
        }
        return count;
    }

    /**
     * @param array
     * @param diff
     */
    public static difference(array: [], diff: any) {
        let result: any[] = [];
        if (array.constructor !== Array || diff.constructor !== Array) {
            return result;
        }

        let length = array.length;
        for (let i: number = 0; i < length; i++) {
            if (diff.indexOf(array[i]) === -1) {
                result.push(array[i]);
            }
        }

        return result;
    }


    public static _stringToArray(string: string) {
        var rsAstralRange = '\\ud800-\\udfff';
        var rsZWJ = '\\u200d';
        var rsVarRange = '\\ufe0e\\ufe0f';
        var rsComboMarksRange = '\\u0300-\\u036f';
        var reComboHalfMarksRange = '\\ufe20-\\ufe2f';
        var rsComboSymbolsRange = '\\u20d0-\\u20ff';
        var rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange;
        var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange + rsComboRange + rsVarRange + ']');

        var rsFitz = '\\ud83c[\\udffb-\\udfff]';
        var rsOptVar = '[' + rsVarRange + ']?';
        var rsCombo = '[' + rsComboRange + ']';
        var rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')';
        var reOptMod = rsModifier + '?';
        var rsAstral = '[' + rsAstralRange + ']';
        var rsNonAstral = '[^' + rsAstralRange + ']';
        var rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}';
        var rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]';
        var rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*';
        var rsSeq = rsOptVar + reOptMod + rsOptJoin;
        var rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';
        var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

        var hasUnicode = function (val: string): boolean {
            return reHasUnicode.test(val);
        };

        var unicodeToArray = function (val: string) {
            return val.match(reUnicode) || [];
        };

        var asciiToArray = function (val: string) {
            return val.split('');
        };

        return hasUnicode(string) ? unicodeToArray(string) : asciiToArray(string);
    }

    public static simulationUUID() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    public static trim(str: string) {
        return str.replace(/(^\s*)|(\s*$)/g, "");
    }

    /**
     * @param {String|Number} start 
     * @param {String|Number} end 
     */
    public static isNowValid(start: any, end: any): boolean {
        var startTime = new Date(start);
        var endTime = new Date(end);
        var result = false;

        if (startTime.getDate() + '' !== 'NaN' && endTime.getDate() + '' !== 'NaN') {
            var curDate = new Date();
            result = curDate < endTime && curDate > startTime;
        }

        return result;
    }

    /**
     * @param start 
     * @param end 
     * @returns 
     */
    public static getDeltaDays(start: any, end: any) {
        start = new Date(start);
        end = new Date(end);

        let startYear: number = start.getFullYear();
        let startMonth: number = start.getMonth() + 1;
        let startDate: number = start.getDate();
        let endYear: number = end.getFullYear();
        let endMonth: number = end.getMonth() + 1;
        let endDate: number = end.getDate();

        start = new Date(startYear + '/' + startMonth + '/' + startDate + ' GMT+0800').getTime();
        end = new Date(endYear + '/' + endMonth + '/' + endDate + ' GMT+0800').getTime();

        let deltaTime = end - start;
        return Math.floor(deltaTime / (24 * 60 * 60 * 1000));
    }

    public static getUserTimezone() {
        const offset = new Date().getTimezoneOffset();
        const hours = Math.abs(offset / 60);
        const minutes = Math.abs(offset % 60);
        const sign = offset > 0 ? "-" : "+";

        return `GMT${sign}${String(hours)}${String(minutes)}`;
    }

    /**
     * @param array 
     * @returns 
     */
    public static getMin(array: number[]) {
        let result: number = null!;
        if (array.constructor === Array) {
            let length = array.length;
            for (let i = 0; i < length; i++) {
                if (i === 0) {
                    result = Number(array[0]);
                } else {
                    result = result > Number(array[i]) ? Number(array[i]) : result;
                }
            }
        }

        return result;
    }

    /**
     * @param time 
     * @returns 
     */
    public static formatTwoDigits(time: number) {
        //@ts-ignore
        return (Array(2).join(0) + time).slice(-2);
    }

    public static getRemainingTime(startDate: Date, endDate: Date): { string: string, isZero: boolean, remainSeconds: number } {
        if (!endDate) {
            return {
                string: "",
                isZero: true,
                remainSeconds: 0
            };
        }
        const msPerSecond = 1000;
        const msPerMinute = msPerSecond * 60;
        const msPerHour = msPerMinute * 60;
        const msPerDay = msPerHour * 24;

        const diff = endDate.getTime() - startDate.getTime();

        const days = Math.floor(diff / msPerDay);
        const hours = Math.floor((diff % msPerDay) / msPerHour);
        const minutes = Math.floor((diff % msPerHour) / msPerMinute);
        const seconds = Math.floor((diff % msPerMinute) / msPerSecond);
        const isZero = diff <= 0;

        const getString = (number: number) => {
            if (number < 10) return "0" + number;
            return number + "";
        }

        let retVal = `${days > 0 ? getString(days) + ":" : ""}${getString(hours)}:${getString(minutes)}:${getString(seconds)}`;
        if (days <= 0 && hours <= 0 && minutes <= 0 && seconds <= 10) {
            retVal = getString(seconds);
        }

        return {
            string: retVal,
            isZero: isZero,
            remainSeconds: diff / msPerSecond
        };
    }

    /**
     * @param date  
     * @param fmt 
     * @returns 
     */
    public static formatDate(date: Date, fmt: string) {
        const monthsFull: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthsShort: string[] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        if (fmt.includes("MMMM")) {
            fmt = fmt.replace("MMMM", monthsFull[date.getMonth()]);
        } else if (fmt.includes("MMM")) {
            fmt = fmt.replace("MMM", monthsShort[date.getMonth()]);
        }

        const o: { [key: string]: number } = {
            "Y+": date.getFullYear(),
            "M+": date.getMonth() + 1, // Month as number
            "d+": date.getDate(), // Day of month
            "h+": date.getHours(), // Hour
            "m+": date.getMinutes(), // Minute
            "s+": date.getSeconds(), // Second
            "q+": Math.floor((date.getMonth() + 3) / 3), // Quarter
            "S": date.getMilliseconds() // Millisecond
        };

        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }

        for (const k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k].toString()) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }

        return fmt;
    }

    public static getDay() {
        let date: Date = new Date();

        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }

    /**
     * @param {string} name  
     * @param {number}limit 
     * @returns {string} 
     */
    public static formatName(name: string, limit: number) {
        limit = limit || 6;
        var nameArray = this._stringToArray(name);
        var str = '';
        var length = nameArray.length;
        if (length > limit) {
            for (var i = 0; i < limit; i++) {
                str += nameArray[i];
            }

            str += '...';
        } else {
            str = name;
        }

        return str;
    }

    /**
     * @param {number}money 
     * @returns {string}
     */
    public static formatMoney(money: number) {
        let arrUnit: string[] = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y', 'B', 'N', 'D'];

        let strValue: string = '';
        for (let idx: number = 0; idx < arrUnit.length; idx++) {
            if (money >= 10000) {
                money /= 1000;
            } else {
                strValue = Math.floor(money).toLocaleString() + arrUnit[idx];
                break;
            }
        }

        if (strValue === '') {
            strValue = Math.floor(money) + 'U';
        }

        return strValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * @param {number}value 
     * @returns {string}
     */
    public static formatValue(value: number) {
        let arrUnit: string[] = [];
        let strValue: string = '';
        for (let i = 0; i < 26; i++) {
            arrUnit.push(String.fromCharCode(97 + i));
        }

        for (let idx: number = 0; idx < arrUnit.length; idx++) {
            if (value >= 10000) {
                value /= 1000;
            } else {
                strValue = Math.floor(value) + arrUnit[idx];
                break;
            }
        }

        return strValue;
    }

    /**
     * @param {Number} leftSec 
     */
    public static formatTimeForSecond(leftSec: number, withoutSeconds: boolean = false) {
        let timeStr: string = '';
        let sec: number = leftSec % 60;

        let leftMin: number = Math.floor(leftSec / 60);
        leftMin = leftMin < 0 ? 0 : leftMin;

        let hour: number = Math.floor(leftMin / 60);
        let min: number = leftMin % 60;

        if (hour > 0) {
            timeStr += hour > 9 ? hour.toString() : '0' + hour;
            timeStr += ':';
        } else {
            timeStr += '00:';
        }

        timeStr += min > 9 ? min.toString() : '0' + min;

        if (!withoutSeconds) {
            timeStr += ':';
            timeStr += sec > 9 ? sec.toString() : '0' + sec;
        }

        return timeStr;
    }

    /**
     * @param {Number} ms
     */
    public static formatTimeForMillisecond(ms: number): Object {
        let second: number = Math.floor(ms / 1000 % 60);
        let minute: number = Math.floor(ms / 1000 / 60 % 60);
        let hour: number = Math.floor(ms / 1000 / 60 / 60);
        return { 'hour': hour, 'minute': minute, 'second': second };
    }

    /**
     * @param {Array}arr  
     * @returns 
     */
    public static rand(arr: []): [] {
        let arrClone = this.clone(arr);
        for (let i: number = arrClone.length - 1; i >= 0; i--) {
            const randomIndex: number = Math.floor(Math.random() * (i + 1));
            const itemIndex: number = arrClone[randomIndex];
            arrClone[randomIndex] = arrClone[i];
            arrClone[i] = itemIndex;
        }
        return arrClone;
    }

    /**
     * @static
     * @param {number} start
     * @param {number} end
     * @memberof Util
     */
    public static getOffsetMimutes(start: number, end: number) {
        let offSetTime: number = end - start;
        let minute: number = Math.floor((offSetTime % (1000 * 60 * 60)) / (1000 * 60));
        return minute;
    }

    /**
     * @param {number} num 
     * @param {number} idx 
     */
    public static formatNumToFixed(num: number, idx: number = 0) {
        return Number(num.toFixed(idx));
    }

    /**
     * @param {number} targetValue  
     * @param {number} curValue 
     * @param {number} ratio    
     * @returns 
     */
    public static lerp(targetValue: number, curValue: number, ratio: number = 0.25) {
        let v: number = curValue;
        if (targetValue > curValue) {
            v = curValue + (targetValue - curValue) * ratio;
        } else if (targetValue < curValue) {
            v = curValue - (curValue - targetValue) * ratio;
        }

        return v;
    }

    /**
     * @param {String} str 
     */
    public static decrypt(b64Data: string) {
        let n: number = 6;
        if (b64Data.length % 2 === 0) {
            n = 7;
        }

        let decodeData = '';
        for (var idx = 0; idx < b64Data.length - n; idx += 2) {
            decodeData += b64Data[idx + 1];
            decodeData += b64Data[idx];
        }

        decodeData += b64Data.slice(b64Data.length - n + 1);

        decodeData = this._base64Decode(decodeData);

        return decodeData;
    }

    /**
 * @param {String} str 
 */
    public static encrypt(str: string) {
        let b64Data = this._base64encode(str);

        let n: number = 6;
        if (b64Data.length % 2 === 0) {
            n = 7;
        }

        let encodeData: string = '';

        for (let idx = 0; idx < (b64Data.length - n + 1) / 2; idx++) {
            encodeData += b64Data[2 * idx + 1];
            encodeData += b64Data[2 * idx];
        }

        encodeData += b64Data.slice(b64Data.length - n + 1);

        return encodeData;
    }

    //public method for encoding
    /**
     * base64
     * @param {string}input 
     * @returns 
     */
    private static _base64encode(input: string) {
        let keyStr: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        let output: string = "", chr1: number, chr2: number, chr3: number, enc1: number, enc2: number, enc3: number, enc4: number, i: number = 0;
        input = this._utf8Encode(input);
        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output +
                keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                keyStr.charAt(enc3) + keyStr.charAt(enc4);
        }
        return output;
    }

    /**
     * utf-8 
     * @param string 
     * @returns 
     */
    private static _utf8Encode(string: string) {
        string = string.replace(/\r\n/g, "\n");
        let utftext: string = "";
        for (let n: number = 0; n < string.length; n++) {
            let c: number = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }
        return utftext;
    }

    /**
     * utf-8
     * @param utftext 
     * @returns 
     */
    private static _utf8Decode(utftext: string) {
        let string = "";
        let i: number = 0;
        let c: number = 0;
        let c1: number = 0;
        let c2: number = 0;
        let c3: number = 0;
        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }

    /**
     * @param {string}input 
     * @returns 
     */
    private static _base64Decode(input: string) {
        let keyStr: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        let output: string = "";
        let chr1: number;
        let chr2: number;
        let chr3: number;
        let enc1: number;
        let enc2: number;
        let enc3: number;
        let enc4: number;
        let i: number = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) {
            enc1 = keyStr.indexOf(input.charAt(i++));
            enc2 = keyStr.indexOf(input.charAt(i++));
            enc3 = keyStr.indexOf(input.charAt(i++));
            enc4 = keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = this._utf8Decode(output);
        return output;
    }

    public static checkIsLowPhone(): Boolean {
        if (window["wx"]) {

            let nowBenchmarkLevel: number = -1; //nowBenchmarkLevel = -1
            const sys = window["wx"].getSystemInfoSync();
            const isIOS = sys.system.indexOf('iOS') >= 0;
            if (isIOS) {
                const model = sys.model;
                const ultraLowPhoneType = ['iPhone1,1', 'iPhone1,2', 'iPhone2,1', 'iPhone3,1', 'iPhone3,3', 'iPhone4,1', 'iPhone5,1', 'iPhone5,2', 'iPhone5,3', 'iPhone5,4', 'iPhone6,1', 'iPhone6,2'];
                const lowPhoneType = ['iPhone6,2', 'iPhone7,1', 'iPhone7,2', 'iPhone8,1', 'iPhone8,2', 'iPhone8,4'];
                const middlePhoneType = ['iPhone9,1', 'iPhone9,2', 'iPhone9,3', 'iPhone9,4', 'iPhone10,1', 'iPhone10,2', 'iPhone10,3', 'iPhone10,4', 'iPhone10,5', 'iPhone10,6'];
                const highPhoneType = ['iPhone11,2', 'iPhone11,4', 'iPhone11,6', 'iPhone11,8', 'iPhone12,1', 'iPhone12,3', 'iPhone12,5', 'iPhone12,8'];
                for (let i = 0; i < ultraLowPhoneType.length; i++) {
                    if (model.indexOf(ultraLowPhoneType[i]) >= 0)
                        nowBenchmarkLevel = 5;
                }
                for (let i = 0; i < lowPhoneType.length; i++) {
                    if (model.indexOf(lowPhoneType[i]) >= 0)
                        nowBenchmarkLevel = 10;
                }
                for (let i = 0; i < middlePhoneType.length; i++) {
                    if (model.indexOf(middlePhoneType[i]) >= 0)
                        nowBenchmarkLevel = 20;
                }
                for (let i = 0; i < highPhoneType.length; i++) {
                    if (model.indexOf(highPhoneType[i]) >= 0)
                        nowBenchmarkLevel = 30;
                }
            } else {
                nowBenchmarkLevel = sys.benchmarkLevel;
            }

            if (nowBenchmarkLevel < 22) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    public static truncateString(str: string, maxLength: number = 15, headLength: number = 5, tailLength: number = 5): string {
        // Check if the string needs to be truncated
        if (str.length <= maxLength) {
            return str; // No truncation needed
        }

        // Calculate lengths and truncate
        const head = str.slice(0, headLength);
        const tail = str.slice(-tailLength);

        // Return the truncated string
        return `${head}...${tail}`;
    }

    public static getVectorString(input: Vec3) {
        return input.x.toFixed(2) + "-" + input.y.toFixed(2);
    }

    public static getCoorKey(row: number, col: number): string {
        return `${row}_${col}`;
    }

}
