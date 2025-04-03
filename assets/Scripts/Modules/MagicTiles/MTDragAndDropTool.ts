import { _decorator, Component, sys, assetManager, AudioClip, Asset, Node, game, director, Label } from "cc";
import { MagicTilesAudioManager } from "./AudioManager";
import { MTGameplayManager, GameState } from "./MTGameplayManager";
import { BeatmapManager } from "./BeatmapManager";
import { Beatmap, BeatmapMetadata, BeatmapAudioData, TrackNoteInfo, NoteType } from "./MTDefines";
import { loadMidi, loadMidiFromURL } from "../../Common/MidiReader";
import { resourceUtil } from "../../Common/resourceUtil";

const { ccclass, property } = _decorator;

/**
 * Drag and Drop Tool for Magic Tiles 3
 * Allows users to drag and drop MIDI and audio files to quickly start a game
 */
@ccclass("MTDragAndDropTool")
export class MTDragAndDropTool extends Component {
    // Singleton instance
    private static _instance: MTDragAndDropTool = null;

    @property(Node)
    notificationNode: Node = null;

    @property(Label)
    notificationLabel: Label = null;

    // Temporary storage for drag-dropped files
    private _midiFile: File = null;
    private _audioFile: File = null;
    private _tempBeatmapId: string = null;
    private _tempAssets: {
        audioClip: AudioClip;
        midiData: any;
        audioUUID: string;
        midiUUID: string;
    } = null;

    // Overlay element for drag visual feedback
    private _dropOverlay: HTMLDivElement = null;

    // Singleton pattern
    public static get instance(): MTDragAndDropTool {
        return this._instance;
    }

    protected onLoad(): void {
        // Set the singleton instance
        MTDragAndDropTool._instance = this;
        this.createDragOverlay();
        this.initialize();
    }

    protected onDestroy(): void {
        // Clean up the overlay if it exists
        if (this._dropOverlay && this._dropOverlay.parentNode) {
            this._dropOverlay.parentNode.removeChild(this._dropOverlay);
        }
        
        // Release the singleton instance if it's this component
        if (MTDragAndDropTool._instance === this) {
            MTDragAndDropTool._instance = null;
        }
    }

    /**
     * Create a visual overlay for drag feedback
     */
    private createDragOverlay(): void {
        if (!sys.isBrowser) return;

        // Create the overlay element
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 100, 255, 0.3)';
        overlay.style.display = 'none';
        overlay.style.zIndex = '9999';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.fontSize = '24px';
        overlay.style.color = 'white';
        overlay.style.textShadow = '0 0 5px black';
        overlay.innerHTML = '<div style="background: rgba(0,0,0,0.7); padding: 20px; border-radius: 10px;">Drop MIDI and Audio files here<br><small>(Need both files to start)</small></div>';

