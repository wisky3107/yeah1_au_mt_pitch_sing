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
    patternComplexityLevel: number; // Current highest complexity level (0-6 for 3-9 inputs)
    unlockedPatternLevels: number[]; // Array of unlocked pattern complexity levels
    finishMovesUnlocked: boolean; // Whether finish moves are unlocked
    patternsCompleted: Record<string, number>; // Record of completed patterns per song
    finishMovesCompleted: number; // Count of finish moves completed
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
        experience: 0,
        patternComplexityLevel: 0, // Start with level 0 (3 inputs)
        unlockedPatternLevels: [0], // Only first level unlocked initially
        finishMovesUnlocked: false, // Finish moves locked initially
        patternsCompleted: {},
        finishMovesCompleted: 0
    };

    // Experience thresholds for unlocking new pattern complexity levels
    private patternLevelExpThresholds: number[] = [
        0,      // Level 0 (3 inputs) - Default
        500,    // Level 1 (4 inputs)
        1500,   // Level 2 (5 inputs)
        3000,   // Level 3 (6 inputs)
        5000,   // Level 4 (7 inputs)
        8000,   // Level 5 (8 inputs)
        12000   // Level 6 (9 inputs)
    ];

    // Experience threshold for unlocking finish moves
    private finishMoveExpThreshold: number = 2000;

    // Track the last experience gain from a song
    private lastExperienceGain: number = 0;
    private lastPatternStats: { completed: number, skipped: number, finishMoves: number } = {
        completed: 0,
        skipped: 0,
        finishMoves: 0
    };

    // Available songs in the game
    private availableSongs: SongData[] = [
        {
            id: 'song0211',
            title: '삐딱하게 (Crooked)',
            artist: 'G-Dragon',
            difficulty: 3,
            bpm: 130,
            audioPath: 'song0211',
            beatmapPath: 'song0211',
            previewStart: 30000,
            previewEnd: 45000
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

        //load sample song
        this.startSong('song0211');
    }

    /**
     * Change to a different scene
     * @param sceneName The name of the scene to load
     */
    public changeScene(sceneName: string): void {
        console.log(`Changing scene to: ${sceneName}`);
        // director.loadScene(sceneName);
        
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
     * @param patternStats Statistics about pattern completion
     */
    public endSong(
        score: number, 
        maxCombo: number, 
        patternStats: { completed: number, skipped: number, finishMoves: number } = { completed: 0, skipped: 0, finishMoves: 0 }
    ): void {
        if (!this.currentSong) {
            console.error('No song is currently active');
            return;
        }
        
        this.gameState = GameState.RESULTS;
        console.log(`Song ended. Score: ${score}, Max Combo: ${maxCombo}, ` +
                   `Patterns: ${patternStats.completed}, Finish Moves: ${patternStats.finishMoves}`);
        
        // Update high score if needed
        if (!this.playerProgress.highScores[this.currentSong.id] || 
            score > this.playerProgress.highScores[this.currentSong.id]) {
            this.playerProgress.highScores[this.currentSong.id] = score;
            console.log(`New high score for ${this.currentSong.title}: ${score}`);
        }
        
        // Store pattern stats
        this.lastPatternStats = patternStats;
        
        // Update pattern completion counts for this song
        if (!this.playerProgress.patternsCompleted[this.currentSong.id]) {
            this.playerProgress.patternsCompleted[this.currentSong.id] = 0;
        }
        
        this.playerProgress.patternsCompleted[this.currentSong.id] += patternStats.completed;
        this.playerProgress.finishMovesCompleted += patternStats.finishMoves;
        
        // Calculate experience gained (based on score, patterns, and difficulty)
        const expMultiplier = this.currentSong.difficulty * 0.5;
        const baseScoreXP = Math.floor(score * 0.01 * expMultiplier);
        const patternBonus = patternStats.completed * 5 * expMultiplier;
        const finishMoveBonus = patternStats.finishMoves * 20;
        
        this.lastExperienceGain = baseScoreXP + patternBonus + finishMoveBonus;
        
        // Add experience
        this.addExperience(this.lastExperienceGain);
        
        // Check for pattern level unlocks
        this.checkPatternLevelUnlocks();
        
        // Save progress
        this.saveProgress();
        
        // Change to results scene
        this.changeScene('AuditionResults');
    }

    /**
     * Check if player has met requirements to unlock new pattern levels
     */
    private checkPatternLevelUnlocks(): void {
        // Check each pattern level
        for (let level = 0; level < this.patternLevelExpThresholds.length; level++) {
            const isLevelUnlocked = this.playerProgress.unlockedPatternLevels.indexOf(level) !== -1;
            
            if (this.playerProgress.experience >= this.patternLevelExpThresholds[level] && 
                !isLevelUnlocked) {
                
                // Unlock the new level
                this.playerProgress.unlockedPatternLevels.push(level);
                console.log(`Unlocked pattern complexity level ${level}!`);
                
                // If it's higher than current level, update that too
                if (level > this.playerProgress.patternComplexityLevel) {
                    this.playerProgress.patternComplexityLevel = level;
                }
            }
        }
        
        // Check for finish move unlock
        if (this.playerProgress.experience >= this.finishMoveExpThreshold && 
            !this.playerProgress.finishMovesUnlocked) {
            
            this.playerProgress.finishMovesUnlocked = true;
            console.log('Finish moves unlocked!');
        }
    }

    /**
     * Get player's current pattern complexity level
     * @returns Current pattern complexity level
     */
    public getPatternComplexityLevel(): number {
        return this.playerProgress.patternComplexityLevel;
    }
    
    /**
     * Set player's current pattern complexity level (within unlocked levels)
     * @param level Level to set (0-6 for 3-9 inputs)
     * @returns Whether the level was successfully set
     */
    public setPatternComplexityLevel(level: number): boolean {
        const isLevelUnlocked = this.playerProgress.unlockedPatternLevels.indexOf(level) !== -1;
        
        if (isLevelUnlocked) {
            this.playerProgress.patternComplexityLevel = level;
            this.saveProgress();
            console.log(`Pattern complexity level set to ${level}`);
            return true;
        }
        
        console.warn(`Pattern complexity level ${level} is not unlocked`);
        return false;
    }
    
    /**
     * Get all unlocked pattern complexity levels
     * @returns Array of unlocked level indices
     */
    public getUnlockedPatternLevels(): number[] {
        return [...this.playerProgress.unlockedPatternLevels];
    }
    
    /**
     * Check if finish moves are unlocked
     * @returns Whether finish moves are unlocked
     */
    public areFinishMovesUnlocked(): boolean {
        return this.playerProgress.finishMovesUnlocked;
    }
    
    /**
     * Get the actual number of inputs for a given complexity level
     * @param level Pattern complexity level (0-6)
     * @returns Number of inputs (3-9)
     */
    public getPatternComplexityValue(level: number): number {
        // Level 0 = 3 inputs, Level 1 = 4 inputs, etc.
        return level + 3;
    }
    
    /**
     * Get the last pattern stats from completed song
     * @returns Pattern statistics
     */
    public getLastPatternStats(): { completed: number, skipped: number, finishMoves: number } {
        return {...this.lastPatternStats};
    }
    
    /**
     * Get total patterns completed across all songs
     * @returns Total pattern count
     */
    public getTotalPatternsCompleted(): number {
        let total = 0;
        
        // Manually sum up the values
        for (const songId in this.playerProgress.patternsCompleted) {
            total += this.playerProgress.patternsCompleted[songId];
        }
        
        return total;
    }
    
    /**
     * Get total finish moves completed
     * @returns Total finish move count
     */
    public getTotalFinishMovesCompleted(): number {
        return this.playerProgress.finishMovesCompleted;
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