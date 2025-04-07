import { Color } from 'cc';

export enum FandomType {
    KINGDOM = 'KINGDOM',
    BONG = 'BONG',
    FAIRIES = 'FAIRIES'
}

export interface IFandomCharacter {
    name: string;
    greeting: string;
    prefabPath: string;
    fandomType: FandomType;
}

export interface IFandomOption {
    id: FandomType;
    name: string;
    isSelected: boolean;
    isEnabled: boolean;
}

export class FandomModel {
    public selectedFandom: FandomType = null;
    public currentCharacterIndex: number = 0;

    public readonly characters: IFandomCharacter[] = [
        {
            name: 'Sibun',
            greeting: 'Xin chào!\nTôi là Sibun, trưởng FC KINGDOM',
            prefabPath: 'Prefabs/Characters/Sibun',
            fandomType: FandomType.KINGDOM
        },
        {
            name: 'Tori',
            greeting: 'Xin chào!\nTôi là Tori, trưởng FC FAIRIES',
            prefabPath: 'Prefabs/Characters/Tori',
            fandomType: FandomType.FAIRIES
        },
        {
            name: 'Kayan',
            greeting: 'Xin chào!\nTôi là Kayan, trưởng FC Bông',
            prefabPath: 'Prefabs/Characters/Kayan',
            fandomType: FandomType.BONG
        }
    ];

    public readonly fandomOptions: IFandomOption[] = [
        {
            id: FandomType.KINGDOM,
            name: 'KINGDOM',
            isSelected: false,
            isEnabled: true
        },
        {
            id: FandomType.BONG,
            name: 'BÔNG',
            isSelected: false,
            isEnabled: true
        },
        {
            id: FandomType.FAIRIES,
            name: 'FAIRIES',
            isSelected: false,
            isEnabled: true
        }
    ];
} 