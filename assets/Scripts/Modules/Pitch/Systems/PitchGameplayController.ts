import { _decorator, Component, Node, Label, Sprite, Button, UITransform, Vec3, tween, Color, Animation, ParticleSystem2D, Prefab, instantiate, director, game, SpriteFrame, v2, Size } from 'cc';
import { PitchConstants, MusicalNote, FeedbackType, GameState, PitchAccuracy } from './PitchConstants';
import { PitchDetectionSystem } from './PitchDetectionSystem';
import { PitchCharacterAnimator } from './PitchCharacterAnimator';
import { PitchTimer } from './PitchTimer';
import { PitchUIManager } from '../UI/PitchUIManager';
import { PitchNoteSequence, PitchSequenceLibrary } from '../Data/PitchNoteSequence';
import { PitchTile } from '../UI/PitchTile';
import { PitchWaveform } from '../../GameCommon/Pitch/PitchWaveform';
const { ccclass, property } = _decorator;

/**
 * Pitch detection result interface
 */
interface PitchDetectionResult {
    frequency: number;
    note: MusicalNote | null;
    accuracy: PitchAccuracy;
    volume: number;
}

/**
 * Main controller for the Pitch Detection Game
 * Manages game flow, integrates all components, and handles user input
 */
@ccclass('PitchGameplayController')
export class PitchGameplayController extends Component {
    // Core components
    @property(PitchDetectionSystem)
    private detectionSystem: PitchDetectionSystem = null;

    @property(PitchCharacterAnimator)
    private characterAnimator: PitchCharacterAnimator = null;

    @property(PitchTimer)
    private timer: PitchTimer = null;

    @property(PitchWaveform)
    private waveformVisualizer: PitchWaveform = null;

    // UI Components
    @property({ type: Node, group: { name: "Gameplay UI", id: "gameplay" } })
    private musicalStaff: Node = null;

    @property({ type: [Node], group: { name: "Gameplay UI", id: "gameplay" } })
    private noteIndicators: Node[] = [];

    @property({ type: Node, group: { name: "Gameplay UI", id: "gameplay" } })
    private progressLine: Node = null;

    @property({ type: Node, group: { name: "Gameplay UI", id: "gameplay" } })
    private microphone: Node = null;

    @property({ type: PitchUIManager, group: { name: "Gameplay UI", id: "gameplay" } })
    private pitchUIManager: PitchUIManager = null;

    // Game state
    private gameState: GameState = GameState.INIT;
    private currentSequence: PitchNoteSequence = null;
    private totalNotesMatched: number = 0;
    private totalAccuracy: number = 0;
    private currentNoteIndex: number = 0;
    private currentNoteStartTime: number = 0;
    private currentNoteDuration: number = 0;
    private readonly PERFECT_DURATION_THRESHOLD: number = 0.8; // 95% of required duration for perfect score

    //#region Animation Properties
    private readonly PROGRESS_LINE_MOVE_DURATION: number = 0.5;
    //#endregion

    //#region Butterfly Properties
    @property({ type: Node, group: { name: "Gameplay UI", id: "gameplay" } })
    private butterfly: Node = null;

    @property({ type: Node, group: { name: "Gameplay UI", id: "gameplay" } })
    private butterflyCamera: Node = null;

    @property({ type: ParticleSystem2D, group: { name: "Feedback", id: "feedback" } })
    private butterflyParticles: ParticleSystem2D = null;

    private readonly BUTTERFLY_MOVE_DURATION: number = 1.0;
    private readonly BUTTERFLY_CAMERA_SPEED: number = 300; // pixels per second
    private butterflyTween: any = null;
    private butterflyTargetY: number = -150; // Default position at the bottom
    private isFirstNoteCorrect: boolean = false;
    private transNotes: UITransform[] = [];
    private noteYPositions: number[] = [];
    //#endregion

    //#region Scrolling Properties
    @property({ type: Prefab, group: { name: "Scrolling", id: "scrolling" } })
    private pitchTilePrefab: Prefab = null;

    @property({ type: Node, group: { name: "Scrolling", id: "scrolling" } })
    private scrollingContainer: Node = null;

