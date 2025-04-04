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
