import { _decorator } from 'cc';
import { PitchAccuracy } from '../Systems/KaraokeConstants';

/**
 * Represents a lyric segment with start and end timestamps
 */
export interface LyricSegment {
    /** The text content of the lyric segment */
    text: string;
    /** Start time in seconds */
    startTime: number;
    /** End time in seconds */
    endTime: number;
    /** Whether the segment has been sung */
    completed?: boolean;
}

/**
 * Represents a song with lyrics and audio path
 */
export interface Song {
    /** Unique identifier for the song */
    id: string;
    /** Title of the song */
    title: string;
    /** Artist name */
    artist: string;
    /** Path to the audio file */
    audioPath: string;
    /** Path to the lyric file */
    lyricPath: string;
    /** BPM (Beats Per Minute) of the song */
    bpm: number;
    /** Array of lyric segments */
    lyrics: LyricSegment[];
    /** Duration of the song in seconds */
    duration: number;
}

/**
 * Result of pitch detection
 */
export interface PitchDetectionResult {
    /** Detected frequency in Hz */
    frequency: number;
    /** Whether any pitch was detected */
    detected: boolean;
    /** Accuracy of the pitch detection */
    accuracy: PitchAccuracy;
    /** Volume level (0-1) */
    volume: number;
}

/**
 * Score details for a karaoke performance
 */
export interface ScoreDetails {
    /** Total duration of valid interaction (singing when lyric is active) */
    validDuration: number;
    /** Total duration of interaction (any singing) */
    totalInteractionDuration: number;
    /** Final score (0-100) */
    score: number;
}

/**
 * Animation details for character animation
 */
export interface AnimationDetails {
    /** Name of the animation */
    name: string;
    /** Duration in seconds */
    duration?: number;
    /** Whether to loop the animation */
    loop?: boolean;
    /** Transition time in seconds */
    transitionTime?: number;
} 