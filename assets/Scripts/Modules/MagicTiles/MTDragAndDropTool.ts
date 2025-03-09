import { _decorator, Component, sys, assetManager, AudioClip, Asset, Node, game, director } from "cc";
import { MagicTilesAudioManager } from "./AudioManager";
import { GameplayManager, GameState } from "./GameplayManager";
import { BeatmapManager } from "./BeatmapManager";
import { Beatmap, BeatmapMetadata, BeatmapAudioData, TrackNoteInfo, NoteType } from "./MTDefines";
import { loadMidi, loadMidiFromURL } from "../../Common/MidiReader";

const { ccclass, property } = _decorator;

/**
 * Drag and Drop Tool for Magic Tiles 3
 * Allows users to drag and drop MIDI and audio files to quickly start a game
 */
@ccclass("MTDragAndDropTool")
export class MTDragAndDropTool extends Component {
    // Make the instance public static to allow initialization
    public static _instance: MTDragAndDropTool = null;

    // Temporary storage for drag-dropped files
    private _midiFile: File = null;
    private _audioFile: File = null;
    private _tempBeatmapId: string = null;
    private _notificationNode: Node = null;
    private _tempAssets: {
        audioClip: AudioClip;
        midiData: any;
        audioUUID: string;
        midiUUID: string;
    } = null;

    // Singleton pattern
    public static get instance(): MTDragAndDropTool {
        if (!this._instance) {
            this._instance = new MTDragAndDropTool();
        }
        return this._instance;
    }

    protected onLoad(): void {
        this.initialize();
    }

