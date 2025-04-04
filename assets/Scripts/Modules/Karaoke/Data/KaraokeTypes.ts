import { _decorator } from 'cc';
import { PitchAccuracy } from '../Systems/KaraokeConstants';



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