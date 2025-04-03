import { _decorator, sys, JsonAsset, NodeEventType, math } from "cc";
import { MTAudioManager } from "./MTAudioManager";
import { resourceUtil } from "../../../Common/resourceUtil";
import { Beatmap, BeatmapAudioData, BeatmapMetadata, NoteType, TrackNoteInfo } from "../Data/MTDefines";

const { ccclass, property } = _decorator;

/**
 * BeatmapManager for Magic Tiles 3
 * Handles beatmap loading, parsing, and providing data to other modules
 */
@ccclass("BeatmapManager")
export class BeatmapManager {
    private static _instance: BeatmapManager | null = null;

    // Singleton pattern
    public static get instance(): BeatmapManager {
        if (!this._instance) {
            this._instance = new BeatmapManager();
        }
        return this._instance;
    }

    // Reference to the audio manager
    private audioManager: MTAudioManager = MTAudioManager.instance;

    // Store loaded beatmaps in memory 
    private beatmaps: Map<string, Beatmap> = new Map();

    // Currently active beatmap
    private activeBeatmap: Beatmap | null = null;

    // Path to the beatmap directory
    private beatmapDirectory: string = "magic_tiles/beatmaps";

    // Maximum number of lanes (columns) for the game
    private maxLanes: number = 4;

    constructor() {
        this.init();
    }

    private init(): void {
        // Initialize the beatmap manager
        console.log("BeatmapManager initialized");
    }

    /**
     * Load a list of available beatmaps from the beatmap index file
     * @returns Promise that resolves with an array of beatmap metadata
     */
    public async loadBeatmapIndex(): Promise<BeatmapMetadata[]> {
        try {
            const indexData = await this.loadJsonAsset(`${this.beatmapDirectory}/index`);
            if (!indexData || !Array.isArray(indexData)) {
                throw new Error("Invalid beatmap index data");
            }

            return indexData as BeatmapMetadata[];
        } catch (err) {
            console.error("Failed to load beatmap index:", err);
            return [];
        }
    }

    /**
     * Load a specific beatmap by ID
     * @param beatmapId The ID of the beatmap to load
     * @returns Promise that resolves with the loaded beatmap or null if loading failed
     */
    public async loadBeatmapInfo(beatmapId: string): Promise<Beatmap | null> {
        // Check if the beatmap is already loaded
        if (this.beatmaps.has(beatmapId)) {
            this.activeBeatmap = this.beatmaps.get(beatmapId)!;
            return this.activeBeatmap;
        }

        try {
            // Load the beatmap data
            const beatmapData = await this.loadJsonAsset(`${this.beatmapDirectory}/${beatmapId}`);
            if (!beatmapData) {
                throw new Error(`Failed to load beatmap data for ID: ${beatmapId}`);
            }

            // Validate the beatmap data
            const beatmap = this.validateBeatmap(beatmapData);

            // Store the validated beatmap
            this.beatmaps.set(beatmapId, beatmap);

            // Set as active beatmap
            this.activeBeatmap = beatmap;

            return beatmap;
        } catch (err) {
            console.error(`Failed to load beatmap ${beatmapId}:`, err);
            return null;
        }
    }

    /**
     * Validate and parse the raw beatmap data
     * @param data The raw beatmap data to validate
     * @returns The validated and processed beatmap
     */
    private validateBeatmap(data: any): Beatmap {
        // Check if the data has the required properties
        if (!data.metadata) {
            throw new Error("Invalid beatmap format: missing metadata or notes");
        }

        // Check metadata fields
        const requiredMetadataFields = ["id", "title", "artist", "bpm", "difficulty",
            "difficultyName", "audioPath", "midiPath"];
        for (const field of requiredMetadataFields) {
            if (!data.metadata[field]) {
                throw new Error(`Invalid beatmap metadata: missing ${field}`);
            }
        }

        // Create a properly formatted beatmap object
        const beatmap: Beatmap = {
            metadata: {
                id: data.metadata.id,
                title: data.metadata.title,
                artist: data.metadata.artist,
                bpm: data.metadata.bpm,
                difficulty: data.metadata.difficulty,
                difficultyName: data.metadata.difficultyName,
                level: data.metadata.level || 1,
                preview: {
                    start: data.metadata.previewStart || 0,
                    end: data.metadata.previewEnd || 30
                },
                audioPath: data.metadata.audioPath,
                midiPath: data.metadata.midiPath,
                backgroundImage: data.metadata.backgroundImage || "",
                coverImage: data.metadata.coverImage || ""
            },
            notes: []
        };
        return beatmap;
    }

