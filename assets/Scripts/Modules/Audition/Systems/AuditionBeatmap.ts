import { _decorator, Component, JsonAsset, resources } from 'cc';
import { AuditionNoteType } from './AuditionNotePool';
import { resourceUtil } from '../../../Common/resourceUtil';
const { ccclass, property } = _decorator;

/**
 * Interface for individual note data within a beatmap
 */
export interface BeatNote {
    time: number;      // Timestamp in milliseconds
    type: number;      // Note type (0=LEFT, 1=RIGHT, 2=SPACE)
    duration?: number; // Optional duration for hold notes
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
 * Class for loading and managing beatmap data
 */
@ccclass('AuditionBeatmap')
export class AuditionBeatmap extends Component {
    // Default beatmap path
    @property
    private beatmapFolder: string = 'audition/beatmaps/';
    
    // Currently loaded beatmap
    private currentBeatmap: BeatmapData = null;
    
    /**
     * Load a beatmap from a JSON file
     * @param beatmapPath Path to the beatmap JSON file
     * @returns Promise that resolves with the beatmap data
     */
    public loadBeatmap(beatmapPath: string): Promise<BeatmapData> {
        return new Promise((resolve, reject) => {
            const fullPath = this.beatmapFolder + beatmapPath;
            console.log(`Loading beatmap from: ${fullPath}`);
            
            resourceUtil.loadRes(fullPath, JsonAsset, (err, jsonAsset) => {
                if (err) {
                    console.error(`Failed to load beatmap: ${fullPath}`, err);
                    reject(err);
                    return;
                }
                
                try {
                    const beatmapData: BeatmapData = jsonAsset.json as BeatmapData;
                    this.validateBeatmap(beatmapData);
                    
                    // Sort notes by time for efficient processing
                    this.sortNotesByTime(beatmapData);
                    
                    this.currentBeatmap = beatmapData;
                    console.log(`Beatmap loaded successfully: ${beatmapData.songId}`);
                    resolve(beatmapData);
                } catch (error) {
                    console.error('Error processing beatmap data:', error);
                    reject(error);
                }
            });
        });
    }
    
    /**
     * Validate the beatmap data structure
     * @param beatmapData The beatmap data to validate
     */
    private validateBeatmap(beatmapData: BeatmapData): void {
        // Check required fields
        if (!beatmapData.songId) {
            throw new Error('Beatmap missing required field: songId');
        }
        
        if (!beatmapData.notes || !Array.isArray(beatmapData.notes)) {
            throw new Error('Beatmap missing required field: notes array');
        }
        
        if (beatmapData.bpm <= 0) {
            throw new Error('Beatmap has invalid BPM value');
        }
        
        // Validate each note
        beatmapData.notes.forEach((note, index) => {
            if (note.time === undefined || note.time < 0) {
                throw new Error(`Note at index ${index} has invalid time value`);
            }
            
            if (note.type === undefined || note.type < 0 || note.type > 2) {
                throw new Error(`Note at index ${index} has invalid type value`);
            }
            
            if (note.duration !== undefined && note.duration <= 0) {
                throw new Error(`Note at index ${index} has invalid duration value`);
            }
        });
    }
    
    /**
     * Sort notes by timestamp for optimized processing
     * @param beatmapData The beatmap to sort
     */
    private sortNotesByTime(beatmapData: BeatmapData): void {
        if (beatmapData.notes) {
            beatmapData.notes.sort((a, b) => a.time - b.time);
        }
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
    
    /**
     * Convert a BeatNote to the corresponding AuditionNoteType
     * @param note The beat note to convert
     * @returns The corresponding AuditionNoteType
     */
    public static getNoteTypeFromBeatNote(note: BeatNote): AuditionNoteType {
        switch (note.type) {
            case 0: return AuditionNoteType.LEFT;
            case 1: return AuditionNoteType.RIGHT;
            case 2: return AuditionNoteType.SPACE;
            default: return AuditionNoteType.SPACE;
        }
    }
    
    /**
     * Create a simple test beatmap (for development/testing)
     * @param songId The song ID
     * @param bpm The beats per minute
     * @param durationMs The song duration in milliseconds
     * @returns A generated test beatmap
     */
    public static createTestBeatmap(songId: string, bpm: number, durationMs: number): BeatmapData {
        const notes: BeatNote[] = [];
        const beatInterval = 60000 / bpm; // ms per beat
        
        // Create a simple pattern
        let currentTime = 1000; // Start after 1 second
        
        while (currentTime < durationMs - 2000) { // End 2 seconds before song end
            // Add LEFT note
            notes.push({ time: currentTime, type: 0 });
            
            // Add RIGHT note after 1 beat
            notes.push({ time: currentTime + beatInterval, type: 1 });
            
            // Add SPACE note after 2 beats
            notes.push({ time: currentTime + (beatInterval * 2), type: 2 });
            
            // Move to next pattern start (every 4 beats)
            currentTime += beatInterval * 4;
        }
        
        return {
            songId: songId,
            bpm: bpm,
            offset: 0,
            notes: notes,
            difficulty: 2,
            creator: 'System',
            version: '1.0'
        };
    }
    
    /**
     * Save a beatmap to JSON (for a beatmap editor feature)
     * @param beatmapData The beatmap data to save
     * @param fileName The file name to save as
     */
    public static exportBeatmapToJson(beatmapData: BeatmapData): string {
        try {
            const json = JSON.stringify(beatmapData, null, 2);
            console.log(`Beatmap exported to JSON: ${beatmapData.songId}`);
            return json;
        } catch (error) {
            console.error('Error exporting beatmap to JSON:', error);
            return null;
        }
    }
} 