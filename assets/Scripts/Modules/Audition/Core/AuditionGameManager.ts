import { _decorator, Component, director, game, sys } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Enum representing the current game state
 */
enum GameState {
    MENU,
    SONG_SELECTION,
    LOADING,
    PLAYING,
    RESULTS
}

/**
 * Interface for song data
 */
interface SongData {
    id: string;
    title: string;
    artist: string;
    difficulty: number;
    bpm: number;
    audioPath: string;
    beatmapPath: string;
    previewStart: number; // Start time for preview (ms)
    previewEnd: number;   // End time for preview (ms)
}

/**
 * Interface for player progress
 */
interface PlayerProgress {
    unlockedSongs: string[];
    highScores: Record<string, number>;
    experience: number;
}

/**
 * Main game manager for Audition module
 * Handles game state, scene transitions, and player progress
 */
@ccclass('AuditionGameManager')
export class AuditionGameManager extends Component {
    // Singleton instance
    private static _instance: AuditionGameManager = null;
    
    // Current scene and game state
    @property
    private currentScene: string = 'AuditionMainMenu';
    private gameState: GameState = GameState.MENU;
    
    // Current song and player progress
    private currentSong: SongData = null;
    private playerProgress: PlayerProgress = {
        unlockedSongs: ['song1', 'song2'], // Default unlocked songs
        highScores: {},
        experience: 0
    };

    // Track the last experience gain from a song
    private lastExperienceGain: number = 0;

    // Available songs in the game
    private availableSongs: SongData[] = [
        {
            id: 'song1',
            title: 'Rhythm of Dreams',
            artist: 'Beat Master',
            difficulty: 1,
            bpm: 120,
            audioPath: 'audition/audio/rhythm_of_dreams',
            beatmapPath: 'audition/beatmaps/rhythm_of_dreams',
            previewStart: 30000,
            previewEnd: 45000
        },
        {
            id: 'song2',
            title: 'Dance Revolution',
            artist: 'Step Pro',
            difficulty: 2,
            bpm: 140,
            audioPath: 'audition/audio/dance_revolution',
            beatmapPath: 'audition/beatmaps/dance_revolution',
            previewStart: 15000,
            previewEnd: 30000
        }
    ];

    // Singleton pattern implementation
    public static get instance(): AuditionGameManager {
        return this._instance;
    }

    onLoad() {
        // Make this a singleton
        if (AuditionGameManager._instance === null) {
            AuditionGameManager._instance = this;
            game.addPersistRootNode(this.node);
            this.initGame();
        } else {
            this.node.destroy();
        }
    }

    /**
     * Initialize game components and load player data
     */
    private initGame(): void {
        // Load saved progress
        this.loadProgress();
        
        // Log initialization
        console.log('Audition Game Manager initialized');
    }

    /**
     * Change to a different scene
     * @param sceneName The name of the scene to load
     */
    public changeScene(sceneName: string): void {
        console.log(`Changing scene to: ${sceneName}`);
        director.loadScene(sceneName);
        this.currentScene = sceneName;
    }

    /**
     * Start playing a selected song
     * @param songId ID of the song to play
     */
    public startSong(songId: string): void {
        this.gameState = GameState.LOADING;
        console.log(`Starting song: ${songId}`);
        
        // Find the song data
        const songData = this.availableSongs.find(song => song.id === songId);
        if (!songData) {
            console.error(`Song with id ${songId} not found`);
            return;
        }
        
        this.currentSong = songData;
        
        // TODO: Load song data and beatmap
        // For now, just transition to gameplay scene
        this.gameState = GameState.PLAYING;
        this.changeScene('AuditionGameplay');
    }

    /**
     * End song and show results
     * @param score The player's score
     * @param maxCombo The player's maximum combo
     */
    public endSong(score: number, maxCombo: number): void {
        if (!this.currentSong) {
            console.error('No song is currently active');
            return;
        }
        
        this.gameState = GameState.RESULTS;
        console.log(`Song ended. Score: ${score}, Max Combo: ${maxCombo}`);
        
        // Update high score if needed
        if (!this.playerProgress.highScores[this.currentSong.id] || 
            score > this.playerProgress.highScores[this.currentSong.id]) {
            this.playerProgress.highScores[this.currentSong.id] = score;
            console.log(`New high score for ${this.currentSong.title}: ${score}`);
        }
        
        // Calculate experience gained (based on score and difficulty)
        const expMultiplier = this.currentSong.difficulty * 0.5;
        this.lastExperienceGain = Math.floor(score * 0.01 * expMultiplier);
        
        // Add experience
        this.addExperience(this.lastExperienceGain);
        
        // Save progress
        this.saveProgress();
        
        // Change to results scene
        this.changeScene('AuditionResults');
    }

    /**
     * Get current song data
     * @returns The current song data or null if no song is active
     */
    public getCurrentSong(): SongData {
        return this.currentSong;
    }

    /**
     * Get player's high score for a song
     * @param songId The song ID
     * @returns The high score or 0 if no high score exists
     */
    public getHighScore(songId: string): number {
        return this.playerProgress.highScores[songId] || 0;
    }

    /**
     * Get all available songs
     * @returns Array of song data
     */
    public getAvailableSongs(): SongData[] {
        return this.availableSongs;
    }

    /**
     * Get player's unlocked songs
     * @returns Array of unlocked song IDs
     */
    public getUnlockedSongs(): string[] {
        return this.playerProgress.unlockedSongs;
    }

    /**
     * Check if a song is unlocked
     * @param songId The song ID to check
     * @returns True if the song is unlocked, false otherwise
     */
    public isSongUnlocked(songId: string): boolean {
        return this.playerProgress.unlockedSongs.indexOf(songId) !== -1;
    }

    /**
     * Unlock a song
     * @param songId The song ID to unlock
     */
    public unlockSong(songId: string): void {
        if (!this.isSongUnlocked(songId)) {
            this.playerProgress.unlockedSongs.push(songId);
            this.saveProgress();
            console.log(`Song unlocked: ${songId}`);
        }
    }

    /**
     * Get player's experience points
     * @returns The player's experience points
     */
    public getExperience(): number {
        return this.playerProgress.experience;
    }

    /**
     * Add experience points to the player
     * @param amount The amount of experience points to add
     */
    public addExperience(amount: number): void {
        this.playerProgress.experience += amount;
        this.saveProgress();
        console.log(`Added ${amount} experience. Total: ${this.playerProgress.experience}`);
    }

    /**
     * Get the last experience gained from completing a song
     * @returns The amount of experience points gained
     */
    public getLastExperienceGain(): number {
        return this.lastExperienceGain;
    }

    /**
     * Get current game state
     * @returns The current game state
     */
    public getGameState(): GameState {
        return this.gameState;
    }

    /**
     * Load player progress from local storage
     */
    private loadProgress(): void {
        const savedData = sys.localStorage.getItem('auditionGameProgress');
        if (savedData) {
            try {
                this.playerProgress = JSON.parse(savedData);
                console.log('Player progress loaded successfully');
            } catch (error) {
                console.error('Failed to parse saved progress:', error);
            }
        }
    }

    /**
     * Save player progress to local storage
     */
    public saveProgress(): void {
        try {
            sys.localStorage.setItem('auditionGameProgress', JSON.stringify(this.playerProgress));
            console.log('Player progress saved successfully');
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }
} 