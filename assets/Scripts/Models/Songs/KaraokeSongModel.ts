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