import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Enum for musical notes
 */
export enum MusicalNote {
    DO = 0,
    RE = 1,
    MI = 2,
    FA = 3,
    SOL = 4,
    LA = 5,
    SI = 6
}

/**
 * Enum for game states
 */
export enum GameState {
    INIT,
    CALIBRATING,
    PLAYING,
    PAUSED,
    GAME_OVER
}

/**
 * Enum for pitch detection accuracy
 */
export enum PitchAccuracy {
    PERFECT,
    GOOD,
    MISS
}

/**
 * Enum for feedback types
 */
export enum FeedbackType {
    PERFECT,
    GOOD,
    MISS,
    TIME_WARNING
}

/**
 * Constants for the Pitch Detection Game
 */
export class PitchConstants {
    // Game timing constants
    public static readonly GAME_DURATION: number = 60; // 60 seconds time limit
    public static readonly WARNING_TIME_1: number = 30; // First warning at 30 seconds
    public static readonly WARNING_TIME_2: number = 10; // Second warning at 10 seconds
    
    // Pitch detection constants
    public static readonly FREQUENCY_RANGES: { [key in MusicalNote]: [number, number] } = {
        [MusicalNote.DO]: [261.63 - 10, 261.63 + 10],  // C4: 261.63 Hz
        [MusicalNote.RE]: [293.66 - 10, 293.66 + 10],  // D4: 293.66 Hz
        [MusicalNote.MI]: [329.63 - 10, 329.63 + 10],  // E4: 329.63 Hz
        [MusicalNote.FA]: [349.23 - 10, 349.23 + 10],  // F4: 349.23 Hz
        [MusicalNote.SOL]: [392.00 - 10, 392.00 + 10], // G4: 392.00 Hz
        [MusicalNote.LA]: [440.00 - 10, 440.00 + 10],  // A4: 440.00 Hz
        [MusicalNote.SI]: [493.88 - 10, 493.88 + 10]   // B4: 493.88 Hz
    };
    
    // Animation names for each note
    public static readonly NOTE_ANIMATIONS: { [key in MusicalNote]: string } = {
        [MusicalNote.DO]: "DoAnimation",
        [MusicalNote.RE]: "ReAnimation",
        [MusicalNote.MI]: "MiAnimation",
        [MusicalNote.FA]: "FaAnimation",
        [MusicalNote.SOL]: "SolAnimation",
        [MusicalNote.LA]: "LaAnimation",
        [MusicalNote.SI]: "SiAnimation"
    };
    
    // UI constants
    public static readonly BUTTERFLY_MOVE_SPEED: number = 0.3; // Speed of butterfly movement
    public static readonly PROGRESS_LINE_SPEED: number = 0.5; // Speed of progress line movement
    
    // Scoring constants
    public static readonly PERFECT_SCORE: number = 100;
    public static readonly GOOD_SCORE: number = 50;
    public static readonly MISS_SCORE: number = 0;
    
    // Note names for display
    public static readonly NOTE_NAMES: { [key in MusicalNote]: string } = {
        [MusicalNote.DO]: "Do",
        [MusicalNote.RE]: "Re",
        [MusicalNote.MI]: "Mi",
        [MusicalNote.FA]: "Fa",
        [MusicalNote.SOL]: "Sol",
        [MusicalNote.LA]: "La",
        [MusicalNote.SI]: "Si"
    };
    
    // Event names for communication between components
    public static readonly EVENTS = {
        PITCH_DETECTED: "pitch-detected",
        NOTE_MATCHED: "note-matched",
        SEQUENCE_COMPLETED: "sequence-completed",
        GAME_OVER: "game-over",
        TIME_WARNING: "time-warning"
    };
}
