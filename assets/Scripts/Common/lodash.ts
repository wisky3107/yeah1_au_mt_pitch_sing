import { _decorator } from "cc";
const { ccclass } = _decorator;

@ccclass("lodash")
export class lodash {
    /* class member could be defined like this */
    // dummy = '';
    /**
     * @param  {any} collection 
     * @param {Function} predicate 
     */
    public static find (collection: any, predicate: Function) {
        var result;
        if (!Array.isArray(collection)) {
            collection = lodash._toArray(collection);
        }

        result = collection.filter(predicate);
        if (result.length) {
            return result[0];
        }

        return undefined;
    }

    /**
     * @param  {any} collection 
     * @param {Function} iteratee 
     */
    public static forEach(collection: any, iteratee: any) {
        if (!Array.isArray(collection)) {
            var array = lodash._toArrayKey(collection);
            array.forEach(function (value: any, index: number, arr: any[]) {
                var key1 = value['key'];
                var value1 = value['value'];
                iteratee(value1, key1, collection);
            });
        } else {
            collection.forEach(iteratee);
        }
    }

    /**
     * @param {any} sObj 
     * @returns 
     */
    public static cloneDeep(sObj: any) {
        if (sObj === null || typeof sObj !== "object") {
            return sObj;
        }

        let s: any = {};
        if (sObj.constructor === Array) {
            s = [];
        }

        for (let i in sObj) {
            if (sObj.hasOwnProperty(i)) {
                s[i] = lodash.cloneDeep(sObj[i]);
            }
        }

        return s;
    }

    /**
     * @param {Array|Object} collection  .
     * @param {Function} predicate  
     * @returns {Array} 
     */
    public static map(collection: any, iteratee: any) {
        if (!Array.isArray(collection)) {
            collection = lodash._toArray(collection);
        }

        let arr: any[] = [];
        collection.forEach(function (value: any, index: number, array: []) {
            arr.push(iteratee(value, index, array));
        });

        return arr;
    }

    /**
     * 
     * @param srcObj 
     * @returns 
     */
    private static _toArrayKey(srcObj: { [x: string]: any; hasOwnProperty: (arg0: string) => any; }) {
        var resultArr = [];

        // to array
        for (var key in srcObj) {
            if (!srcObj.hasOwnProperty(key)) {
                continue;
            }

            resultArr.push({ key: key, value: srcObj[key] });
        }

        return resultArr;
    }

    private static _toArray(srcObj: any) {
        let resultArr: any[] = [];

        // to array
        for (var key in srcObj) {
            if (!srcObj.hasOwnProperty(key)) {
                continue;
            }

            resultArr.push(srcObj[key]);
        }

        return resultArr;
    }

    /**
     * @param {Array|Object} collection  .
     * @param {Function} predicate  
     * @returns 
     */
    public static filter(collection: any, iteratees: Function) {
        if (!Array.isArray(collection)) {
            collection = lodash._toArray(collection);
        }

        return collection.filter(iteratees);
    }

