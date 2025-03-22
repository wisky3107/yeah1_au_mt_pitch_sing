import { _decorator, Component, Node, Vec3, Sprite, tween, math, CCFloat, UIOpacity } from 'cc';
import { AuditionAudioManager } from './AuditionAudioManager';
import { AuditionInputHandler, AuditionInputType } from './AuditionInputHandler';
import { AuditionNotePool, AuditionNoteType } from './AuditionNotePool';
import { AuditionNote } from './AuditionNote';
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
 * Level sequence types
 */
export enum LevelSequenceType {
    OFF = 'off',
    LEVEL = 'lv',
    FINISH = 'finish'
}

/**
 * Level sequence data
 */
interface LevelSequence {
    type: LevelSequenceType;
    notes: number;
    loop: number;
    delay?: number;
}

/**
 * Beat System for Audition module
 * Manages single note movement and timing evaluation
 */
@ccclass('AuditionBeatSystem')
export class AuditionBeatSystem extends Component {
    // Note settings
    // Visual nodes group
    @property({ type: Node, group: { name: "Visual Elements", id: "visual" } })
    private movingBeatNote: Node = null;

    @property({ type: Node, group: { name: "Visual Elements", id: "visual" } })
    private targetZone: Node = null;

    @property({ type: Node, group: { name: "Visual Elements", id: "visual" } })
    private startNode: Node = null;

    @property({ type: Node, group: { name: "Visual Elements", id: "visual" } })
    private endNode: Node = null;

    @property({ type: Sprite, group: { name: "Visual Elements", id: "visual" } })
    private heartBeatSprite: Sprite = null;

    @property({ type: UIOpacity, group: { name: "Visual Elements", id: "visual" } })
    private opacityGameplay: UIOpacity = null;

    // Beat settings
    @property({ group: { name: "Beat Settings", id: "beat" } })
    private bpm: number = 120;

    @property({ group: { name: "Beat Settings", id: "beat" } })
    private beatsPerLoop: number = 4;

    // Timing windows for accuracy ratings (in milliseconds)
    @property({ group: { name: "Timing Windows", id: "timing" } })
    private perfectWindow: number = 50;  // ±50ms for perfect hit

    @property({ group: { name: "Timing Windows", id: "timing" } })
    private goodWindow: number = 100;    // ±100ms for good hit

    @property({ group: { name: "Timing Windows", id: "timing" } })
    private missWindow: number = 150;    // ±150ms for miss

    // Note settings
    @property({ type: AuditionNotePool, group: { name: "Note Settings", id: "notes" } })
    private notePool: AuditionNotePool = null;

    @property({ type: Node, group: { name: "Note Settings", id: "notes" } })
    private nodeContainer: Node = null;

    @property({ type: CCFloat, group: { name: "Note Settings", id: "notes" } })
    private nodeDistance: number = 65;

    // Game state
    private isPlaying: boolean = false;
    private timingWindows: Map<AuditionAccuracyRating, number> = new Map();
    private currentLoop: number = 0;
    private lastBeatTime: number = 0;
    private songDuration: number = 0;

    // Callback for scoring events
    private scoringCallback: (rating: AuditionAccuracyRating) => void = null;

    // Start and end positions for note movement
    private startX: number = -500;
    private endX: number = 500;
    private targetX: number = 0;
    private noteSpeed: number = 0; // Speed in units per second
    private noteDelay: number = 0; // Delay in seconds to hit target zone at right time

    // Heartbeat effect settings
    private heartbeatScale: number = 1.5;
    private heartbeatDuration: number = 0.1;
    private isHeartbeatAnimating: boolean = false;

    // Level system properties
    private currentLevel: number = 0;
    private currentLevelLoop: number = 0;
    private requiredNotes: number = 0;
    private currentNotes: number = 0;
    private isInDelay: boolean = false;
    private delayLoops: number = 0;
    private levelSequences: LevelSequence[] = [];
    private currentSequenceIndex: number = 0;
    private penaltyPatternLoops: number = 0;
    
