import { Color } from 'cc';

export interface CharacterFeature {
    id: string;
    isSelected?: boolean;
    onSelected?: (feature: CharacterFeature) => void;
}

export interface SkinColor extends CharacterFeature {
    color: Color;
}

export interface EyeStyle extends CharacterFeature {
    spritePath: string;
}

export enum CharacterGender {
    Male = 'male',
    Female = 'female'
}

export class CharacterCustomizationModel {
    skinColors: SkinColor[];
    eyeStyles: EyeStyle[];
    selectedSkinColorId?: string;
    selectedEyeStyleId?: string;
    characterName?: string;
    gender: CharacterGender = CharacterGender.Male;

    public getSkinColor(): SkinColor {
        return this.skinColors.find(color => color.id === this.selectedSkinColorId);
    }

    public getEyeStyle(): EyeStyle {
        return this.eyeStyles.find(style => style.id === this.selectedEyeStyleId);
    }
}

export enum CustomizationTab {
    SkinColor = 0,
    Eyes = 1
}