    /**
     * Update the notes data for a beatmap while minimizing object creation
     * @param id The beatmap ID
     * @param notes The raw note data
     * @returns The updated beatmap or null if not found
     */
    public updateNotes(id: string, notes: TrackNoteInfo[]): Beatmap {
        if (this.beatmaps.has(id)) {
            const beatmap = this.beatmaps.get(id)!;
            
            // Convert notes and update the beatmap
            beatmap.notes = this.convertNotes(notes, beatmap.notes);
            
            this.beatmaps.set(id, beatmap);
            return beatmap;
        }
        return null;
    }
    
    /**
     * Convert raw note data to optimized game notes while minimizing object creation
     * @param notes The raw note data to convert
     * @param existingNotes Optional array of existing notes to reuse
     * @returns Array of processed and optimized notes
     */
    public convertNotes(notes: TrackNoteInfo[], existingNotes: TrackNoteInfo[] = []): TrackNoteInfo[] {
        const newLength = notes.length;
        let resultNotes: TrackNoteInfo[];
        
        // If we already have an array with sufficient capacity, reuse it
        if (existingNotes.length >= newLength) {
            // Reuse existing array and just update values
            for (let i = 0; i < newLength; i++) {
                const node = notes[i];
                existingNotes[i].midi = node.midi;
                existingNotes[i].time = node.time;
                existingNotes[i].lane = this.getLandById(node.midi);
                existingNotes[i].duration = node.duration;
                existingNotes[i].durationTicks = node.durationTicks;
                existingNotes[i].velocity = node.velocity;
                existingNotes[i].type = this.getNoteType(node);
            }
            // If the new array is smaller, truncate the existing one
            if (existingNotes.length > newLength) {
                existingNotes.length = newLength;
            }
            resultNotes = existingNotes;
        } else {
            // Need to create a new array
            resultNotes = new Array(newLength);
            
            // Use existing objects where possible
            for (let i = 0; i < newLength; i++) {
                const node = notes[i];
                if (i < existingNotes.length) {
                    // Reuse existing note object
                    resultNotes[i] = existingNotes[i];
                    resultNotes[i].midi = node.midi;
                    resultNotes[i].time = node.time;
                    resultNotes[i].lane = this.getLandById(node.midi);
                    resultNotes[i].duration = node.duration;
                    resultNotes[i].durationTicks = node.durationTicks;
                    resultNotes[i].velocity = node.velocity;
                    resultNotes[i].type = this.getNoteType(node);
                } else {
                    // Create new note object
                    resultNotes[i] = {
                        midi: node.midi,
                        time: node.time,
                        lane: this.getLandById(node.midi),
                        duration: node.duration,
                        durationTicks: node.durationTicks,
                        velocity: node.velocity,
                        type: this.getNoteType(node)
                    };
                }
            }
        }
        
        // Sort in place with a more efficient implementation if needed
        resultNotes.sort((a, b) => a.time - b.time);
        
        // After sorting, calculate durations for non-hold notes based on the next note time
        for (let i = 0; i < resultNotes.length - 1; i++) {
            const currentNote = resultNotes[i];
            let nextNote = resultNotes[i + 1];
            
            // Check if the next note has the same time as current note
            // If so, look for the note after that (i + 2)
            if (nextNote.time === currentNote.time && i + 2 < resultNotes.length) {
                nextNote = resultNotes[i + 2];
            }
            
            // Only adjust duration for tap notes (not hold notes)
            if (currentNote.type !== NoteType.HOLD) {
                // Set duration to the time difference between this note and the next
                currentNote.duration = Math.min(nextNote.time - currentNote.time, 0.23);
            }
        }
        
        // Handle the last note if it's not a hold note
        if (resultNotes.length > 0) {
            const lastNote = resultNotes[resultNotes.length - 1];
            if (lastNote.type !== NoteType.HOLD) {
                // For the last note, we could set a default duration or leave as is
                // Here we set a small default duration if it's not already set
                if (lastNote.duration <= 0) {
                    lastNote.duration = 0.2; // Default duration for the last note
                }
            }
        }
        
        return resultNotes;
    }


    public getLandById(nodeId: number) {
        return nodeId - 96;
    }

    public getNoteType(node: TrackNoteInfo) {
        if (node.duration > 0.3) {
            return NoteType.HOLD;
        }
        return NoteType.TAP;
    }

