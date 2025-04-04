import { SongModel } from "./SongModel";

export interface MTSongModel extends SongModel {
    midiPath?: string;
    backgroundImage?: string;
    level?: number;
}
export namespace MTSongModel {
    export function getMidiPath(song: MTSongModel): string {
        return song.midiPath || song.id;
    }
}
