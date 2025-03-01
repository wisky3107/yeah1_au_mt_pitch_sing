
export enum UserInteractEventType {
    NONE = 0,
    TOUCH,
    DRAG,
    ZOOM,
    SWIPE,
    HOVER,
    DOUBLE_TOUCH,
    END_INTERACTED
}

export enum ViewBeginType {
    NONE,
    HIDE,
    SHOW
}

export interface Point {
    x: number;
    y: number;
}
export enum CornerType {
    LEFT_TOP,
    LEFT,
    LEFT_BOTTOM,
    TOP,
    RIGHT_TOP,
    RIGHT,
    RIGHT_BOTTOM,
    BOTTOM,
    CENTER,
}

export enum MissionType {
    DAILY = "DAILY",
    ONE_TIME = "ONE_TIME",
    STREAK = "STREAK",
    SOCIAL = "SOCIAL",
}

export enum MissionRewardType {
    NORMAL = 0,
    CLAIMABLE = 1,
    CLAIMED = 2,
    PENDING = 3,
}