        document.body.appendChild(overlay);
        this._dropOverlay = overlay;
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
            if (this._dropOverlay) {
                this._dropOverlay.style.display = 'flex';
            }
        });

        body.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Check if we're actually leaving the document body
            const rect = body.getBoundingClientRect();
            if (e.clientX <= rect.left || e.clientX >= rect.right ||
                e.clientY <= rect.top || e.clientY >= rect.bottom) {
                if (this._dropOverlay) {
                    this._dropOverlay.style.display = 'none';
                }
            }
        });

        body.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this._dropOverlay) {
                this._dropOverlay.style.display = 'none';
            }

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

        let midiFound = false;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Check file type - now only looking for MIDI files
            if (file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi')) {
                this._midiFile = file;
                midiFound = true;
                console.log("MTDragAndDropTool: MIDI file dropped:", file.name);
                break; // Stop after finding the first MIDI file
            }
        }

        // Provide feedback about what files we have
        if (midiFound) {
            this.notifyNextStep("MIDI file received! Processing...");
            // Schedule processing on the next frame to not block
            this.scheduleOnce(() => {
                this.processFiles();
            }, 0);
        } else {
            this.notifyNextStep("Please drop a MIDI file (.mid/.midi).");
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

            // Get the base name of the MIDI file (without extension)
            const midiFileName = this._midiFile.name.replace(/\.(mid|midi)$/i, "");
            
            // Construct audio resource path using the MIDI file name
            const audioResourcePath = `magic_tiles/audios/${midiFileName}`;
            console.log(`Attempting to load audio from resources: ${audioResourcePath}`);
            
            // Load audio from resources
            let audioClip: AudioClip;
            try {
                audioClip = await this.loadAudioFromResources(audioResourcePath);
                console.log("Successfully loaded audio from resources:", audioClip.name);
            } catch (error) {
                console.error(`Failed to load audio resource at ${audioResourcePath}:`, error);
                this.notifyNextStep(`Could not find matching audio file in resources. Please ensure audio file "${midiFileName}.mp3" exists in magic_tiles/audios folder.`);
                this.resetFiles();
                return;
            }

            // Load the MIDI file
            const midiURL = URL.createObjectURL(this._midiFile);
            const midiData = await loadMidiFromURL(midiURL);

            // Create a temporary beatmap metadata with direct references
            const tempMetadata: BeatmapMetadata = {
                id: this._tempBeatmapId,
                title: midiFileName, // Use MIDI filename without extension
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
                let notes: TrackNoteInfo[] = [];
                notes = BeatmapManager.instance.convertNotes(midiData.notes, notes);
                tempBeatmap.notes = notes;
                console.log(`Processed ${tempBeatmap.notes.length} notes from MIDI data`);
            } else {
                console.warn("No valid MIDI tracks found in the file");
                this.notifyNextStep("MIDI file doesn't contain valid note data. Please try another file.");
                this.resetFiles();
                return;
            }

            // Add the beatmap to the BeatmapManager
            const beatmapManager = BeatmapManager.instance;
            
            // Set the current beatmap for the audio manager
            const audioManager = MagicTilesAudioManager.instance;
            
            // Debug the audio clip to check its properties
            console.log("AudioClip details:", {
                name: audioClip.name,
                duration: audioClip.getDuration(),
                isValid: audioClip.loaded,
                type: typeof audioClip._nativeAsset
            });
            
            // Create a BeatmapAudioData object with our loaded assets
            const beatmapAudioData: BeatmapAudioData = {
                clip: audioClip,
                trackInfo: midiData,
                totalDuration: audioClip.getDuration() || 180, // Default to 3 minutes if duration is not available
                currentTime: 0,
                isPlaying: false,
                isPaused: false
            };

            // Set the current beatmap in the audio manager
            audioManager.setCurrentBeatmap(beatmapAudioData);
            beatmapManager.addTempBeatmap(this._tempBeatmapId, tempBeatmap);

            // Start the game
            this.startGame();
        } catch (error) {
            console.error("MTDragAndDropTool: Error processing files:", error);
            this.notifyNextStep("Error processing files: " + error.message);
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
    private findGameplayManager(): MTGameplayManager {
        return director.getScene().getComponentInChildren(MTGameplayManager);
    }

    /**
     * Load an audio file from resources
     */
    private loadAudioFromResources(path: string): Promise<AudioClip> {
        return new Promise((resolve, reject) => {
            // Use the utility function to load from resources
            resourceUtil.loadRes(path, AudioClip, (err, audioClip: AudioClip) => {
                if (err) {
                    console.error("Failed to load audio from resources:", err);
                    reject(err);
                    return;
                }
                
                // Check if we have a valid AudioClip
                if (!audioClip || !(audioClip instanceof AudioClip)) {
                    console.error("Invalid AudioClip received:", audioClip);
                    reject("Invalid AudioClip received");
                } else {
                    console.log("Successfully loaded AudioClip from resources:", audioClip);
                    resolve(audioClip);
                }
            });
        });
    }

    /**
     * Reset the stored files
     */
    private resetFiles(): void {
        // Release object URLs if they exist
        if (this._midiFile) URL.revokeObjectURL(URL.createObjectURL(this._midiFile));
        
        this._midiFile = null;
        this._tempBeatmapId = null;
        this._tempAssets = null;
    }

    /**
     * Show a notification about the next step
     */
    private notifyNextStep(message: string): void {
        console.log("MTDragAndDropTool: " + message);

        // If we have a notification node with label, use it
        if (this.notificationNode && this.notificationLabel) {
            this.notificationNode.active = true;
            this.notificationLabel.string = message;
            
            // Hide after a few seconds
            this.scheduleOnce(() => {
                this.notificationNode.active = false;
            }, 3);
        } else {
            // Fallback notification - use a custom overlay instead of alert
            this.showTemporaryNotification(message);
        }
    }

    /**
     * Show a temporary HTML notification when the Cocos UI isn't available
     */
    private showTemporaryNotification(message: string): void {
        if (!sys.isBrowser) return;
        
        // Create a simple notification element
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '10000';
        notification.innerText = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}