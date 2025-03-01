
import { randomRangeInt } from "cc";
import { DEBUG } from "cc/env"

export let APIFakeData = {
}

export const initFakeData = () => {
    if (DEBUG) {
        APIFakeData = {
            "users/info": {
                "user": {
                    "_id": "663222212019da65ced1bd56",
                    "telegram_id": "1565295243",
                    "username": "Wisky3107",
                    "ather_id": null,
                    "guild_id": null,
                    "first_name": "Wikz",
                    "last_name": "",
                    "language_code": "",
                    "allows_write_to_pm": true,
                    "turn": 952,
                    "coin": 622874030.7038965,
                    "shield": 2,
                    "attack": 0,
                    "steal": 0,
                    "last_login": 1716190128276,
                    "reward_time": 1716180385166,
                    "attacking_island_id": null,
                    "stealing_island_id_1": null,
                    "stealing_island_id_2": null,
                    "stealing_island_id_3": null,
                    "total_pull": 465251,
                    "__v": 0,
                    "commulative_coin": 244620699.078597,
                    "commulative_invite": 0,
                    "commulative_invite_recevied": 0,
                    "commulative_purchase": 0,
                    "commulative_purchase_recevied": 0,
                    "is_follow_x": false,
                    "is_join_telegram_channel": false,
                    "is_join_telegram_chat": false,
                    "login_streak": 0,
                    "premium_login_streak": 0,
                    "premium_login_streak_received": 0,
                    "ship": 0,
                }
            },
        }
    }
}