    @property({ type: Number, group: { name: "Scrolling", id: "scrolling" } })
    private scrollSpeed: number = 100; // pixels per second

    @property({ type: Number, group: { name: "Scrolling", id: "scrolling" } })
    private tileStartX: number = 200; // Starting X position for new tiles

    private activeTiles: PitchTile[] = [];
    private tilePositions: { x: number, y: number }[] = [];
    private containerPosition: number = 0;
    private targetScrollingPositionX: number = 0;
    private isScrolling: boolean = false;
    private noteIndexToTileMap: Map<number, PitchTile> = new Map(); // Map to store note index to tile mapping
    private readonly SCROLL_SMOOTHING_FACTOR: number = 0.1; // Controls how quickly the scrolling position updates
    //#endregion


    onLoad() {
        // Initialize waveform visualization using the PitchWaveform component
        if (this.waveformVisualizer) {
            this.waveformVisualizer.initialize(this.microphone);
        }

        // Initialize PitchSequenceLibrary
        PitchSequenceLibrary.initialize();

        // Initialize note positions
        this.transNotes = this.noteIndicators.map(indicator => indicator.getComponent(UITransform));
        const noteHeight = this.transNotes[0].height;
        this.noteYPositions = this.noteIndicators.map(trans => {
            return trans.position.y + this.musicalStaff.position.y + noteHeight / 2;
        });
    }

    start() {
        // Set up event listeners
        this.setupEventListeners();
        // Show main menu initially
        this.startGame('sequence_1');
    }

    /**
     * Set up event listeners for game events
     */
    private setupEventListeners(): void {
        // Listen for pitch detection events
        this.detectionSystem.on(PitchConstants.EVENTS.PITCH_DETECTED, this.onPitchDetected, this);

        // Listen for timer events
        this.timer.on(PitchConstants.EVENTS.TIME_WARNING, this.onTimeWarning, this);
        this.timer.on(PitchConstants.EVENTS.GAME_OVER, this.onTimeUp, this);
    }

    /**
     * Extend the sequence to fill the game duration if needed
     * @param sequence Original sequence
     * @returns Extended sequence if needed, otherwise original sequence
     */
    private extendSequenceToFillDuration(sequence: PitchNoteSequence): PitchNoteSequence {
        const targetDuration = PitchConstants.GAME_DURATION;
        const currentDuration = sequence.getTotalDuration();

        // If sequence is already long enough, return it as is
        if (currentDuration >= targetDuration) {
            return sequence;
        }

        // Calculate how many additional seconds we need
        const remainingDuration = targetDuration - currentDuration;

        // Create extended notes array starting with original notes
        const extendedNotes: { note: MusicalNote, duration: number }[] = [...sequence.notes];

        // Generate random notes to fill remaining duration
        let currentTime = currentDuration;
        while (currentTime < targetDuration) {
            // Generate random note between Do (0) and Si (6)
            const randomNote = Math.floor(Math.random() * 7) as MusicalNote;

            // Generate random duration between 1 and 2 seconds
            const randomDuration = 1 + Math.random();

            // Add the random note
            extendedNotes.push({
                note: randomNote,
                duration: randomDuration
            });

            currentTime += randomDuration;
        }

        // Create new sequence with extended notes
        return new PitchNoteSequence(
            `${sequence.id}_extended`,
            `${sequence.name} (Extended)`,
            sequence.difficulty,
            extendedNotes
        );
    }

