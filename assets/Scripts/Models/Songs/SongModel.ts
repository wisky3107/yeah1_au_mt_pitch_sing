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
    export function getMusicPath(song: SongModel): string {
        return song.musicPath || song.id;
    }

    export function getMidiPath(song: MTSongModel): string {
        return song.midiPath || song.id;
    }
}

