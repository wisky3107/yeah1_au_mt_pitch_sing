import { Color } from 'cc';

export interface ICharacterFeature {
    id: string;
    isSelected?: boolean;
    onSelected?: (feature: ICharacterFeature) => void;
}

export interface ISkinColor extends ICharacterFeature {
    color: Color;
}

export interface IEyeStyle extends ICharacterFeature {
    spritePath: string;
}

export enum CharacterGender {
    Male = 'male',
    Female = 'female'
}

export class CharacterCustomizationModel {
    skinColors: ISkinColor[];
    eyeStyles: IEyeStyle[];
    selectedSkinColorId?: string;
    selectedEyeStyleId?: string;
    characterName?: string;
    gender: CharacterGender = CharacterGender.Male;
}

export enum CustomizationTab {
    SkinColor = 0,
    Eyes = 1
}