    /**
     * Start a new game with the specified sequence
     * @param sequenceId Sequence ID to play
     */
    public startGame(sequenceId: string): void {
        // Get the sequence
        const sequence = PitchSequenceLibrary.getSequenceById(sequenceId);
        if (!sequence) {
            console.error(`Sequence with ID ${sequenceId} not found`);
            return;
        }

        // Extend sequence if needed to fill game duration
        this.currentSequence = this.extendSequenceToFillDuration(sequence);

        // Reset game state
        this.totalNotesMatched = 0;
        this.totalAccuracy = 0;
        this.currentNoteIndex = 0;
        this.isScrolling = false;
        this.containerPosition = 0;

        // Initialize UI
        this.pitchUIManager.showGameplay(this.currentSequence);

        // Initialize note indicators
        this.setupNoteIndicators();

        // Initialize scrolling system
        this.initializeScrolling();

        // Initialize detection system
        this.detectionSystem.initialize()
            .then(() => {
                return this.detectionSystem.requestMicrophoneAccess();
            })
            .then((success) => {
                if (success) {
                    this.gameState = GameState.WAIT_FOR_FIRST_NOTE;
                    // Start detection
                    this.detectionSystem.startDetection();
                    console.log('Game started, waiting for first note');
                } else {
                    console.error('Failed to access microphone');
                    // TODO: Show error message to user
                }
            })
            .catch((error) => {
                console.error('Error starting game:', error);
                // TODO: Show error message to user
            });
    }

    /**
     * Pause the game
     */
    public pauseGame(): void {
        if (this.gameState !== GameState.PLAYING) return;

        this.gameState = GameState.PAUSED;

        // Pause timer
        this.timer.pauseTimer();

        // Pause detection
        this.detectionSystem.stopDetection();

        // Pause scrolling
        this.isScrolling = false;

        console.log('Game paused');
    }

    /**
     * Resume the game
     */
    public resumeGame(): void {
        if (this.gameState !== GameState.PAUSED) return;

        this.gameState = GameState.PLAYING;

        // Resume timer
        this.timer.resumeTimer();

        // Resume detection
        this.detectionSystem.startDetection();

        // Resume scrolling
        this.isScrolling = true;

        console.log('Game resumed');
    }

    /**
     * End the game
     * @param success Whether the player completed the sequence successfully
     */
    public endGame(success: boolean): void {
        this.gameState = GameState.GAME_OVER;

        // Stop timer
        this.timer.stopTimer();

        // Stop detection
        this.detectionSystem.stopDetection();

        // Stop scrolling
        this.stopScrolling();

        // Calculate accuracy
        const accuracy = this.totalNotesMatched > 0
            ? (this.totalAccuracy / this.totalNotesMatched) * 100
            : 0;

        // Show results
        this.pitchUIManager.showResults(
            success,
            this.timer.getRemainingTime(),
            accuracy
        );

        console.log(`Game ended. Success: ${success}, Accuracy: ${accuracy.toFixed(2)}%`);
    }

    /**
     * Start calibration process
     */
    public startCalibration(): void {
        this.gameState = GameState.CALIBRATING;

        // Show calibration UI
        this.pitchUIManager.showCalibration();

        // Initialize detection system
        this.detectionSystem.initialize()
            .then(() => {
                return this.detectionSystem.requestMicrophoneAccess();
            })
            .then((success) => {
                if (success) {
                    // Start calibration
                    this.detectionSystem.startCalibration((success) => {
                        if (success) {
                            console.log('Calibration completed successfully');
                            // Return to main menu
                            this.pitchUIManager.showMainMenu();
                            this.gameState = GameState.INIT;
                        } else {
                            console.error('Calibration failed');
                            // TODO: Show error message to user
                        }
                    });
                } else {
                    console.error('Failed to access microphone');
                    // TODO: Show error message to user
                }
            })
            .catch((error) => {
                console.error('Error starting calibration:', error);
                // TODO: Show error message to user
            });
    }

