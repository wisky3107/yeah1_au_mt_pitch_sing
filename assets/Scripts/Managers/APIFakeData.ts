import { randomRangeInt } from "cc";
import { DEBUG } from "cc/env"
import { FandomType } from '../Models/FandomModel';

export let APIFakeData: { [key: string]: any } = {};

export const initFakeData = () => {
    if (DEBUG) {
        APIFakeData = {
            isFakeData: true,
            "users/info": {
                "user": {
                    "id": "663222212019da65ced1bd56",
                    "username": "Wisky3107",
                    "first_name": "Wikz",
                    "last_name": "",
                    "turn": 952,
                    "coin": 622874030.7038965,
                }
            }
        };
    }
}