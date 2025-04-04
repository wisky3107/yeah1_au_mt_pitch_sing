import { SongModel } from "./SongModel";

export interface MTSongModel extends SongModel {
    audioPath?: string;
    midiPath?: string;
    backgroundImage?: string;
    level?: number;
}