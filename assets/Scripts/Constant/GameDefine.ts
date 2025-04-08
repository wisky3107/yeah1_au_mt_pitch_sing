import { POPUP } from './PopupDefine';
import { SCENE_NAME } from './SceneDefine';

/**
 * Enum representing different game types in the application
 */
export enum GameType {
    AUDITION = 'Audition',
    MAGIC_TILE = 'MagicTile',
    PITCH = 'Pitch',
    KARAOKE = 'Karaoke'
}

export namespace GameType {
    export function getSceneName(game: GameType): string {
        switch (game) {
            case GameType.AUDITION:
                return SCENE_NAME.AUDITION;
            case GameType.MAGIC_TILE:
                return SCENE_NAME.MT;
            case GameType.PITCH:
                return SCENE_NAME.PITCH;
            case GameType.KARAOKE:
                return SCENE_NAME.KARAOKE;
            default:
                throw new Error(`Unknown game type: ${game}`);
        }
    }


    export function getGameName(sceneName: string): string {
        switch (sceneName) {
            case SCENE_NAME.AUDITION:
                return "Nhảy đê";
            case SCENE_NAME.MT:
                return "Magic Tile";
            case SCENE_NAME.PITCH:
                return "Thanh nhạc";
            case SCENE_NAME.KARAOKE:
                return "Karaoke";
            default:
                throw new Error(`Unknown scene name: ${sceneName}`);
        }
    }


    export function getPopupLoading(game: GameType): string {
        switch (game) {
            case GameType.AUDITION:
                return POPUP.AUDITION_LOADING;
            case GameType.MAGIC_TILE:
                return POPUP.MAGIC_TILE_LOADING;
            case GameType.PITCH:
                return POPUP.PITCH_LOADING;
            case GameType.KARAOKE:
                return POPUP.KARAOKE_LOADING;
            default:
                return POPUP.PROCESS_LOADING;
        }
    }
}