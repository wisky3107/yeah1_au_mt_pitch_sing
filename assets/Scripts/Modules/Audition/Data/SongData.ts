export interface SongData {
    id: string;
    title: string;
    artist: string;
    difficulty: number;
    bpm: number;
    audioPath: string;
    previewStart: number; // Start time for preview (ms)
    previewEnd: number;   // End time for preview (ms)
}