    private get isInPenalty(): boolean {
        return this.penaltyPatternLoops > 0;
    }

    // Note tracking
    private activeNoteIds: number[] = [];
    private noteSequence: AuditionNoteType[] = [];
    private currentSequenceNotes: AuditionNote[] = [];

    onLoad() {
        // Setup timing windows
        this.timingWindows.set(AuditionAccuracyRating.PERFECT, this.perfectWindow);
        this.timingWindows.set(AuditionAccuracyRating.GOOD, this.goodWindow);
        this.timingWindows.set(AuditionAccuracyRating.MISS, this.missWindow);

        this.startX = this.startNode.position.x;
        this.endX = this.endNode.position.x;
        this.targetX = this.targetZone.position.x;

        this.updateSpeed();

        // Make sure we have the note
        if (!this.movingBeatNote) {
            console.error('No note assigned to AuditionBeatSystem!');
            return;
        }

        // Set initial position
        this.movingBeatNote.position = new Vec3(this.startX, this.startNode.position.y, this.startNode.position.z);

        // Initialize heartbeat sprite if available
        if (this.heartBeatSprite) {
            this.heartBeatSprite.node.scale = new Vec3(1, 1, 1);
        }
    }

    private updateSpeed() {
        // Calculate note speed based on distance and timing
        const distance = this.endX - this.startX;
        const beatTime = (60000 / this.bpm) / 1000; // Convert to seconds
        const beatInterval = beatTime * this.beatsPerLoop;
        this.noteSpeed = distance / beatInterval;

        // Calculate delay needed to hit target zone at right time
        const distanceToEnd = this.endX - this.targetX;
        this.noteDelay = (distanceToEnd / distance) * beatInterval;
    }

    private getCurrentTime(): number {
        return AuditionAudioManager.instance.getCurrentTime();
    }

    /**
     * Initialize level sequences from brief
     */
    private initializeLevelSequences(): void {
        this.levelSequences = [
            { type: LevelSequenceType.OFF, loop: 3, notes: 0 },
            { type: LevelSequenceType.LEVEL, loop: 1, notes: 1 },
            { type: LevelSequenceType.LEVEL, loop: 1, notes: 2 },
            { type: LevelSequenceType.LEVEL, loop: 1, notes: 3 },
            { type: LevelSequenceType.LEVEL, loop: 1, notes: 4 },
            { type: LevelSequenceType.LEVEL, loop: 1, notes: 5 },
            { type: LevelSequenceType.LEVEL, loop: 4, notes: 6, delay: 1 },
            { type: LevelSequenceType.LEVEL, loop: 4, notes: 7, delay: 1 },
            { type: LevelSequenceType.LEVEL, loop: 4, notes: 8, delay: 1 },
            { type: LevelSequenceType.LEVEL, loop: 4, notes: 9, delay: 1 },
            { type: LevelSequenceType.FINISH, loop: 1, notes: 9 },
            { type: LevelSequenceType.OFF, loop: 4, notes: 0 }
        ];
    }

    /**
     * Start the beat system with level sequences
     */
    public startBeatSystem(bpm: number, songDuration: number, disableLoops: number = 0): void {
        if (!this.movingBeatNote) return;
        this.bpm = bpm;
        this.updateSpeed();

        this.isPlaying = true;
        this.songDuration = songDuration;

        // Initialize level system
        this.initializeLevelSequences();
        this.currentSequenceIndex = 0;
        this.currentLevel = 0;
        this.currentNotes = 0;

        this.penaltyPatternLoops = 0;
        this.activeNoteIds = [];
        this.noteSequence = [];

        // Initialize lastBeatTime with current audio time
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            this.lastBeatTime = audioManager.getCurrentTime();
        } else {
            this.lastBeatTime = Date.now();
        }

        this.currentLoop = 0;

