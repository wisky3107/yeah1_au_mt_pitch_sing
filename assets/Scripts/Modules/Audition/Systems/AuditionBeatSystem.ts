import { _decorator, Component, Node, Vec3, Sprite, tween, math, CCFloat, UIOpacity, Label, LabelShadow, Tween, Color } from 'cc';
import { AuditionAudioManager } from './AuditionAudioManager';
import { AuditionInputHandler, AuditionInputType } from './AuditionInputHandler';
import { AuditionNotePool, AuditionNoteType } from './AuditionNotePool';
import { AuditionNote } from './AuditionNote';
import { EDITOR } from 'cc/env';
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
    //#region Properties - Visual Elements
    // Visual nodes and UI elements for gameplay visualization
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

    @property({ type: Label, group: { name: "Visual Elements", id: "visual" } })
    private levelLabel: Label = null;

    //#endregion

    //#region Properties - Beat Settings
    // Core beat timing and rhythm settings
    @property({ group: { name: "Beat Settings", id: "beat" } })
    private bpm: number = 120;

    @property({ group: { name: "Beat Settings", id: "beat" } })
    private beatsPerLoop: number = 4;
    //#endregion

    //#region Properties - Timing Windows
    // Accuracy evaluation windows for note hits
    @property({ group: { name: "Timing Windows", id: "timing" } })
    private perfectWindow: number = 50;  // ±50ms for perfect hit

    @property({ group: { name: "Timing Windows", id: "timing" } })
    private goodWindow: number = 100;    // ±100ms for good hit

    @property({ group: { name: "Timing Windows", id: "timing" } })
    private missWindow: number = 200;    // ±200ms for miss
    //#endregion

    //#region Properties - Note Settings
    // Note pool and positioning configuration
    @property({ type: AuditionNotePool, group: { name: "Note Settings", id: "notes" } })
    private notePool: AuditionNotePool = null;

    @property({ type: Node, group: { name: "Note Settings", id: "notes" } })
    private nodeContainer: Node = null;

    @property({ type: CCFloat, group: { name: "Note Settings", id: "notes" } })
    private nodeDistance: number = 65;
    //#endregion

    //#region Game State
    // Core game state variables
    private isPlaying: boolean = false;
    private timingWindows: Map<AuditionAccuracyRating, number> = new Map();
    private currentLoop: number = 0;
    private lastBeatTime: number = 0;
    private songDuration: number = 0;
    private isAutoPlay: boolean = false;
    private scoringCallback: (rating: AuditionAccuracyRating) => void = null;
    private readyCallback: () => void = null;
    private levelChangedCallback: (level: number, sequenceType: LevelSequenceType) => void = null;
    //#endregion

    //#region Note Movement
    // Note movement and positioning variables
    private startX: number = -500;
    private endX: number = 500;
    private targetX: number = 0;
    private noteSpeed: number = 0; // Speed in units per second
    private noteDelay: number = 0; // Delay in seconds to hit target zone at right time
    //#endregion

    //#region Level System
    // Level progression and sequence management
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
    //#endregion

    //#region Note Tracking
    // Active note and sequence tracking
    private activeNoteIds: number[] = [];
    private noteSequence: AuditionNoteType[] = [];
    private currentSequenceNotes: AuditionNote[] = [];
    //#endregion

    //#region Lifecycle Methods
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

        //test auto plays
        this.setAutoPlay(true);
    }
    //#endregion

    //#region Core Gameplay Methods
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

        // Handle auto-play
        this.handleAutoPlay();
    }
    //#endregion

    //#region Level System Methods
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
        ];
    }

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

        const beatTime = (60000 / this.bpm) / 1000; // Convert to seconds
        const beatInterval = beatTime * this.beatsPerLoop * 4;
        const readyCallbackTime = Math.max(0, beatInterval - 1.0);
        this.scheduleOnce(() => {
            if (this.readyCallback) {
                this.readyCallback();
                this.readyCallback = null;
            }
        }, readyCallbackTime);
    }

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
                this.currentLevelLoop = nextSequence.loop;//no need wait loop cause already wait in InDelay
                this.isInDelay = true;
            } else if (nextSequence.type === LevelSequenceType.LEVEL) {
                this.currentLevel = nextSequence.notes;
                this.currentLevelLoop = 1;
                this.updateLevelTextNormal(this.currentLevel);
                if (this.levelChangedCallback) {
                    this.levelChangedCallback(this.currentLevel, nextSequence.type);
                }
                startNewSequence(nextSequence);
            } else if (nextSequence.type === LevelSequenceType.FINISH) {
                // Handle finish sequence
                this.currentLevelLoop = 1;
                startNewSequence(nextSequence);
                this.updateLevelTextFinish();
            }
        }
        else {
            this.currentLevelLoop++;
            if (currentSequence.type === LevelSequenceType.LEVEL) {
                startNewSequence(currentSequence);
            }
        }
    }

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

        this.updateGameplayInteractableVisualize();
    }

    private updateLevelTextNormal(level: number): void {
        if (this.levelLabel) {
            this.levelLabel.string = "Level " + level.toString();
            // Set shadow color based on level
            if (level <= 3) {
                this.levelLabel.shadowColor = new Color(0, 0, 0, 255); // Black shadow for early levels
            } else if (level <= 6) {
                this.levelLabel.shadowColor = new Color(0, 0, 128, 255); // Navy blue for mid levels
            } else if (level <= 9) {
                this.levelLabel.shadowColor = new Color(128, 0, 128, 255); // Purple for higher levels
            } else {
                this.levelLabel.shadowColor = new Color(178, 34, 34, 255); // Firebrick red for top levels
            }
        }

        // Animate the level label with a scale tween
        if (this.levelLabel) {
            // Stop any existing tween
            Tween.stopAllByTarget(this.levelLabel.node);
            // Set initial scale
            this.levelLabel.node.setScale(new Vec3(1.5, 1.5, 1));
            // Create and play the scale animation
            tween(this.levelLabel.node)
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'bounceOut' })
                .start();
        }
    }

    private updateLevelTextFinish(): void {
        if (this.levelLabel) {
            this.levelLabel.string = "Finish Move";
            // Set shadow color for finish move to a vibrant gold/orange color
            this.levelLabel.shadowColor = new Color(255, 165, 0, 255); // Gold/Orange for finish move

            // Stop any existing tween
            Tween.stopAllByTarget(this.levelLabel.node);

            // Set initial scale
            this.levelLabel.node.setScale(new Vec3(1, 1, 1));

            // Create a looping scale animation
            tween(this.levelLabel.node)
                .to(0.5, { scale: new Vec3(1.2, 1.2, 1) })
                .to(0.5, { scale: new Vec3(1, 1, 1) })
                .union()
                .repeatForever()
                .start();
        }
    }
    //#endregion

    //#region Input Handling
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

    private handleAutoPlay(): void {
        if (!this.isAutoPlay || !this.isPlaying || this.isInPenalty) return;

        const currentTime = this.getCurrentTime();
        const beatInterval = (60000 / this.bpm) * this.beatsPerLoop;
        const timeSinceLastBeat = currentTime - this.lastBeatTime;
        const targetProgress = 1.0;
        const currentProgress = (timeSinceLastBeat) / (beatInterval);
        const distanceFromTarget = Math.abs(targetProgress - currentProgress);

        // Auto-play logic
        if (this.noteSequence.length > 0 && this.currentNotes < this.noteSequence.length) {
            // Auto-press the correct note
            const inputHandler = AuditionInputHandler.instance;
            if (inputHandler) {
                const noteType = this.noteSequence[this.currentNotes];
                if (noteType === AuditionNoteType.LEFT) {
                    inputHandler.simulateInput(AuditionInputType.LEFT, currentTime);
                } else if (noteType === AuditionNoteType.RIGHT) {
                    inputHandler.simulateInput(AuditionInputType.RIGHT, currentTime);
                }
            }
        }

        // Auto-press space at the right time
        if (distanceFromTarget <= this.timingWindows.get(AuditionAccuracyRating.PERFECT) / beatInterval) {
            const inputHandler = AuditionInputHandler.instance;
            if (inputHandler) {
                inputHandler.simulateInput(AuditionInputType.SPACE, currentTime);
            }
        }
    }
    //#endregion

    //#region Note Management
    private clearLastNotes() {
        // Recycle all active notes
        this.activeNoteIds.forEach(id => this.notePool.recycleNote(id));
        this.activeNoteIds = [];
        this.noteSequence = [];
        this.currentNotes = 0;
    }

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

    private isMiss(): boolean {
        return this.currentNotes < this.requiredNotes;
    }
    //#endregion

    //#region Visual Effects
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

    private updateGameplayInteractableVisualize() {
        if (!this.opacityGameplay) return;
        const isPlayable = !this.isInPenalty && this.isPlaying;
        this.opacityGameplay.opacity = isPlayable ? 255 : 50;
    }
    //#endregion

    //#region Public Interface
    public stopBeatSystem(): void {
        this.isPlaying = false;
        this.isAutoPlay = false;

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

    public setScoreCallback(callback: (rating: AuditionAccuracyRating) => void): void {
        this.scoringCallback = callback;
    }

    public setReadyCallback(callback: () => void): void {
        this.readyCallback = callback;
    }

    public setLevelChangedCallback(callback: (level: number, sequenceType: LevelSequenceType) => void): void {
        this.levelChangedCallback = callback;
    }

    public getBPM(): number {
        return this.bpm;
    }

    public setBPM(bpm: number): void {
        this.bpm = Math.max(60, Math.min(200, bpm));
        console.log(`BPM set to ${this.bpm}`);
    }

    public getBeatsPerLoop(): number {
        return this.beatsPerLoop;
    }

    public setBeatsPerLoop(beats: number): void {
        this.beatsPerLoop = Math.max(1, Math.min(8, beats));
        console.log(`Beats per loop set to ${this.beatsPerLoop}`);
    }

    public setAutoPlay(enabled: boolean): void {
        this.isAutoPlay = enabled;
        console.log(`Auto-play ${enabled ? 'enabled' : 'disabled'}`);
    }

    public isAutoPlayEnabled(): boolean {
        return this.isAutoPlay;
    }
    //#endregion
} 