import { DEBUG } from 'cc/env';
import { FandomType } from '../Models/FandomModel';
import api, { APIError } from '../Managers/APIManager';
import { APIFakeData } from '../Managers/APIFakeData';

/**
 * Interface for fandom selection request payload
 */
export interface FandomSelectionRequest {
    fandomType: FandomType;
}

/**
 * Interface for fandom data response
 */
export interface FandomDataResponse {
    selectedFandom: FandomType | null;
}

// Initialize fake data for testing
if (DEBUG) {
    APIFakeData['fandom/data'] = {
        selectedFandom: FandomType.KINGDOM
    };
}

/**
 * Save the user's selected fandom choice to the server
 * @param fandomType The selected fandom type
 * @param callback Callback function with success status and potential error
 */
export function saveFandomSelection(
    fandomType: FandomType,
    callback: (success: boolean, error?: string) => void
): void {
    const apiName = 'fandom/select';

    // Handle fake data in debug mode
    if (APIFakeData.isFakeData && DEBUG) {
        return callback?.(true, null);
    }

    const requestData: FandomSelectionRequest = { fandomType };

    api.request<{ success: boolean }>(
        apiName,
        {
            method: 'POST',
            headers: api.getHeaders(),
            body: JSON.stringify(requestData)
        },
        data => callback?.(data.success, null),
        error => callback?.(false, error.message)
    );
}

/**
 * Request initial fandom data from the server
 * @param callback Callback with fandom data or error
 */
export function requestFandomData(
    callback: (data: FandomDataResponse | null, error?: string) => void
): void {
    const apiName = 'fandom/data';

    // Handle fake data in debug mode
    if (APIFakeData.isFakeData && DEBUG) {
        return callback?.(APIFakeData[apiName], null);
    }

    api.request<FandomDataResponse>(
        apiName,
        {
            method: 'GET',
            headers: api.getHeaders()
        },
        data => callback?.(data, null),
        error => callback?.(null, error.message)
    );
} 