        // Register input callbacks
        const inputHandler = AuditionInputHandler.instance;
        if (inputHandler) {
            inputHandler.registerInputCallback(AuditionInputType.SPACE,
                (time: number) => this.evaluateInput(time));
            inputHandler.registerInputCallback(AuditionInputType.LEFT,
                (time: number) => this.handleNoteInput(AuditionNoteType.LEFT, time));
            inputHandler.registerInputCallback(AuditionInputType.RIGHT,
                (time: number) => this.handleNoteInput(AuditionNoteType.RIGHT, time));
        }

        console.log('Beat system started with level sequences');

        //setup frist sequence
        this.isInDelay = false;
        this.delayLoops = 0;
        this.currentLevelLoop = 0;
        this.updateGameplayInteractableVisualize();
    }

    /**
     * Handle note input from player
     */
    private handleNoteInput(noteType: AuditionNoteType, time: number): void {
        if (!this.isPlaying || this.isInPenalty) return;
        if (this.currentNotes >= this.noteSequence.length) return; //if user finished the sequence

        // Check if the note matches the sequence
        if (this.currentNotes < this.noteSequence.length && this.noteSequence[this.currentNotes] === noteType) {
            this.currentSequenceNotes[this.currentNotes].playHitEffect(AuditionAccuracyRating.PERFECT);
            this.currentNotes++;

        } else {
            // Wrong note pressed

            this.currentNotes = 0;
            this.currentSequenceNotes.forEach(note => note.reset());
        }
    }

    private clearLastNotes() {
        // Recycle all active notes
        this.activeNoteIds.forEach(id => this.notePool.recycleNote(id));
        this.activeNoteIds = [];
        this.noteSequence = [];
        this.currentNotes = 0;
    }

    /**
     * Handle miss event
     */
    private handleMiss(): void {
        if (this.isInPenalty) return;

        this.penaltyPatternLoops = 2;//can not play next patterns

        if (this.scoringCallback) {
            this.scoringCallback(AuditionAccuracyRating.MISS);
        }
        this.updateGameplayInteractableVisualize();
    }

    private handleScored(rating: AuditionAccuracyRating): void {
        this.clearLastNotes();
        if (this.scoringCallback) {
            this.scoringCallback(rating);
        }
    }

    /**
     * Update method called every frame
     */
    update(dt: number): void {
        if (!this.isPlaying || !this.movingBeatNote) return;

        const audioManager = AuditionAudioManager.instance;
        if (!audioManager) return;

        const currentTime = this.getCurrentTime();
        const beatTime = (60000 / this.bpm);
        const beatInterval = beatTime * this.beatsPerLoop;

        // Check if it's time for the next beat
        if (currentTime - this.lastBeatTime >= beatInterval + this.missWindow) {
            this.lastBeatTime = Math.round(currentTime / beatInterval) * beatInterval;
            this.currentLoop++;
            this.updateLevelSystem();
        }

        this.updateBeatNoteMoving(currentTime);
        this.updateHeartBeatEffect(currentTime, beatTime, beatInterval);
    }

    /**
     * Update level system state
     */
    private updateLevelSystem(): void {
        if (this.noteSequence.length > 0) {
            this.handleMiss(); //if reach this but not perfect
        }
        this.clearLastNotes();

        if (this.isInDelay) {
            this.delayLoops--;
            if (this.delayLoops <= 0) {
                this.isInDelay = false;
            }
            return;
        }

        const startNewSequence = (sequence: LevelSequence) => {
            if (this.isInPenalty) {
                this.penaltyPatternLoops--;
            }

            this.startNextPattern();

            if (sequence.delay) {
                this.delayLoops = sequence.delay;
                this.isInDelay = true;
            }

        };

        const currentSequence = this.levelSequences[this.currentSequenceIndex];

        // Check if current pattern is complete
        if (this.currentLevelLoop >= currentSequence.loop) {
            this.currentSequenceIndex++;
            if (this.currentSequenceIndex >= this.levelSequences.length) {
                this.currentSequenceIndex = 0;//reset to wait phase
                this.penaltyPatternLoops = 0;
            }

            const nextSequence = this.levelSequences[this.currentSequenceIndex];
            if (nextSequence.type === LevelSequenceType.OFF) {
                this.delayLoops = nextSequence.loop;
                this.isInDelay = true;
            } else if (nextSequence.type === LevelSequenceType.LEVEL) {
                this.currentLevel = nextSequence.notes;
                this.currentLevelLoop = 0;
                startNewSequence(nextSequence);
            } else if (nextSequence.type === LevelSequenceType.FINISH) {
                // Handle finish sequence
                this.handleFinishSequence();
            }
        }
        else {
            this.currentLevelLoop++;
            if (currentSequence.type === LevelSequenceType.LEVEL) {
                startNewSequence(currentSequence);
            }
        }
    }

    /**
     * Start the next pattern
     */
    private startNextPattern(): void {
        const sequence = this.levelSequences[this.currentSequenceIndex];
        // Set required notes to match the level number (not the sequence value)
        this.requiredNotes = sequence.notes;
        this.currentNotes = 0;
        this.noteSequence = [];
        this.currentSequenceNotes = [];
        // Calculate starting X position to center the sequence
        let startX = -(this.nodeDistance * this.requiredNotes / 2) + (this.nodeDistance / 2);

        // Generate random note sequence
        for (let i = 0; i < this.requiredNotes; i++) {
            const noteType = Math.random() < 0.5 ? AuditionNoteType.LEFT : AuditionNoteType.RIGHT;
            this.noteSequence.push(noteType);

            // Create note visual
            const { id, node } = this.notePool.getNote(noteType);
            node.parent = this.nodeContainer;
            if (node) {
                this.activeNoteIds.push(id);
                const note = node.getComponent(AuditionNote);
                note.initialize(noteType, this.lastBeatTime, id);
                this.currentSequenceNotes.push(note);
                // Position the note using the configured nodeDistance property
                node.setPosition(new Vec3(startX + (i * this.nodeDistance), 0, 0));
            }
        }

        this.currentLevelLoop++;
        this.updateGameplayInteractableVisualize();
    }

    /**
     * Handle finish sequence
     */
    private handleFinishSequence(): void {
        // Implement finish sequence logic here
        console.log('Finish sequence started');
        // You can add special effects or final pattern here
    }

    /**
     * Stop the beat system
     */
    public stopBeatSystem(): void {
        this.isPlaying = false;

        // Unregister input callback
        const inputHandler = AuditionInputHandler.instance;
        if (inputHandler) {
            inputHandler.unregisterInputCallback(AuditionInputType.SPACE,
                (time: number) => this.evaluateInput(time));
            inputHandler.unregisterInputCallback(AuditionInputType.LEFT,
                (time: number) => this.handleNoteInput(AuditionNoteType.LEFT, time));
            inputHandler.unregisterInputCallback(AuditionInputType.RIGHT,
                (time: number) => this.handleNoteInput(AuditionNoteType.RIGHT, time));
        }

        console.log('Beat system stopped');
    }

    /**
     * Set callback for scoring events
     * @param callback Function to call when notes are hit/missed
     */
    public setScoreCallback(callback: (rating: AuditionAccuracyRating) => void): void {
        this.scoringCallback = callback;
    }

    private updateBeatNoteMoving(currentTime: number) {
        // Move note using speed-based movement based on audio time with delay
        const checkTime = (currentTime - this.lastBeatTime);
        const timeSinceLastBeat = checkTime / 1000 - this.noteDelay; // Convert to seconds
        let newX = this.startX;
        if (timeSinceLastBeat > 0) {
            newX = this.startX + (this.noteSpeed * timeSinceLastBeat);
        }
        else {
            newX = this.endX + (this.noteSpeed * timeSinceLastBeat);
        }
        this.movingBeatNote.position = new Vec3(newX, this.movingBeatNote.position.y, this.movingBeatNote.position.z);
    }

    private updateHeartBeatEffect(currentTime: number, beatTime: number, beatInterval: number) {
        // Visualize heartbeat effect based on proximity to beat time
        if (!this.heartBeatSprite) return;

        const checkTime = (currentTime - this.lastBeatTime);
        // Calculate how close we are to the next beat
        const normalizedPosition = (currentTime % beatTime);
        const isApplyScale = checkTime > (beatInterval - beatTime * 0.5) && checkTime < (beatInterval + beatTime * 0.5);
        const scale = isApplyScale ? Math.max(1.0, (1.0 - normalizedPosition / beatTime) * 2.0) : 1.0;
        // Apply scale to note
        this.heartBeatSprite.node.setScale(new Vec3(scale, 1.0, 1.0));

        // Set alpha based on beat proximity
        const alpha = Math.max(0.5, 1.0 - normalizedPosition / beatTime);
        // Apply alpha to heartbeat sprite
        const color = this.heartBeatSprite.color.clone();
        color.a = alpha * 255;
        this.heartBeatSprite.color = color;
    }

    /**
     * 
     * Evaluate player input against note timing
     * @param time Time of input
     */
    private evaluateInput(time: number): void {
        if (!this.isPlaying || this.isInPenalty) return;
        if (this.noteSequence.length == 0) return; //can not press space if not note sequence

        const audioManager = AuditionAudioManager.instance;
        if (!audioManager) return;

        const currentTime = this.getCurrentTime();
        const beatInterval = (60000 / this.bpm) * this.beatsPerLoop;
        const timeSinceLastBeat = currentTime - this.lastBeatTime;

        // Calculate how close to the target the note is
        const targetProgress = 1.0; // Note should be at target when beat occurs
        const currentProgress = (timeSinceLastBeat) / (beatInterval);
        const distanceFromTarget = Math.abs(targetProgress - currentProgress);

        // Determine accuracy rating
        let accuracyRating: AuditionAccuracyRating;
        if (distanceFromTarget <= this.timingWindows.get(AuditionAccuracyRating.PERFECT) / beatInterval) {
            accuracyRating = AuditionAccuracyRating.PERFECT;
        } else if (distanceFromTarget <= this.timingWindows.get(AuditionAccuracyRating.GOOD) / beatInterval) {
            accuracyRating = AuditionAccuracyRating.GOOD;
        } else {
            accuracyRating = AuditionAccuracyRating.MISS;
        }

        if (this.isMiss() || accuracyRating == AuditionAccuracyRating.MISS) {
            this.handleMiss();
        }
        else {
            this.handleScored(accuracyRating);
        }
    }

    private isMiss(): boolean {
        return this.currentNotes < this.requiredNotes;
    }

    private updateGameplayInteractableVisualize() {
        if (!this.opacityGameplay) return;
        const isPlayable = !this.isInPenalty && this.isPlaying;
        this.opacityGameplay.opacity = isPlayable ? 255 : 50;
    }

    /**
     * Get the current BPM
     * @returns Current BPM
     */
    public getBPM(): number {
        return this.bpm;
    }

    /**
     * Set the BPM
     * @param bpm New BPM value
     */
    public setBPM(bpm: number): void {
        this.bpm = Math.max(60, Math.min(200, bpm));
        console.log(`BPM set to ${this.bpm}`);
    }

    /**
     * Get the number of beats per loop
     * @returns Current beats per loop
     */
    public getBeatsPerLoop(): number {
        return this.beatsPerLoop;
    }

    /**
     * Set the number of beats per loop
     * @param beats New number of beats per loop
     */
    public setBeatsPerLoop(beats: number): void {
        this.beatsPerLoop = Math.max(1, Math.min(8, beats));
        console.log(`Beats per loop set to ${this.beatsPerLoop}`);
    }
} 