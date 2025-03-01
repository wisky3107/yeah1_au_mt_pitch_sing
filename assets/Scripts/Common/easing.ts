import { easing } from "cc";

export enum EasingType {
    Linear,

    SineIn,
    SineOut,
    SineInOut,

    QuadIn,
    QuadOut,
    QuadInOut,

    CubicIn,
    CubicOut,
    CubicInOut,

    QuartIn,
    QuartOut,
    QuartInOut,

    QuintIn,
    QuintOut,
    QuintInOut,

    ExpoIn,
    ExpoOut,
    ExpoInOut,

    CircIn,
    CircOut,
    CircInOut,

    ElasticIn,
    ElasticOut,
    ElasticInOut,

    BackIn,
    BackOut,
    BackInOut,

    BounceIn,
    BounceOut,
    BounceInOut,
}

export function getEasingFunction( easingType: EasingType) {
    const easingFunctions = {
        [EasingType.Linear]: easing.linear,

        [EasingType.SineIn]: easing.sineIn,
        [EasingType.SineOut]: easing.sineOut,
        [EasingType.SineInOut]: easing.sineInOut,

        [EasingType.QuadIn]: easing.quadIn,
        [EasingType.QuadOut]: easing.quadOut,
        [EasingType.QuadInOut]: easing.quadInOut,

        [EasingType.CubicIn]: easing.cubicIn,
        [EasingType.CubicOut]: easing.cubicOut,
        [EasingType.CubicInOut]: easing.cubicInOut,

        [EasingType.QuartIn]: easing.quartIn,
        [EasingType.QuartOut]: easing.quartOut,
        [EasingType.QuartInOut]: easing.quartInOut,

        [EasingType.QuintIn]: easing.quintIn,
        [EasingType.QuintOut]: easing.quintOut,
        [EasingType.QuintInOut]: easing.quintInOut,

        [EasingType.ExpoIn]: easing.expoIn,
        [EasingType.ExpoOut]: easing.expoOut,
        [EasingType.ExpoInOut]: easing.expoInOut,

        [EasingType.CircIn]: easing.circIn,
        [EasingType.CircOut]: easing.circOut,
        [EasingType.CircInOut]: easing.circInOut,

        [EasingType.ElasticIn]: easing.elasticIn,
        [EasingType.ElasticOut]: easing.elasticOut,
        [EasingType.ElasticInOut]: easing.elasticInOut,

        [EasingType.BackIn]: easing.backIn,
        [EasingType.BackOut]: easing.backOut,
        [EasingType.BackInOut]: easing.backInOut,

        [EasingType.BounceIn]: easing.bounceIn,
        [EasingType.BounceOut]: easing.bounceOut,
        [EasingType.BounceInOut]: easing.bounceInOut,
    };

    return easingFunctions[easingType];
}