    /**
     * @param {any}x 
     * @param {any}y 
     * @returns {boolean} 
     */
    public static isEqual(x: any, y: any): boolean {
        var in1 = x instanceof Object;
        var in2 = y instanceof Object;
        if (!in1 || !in2) {
            return x === y;
        }

        if (Object.keys(x).length !== Object.keys(y).length) {
            return false;
        }

        for (var p in x) {
            var a = x[p] instanceof Object;
            var b = y[p] instanceof Object;
            if (a && b) {
                return lodash.isEqual(x[p], y[p]);
            } else if (x[p] !== y[p]) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param {Array} array 
     * @param {Array} value 
     * @param  {Function} comparator 
     * @returns 
     */
    public static pullAllWith(array: any[], value: any[], comparator: Function) {
        value.forEach(function (item) {
            var res = array.filter(function (n) {
                return comparator(n, item);
            });

            res.forEach(function (item) {
                var index = array.indexOf(item);
                if (array.indexOf(item) !== -1) {
                    array.splice(index, 1);
                }
            });
        });

        return array;
    }

    /**
     * @returns 
     */
    public static now() {
        return Date.now();
    }

    /**
     * @param {Array} array 
     * @returns 
     */
    public static pullAll(array: any[], value: any) {
        value.forEach(function (item: any) {
            var index = array.indexOf(item);
            if (array.indexOf(item) !== -1) {
                array.splice(index, 1);
            }
        });

        return array;
    }

    /**
     * @param {Array|Object} collection  
     * @param {Function} predicate  
     */
    public static forEachRight(collection: [] | {}, iteratee: Function) {
        if (!Array.isArray(collection)) {
            collection = lodash._toArray(collection);
        }

        //@ts-ignore
        for (var i = collection.length - 1; i >= 0; i--) {
            //@ts-ignore
            var ret = iteratee(collection[i]);
            if (!ret) break;
        }
    }

    /**
     * @param {string} str 
     * @param {string}target  
     * @param {number}position 
     * @returns 
     */
    public static startsWith(str: string, target: string, position: number) {
        str = str.substr(position);
        return str.startsWith(target);
    }

    /**
     * @param {string} str 
     * @param {string}target  
     * @param {number}position 
     * @returns 
     */
    public static endsWith(str: string, target: string, position: number) {
        str = str.substr(position);
        return str.endsWith(target);
    }

    /**
     * @param {Array} array  
     * @param {Function} predicate  
     * @returns 
     */
    public static remove(array: any[], predicate: Function) {
        var result: any[] = [];
        var indexes: any[] = [];
        array.forEach(function (item, index) {
            if (predicate(item)) {
                result.push(item);
                indexes.push(index);
            }
        });

        lodash._basePullAt(array, indexes);
        return result;
    }

    private static _basePullAt(array: any[], indexes: any[]) {
        var length = array ? indexes.length : 0;
        var lastIndex = length - 1;
        var previous;

        while (length--) {
            var index = indexes[length];
            if (length === lastIndex || index !== previous) {
                previous = index;
                Array.prototype.splice.call(array, index, 1);
            }
        }

        return array;
    }

    /**
     * @param {Array} array  
     * @param {Function} predicate  
     * @param {number} fromIndex 
     * @returns 
     */
    public static findIndex(array: any[], predicate: Function, fromIndex: number) {
        array =  array.slice(fromIndex);
        var i;
        if (typeof predicate === "function") {
            for (i = 0; i < array.length; i++) {
                if (predicate(array[i])) {
                    return i;
                }
            }
        } else if (Array.isArray(predicate)) {
            for (i = 0; i < array.length; i++) {
                var key = predicate[0];
                var vaule = true;
                //@ts-ignore
                if (predicate.length > 1) {
                    vaule = predicate[1];
                }

                if (array[i][key] === vaule) {
                    return i;
                }
            }
        } else {
            for (i = 0; i < array.length; i++) {
                if (array[i] === predicate) {
                    return i;
                }
            }
        }

        return -1;
    }

    /**
     * @returns 
     */
    public static concat() {
        var length = arguments.length;
        if (!length) {
            return [];
        }

        var array = arguments[0];
        var index = 1;
        while (index < length) {
            array = array.concat(arguments[index]);
            index++;
        }

        return array;
    }

    /**
     * @param {any }value 
     * @returns 
     */
    public static isNumber(value: any) {
        return typeof value === 'number';
    }

    /**
     * @param {Array}array 
     * @param {any}value 
     * @param {number} fromIndex 
     * @returns 
     */
    public static indexOf(array: any[], value: any, fromIndex: number) {
        array =  array.slice(fromIndex);
        return array.indexOf(value);
    }

    /**
     * @param {any} array 
     * @param {string} separator 
     * @returns 
     */
    public static join(array: any[], separator: string) {
        if (array === null) return '';

        var result = '';
        array.forEach(function (item) {
            result += item + separator;
        });

        return result.substr(0, result.length - 1);
    }

    /**
     * @param {string} str 
     * @param {RegExp|string} separator 
     * @param {number} limit 
     * @returns 
     */
    public static split(str: string, separator: RegExp|string, limit: number) {
        return str.split(separator, limit);
    }

    /**
     * @param {Array}array 
     * @returns 
     */
    public static max(array: any[]) {
        if (array && array.length) {
            var result;
            for (var i = 0; i < array.length; i++) {
                if (i === 0) {
                    result = array[0];
                } else if (result < array[i]) {
                    result = array[i];
                }
            }

            return result;
        }

        return undefined;

    }

    /**
     * @param {Array}array : 
     * @param {number}n 
     * @returns 
     */
    public static drop(array: any[], n: number) {
        var length = array === null ? 0 : array.length;
        if (!length) {
            return [];
        }

        return array.slice(n);
    }

    /**
     * @param {Array} arr 
     * @returns 
     */
    public static flattenDeep(arr: any[]): any {
        return arr.reduce(function (prev: any[], cur: any[]) {
            return prev.concat(Array.isArray(cur) ? lodash.flattenDeep(cur) : cur);
        }, [ ]);
    }

    /**
     * @param {Array} array 
     * @returns 
     */
    public static uniq(array: any[]) {
        let result: any[] = [];
        array.forEach(function (item) {
            if (result.indexOf(item) === -1) {
                result.push(item);
            }
        });

        return result;
    }

    /**
     * @param {any}value 
     * @returns 
     */
    public static isNaN(value: any) {
        // An `NaN` primitive is the only value that is not equal to itself.
        // Perform the `toStringTag` check first to avoid errors with some
        // ActiveX objects in IE.
        return lodash.isNumber(value) && value !== +value;
    }

    /**
     * @param {Array}array 
     * @param {number}size 
     * @returns 
     */
    public static chunk(array: any[], size: number) {
        var length = array === null ? 0 : array.length;
        if (!length || size < 1) {
            return [];
        }

        var result = [];
        while (array.length > size) {
            result.push(array.slice(0, size));
            array = array.slice(size);
        }

        result.push(array);
        return result;
    }

    /**
     * @param {any} value 
     * @returns 
     */
    public static toFinite(value: any) {
        var INFINITY = 1 / 0;
        var MAX_INTEGER = 1.7976931348623157e+308;
        if (!value) {
            return value === 0 ? value : 0;
        }
        value = Number(value);
        if (value === INFINITY || value === -INFINITY) {
            var sign = (value < 0 ? -1 : 1);
            return sign * MAX_INTEGER;
        }
        return value === value ? value : 0;
    }

    /**
     * @param {any}value  
     * @returns {boolean}
     */
    public static isObject(value: any) {
        var type = typeof value;
        return value !== null && (type === 'object' || type === 'function');
    }

    public static MAX_SAFE_INTEGER = 9007199254740991;

    /**
     * 
     * @param value 
     * @returns 
     */
    public static isLength(value: any) {
        return typeof value === 'number' &&
            value > -1 && value % 1 === 0 && value <= lodash.MAX_SAFE_INTEGER;
    }

    public static _isArrayLike(value: []) {
        return value !== null && lodash.isLength(value.length) /*&& !isFunction(value)*/;
    }

    /**
     * @param {Array} array  
     * @param {Function} predicate  
     * @returns {Object} 
     */
    public static maxBy(array: any[], predicate: Function) {
        if (array && array.length) {
            var result;
            var objResult;
            for (var i = 0; i < array.length; i++) {
                if (i === 0) {
                    result = predicate(array[0]);
                    objResult = array[0];
                } else if (result < array[i]) {
                    result = (array[i]);
                    objResult = array[i];
                }
            }

            return objResult;
        }

        return undefined;

    }

    /**
     * @param {Array} array  
     * @param {Function} predicate  
     * @returns {Object} 
     */
    public static minBy(array: any[], predicate: Function) {
        if (array && array.length) {
            let result;
            let objResult;
            for (var i = 0; i < array.length; i++) {
                if (i === 0) {
                    result = predicate(array[0]);
                    objResult = array[0];
                } else if (result > array[i]) {
                    result = predicate(array[i]);
                    objResult = array[i];
                }
            }

            return objResult;
        }

        return undefined;

    }
    /**
     * @param {Array|Object} collection  
     * @param {Function} predicate  
     * @returns {Object} 
     */
    public static sumBy(collection: [] | {}, predicate: Function) {
        let sum: number = 0;
        for (let key in collection) {
            //@ts-ignore
            sum += predicate(collection[key]);
        }

        return sum;
    }

    /**
     * @param {Array|Object} collection  
     * @param {Function} predicate  
     * @returns {Object} 
     */
    public static countBy(collection: [] | {}, predicate: Function) {
        let objRet: {[key: string]: number} = {};
        for (let key in collection) {
            let value: any = predicate(key);
            if (objRet.hasOwnProperty(value)) {
                objRet[value] += 1;
            } else {
                objRet[value] = 1;
            }
        }

        return objRet;
    }
    
}
