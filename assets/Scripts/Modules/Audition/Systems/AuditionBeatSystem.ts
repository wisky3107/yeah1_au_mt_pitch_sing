import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
import { AuditionAudioManager } from './AuditionAudioManager';
import { AuditionInputHandler, AuditionInputType } from './AuditionInputHandler';
import { AuditionNotePool, AuditionNoteType } from './AuditionNotePool';
import { AuditionBeatmap, BeatmapData, BeatNote as BeatMapNote } from './AuditionBeatmap';
import { AuditionNote } from './AuditionNote';
import { PatternData } from './PatternData';
const { ccclass, property } = _decorator;

/**
 * Accuracy ratings for note hits
 */
export enum AuditionAccuracyRating {
    PERFECT,
    GOOD,
    MISS
}

/**
 * Class representing an active beat note in the game
 */
class ActiveNote {
    public noteId: number;   // Unique ID for the note (for pooling)
    public beatTime: number; // Time when the note should be hit
    public noteType: AuditionNoteType; // Type of note
    public component: AuditionNote; // Reference to note component
    public hit: boolean = false;
    public patternSequence: PatternData;
    public patternProgress: number;
    
    constructor(noteId: number, beatTime: number, noteType: AuditionNoteType, component: AuditionNote) {
        this.noteId = noteId;
        this.beatTime = beatTime;
        this.noteType = noteType;
        this.component = component;
    }
}

/**
 * Beat System for Audition module
 * Manages note generation, movement, and timing evaluation
 */
@ccclass('AuditionBeatSystem')
export class AuditionBeatSystem extends Component {
    // Reference to note pool system
    @property(AuditionNotePool)
    private notePool: AuditionNotePool = null;
    
    // Reference to beatmap system
    @property(AuditionBeatmap)
    private beatmapSystem: AuditionBeatmap = null;
    
    // Container for spawned notes
    @property(Node)
    private notesContainer: Node = null;
    
    // Target zone for notes
    @property(Node)
    private targetZone: Node = null;
    
    // Gameplay settings
    @property
    private speed: number = 1.0; // Speed multiplier for note movement
    
    @property
    private approachTime: number = 2000; // Time in ms for notes to travel
    
    @property
    private lookAheadTime: number = 2500; // Time to look ahead for spawning notes
    
    // Timing windows for accuracy ratings (in milliseconds)
    @property
    private perfectWindow: number = 50;  // ±50ms for perfect hit
    
    @property
    private goodWindow: number = 100;    // ±100ms for good hit
    
    @property
    private missWindow: number = 150;    // ±150ms for miss
    
    // Current beatmap data
    private beatmap: BeatmapData = null;
    private activeNotes: ActiveNote[] = [];
    private processedNotes: number = 0;
    private totalNotes: number = 0;
    private timingWindows: Map<AuditionAccuracyRating, number> = new Map();
    
    // Callback for scoring events
    private scoringCallback: (rating: AuditionAccuracyRating, noteType: number) => void = null;
    
    // Start position (top of screen) and target position for notes
    private startPosition: Vec3 = new Vec3(0, 600, 0);
    private targetPosition: Vec3 = new Vec3(0, 0, 0);
    
    // Whether the beatmap is currently playing
    private isPlaying: boolean = false;
    private lastSpawnedTime: number = 0;
    private currentPatternProgress: number = 0;
    
    private currentPattern: PatternData | null = null;
    
    onLoad() {
        // Setup timing windows
        this.timingWindows.set(AuditionAccuracyRating.PERFECT, this.perfectWindow);
        this.timingWindows.set(AuditionAccuracyRating.GOOD, this.goodWindow);
        this.timingWindows.set(AuditionAccuracyRating.MISS, this.missWindow);
        
        // Set target position based on target zone if available
        if (this.targetZone) {
            this.targetPosition = this.targetZone.position.clone();
        }
        
        // Make sure we have the note pool and beatmap system
        if (!this.notePool) {
            console.warn('No note pool assigned to AuditionBeatSystem! Creating one...');
            this.notePool = this.node.addComponent(AuditionNotePool);
        }
        
        if (!this.beatmapSystem) {
            console.warn('No beatmap system assigned to AuditionBeatSystem! Creating one...');
            this.beatmapSystem = this.node.addComponent(AuditionBeatmap);
        }
    }
    
    /**
     * Load a beatmap from the specified path
     * @param songData Path to the beatmap JSON file
     * @returns Promise that resolves when the beatmap is loaded
     */
    public loadBeatmap(id: string, bpm: number, durationMs: number, quantization: number = 4): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(`Loading beatmap: ${id}`);
            
