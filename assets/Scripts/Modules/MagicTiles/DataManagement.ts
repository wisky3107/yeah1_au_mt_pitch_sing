import { _decorator, Component, Node, sys } from 'cc';
import { BeatmapManager, BeatmapMetadata } from './BeatmapManager';

const { ccclass, property } = _decorator;

/**
 * Player settings data structure
 */
interface PlayerSettings {
    musicVolume: number;
    sfxVolume: number;
    noteSpeed: number;
    audioOffset: number;
    vibrationEnabled: boolean;
    notificationEnabled: boolean;
    autoPlayCount: number;
    language: string;
    lastPlayedSongId: string;
    visualEffectsLevel: number;
}

/**
 * Player progress data structure
 */
interface PlayerProgress {
    level: number;
    exp: number;
    coins: number;
    gems: number;
    unlockedSongs: string[];
    completedTutorials: string[];
}

/**
 * Player statistics data structure
 */
interface PlayerStatistics {
    totalPlayCount: number;
    totalPlayTime: number;
    perfectCount: number;
    goodCount: number;
    okCount: number;
    missCount: number;
    maxCombo: number;
    averageAccuracy: number;
    songPlayCounts: Record<string, number>;
}

/**
 * High score entry data structure
 */
interface HighScoreEntry {
    score: number;
    accuracy: number;
    maxCombo: number;
    perfect: number;
    good: number;
    ok: number;
    miss: number;
    date: number;
}

/**
 * Data manager for Magic Tiles 3
 * Handles all persistent data management including settings, progress, statistics, and high scores
 */
@ccclass('DataManager')
export class DataManager extends Component {
    // Singleton instance
    private static _instance: DataManager | null = null;

    public static get instance(): DataManager {
        return DataManager._instance!;
    }

    // Storage keys
    private static readonly SETTINGS_KEY = 'magicTiles_settings';
    private static readonly PROGRESS_KEY = 'magicTiles_progress';
    private static readonly STATISTICS_KEY = 'magicTiles_statistics';
    private static readonly HIGH_SCORES_KEY = 'magicTiles_highScores';

    // Data caches
    private settings: PlayerSettings = {
        musicVolume: 0.8,
        sfxVolume: 1.0,
        noteSpeed: 1.0,
        audioOffset: 0,
        vibrationEnabled: true,
        notificationEnabled: true,
        autoPlayCount: 5,
        language: 'en',
        lastPlayedSongId: '',
        visualEffectsLevel: 2
    };

    private progress: PlayerProgress = {
        level: 1,
        exp: 0,
        coins: 0,
        gems: 0,
        unlockedSongs: [],
        completedTutorials: []
    };

    private statistics: PlayerStatistics = {
        totalPlayCount: 0,
        totalPlayTime: 0,
        perfectCount: 0,
        goodCount: 0,
        okCount: 0,
        missCount: 0,
        maxCombo: 0,
        averageAccuracy: 0,
        songPlayCounts: {}
    };

    private highScores: Record<string, HighScoreEntry> = {};

    // Callbacks
    private onSettingsChangedCallback: (() => void) | null = null;
    private onProgressChangedCallback: ((progress: PlayerProgress) => void) | null = null;
    private onCoinsChangedCallback: ((coins: number) => void) | null = null;

    // References
    private beatmapManager: BeatmapManager = null!;

    onLoad() {
        // Set singleton instance
        if (DataManager._instance === null) {
            DataManager._instance = this;
        } else {
            this.destroy();
            return;
        }

        // Get references
        this.beatmapManager = BeatmapManager.instance;

        // Load all data from storage
        this.loadAllData();
    }

    /**
     * Load all data from persistent storage
     */
    private loadAllData() {
        this.loadSettings();
        this.loadProgress();
        this.loadStatistics();
        this.loadHighScores();

        console.log('All player data loaded');
    }

    /**
     * Save all data to persistent storage
     */
    saveAllData() {
        this.saveSettings();
        this.saveProgress();
        this.saveStatistics();
        this.saveHighScores();

        console.log('All player data saved');
    }

