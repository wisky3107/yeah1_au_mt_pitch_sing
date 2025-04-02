import { _decorator } from 'cc';

/**
 * Enum for Karaoke application states
 */
export enum KaraokeState {
    INIT = 0,
    LOADING = 1,
    READY = 2,
    PLAYING = 3,
    PAUSED = 4,
    FINISHED = 5
}

/**
 * Enum for pitch accuracy
 */
export enum PitchAccuracy {
    MISS = 0,
    GOOD = 1,
    PERFECT = 2
}

/**
 * Enum for scoring feedback types
 */
export enum FeedbackType {
    PERFECT = 0,
    GOOD = 1,
    MISS = 2,
    IDLE = 3
}

/**
 * Constants for the Karaoke application
 */
export class KaraokeConstants {
    // Animation states
    public static readonly ANIMATION_IDLE: string = "idle";
    public static readonly ANIMATION_SINGING: string = "singing";
    
    // Animation transition time in seconds
    public static readonly ANIMATION_TRANSITION_TIME: number = 0.3;
    
    // Pitch detection settings
    public static readonly PITCH_DETECTION_INTERVAL_MS: number = 50;
    
    // Pitch accuracy thresholds
    public static readonly ACCURACY_THRESHOLDS = {
        PERFECT: 5, // Hz difference for perfect match
        GOOD: 15    // Hz difference for good match
    };
    
    // Scoring constants
    public static readonly MAX_SCORE: number = 100;
    
    // Event names
    public static readonly EVENTS = {
        PITCH_DETECTED: "karaoke_pitch_detected",
        LYRICS_UPDATED: "karaoke_lyrics_updated",
        SCORE_UPDATED: "karaoke_score_updated",
        SONG_LOADED: "karaoke_song_loaded",
        SONG_ENDED: "karaoke_song_ended",
        SONG_STARTED: "karaoke_song_started",
        STATE_CHANGED: "karaoke_state_changed"
    };
    
    // Default audio formats
    public static readonly SUPPORTED_AUDIO_FORMATS = ["mp3", "wav", "ogg"];
} 