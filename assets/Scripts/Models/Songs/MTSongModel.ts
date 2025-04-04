import { MTConstant } from "../../Modules/MagicTiles/Data/MTDefines";
import { SongModel } from "./SongModel";

export interface MTSongModel extends SongModel {
    midiPath?: string;
    backgroundImage?: string;
    level?: number;
}
export namespace MTSongModel {
    export function getMidiPath(song: MTSongModel): string {
        return `${MTConstant.RESOURCE_MIDI_PATH}/${song.midiPath || song.id}`;
    }
}