    /**
     * Initialize drag and drop event listeners
     */
    private initialize(): void {
        // Ensure we're in a browser environment
        if (!sys.isBrowser) {
            console.warn("MTDragAndDropTool: Drag and drop is only supported in browser environments");
            return;
        }

        // Add event listeners to the document body
        const body = document.body;

        body.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            body.classList.add('drag-over');
        });

        body.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            body.classList.remove('drag-over');
        });

        body.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            body.classList.remove('drag-over');

            this.handleFileDrop(e.dataTransfer.files);
        });

        console.log("MTDragAndDropTool: Initialized drag and drop handlers");
    }

    /**
     * Handle dropped files
     * @param files The files from the drop event
     */
    private handleFileDrop(files: FileList): void {
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Check file type
            if (file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi')) {
                this._midiFile = file;
                console.log("MTDragAndDropTool: MIDI file dropped:", file.name);
            }
            else if (file.name.toLowerCase().endsWith('.mp3') ||
                file.name.toLowerCase().endsWith('.wav') ||
                file.name.toLowerCase().endsWith('.ogg')) {
                this._audioFile = file;
                console.log("MTDragAndDropTool: Audio file dropped:", file.name);
            }
        }

        // Check if we have both files
        if (this._midiFile && this._audioFile) {
            console.log("MTDragAndDropTool: Both files received, processing...");
            this.processFiles();
        }
    }

    /**
     * Process the dropped files to create a temporary beatmap
     */
    private async processFiles(): Promise<void> {
        try {
            this.notifyNextStep("Processing files...");

            // Generate a temporary ID for this beatmap
            this._tempBeatmapId = `temp_${Date.now()}`;

            // Load the audio file as an AudioClip
            const audioURL = URL.createObjectURL(this._audioFile);
            const audioClip = await this.loadAudioFromURL(audioURL);

            // Load the MIDI file
            const midiURL = URL.createObjectURL(this._midiFile);
            const midiData = await loadMidiFromURL(midiURL);

            // Instead of referring to files in the resource system, we'll use cache directly
            // Create a UUID for our temporary assets
            const audioUUID = `temp_audio_${Date.now()}`;
            const midiUUID = `temp_midi_${Date.now()}`;

            // Store directly in the asset manager's cache using proper UUIDs
            assetManager.assets.add(audioUUID, audioClip);
            assetManager.assets.add(midiUUID, midiData);

            // Create a temporary beatmap metadata with direct references
            const tempMetadata: BeatmapMetadata = {
                id: this._tempBeatmapId,
                title: this._audioFile.name.replace(/\.[^/.]+$/, ""), // Remove extension
                artist: "Unknown Artist",
                bpm: midiData.tempo || 120,
                difficulty: 3,
                difficultyName: "Medium",
                level: 5,
                preview: {
                    start: 0,
                    end: 30
                },
                // Use the actual assets rather than paths that don't exist
                audioPath: null, // We'll override this in our implementation
                midiPath: null, // We'll override this in our implementation
                backgroundImage: "magic_tiles/images/default_background",
                coverImage: "magic_tiles/images/default_cover"
            };

            // Create a temporary JSON data for the beatmap
            const tempBeatmap: Beatmap = {
                metadata: tempMetadata,
                notes: [] // Will be generated from MIDI
            };

            // Process MIDI data to generate notes for the beatmap
            if (midiData && midiData.notes) {
                const trackNotes: TrackNoteInfo[] = [];
                for (const note of midiData.notes) {
                    trackNotes.push({
                        midi: note.midi || 97, // Default to lane 1 if not specified
                        time: note.time || 0,
                        duration: note.duration || 0,
                        durationTicks: note.durationTicks || 0,
                        velocity: note.velocity || 1,
                        lane: BeatmapManager.instance.getLandById(note.midi),
                        type: BeatmapManager.instance.getNoteType(note)
                    });
                }

                // Sort notes by time
                trackNotes.sort((a, b) => a.time - b.time);
                tempBeatmap.notes = trackNotes;
                console.log(`Processed ${tempBeatmap.notes.length} notes from MIDI data`);
            } else {
                console.warn("No valid MIDI tracks found in the file");
            }

            // Add the beatmap to the BeatmapManager
            const beatmapManager = BeatmapManager.instance;
            // Set the current beatmap for the audio manager
            const audioManager = MagicTilesAudioManager.instance;
            // Create a BeatmapAudioData object with our loaded assets
            const beatmapAudioData: BeatmapAudioData = {
                clip: audioClip,
                trackInfo: midiData,
                totalDuration: audioClip.getDuration(),
                currentTime: 0,
                isPlaying: false,
                isPaused: false
            };

            // Set the current beatmap in the audio manager
            audioManager.setCurrentBeatmap(beatmapAudioData);
            beatmapManager.addTempBeatmap(this._tempBeatmapId, tempBeatmap);

            // Store references to these assets in a way we can access them later
            // These will be used by our modified version of loadBeatmapAudioData
            this._tempAssets = {
                audioClip: audioClip,
                midiData: midiData,
                audioUUID: audioUUID,
                midiUUID: midiUUID
            };

            // Now patch the BeatmapManager's loadBeatmapAudioData method to handle our special case
            this.patchBeatmapManager();

            // Start the game
            this.startGame();
        } catch (error) {
            console.error("MTDragAndDropTool: Error processing files:", error);
            this.notifyNextStep("Error processing files. Please try again.");
            this.resetFiles();
        }
    }

    /**
     * Start a new game with the temporary beatmap
     */
    private startGame(): void {
        // Find the GameplayManager
        const gameplayManager = this.findGameplayManager();
        if (!gameplayManager) {
            console.error("MTDragAndDropTool: GameplayManager not found");
            this.notifyNextStep("Cannot start game. Please try loading files from the game menu.");
            return;
        }

        this.notifyNextStep("Starting game...");

        // Start the game with the temporary beatmap
        gameplayManager.resetGameState();
        gameplayManager.setGameState(GameState.LOADING);
        gameplayManager.tileManager.initGame();
        gameplayManager.createBeginningTile();

        // Reset files after starting
        this.resetFiles();
    }

    /**
     * Helper method to find the GameplayManager component
     */
    private findGameplayManager(): GameplayManager {
        return director.getScene().getComponentInChildren(GameplayManager);
    }

    /**
     * Load an audio file from URL into an AudioClip
     */
    private loadAudioFromURL(url: string): Promise<AudioClip> {
        return new Promise((resolve, reject) => {
            // Create an Audio element to load the file
            const audio = new Audio(url);

            audio.oncanplaythrough = () => {
                // Create an AudioClip
                const audioClip = new AudioClip();
                // Set the _nativeAsset directly (internal property)
                // @ts-ignore - Accessing private property
                audioClip._nativeAsset = audio;

                resolve(audioClip);
            };

            audio.onerror = (err) => {
                reject(new Error("Failed to load audio: " + err));
            };

            // Start loading
            audio.load();
        });
    }

    /**
     * Patch the BeatmapManager to handle our temporary assets
     */
    private patchBeatmapManager(): void {
        const originalLoadBeatmapAudioData = BeatmapManager.prototype.loadBeatmapAudioData;
        const tempAssets = this._tempAssets;
        const tempBeatmapId = this._tempBeatmapId;

        // Store the original method for later restoration
        BeatmapManager.prototype['originalLoadBeatmapAudioData'] = originalLoadBeatmapAudioData;
        // Override the loadBeatmapAudioData method to intercept calls for our temp beatmap
        BeatmapManager.prototype.loadBeatmapAudioData = async function (): Promise<BeatmapAudioData> {
            // Check if this is a request for our temp beatmap
            if (this.activeBeatmap && this.activeBeatmap.metadata.id === tempBeatmapId && tempAssets) {
                try {
                    // Create beatmap audio data using our cached assets
                    const audioManager = MagicTilesAudioManager.instance;

                    // Now directly use the in-memory instances we've already loaded
                    const beatmapAudioData = await audioManager.createBeatmapAudioDataFromAssets(
                        tempAssets.audioClip,
                        tempAssets.midiData
                    );

                    return beatmapAudioData;
                } catch (err) {
                    console.error("Error loading temporary beatmap audio:", err);
                    return null;
                }
            }

            // If not our temp beatmap, use the original method
            return originalLoadBeatmapAudioData.call(this);
        };
    }

    /**
     * Reset the stored files
     */
    private resetFiles(): void {
        this._midiFile = null;
        this._audioFile = null;
        this._tempBeatmapId = null;
        this._tempAssets = null;

        // Restore original BeatmapManager method if it was patched
        // This prevents memory leaks and unintended side effects
        this.unpatchBeatmapManager();
    }

    /**
     * Restore the original BeatmapManager method
     */
    private unpatchBeatmapManager(): void {
        // Only restore if we have a reference to the original
        // This check prevents errors if calling multiple times
        const origMethod = BeatmapManager.prototype['originalLoadBeatmapAudioData'];
        if (origMethod) {
            BeatmapManager.prototype.loadBeatmapAudioData = origMethod;
            delete BeatmapManager.prototype['originalLoadBeatmapAudioData'];
        }
    }

    /**
     * Show a notification about the next step
     */
    private notifyNextStep(message: string): void {
        console.log("MTDragAndDropTool: " + message);

        // Simple notification to the user - in a real implementation, 
        // this would connect to the UI manager to show a proper notification
        alert(message);
    }
}

// Initialize the singleton instance
MTDragAndDropTool._instance = new MTDragAndDropTool();