    /**
     * Handle pitch detection event
     * @param result Pitch detection result
     */
    private onPitchDetected(result: PitchDetectionResult): void {
        if (this.gameState !== GameState.PLAYING && this.gameState !== GameState.WAIT_FOR_FIRST_NOTE) return;

        // Update waveform visualization using the PitchWaveform component
        if (this.waveformVisualizer) {
            this.waveformVisualizer.updateWaveformVisualization(result.volume, result.frequency, this.detectionSystem);
        }

        // Update UI with current note
        this.pitchUIManager.updateCurrentNoteLabel(result.note);

        // Move butterfly to indicate current pitch
        this.moveButterfly(result.note, result.volume, result.frequency);

        // Check if the detected note matches the target note
        const targetNote = this.getCurrentTargetNote();

        if (targetNote !== null && result.note === targetNote) {
            // If we're waiting for the first note, start the game
            if (this.gameState === GameState.WAIT_FOR_FIRST_NOTE) {
                this.transitionToPlaying();
                console.log('First note matched, starting timer');
            }

            const addedTime = game.totalTime / 1000 - this.currentNoteStartTime;
            this.currentNoteStartTime = game.totalTime / 1000;
            // Update duration
            this.currentNoteDuration += addedTime;

            // Update target scrolling position based on current note duration
            const requiredDuration = this.currentSequence.notes[this.currentNoteIndex].duration;
            const progress = this.currentNoteDuration / requiredDuration;
            // Get the current note's position from tilePositions
            const currentNotePosX = this.tilePositions[this.currentNoteIndex]?.x || 0;
            // Calculate how far we should scroll based on the note duration and progress
            const scrollDistance = requiredDuration * this.scrollSpeed * progress;
            // Set target position to move the note towards the left
            this.targetScrollingPositionX = -currentNotePosX - scrollDistance;

            // Check if we've held the note long enough
            if (this.currentNoteDuration >= requiredDuration) {
                this.updateDurationProgress(1.0);
                this.currentNoteDuration = 0;
                this.onNoteMatched(result.note, this.calculateDurationAccuracy(requiredDuration));
            } else {
                // Update visual feedback for duration progress
                this.updateDurationProgress(this.currentNoteDuration / requiredDuration);
            }
        } else {
            this.currentNoteStartTime = game.totalTime / 1000
            // Reset note holding if wrong note is played
            this.targetScrollingPositionX = this.containerPosition; // Keep current position when wrong note
        }
    }

    private calculateDurationAccuracy(requiredDuration: number): PitchAccuracy {
        const durationRatio = this.currentNoteDuration / requiredDuration;
        if (durationRatio >= this.PERFECT_DURATION_THRESHOLD) {
            return PitchAccuracy.PERFECT;
        }

        return PitchAccuracy.GOOD;
    }

    private updateDurationProgress(progress: number): void {
        // Update visual feedback for duration progress using the map
        const currentTile = this.noteIndexToTileMap.get(this.currentNoteIndex);
        if (currentTile) {
            currentTile.updateDurationProgress(progress);
        }
    }

    /**
     * Handle note matched event
     * @param note Matched note
     * @param accuracy Detection accuracy
     */
    private onNoteMatched(note: MusicalNote, accuracy: PitchAccuracy): void {
        // Play character animation
        this.characterAnimator.playNoteAnimation(note, accuracy);

        // Show feedback
        let feedbackType: FeedbackType;
        switch (accuracy) {
            case PitchAccuracy.PERFECT:
                feedbackType = FeedbackType.PERFECT;
                break;
            case PitchAccuracy.GOOD:
                feedbackType = FeedbackType.GOOD;
                break;
            default:
                feedbackType = FeedbackType.MISS;
        }

        this.pitchUIManager.showFeedback(feedbackType);

        // Update accuracy tracking
        this.totalNotesMatched++;
        this.totalAccuracy += accuracy === PitchAccuracy.PERFECT ? 1.0 :
            accuracy === PitchAccuracy.GOOD ? 0.7 : 0.3;

        // Advance progress
        this.advanceProgressLine();

        // Check if there are more notes
        const hasMoreNotes = this.advanceToNextNote();
        if (!hasMoreNotes) {
            // Sequence complete
            this.endGame(true);
        }
    }

    /**
     * Transition to playing state
     */
    private transitionToPlaying(): void {
        this.gameState = GameState.PLAYING;
        this.timer.startTimer();
        // Don't start scrolling immediately, wait for first note to be held
        this.isScrolling = true;
        // Activate the current tile
        if (this.activeTiles.length > 0) {
            this.activeTiles[0].setActive(true);
        }
    }