            this.beatmapSystem.generateBeatmap(id, bpm, durationMs, quantization)
                .then((beatmapData) => {
                    this.beatmap = beatmapData;
                    this.totalNotes = beatmapData.notes.length;
                    this.resetBeatmap();
                    console.log(`Beatmap loaded successfully with ${this.totalNotes} notes`);
                    resolve();
                })
                .catch(error => {
                    console.error('Failed to load beatmap:', error);
                    reject(error);
                });
        });
    }
    
    /**
     * Reset beatmap state to prepare for gameplay
     */
    private resetBeatmap(): void {
        // Return all active notes to the pool
        this.recycleAllNotes();
        
        this.activeNotes = [];
        this.processedNotes = 0;
        this.isPlaying = false;
        this.lastSpawnedTime = 0;
        
        console.log('Beatmap reset');
    }
    
    /**
     * Return all active notes to the pool
     */
    private recycleAllNotes(): void {
        // Recycle all active notes
        for (const note of this.activeNotes) {
            this.notePool.recycleNote(note.noteId);
        }
        
        // Also call the pool's recycleAllNotes to be sure
        this.notePool.recycleAllNotes();
    }
    
    /**
     * Start playing the beatmap
     */
    public startBeatmap(): void {
        if (!this.beatmap) {
            console.error('No beatmap loaded');
            return;
        }
        
        this.isPlaying = true;
        
        // Register input callbacks
        const inputHandler = AuditionInputHandler.instance;
        if (inputHandler) {
            inputHandler.registerInputCallback(AuditionInputType.LEFT, 
                (time: number) => this.evaluateInput(AuditionInputType.LEFT, time));
                
            inputHandler.registerInputCallback(AuditionInputType.RIGHT, 
                (time: number) => this.evaluateInput(AuditionInputType.RIGHT, time));
                
            inputHandler.registerInputCallback(AuditionInputType.SPACE, 
                (time: number) => this.evaluateInput(AuditionInputType.SPACE, time));
        }
        
        console.log('Beatmap started');
    }
    
    /**
     * Stop playing the beatmap
     */
    public stopBeatmap(): void {
        this.isPlaying = false;
        
        // Unregister input callbacks
        const inputHandler = AuditionInputHandler.instance;
        if (inputHandler) {
            inputHandler.unregisterInputCallback(AuditionInputType.LEFT, 
                (time: number) => this.evaluateInput(AuditionInputType.LEFT, time));
                
            inputHandler.unregisterInputCallback(AuditionInputType.RIGHT, 
                (time: number) => this.evaluateInput(AuditionInputType.RIGHT, time));
                
            inputHandler.unregisterInputCallback(AuditionInputType.SPACE, 
                (time: number) => this.evaluateInput(AuditionInputType.SPACE, time));
        }
        
        // Recycle all notes
        this.recycleAllNotes();
        
        console.log('Beatmap stopped');
    }
    
    /**
     * Set callback for scoring events
     * @param callback Function to call when notes are hit/missed
     */
    public setScoreCallback(callback: (rating: AuditionAccuracyRating, noteType: number) => void): void {
        this.scoringCallback = callback;
    }
    
    /**
     * Set the speed multiplier for note movement
     * @param speed Speed multiplier (1.0 = normal speed)
     */
    public setSpeed(speed: number): void {
        this.speed = Math.max(0.5, Math.min(3.0, speed));
        this.approachTime = 2000 / this.speed;
        this.lookAheadTime = this.approachTime + 500; // Add some buffer
        console.log(`Note speed set to ${this.speed}x (${this.approachTime}ms approach time)`);
    }
    
    /**
     * Update method called every frame
     * @param dt Delta time since last frame
     */
    update(dt: number): void {
        if (!this.isPlaying || !this.beatmap) return;
        
        const audioManager = AuditionAudioManager.instance;
        if (!audioManager) return;
        
        const currentTime = audioManager.getCurrentTime();
        
        // Spawn new notes
        this.spawnNewNotes(currentTime);
        
        // Update existing notes
        this.updateNotes(currentTime);
        
        // Check for missed notes
        this.checkMissedNotes(currentTime);
        
        // Check if the beatmap is finished
        if (this.processedNotes >= this.totalNotes && this.activeNotes.length === 0) {
            console.log('Beatmap finished');
            this.isPlaying = false;
            // Signal that the beatmap is complete
            this.node.emit('beatmap-completed');
        }
    }
    
    /**
     * Spawn new notes based on current time
     * @param currentTime Current playback time
     */
    private spawnNewNotes(currentTime: number): void {
        if (!this.beatmapSystem) return;
        
        // Only spawn notes if we've moved forward in time (prevents duplicate spawns if time is paused)
        if (currentTime <= this.lastSpawnedTime) return;
        
        // Get notes that should be spawned based on look-ahead time
        const notesToSpawn = this.beatmapSystem.getNotesToSpawn(
            this.lastSpawnedTime, 
            currentTime + this.lookAheadTime
        );
        
        // Spawn each note
        for (const noteData of notesToSpawn) {
            this.spawnNote(noteData);
            this.processedNotes++;
        }
        
        this.lastSpawnedTime = currentTime;
    }
    
    /**
     * Update positions and states of active notes
     * @param currentTime Current playback time
     */
    private updateNotes(currentTime: number): void {
        for (const note of this.activeNotes) {
            if (note.hit) continue;
            
            // Update note position
            const timeToHit = note.beatTime - currentTime;
            const progress = 1 - (timeToHit / this.approachTime);
            
            // Note is now visible and moving
            if (note.component && note.component.isNoteMoving()) {
                // Position is handled by the note component's movement tween
            } else if (progress >= 0 && progress <= 1) {
                // Start the note movement if it's time
                this.startNoteMovement(note, this.approachTime * (1 - progress));
            }
        }
    }
    
    /**
     * Start note movement animation
     * @param note The note to animate
     * @param duration Duration of the movement in milliseconds
     */
    private startNoteMovement(note: ActiveNote, duration: number): void {
        if (!note.component) return;
        
        // Start the note movement
        note.component.startMovement(this.startPosition.y, this.targetPosition.y, duration / 1000);
    }
    
    /**
     * Check for notes that have been missed
     * @param currentTime Current playback time
     */
    private checkMissedNotes(currentTime: number): void {
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            
            if (note.hit) continue;
            
            // If note has passed the miss window, handle it as missed
            const timeToHit = note.beatTime - currentTime;
            if (timeToHit < -this.timingWindows.get(AuditionAccuracyRating.MISS)) {
                this.handleMissedNote(note);
                this.activeNotes.splice(i, 1);
            }
        }
    }
    
    /**
     * Spawn a new note from the note pool
     * @param noteData Note data from beatmap
     */
    private spawnNote(noteData: BeatMapNote): void {
        // Convert beatmap note type to AuditionNoteType
        const noteType = AuditionBeatmap.getNoteTypeFromBeatNote(noteData);
        
        // Get a note from the pool
        const noteResult = this.notePool.getNote(noteType);
        if (!noteResult) {
            console.error('Failed to get note from pool');
            return;
        }
        
        const { id, node } = noteResult;
        
        // Set note parent to notes container
        if (this.notesContainer) {
            node.parent = this.notesContainer;
        }
        
        // Get the AuditionNote component
        const noteComponent = node.getComponent(AuditionNote);
        if (!noteComponent) {
            console.error('Note node does not have AuditionNote component');
            this.notePool.recycleNote(id);
            return;
        }
        
        // Initialize the note
        noteComponent.initialize(noteType, noteData.time, this.speed, id);
        
        // Set initial position at the start position
        node.position = this.startPosition.clone();
        
        // Create active note and add to active notes list
        const activeNote = new ActiveNote(id, noteData.time, noteType, noteComponent);
        this.activeNotes.push(activeNote);
    }
    
    /**
     * Evaluate player input against note timing
     * @param inputType Type of input
     * @param time Time of input
     */
    public evaluateInput(inputType: AuditionInputType, time: number): void {
        if (!this.isPlaying) return;
        
        // Convert input type to note type
        const noteType = this.inputTypeToNoteType(inputType);
        
        let bestNote: ActiveNote = null;
        let bestDifference: number = Number.MAX_VALUE;
        let bestIndex: number = -1;
        
        // Find the closest note of matching type
        for (let i = 0; i < this.activeNotes.length; i++) {
            const note = this.activeNotes[i];
            
            if (note.hit || note.noteType !== noteType) continue;
            
            const timeDifference = Math.abs(note.beatTime - time);
            
            if (timeDifference < bestDifference) {
                bestDifference = timeDifference;
                bestNote = note;
                bestIndex = i;
            }
        }
        
        // If no valid note found or too far off timing
        if (!bestNote || bestDifference > this.timingWindows.get(AuditionAccuracyRating.MISS)) {
            return;
        }
        
        // Determine accuracy rating
        let accuracyRating: AuditionAccuracyRating;
        if (bestDifference <= this.timingWindows.get(AuditionAccuracyRating.PERFECT)) {
            accuracyRating = AuditionAccuracyRating.PERFECT;
        } else if (bestDifference <= this.timingWindows.get(AuditionAccuracyRating.GOOD)) {
            accuracyRating = AuditionAccuracyRating.GOOD;
        } else {
            accuracyRating = AuditionAccuracyRating.MISS;
        }
        
        // Mark note as hit
        bestNote.hit = true;
        
        // Play hit animation via note component
        if (bestNote.component) {
            const accuracy = 1.0 - (bestDifference / this.timingWindows.get(AuditionAccuracyRating.PERFECT));
            bestNote.component.playHitEffect(Math.max(0, accuracy));
        }
        
        // Play sound effect
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            if (accuracyRating === AuditionAccuracyRating.PERFECT) {
                audioManager.playSound('perfect');
            } else if (accuracyRating === AuditionAccuracyRating.GOOD) {
                audioManager.playSound('good');
            }
        }
        
        // Call scoring callback
        if (this.scoringCallback) {
            this.scoringCallback(accuracyRating, inputType);
        }
        
        // Remove note from active notes and recycle after a delay
        if (bestIndex !== -1) {
            const noteToRecycle = this.activeNotes[bestIndex];
            this.activeNotes.splice(bestIndex, 1);
            
            // Recycle the note after animation completes
            setTimeout(() => {
                this.notePool.recycleNote(noteToRecycle.noteId);
            }, 500);
        }
        
        console.log(`Note hit: ${AuditionInputType[inputType]}, Rating: ${AuditionAccuracyRating[accuracyRating]}`);
    }
    
    /**
     * Handle missed notes
     * @param note The note that was missed
     */
    private handleMissedNote(note: ActiveNote): void {
        // Play miss animation via note component
        if (note.component) {
            note.component.playMissEffect();
        }
        
        // Play miss sound
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.playSound('miss');
        }
        
        // Call scoring callback
        if (this.scoringCallback) {
            // Convert note type back to input type for the callback
            const inputType = this.noteTypeToInputType(note.noteType);
            this.scoringCallback(AuditionAccuracyRating.MISS, inputType);
        }
        
        // Recycle the note after animation completes
        setTimeout(() => {
            this.notePool.recycleNote(note.noteId);
        }, 500);
        
        console.log(`Note missed: ${note.noteType}`);
    }
    
    /**
     * Convert input type to note type
     * @param inputType The input type
     * @returns The corresponding note type
     */
    private inputTypeToNoteType(inputType: AuditionInputType): AuditionNoteType {
        switch (inputType) {
            case AuditionInputType.LEFT:
                return AuditionNoteType.LEFT;
            case AuditionInputType.RIGHT:
                return AuditionNoteType.RIGHT;
            case AuditionInputType.SPACE:
                return AuditionNoteType.SPACE;
            default:
                return AuditionNoteType.SPACE;
        }
    }
    
    /**
     * Convert note type to input type
     * @param noteType The note type
     * @returns The corresponding input type
     */
    private noteTypeToInputType(noteType: AuditionNoteType): AuditionInputType {
        switch (noteType) {
            case AuditionNoteType.LEFT:
                return AuditionInputType.LEFT;
            case AuditionNoteType.RIGHT:
                return AuditionInputType.RIGHT;
            case AuditionNoteType.SPACE:
                return AuditionInputType.SPACE;
            default:
                return AuditionInputType.SPACE;
        }
    }
    
    /**
     * Get the total number of notes in the beatmap
     * @returns Total note count
     */
    public getTotalNoteCount(): number {
        return this.totalNotes;
    }
    
    /**
     * Get the number of notes that have been processed
     * @returns Processed note count
     */
    public getProcessedNoteCount(): number {
        return this.processedNotes;
    }
    
    private handlePatternInput(inputType: AuditionInputType): void {
        if (!this.currentPattern) return;
        
        // Validate input against current pattern sequence
        const expectedInput = this.currentPattern.sequence[this.currentPatternProgress];
        if (inputType === expectedInput) {
            this.currentPatternProgress++;
            if (this.currentPatternProgress >= this.currentPattern.sequence.length) {
                this.activateSyncPoint();
            }
        } else {
            this.breakPattern();
        }
    }
    
    private activateSyncPoint(): void {
        // Handle spacebar sync timing evaluation
    }
    
    private breakPattern(): void {
        // Handle pattern break consequences
    }
} 