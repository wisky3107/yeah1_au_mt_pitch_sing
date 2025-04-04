import { SongConstant } from "../../Constant/SongConstant";

export interface SongModel {
    id: string;
    title: string;
    artist: string;
    difficulty: number;
    previewStart: number;
    previewEnd: number;

    bpm?: number;
    thumbnail?: string;
    musicPath?: string; //if null use id
}

export namespace SongModel {
    //if the music path is null then we use the id as the music path
    export function getMusicPath(song: SongModel): string {
        return `${SongConstant.RESOURCE_MUSIC_PATH}/${song.musicPath || song.id}`;
    }
}