    private checkNoteDuration(note: MusicalNote): boolean {
        if (!this.currentSequence || this.currentNoteIndex >= this.currentSequence.notes.length) {
            return false;
        }

        const currentNote = this.currentSequence.notes[this.currentNoteIndex];
        if (currentNote.note !== note) {
            return false;
        }

        // Check if we've held the note for the required duration
        return this.currentNoteDuration >= currentNote.duration;
    }

    /**
     * Handle time warning event
     * @param remainingTime Remaining time in seconds
     */
    private onTimeWarning(remainingTime: number): void {
        if (this.gameState !== GameState.PLAYING) return;

        // Show time warning
        this.pitchUIManager.showTimeWarning(remainingTime);
    }

    /**
     * Handle time up event
     */
    private onTimeUp(): void {
        if (this.gameState !== GameState.PLAYING) return;

        // End game with failure
        this.endGame(false);
    }

    /**
     * Update method called every frame
     * @param dt Delta time
     */
    update(dt: number): void {
        if (this.gameState !== GameState.PLAYING) return;

        // Update timer display
        this.pitchUIManager.updateTimer(this.timer.getRemainingTime());

        // Update scrolling
        this.updateScrolling(dt);

        // Update butterfly camera movement after first correct note
        if (this.isFirstNoteCorrect && this.butterflyCamera) {
            const currentPos = this.butterflyCamera.position;
            this.butterflyCamera.setPosition(new Vec3(
                currentPos.x + this.BUTTERFLY_CAMERA_SPEED * dt,
                currentPos.y,
                currentPos.z
            ));
        }

        // Update butterfly Y position smoothly
        if (this.butterfly) {
            const currentPos = this.butterfly.position;
            const newY = currentPos.y + (this.butterflyTargetY - currentPos.y) * dt * 2.0;
            this.butterfly.setPosition(new Vec3(currentPos.x, newY, currentPos.z));
        }
    }

    /**
     * Return to the main menu
     */
    public returnToMainMenu(): void {
        // Stop any ongoing game
        if (this.gameState === GameState.PLAYING || this.gameState === GameState.PAUSED) {
            this.timer.stopTimer();
            this.detectionSystem.stopDetection();
            this.stopScrolling();
        }

        // Reset game state
        this.gameState = GameState.INIT;
        this.currentSequence = null;
        this.currentNoteIndex = 0;
        this.totalNotesMatched = 0;
        this.totalAccuracy = 0;

        // Show main menu
        this.pitchUIManager.showMainMenu();
    }

    /**
     * Restart the current game
     */
    public restartGame(): void {
        if (!this.currentSequence) return;

        // Stop current game
        if (this.gameState === GameState.PLAYING || this.gameState === GameState.PAUSED) {
            this.timer.stopTimer();
            this.detectionSystem.stopDetection();
            this.stopScrolling();
        }

        // Start a new game with the same sequence
        this.startGame(this.currentSequence.id);
    }

    onDestroy() {
        // Clean up event listeners
        this.detectionSystem.off(PitchConstants.EVENTS.PITCH_DETECTED, this.onPitchDetected, this);
        this.timer.off(PitchConstants.EVENTS.TIME_WARNING, this.onTimeWarning, this);
        this.timer.off(PitchConstants.EVENTS.GAME_OVER, this.onTimeUp, this);

        // Stop detection and timer
        // this.detectionSystem.stopDetection();
        // this.timer.stopTimer();

        // // Clear tiles
        // this.clearTiles();
    }

