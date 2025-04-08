import { debug } from "cc";
import { SongModel, SongListResponse } from "../Models/Songs/SongModel";
import { DEBUG } from "cc/env";
import { APIError } from "../Managers/APIManager";
import api from "../Managers/APIManager";
import { APIFakeData } from "../Managers/APIFakeData";

/**
 * Generates fake song data for testing
 */
const generateFakeSongData = (): SongListResponse => {
    const createSong = (id: string, title: string, artist: string, musicPath: string, previewStart: number, previewEnd: number, bpm: number, difficulty: number): SongModel => ({
        id,
        title,
        artist,
        difficulty,
        previewStart,
        previewEnd,
        bpm,
        thumbnail: `songs/${id}/thumbnail`,
        musicPath,
        isLocked: Math.random() > 0.7,
        unlockCondition: "Bạn chưa đủ cấp độ (Vàng)"
    });

    return {
        maleSongs: [
            createSong("DauCoLoiLam", "Dẫu có lỗi lầm - bestcut", "ATVNCG", "DauCoLoiLam_ATVNCG_bestcut", 60000, 90000, 95, 3),
            createSong("Lang", "Lặng", "Rhymastic", "Lang_Rhymastic_ATVNCG", 60000, 90000, 85, 3),
        ],
        femaleSongs: [
            createSong("TrongCom", "Trống Cơm", "ATVNCG", "TrongCom_ATVNCG", 60000, 90000, 100, 4),
            createSong("GiaNhu", "Giá Như", "SOOBIN", "GiaNhu_SOOBIN_ATVNCG", 60000, 90000, 90, 2)
        ],
        tbtnSongs: []
    };
};

// Initialize fake data in debug mode
if (DEBUG) {
    APIFakeData["songs/lists"] = generateFakeSongData();
}

/**
 * Fetches all song lists categorized by type
 */
export function requestSongLists(
    callback: (data: SongListResponse, error: APIError) => void
): void {
    const apiName = "songs/lists";

    if (APIFakeData.isFakeData && DEBUG) {
        return callback?.(APIFakeData[apiName], null);
    }

    api.request<SongListResponse>(
        apiName,
        {
            method: "GET",
            headers: api.getHeaders()
        },
        data => callback?.(data, null),
        error => callback?.(null, error)
    );
}

/**
 * Fetches detailed information for a specific song
 */
export function requestSongDetails(
    songId: string,
    callback: (data: SongModel, error: APIError) => void
): void {
    const apiName = `songs/${songId}`;

    if (APIFakeData.isFakeData && DEBUG) {
        const allSongs = [
            ...APIFakeData["songs/lists"].allSongs,
            ...APIFakeData["songs/lists"].maleSongs,
            ...APIFakeData["songs/lists"].femaleSongs,
            ...APIFakeData["songs/lists"].tbtnSongs
        ];
        const song = allSongs.find(s => s.id === songId);
        return callback?.(song || null, song ? null : { statusCode: 404, message: "Song not found" });
    }

    api.request<SongModel>(
        apiName,
        {
            method: "GET",
            headers: api.getHeaders()
        },
        data => callback?.(data, null),
        error => callback?.(null, error)
    );
}

/**
 * Unlocks a song if the user meets the requirements
 */
export function requestUnlockSong(
    songId: string,
    callback: (success: boolean, error: APIError) => void
): void {
    const apiName = `songs/${songId}/unlock`;

    if (APIFakeData.isFakeData && DEBUG) {
        // Simulate unlock success with 80% probability
        const success = Math.random() > 0.2;
        return callback?.(success, success ? null : {
            statusCode: 403,
            message: "Requirements not met"
        });
    }

    api.request<{ success: boolean }>(
        apiName,
        {
            method: "POST",
            headers: api.getHeaders()
        },
        data => callback?.(data.success, null),
        error => callback?.(false, error)
    );
} 