    /**
     * Load a JSON asset from the resources directory
     * @param path Path to the JSON asset (without extension)
     * @returns Promise that resolves with the parsed JSON data
     */
    private loadJsonAsset(path: string): Promise<any> {
        return new Promise((resolve, reject) => {
            resourceUtil.loadRes(path, JsonAsset, (err, jsonAsset) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!jsonAsset) {
                    reject(new Error(`JSON asset not found at path: ${path}`));
                    return;
                }

                resolve(jsonAsset.json);
            });
        });
    }

    /**
     * Load the audio and MIDI files for the active beatmap
     * @returns Promise that resolves when loading is complete
     */
    public async loadBeatmapAudioData(): Promise<BeatmapAudioData> {
        if (!this.activeBeatmap) {
            console.error("No active beatmap to load audio for");
            return null;
        }

        try {
            // Load the audio and MIDI using the audio manager
            const { audioPath, midiPath } = this.activeBeatmap.metadata;
            return await this.audioManager.loadBeatmapAudioData(audioPath, midiPath);
        } catch (err) {
            console.error("Failed to load beatmap audio:", err);
            return null;
        }
    }

    /**
     * Get the active beatmap
     * @returns The currently active beatmap or null if none is loaded
     */
    public getActiveBeatmap(): Beatmap | null {
        return this.activeBeatmap;
    }

    /**
     * Get the notes for the active beatmap
     * @returns Array of notes from the active beatmap or empty array if none is loaded
     */
    public getNotes(): TrackNoteInfo[] {
        return this.activeBeatmap ? this.activeBeatmap.notes : [];
    }

    /**
     * Calculate the difficulty rating based on note density and patterns
     * @param beatmap The beatmap to calculate difficulty for
     * @returns A difficulty rating between 1-10
     */
    public calculateDifficulty(beatmap: Beatmap): number {
        const notes = beatmap.notes;
        if (!notes.length) return 1;

        // Factor 1: Note density (notes per second)
        const totalDuration = notes[notes.length - 1].time - notes[0].time;
        const notesPerSecond = notes.length / (totalDuration || 1);

        // Factor 2: Percentage of complex notes (hold and slide)
        const complexNotes = notes.filter(note => note.type !== NoteType.TAP).length;
        const complexNotePercentage = complexNotes / notes.length;

        // Factor 3: Lane changes - quick transitions between lanes are harder
        let laneChanges = 0;
        for (let i = 1; i < notes.length; i++) {
            if (notes[i].lane !== notes[i - 1].lane) {
                laneChanges++;
            }
        }
        const laneChangeRate = laneChanges / (notes.length - 1);

        // Factor 4: Time between notes - quick successive notes are harder
        let shortIntervals = 0;
        for (let i = 1; i < notes.length; i++) {
            const interval = notes[i].time - notes[i - 1].time;
            if (interval < 0.3) { // Less than 300ms between notes
                shortIntervals++;
            }
        }
        const shortIntervalRate = shortIntervals / (notes.length - 1);

        // Calculate final difficulty score (1-10 scale)
        let difficulty = 1 +
            (notesPerSecond * 0.5) +
            (complexNotePercentage * 2) +
            (laneChangeRate * 2) +
            (shortIntervalRate * 3);

        // Cap at 10
        return Math.min(Math.round(difficulty * 10) / 10, 10);
    }

    /**
     * Get a preview section of the beatmap for the song selection screen
     * @param beatmapId ID of the beatmap to get preview for
     * @returns A subset of notes that fall within the preview time range
     */
    public getBeatmapPreview(beatmapId: string): TrackNoteInfo[] {
        const beatmap = this.beatmaps.get(beatmapId);
        if (!beatmap) return [];

        const { start, end } = beatmap.metadata.preview;

        return beatmap.notes.filter(note =>
            note.time >= start && note.time <= end
        );
    }

    /**
     * Validate a custom beatmap format and convert it if valid
     * @param customData Raw data from a custom beatmap format
     * @returns A valid beatmap object or null if invalid
     */
    public validateCustomBeatmap(customData: any): Beatmap | null {
        try {
            // Implement custom beatmap validation logic here
            // This would depend on the format of custom beatmaps
            // For now, we'll just use our standard validation
            return this.validateBeatmap(customData);
        } catch (err) {
            console.error("Invalid custom beatmap format:", err);
            return null;
        }
    }

    /**
     * Adds a temporary beatmap for drag and drop functionality
     * @param id The temporary beatmap ID
     * @param beatmap The beatmap data
     * @returns The added beatmap
     */
    public addTempBeatmap(id: string, beatmap: Beatmap): Beatmap {
        // Add to our collection
        this.beatmaps.set(id, beatmap);
        
        // Set as active beatmap
        this.activeBeatmap = beatmap;
        
        return beatmap;
    }
} 