    //#region Butterfly Management
    private moveButterfly(note: MusicalNote | null, volume: number, frequency: number = 0): void {
        if (!this.butterfly || !this.noteIndicators || !this.butterflyCamera) return;

        // Cancel any existing tween
        if (this.butterflyTween) {
            this.butterflyTween.stop();
            this.butterflyTween = null;
        }

        // Calculate target position based on note or frequency
        let targetY = -150; // Default position at the bottom

        if (note !== null) {
            // Use the note indicator's position for the target note
            if (note >= 0 && note < this.noteIndicators.length) {
                const indicator = this.noteIndicators[note];
                if (indicator && indicator.active) {
                    targetY = this.noteYPositions[note];
                }
            }

            // Activate butterfly particles
            if (this.butterflyParticles) {
                this.butterflyParticles.enabled = true;
                this.butterflyParticles.emissionRate = volume * 100;
            }
        } else {
            // When no note is detected, use frequency to determine position
            const lowestNote = 0; // DO
            const highestNote = 6; // SI

            if (this.noteIndicators[lowestNote] && this.noteIndicators[highestNote]) {
                const lowestY = this.noteYPositions[lowestNote] - 100.0;
                const highestY = this.noteYPositions[highestNote] + 100.0;

                // Get the frequency range for musical notes (approximately 261.63 Hz to 493.88 Hz for C4 to B4)
                const minFreq = 247.22; // C4 (DO)
                const maxFreq = 523.25; // B4 (SI)

                // Normalize frequency to a value between 0 and 1, clamping to valid range
                const normalizedFreq = Math.max(0, Math.min(1, (frequency - minFreq) / (maxFreq - minFreq)));

                // Interpolate between lowest and highest positions
                targetY = lowestY + (highestY - lowestY) * normalizedFreq;
            }

            // Disable butterfly particles
            if (this.butterflyParticles) {
                this.butterflyParticles.enabled = false;
            }
        }

        // Update butterfly target Y position
        this.butterflyTargetY = targetY;

        // If this is the first correct note, move butterfly to center
        if (!this.isFirstNoteCorrect && note === this.getCurrentTargetNote()) {
            this.isFirstNoteCorrect = true;
            // Move butterfly to center
            tween(this.butterfly)
                .to(this.BUTTERFLY_MOVE_DURATION, { position: new Vec3(0, targetY, -20.0) }, {
                    easing: 'cubicOut'
                })
                .start();
        }
    }
    //#endregion

    //#region Scrolling Management
    private initializeScrolling(): void {
        if (!this.currentSequence || !this.scrollingContainer) return;

        // Clear existing tiles
        this.clearTiles();

        // Reset container position
        this.containerPosition = 0;
        this.scrollingContainer.setPosition(new Vec3(0, 0, 0));

        // Create initial tiles
        const notes = this.currentSequence.notes;
        for (let i = 0; i < notes.length; i++) {
            this.createTile(notes[i], i);
        }

        this.isScrolling = false;
        this.currentNoteStartTime = 0;
    }

    private createTile(noteData: { note: MusicalNote, duration: number }, index: number): void {
        if (!this.pitchTilePrefab || !this.scrollingContainer) return;

        const tileNode = instantiate(this.pitchTilePrefab);
        this.scrollingContainer.addChild(tileNode);

        const tile = tileNode.getComponent(PitchTile);
        if (tile) {
            // Initialize tile with basic properties
            tile.initialize(
                noteData.note,
                noteData.duration,
                this.scrollSpeed
            );

            // Calculate x position based on previous tile
            let xPosition = this.tileStartX;
            if (index > 0 && this.tilePositions.length > 0) {
                const previousTile = this.activeTiles[index - 1];
                const previousTilePos = this.tilePositions[index - 1];
                // Position the new tile right after the previous tile's duration
                xPosition = previousTilePos.x + (previousTile.getDuration() * this.scrollSpeed);
            }

            // Calculate y position based on the note
            const yPosition = this.noteIndicators[noteData.note].position.y;
            this.tilePositions.push({ x: xPosition, y: yPosition });

            // Set initial position
            tileNode.setPosition(new Vec3(xPosition, yPosition, 0));

            this.activeTiles.push(tile);
            this.noteIndexToTileMap.set(index, tile);
        }
    }

    private clearTiles(): void {
        for (const tile of this.activeTiles) {
            if (tile && tile.node) {
                tile.node.destroy();
            }
        }
        this.activeTiles = [];
        this.tilePositions = [];
        this.noteIndexToTileMap.clear();
    }

    private updateScrolling(deltaTime: number): void {
        if (!this.isScrolling || !this.scrollingContainer) return;
        // Only scroll if we're holding the correct note
        // Smoothly interpolate to target position
        this.containerPosition += (this.targetScrollingPositionX - this.containerPosition) * this.SCROLL_SMOOTHING_FACTOR;
        this.scrollingContainer.setPosition(new Vec3(this.containerPosition, 0, 0));
    }