    /**
     * Load settings from storage
     */
    private loadSettings() {
        const data = sys.localStorage.getItem(DataManager.SETTINGS_KEY);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                // Merge with defaults to handle missing properties
                this.settings = { ...this.settings, ...parsed };
            } catch (e) {
                console.error('Failed to parse settings data:', e);
            }
        }
    }

    /**
     * Save settings to storage
     */
    private saveSettings() {
        try {
            const data = JSON.stringify(this.settings);
            sys.localStorage.setItem(DataManager.SETTINGS_KEY, data);
        } catch (e) {
            console.error('Failed to save settings data:', e);
        }
    }

    /**
     * Load player progress from storage
     */
    private loadProgress() {
        const data = sys.localStorage.getItem(DataManager.PROGRESS_KEY);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                // Merge with defaults to handle missing properties
                this.progress = { ...this.progress, ...parsed };
            } catch (e) {
                console.error('Failed to parse progress data:', e);
            }
        }
    }

    /**
     * Save player progress to storage
     */
    private saveProgress() {
        try {
            const data = JSON.stringify(this.progress);
            sys.localStorage.setItem(DataManager.PROGRESS_KEY, data);
        } catch (e) {
            console.error('Failed to save progress data:', e);
        }
    }

    /**
     * Load player statistics from storage
     */
    private loadStatistics() {
        const data = sys.localStorage.getItem(DataManager.STATISTICS_KEY);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                // Merge with defaults to handle missing properties
                this.statistics = { ...this.statistics, ...parsed };
            } catch (e) {
                console.error('Failed to parse statistics data:', e);
            }
        }
    }

    /**
     * Save player statistics to storage
     */
    private saveStatistics() {
        try {
            const data = JSON.stringify(this.statistics);
            sys.localStorage.setItem(DataManager.STATISTICS_KEY, data);
        } catch (e) {
            console.error('Failed to save statistics data:', e);
        }
    }

    /**
     * Load high scores from storage
     */
    private loadHighScores() {
        const data = sys.localStorage.getItem(DataManager.HIGH_SCORES_KEY);
        if (data) {
            try {
                this.highScores = JSON.parse(data);
            } catch (e) {
                console.error('Failed to parse high scores data:', e);
            }
        }
    }

    /**
     * Save high scores to storage
     */
    private saveHighScores() {
        try {
            const data = JSON.stringify(this.highScores);
            sys.localStorage.setItem(DataManager.HIGH_SCORES_KEY, data);
        } catch (e) {
            console.error('Failed to save high scores data:', e);
        }
    }

    /**
     * Get player settings
     */
    getSettings(): PlayerSettings {
        return { ...this.settings }; // Return a copy to prevent direct modification
    }

    /**
     * Update player settings
     */
    updateSettings(newSettings: Partial<PlayerSettings>) {
        // Update only the provided settings
        this.settings = { ...this.settings, ...newSettings };

        // Save to storage
        this.saveSettings();

        // Notify listeners
        if (this.onSettingsChangedCallback) {
            this.onSettingsChangedCallback();
        }
    }

    /**
     * Get player progress
     */
    getProgress(): PlayerProgress {
        return { ...this.progress }; // Return a copy to prevent direct modification
    }

    /**
     * Add experience points and update level if needed
     */
    addExperience(exp: number) {
        if (exp <= 0) return;

        this.progress.exp += exp;

        // Check for level up (simple level calculation)
        const newLevel = Math.floor(Math.sqrt(this.progress.exp / 100)) + 1;
        const leveledUp = newLevel > this.progress.level;

        if (leveledUp) {
            const oldLevel = this.progress.level;
            this.progress.level = newLevel;
            console.log(`Player leveled up from ${oldLevel} to ${newLevel}!`);

            // TODO: Handle level up rewards
        }

        // Save progress
        this.saveProgress();

        // Notify listeners
        if (this.onProgressChangedCallback) {
            this.onProgressChangedCallback(this.getProgress());
        }

        return leveledUp;
    }

    /**
     * Add or subtract coins
     */
    updateCoins(amount: number) {
        this.progress.coins += amount;

        // Ensure coins don't go negative
        if (this.progress.coins < 0) {
            this.progress.coins = 0;
        }

        // Save progress
        this.saveProgress();

        // Notify listeners
        if (this.onCoinsChangedCallback) {
            this.onCoinsChangedCallback(this.progress.coins);
        }

        return this.progress.coins;
    }

    /**
     * Add or subtract gems
     */
    updateGems(amount: number) {
        this.progress.gems += amount;

        // Ensure gems don't go negative
        if (this.progress.gems < 0) {
            this.progress.gems = 0;
        }

        // Save progress
        this.saveProgress();

        return this.progress.gems;
    }

    /**
     * Check if a song is unlocked
     */
    isSongUnlocked(songId: string): boolean {
        // Check the unlockedSongs array
        return this.progress.unlockedSongs.indexOf(songId) >= 0;
    }

    /**
     * Unlock a song
     */
    unlockSong(songId: string) {
        if (!this.isSongUnlocked(songId)) {
            this.progress.unlockedSongs.push(songId);
            this.saveProgress();
            return true;
        }
        return false;
    }

    /**
     * Get all unlocked songs
     */
    getUnlockedSongs(): string[] {
        return [...this.progress.unlockedSongs]; // Return a copy to prevent direct modification
    }

    /**
     * Get player statistics
     */
    getStatistics(): PlayerStatistics {
        return { ...this.statistics }; // Return a copy to prevent direct modification
    }

    /**
     * Update statistics after playing a song
     */
    updateStatistics(songId: string, playTime: number, perfect: number, good: number, ok: number, miss: number, maxCombo: number, accuracy: number) {
        // Update song play count
        if (!this.statistics.songPlayCounts[songId]) {
            this.statistics.songPlayCounts[songId] = 0;
        }
        this.statistics.songPlayCounts[songId]++;

        // Update total play count
        this.statistics.totalPlayCount++;

        // Update total play time
        this.statistics.totalPlayTime += playTime;

        // Update hit counts
        this.statistics.perfectCount += perfect;
        this.statistics.goodCount += good;
        this.statistics.okCount += ok;
        this.statistics.missCount += miss;

        // Update max combo
        if (maxCombo > this.statistics.maxCombo) {
            this.statistics.maxCombo = maxCombo;
        }

        // Update average accuracy
        // Using a weighted average based on play count
        const oldWeight = (this.statistics.totalPlayCount - 1) / this.statistics.totalPlayCount;
        const newWeight = 1 / this.statistics.totalPlayCount;
        this.statistics.averageAccuracy = this.statistics.averageAccuracy * oldWeight + accuracy * newWeight;

        // Save updated statistics
        this.saveStatistics();
    }

    /**
     * Get song play count
     */
    getSongPlayCount(songId: string): number {
        return this.statistics.songPlayCounts[songId] || 0;
    }

    /**
     * Get all song play counts
     */
    getAllSongPlayCounts(): Record<string, number> {
        return { ...this.statistics.songPlayCounts };
    }

    /**
     * Get high score for a song
     */
    getHighScore(songId: string): HighScoreEntry | null {
        return this.highScores[songId] || null;
    }

    /**
     * Submit a new score for a song
     * Returns true if it's a new high score
     */
    submitScore(songId: string, score: number, accuracy: number, maxCombo: number, perfect: number, good: number, ok: number, miss: number): boolean {
        // Check if this is a new high score
        const currentHighScore = this.getHighScore(songId);
        const isNewHighScore = !currentHighScore || score > currentHighScore.score;

        if (isNewHighScore) {
            // Create new high score entry
            const newEntry: HighScoreEntry = {
                score,
                accuracy,
                maxCombo,
                perfect,
                good,
                ok,
                miss,
                date: Date.now()
            };

            // Save the new high score
            this.highScores[songId] = newEntry;
            this.saveHighScores();
        }

        return isNewHighScore;
    }

    /**
     * Get all high scores
     */
    getAllHighScores(): Record<string, HighScoreEntry> {
        return { ...this.highScores };
    }

    /**
     * Clear all data (for debugging or account reset)
     */
    clearAllData() {
        // Clear all data from storage
        sys.localStorage.removeItem(DataManager.SETTINGS_KEY);
        sys.localStorage.removeItem(DataManager.PROGRESS_KEY);
        sys.localStorage.removeItem(DataManager.STATISTICS_KEY);
        sys.localStorage.removeItem(DataManager.HIGH_SCORES_KEY);

        // Reset caches to defaults
        this.settings = {
            musicVolume: 0.8,
            sfxVolume: 1.0,
            noteSpeed: 1.0,
            audioOffset: 0,
            vibrationEnabled: true,
            notificationEnabled: true,
            autoPlayCount: 5,
            language: 'en',
            lastPlayedSongId: '',
            visualEffectsLevel: 2
        };

        this.progress = {
            level: 1,
            exp: 0,
            coins: 0,
            gems: 0,
            unlockedSongs: [],
            completedTutorials: []
        };

        this.statistics = {
            totalPlayCount: 0,
            totalPlayTime: 0,
            perfectCount: 0,
            goodCount: 0,
            okCount: 0,
            missCount: 0,
            maxCombo: 0,
            averageAccuracy: 0,
            songPlayCounts: {}
        };

        this.highScores = {};

        console.log('All player data cleared');
    }

    /**
     * Register a callback for settings changes
     */
    onSettingsChanged(callback: () => void) {
        this.onSettingsChangedCallback = callback;
    }

    /**
     * Register a callback for progress changes
     */
    onProgressChanged(callback: (progress: PlayerProgress) => void) {
        this.onProgressChangedCallback = callback;
    }

    /**
     * Register a callback for coins changes
     */
    onCoinsChanged(callback: (coins: number) => void) {
        this.onCoinsChangedCallback = callback;
    }

    /**
     * Mark a tutorial as completed
     */
    completeTutorial(tutorialId: string) {
        if (this.progress.completedTutorials.indexOf(tutorialId) < 0) {
            this.progress.completedTutorials.push(tutorialId);
            this.saveProgress();
        }
    }

    /**
     * Check if a tutorial is completed
     */
    isTutorialCompleted(tutorialId: string): boolean {
        return this.progress.completedTutorials.indexOf(tutorialId) >= 0;
    }

    /**
     * Export player data as JSON (for backup or transfer)
     */
    exportData(): string {
        const data = {
            settings: this.settings,
            progress: this.progress,
            statistics: this.statistics,
            highScores: this.highScores
        };

        return JSON.stringify(data);
    }

    /**
     * Import player data from JSON
     */
    importData(jsonData: string): boolean {
        try {
            const data = JSON.parse(jsonData);

            if (data.settings) this.settings = data.settings;
            if (data.progress) this.progress = data.progress;
            if (data.statistics) this.statistics = data.statistics;
            if (data.highScores) this.highScores = data.highScores;

            // Save all imported data
            this.saveAllData();

            return true;
        } catch (e) {
            console.error('Failed to import data:', e);
            return false;
        }
    }
} 