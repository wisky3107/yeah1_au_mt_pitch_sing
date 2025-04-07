import { Color } from 'cc';
import { DEBUG } from 'cc/env';
import { APIFakeData } from '../Managers/APIFakeData';
import { CharacterCustomizationModel, CharacterGender } from '../Models/CharacterCustomizationModel';
import { APIError } from '../Managers/APIManager';
import api from '../Managers/APIManager';

// Initialize fake data for testing
if (DEBUG) {
    APIFakeData['character/customization'] = {
        skinColors: [
            { id: 'skin1', color: new Color(255, 224, 196, 255) },
            { id: 'skin2', color: new Color(255, 198, 160, 255) },
            { id: 'skin3', color: new Color(234, 182, 150, 255) },
            { id: 'skin4', color: new Color(198, 134, 66, 255) },
            { id: 'skin5', color: new Color(141, 85, 36, 255) }
        ],
        eyeStyles: [
            { id: 'eye1', spritePath: 'character/eyes/style1' },
            { id: 'eye2', spritePath: 'character/eyes/style2' },
            { id: 'eye3', spritePath: 'character/eyes/style3' },
            { id: 'eye4', spritePath: 'character/eyes/style4' },
            { id: 'eye5', spritePath: 'character/eyes/style5' }
        ],
        characterName: '',
        gender: CharacterGender.Male
    };
}

export function requestCharacterCustomization(
    callback: (data: CharacterCustomizationModel, error: APIError) => void
): void {
    const apiName = 'character/customization';

    if (APIFakeData.isFakeData && DEBUG) {
        return callback?.(APIFakeData[apiName], null);
    }

    api.request<CharacterCustomizationModel>(
        apiName,
        {
            method: 'GET',
            headers: api.getHeaders()
        },
        data => callback?.(data, null),
        error => callback?.(null, error)
    );
}

export function saveCharacterCustomization(
    data: {
        skinColorId: string;
        eyeStyleId: string;
        characterName: string;
        gender: CharacterGender;
    },
    callback: (success: boolean, error: APIError) => void
): void {
    const apiName = 'character/customization/save';

    if (APIFakeData.isFakeData && DEBUG) {
        return callback?.(true, null);
    }

    api.request<{ success: boolean }>(
        apiName,
        {
            method: 'POST',
            headers: api.getHeaders(),
            body: JSON.stringify(data)
        },
        response => callback?.(response.success, null),
        error => callback?.(false, error)
    );
} 