    private stopScrolling(): void {
        this.isScrolling = false;

        // Deactivate all tiles
        for (const tile of this.activeTiles) {
            if (tile) {
                tile.setActive(false);
            }
        }
    }

    private advanceToNextNote(): boolean {
        if (!this.currentSequence) return false;

        this.currentNoteIndex++;

        // Check if there are more notes
        if (this.currentNoteIndex < this.currentSequence.notes.length) {
            // Update UI for the next note
            this.pitchUIManager.updateTargetNoteLabel(this.getCurrentTargetNote());
            this.highlightNoteIndicator(this.currentSequence.notes[this.currentNoteIndex].note);

            // Activate the next tile if it exists in the map
            const nextTile = this.noteIndexToTileMap.get(this.currentNoteIndex);
            if (nextTile) {
                nextTile.setActive(true);
            }

            return true;
        } else {
            // Sequence complete
            this.stopScrolling();
            return false;
        }
    }

    private advanceProgressLine(): void {
        if (!this.progressLine || !this.currentSequence) return;

        // Calculate progress percentage
        const totalNotes = this.currentSequence.notes.length;
        const progress = (this.currentNoteIndex + 1) / totalNotes;

        // Calculate target position
        const startX = -200;
        const endX = 200;
        const targetX = startX + (endX - startX) * progress;

        // Create tween to move progress line
        const currentPos = this.progressLine.position;
        tween(this.progressLine)
            .to(this.PROGRESS_LINE_MOVE_DURATION, { position: new Vec3(targetX, currentPos.y, currentPos.z) }, {
                easing: 'cubicOut'
            })
            .start();
    }

    /**
     * Get the current target note
     */
    public getCurrentTargetNote(): MusicalNote | null {
        if (!this.currentSequence || this.currentNoteIndex >= this.currentSequence.notes.length) {
            return null;
        }

        return this.currentSequence.notes[this.currentNoteIndex].note;
    }

    public getCurrentSequence(): PitchNoteSequence | null {
        return this.currentSequence;
    }

    /**
     * Get the current game state
     */
    public getGameState(): GameState {
        return this.gameState;
    }

    /**
     * Get the current note index
     */
    public getCurrentNoteIndex(): number {
        return this.currentNoteIndex;
    }

    /**
     * Get the total number of notes in the current sequence
     */
    public getTotalNotes(): number {
        return this.currentSequence ? this.currentSequence.notes.length : 0;
    }
    //#endregion

    //#region Note Indicators Management
    private setupNoteIndicators(): void {
        if (!this.noteIndicators) return;

        const sequence = this.getCurrentSequence();
        if (!sequence) return;

        // Hide all note indicators initially
        for (const indicator of this.noteIndicators) {
            indicator.active = false;
        }

        // Show indicators for notes in the sequence
        const notes = sequence.notes;
        for (let i = 0; i < notes.length && i < this.noteIndicators.length; i++) {
            const noteValue = notes[i].note;
            if (noteValue >= 0 && noteValue < this.noteIndicators.length) {
                this.noteIndicators[noteValue].active = true;
            }
        }

        // Highlight the first note
        this.highlightNoteIndicator(notes[0].note);
    }

    public highlightNoteIndicator(note: MusicalNote): void {
        if (!this.noteIndicators) return;

        // Reset all indicators to normal state
        for (let i = 0; i < this.noteIndicators.length; i++) {
            const indicator = this.noteIndicators[i];
            if (indicator && indicator.active) {
                const sprite = indicator.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(255, 255, 255, 0);
                }
            }
        }

        // Highlight the target note
        if (note >= 0 && note < this.noteIndicators.length) {
            const indicator = this.noteIndicators[note];
            if (indicator && indicator.active) {
                const sprite = indicator.getComponent(Sprite);
                if (sprite) {
                    sprite.color = new Color(255, 255, 0, 125); // Yellow highlight
                }
            }
        }
    }
    //#endregion
}
