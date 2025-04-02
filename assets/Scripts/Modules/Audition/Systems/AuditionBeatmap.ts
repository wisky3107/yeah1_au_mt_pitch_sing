import { _decorator, Component } from 'cc';
import { AuditionNoteType } from './AuditionNotePool';
const { ccclass, property } = _decorator;

/**
 * Interface for individual note data within a beatmap
 */
export interface BeatNote {
    time: number;      // Timestamp in milliseconds
    type: number;      // Note type (2=SPACE only)
}

/**
 * Interface for beatmap data structure
 */
export interface BeatmapData {
    songId: string;             // Unique identifier for the song
    bpm: number;                // Beats per minute
    offset: number;             // Offset in milliseconds to sync with audio
    notes: BeatNote[];          // Array of note data
    difficulty: number;         // Difficulty level (1-5)
    creator: string;            // Beatmap creator name
    version: string;            // Beatmap version
}

/**
 * Class for generating and managing beatmap data
 */
@ccclass('AuditionBeatmap')
export class AuditionBeatmap extends Component {
    // Currently loaded beatmap
    private currentBeatmap: BeatmapData = null;
    
    /**
     * Generate a beatmap based on BPM and quantization
     * @param songId The song ID
     * @param bpm The beats per minute
     * @param durationMs The song duration in milliseconds
     * @param quantization The note quantization (e.g., 4 for quarter notes, 8 for eighth notes, 16 for sixteenth notes)
     * @returns Promise that resolves with the beatmap data
     */
    public generateBeatmap(songId: string, bpm: number, durationMs: number, quantization: number): Promise<BeatmapData> {
        return new Promise((resolve) => {
            const notes: BeatNote[] = [];
            const beatInterval = 60000 / bpm; // ms per beat
            const spaceNoteInterval = beatInterval * quantization; // ms per note
            
            // Start after 1 second and end 2 seconds before song end
            let currentTime = 1000;
            const endTime = durationMs - 2000;
            
            while (currentTime < endTime) {
                // Add SPACE note at each quantization point
                notes.push({ 
                    time: currentTime, 
                    type: 2 // SPACE type
                });
                
                currentTime += spaceNoteInterval;
            }
            
            const beatmapData: BeatmapData = {
                songId: songId,
                bpm: bpm,
                offset: 0,
                notes: notes,
                difficulty: 2,
                creator: 'System',
                version: '1.0'
            };
            
            this.currentBeatmap = beatmapData;
            console.log(`Beatmap generated successfully: ${beatmapData.songId}`);
            resolve(beatmapData);
        });
    }
    
    /**
     * Get the currently loaded beatmap
     * @returns The current beatmap data or null if none loaded
     */
    public getCurrentBeatmap(): BeatmapData {
        return this.currentBeatmap;
    }
    
    /**
     * Get all notes in a specific time range
     * @param startTime Start time in milliseconds
     * @param endTime End time in milliseconds
     * @returns Array of notes within the time range
     */
    public getNotesInTimeRange(startTime: number, endTime: number): BeatNote[] {
        if (!this.currentBeatmap || !this.currentBeatmap.notes) {
            return [];
        }
        
        return this.currentBeatmap.notes.filter(note => 
            note.time >= startTime && note.time <= endTime
        );
    }
    
    /**
     * Get the next notes to spawn based on look-ahead time
     * @param currentTime Current song time in milliseconds
     * @param lookAheadTime Time to look ahead in milliseconds
     * @returns Array of notes that should be spawned
     */
    public getNotesToSpawn(currentTime: number, lookAheadTime: number): BeatNote[] {
        return this.getNotesInTimeRange(currentTime, currentTime + lookAheadTime);
    }
    
    /**
     * Get total number of notes in the beatmap
     * @returns The total note count
     */
    public getTotalNoteCount(): number {
        return this.currentBeatmap?.notes?.length || 0;
    }
} 