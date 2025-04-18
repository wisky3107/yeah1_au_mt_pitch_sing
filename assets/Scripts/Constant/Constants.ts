import { Color, color } from "cc";

export const GameConstant = {
   

    RESOURCE_PATH: {
        GAME_MAIN_PATH: "prefab/Game",
    },

    SOUND_FILES: {
        SFX_PATH: "sounds/sfx/",
    },

    CAMERA_CONFIG: {
        MIN_SIZE: 200,
    },

    CAMERA_ZOOM_THRESHOLD: 500,
    AUTO_TIME: 3.0,

    STORAGE_KEY: {
        BGM_VOLUME: "BGM_VOLUME",
        SFX_VOLUME: "SFX_VOLUME",
        USER_MODIFIER: "USER_MODIFIER",
    },

    EFFECT: {
        MOVING_UI_OBJECT: "moving",
        UI_COINS: "coins",
        UI_TURNS: "turns",
        LEVLEUP_SMALL: "levelup_small",
        LEVLEUP_BIG: "levelup_big",
        CONFETTI: "confetti",
        TEXT: "text",
    },

    GAME: {
        PHYSIC_GRAVITY: 18.0
    },

    VIEW: {
        TOPHUB: "ViewTopHub",
    },
}

// this will be setted by scene enviroment (prod, dev, staging,...)
export let CurrentEnviroment = {
    API: "",
    LOG: true,
};

export const setEnvi = (data: any) => {
    CurrentEnviroment = data;
}
