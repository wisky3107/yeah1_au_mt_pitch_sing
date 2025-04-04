import { SongConstant } from "../../Constant/SongConstant";
import { KaraokeConstants } from "../../Modules/Karaoke/Data/KaraokeTypes";
import { SongModel } from "./SongModel";

export interface LyricSegment {
    /** The text content of the lyric segment */
    text: string;
    /** Start time in seconds */
    startTime: number;
    /** End time in seconds */
    endTime: number;
    /** Whether the segment has been sung */
    completed?: boolean;
}

export interface KaraokeSongModel extends SongModel {
    lyricPath?: string;
    duration?: number;
    lyrics?: LyricSegment[];
}

export namespace KaraokeSongModel {
    export function getLyricPath(song: KaraokeSongModel): string {
        return `${KaraokeConstants.RESOURCE_LYRIC_PATH}/${song.lyricPath || song.id}`;
    }

    export function getBeatmapPath(song: KaraokeSongModel): string {
        return `${SongConstant.RESOURCE_MUSIC_PATH}/${song.musicPath || song.id}_beat`;
    }
}

