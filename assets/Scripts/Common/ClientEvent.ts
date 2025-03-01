import { _decorator } from "cc";
const { ccclass, property } = _decorator;

@ccclass("clientEvent")
export class ClientEvent {
    private static _handlers: { [key: string]: any[] } = {};

    /**
     * @param {string} eventName 
     * @param {function} handler 
     * @param {object} target 
     */
    public static on (eventName: string, handler: Function, target: any) {
        var objHandler: {} = {handler: handler, target: target};
        var handlerList: Array<any> = ClientEvent._handlers[eventName];
        if (!handlerList) {
            handlerList = [];
            ClientEvent._handlers[eventName] = handlerList;
        }

        for (var i = 0; i < handlerList.length; i++) {
            if (!handlerList[i]) {
                handlerList[i] = objHandler;
                return i;
            }
        }

        handlerList.push(objHandler);

        return handlerList.length;
    };

    /**
     * @param {string} eventName 
     * @param {function} handler 
     * @param {object} target 
     */
    public static off (eventName: string, handler: Function, target: any) {
        var handlerList = ClientEvent._handlers[eventName];

        if (!handlerList) {
            return;
        }

        for (var i = 0; i < handlerList.length; i++) {
            var oldObj = handlerList[i];
            if (oldObj.handler === handler && (!target || target === oldObj.target)) {
                handlerList.splice(i, 1);
                break;
            }
        }
    };

    /**
     * @param {string} eventName 
     * @param  {...any} params 
     */
    public static dispatchEvent (eventName: string, ...args: any) {
        var handlerList = ClientEvent._handlers[eventName];

        var args1 = [];
        var i;
        for (i = 1; i < arguments.length; i++) {
            args1.push(arguments[i]);
        }

        if (!handlerList) {
            return;
        }

        for (i = 0; i < handlerList.length; i++) {
            var objHandler = handlerList[i];
            if (objHandler.handler) {
                objHandler.handler.apply(objHandler.target, args1);
            }
        }
    };
}
