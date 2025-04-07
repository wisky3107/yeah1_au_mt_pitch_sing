import { _decorator } from 'cc';

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
    INIT = 0,
    CALIBRATING = 1,
    WAIT_FOR_FIRST_NOTE = 2,
    PLAYING = 3,
    PAUSED = 4,
    GAME_OVER = 5
}

/**
 * Enum for pitch detection accuracy
 */
export enum PitchAccuracy {
    MISS = 0,
    GOOD = 1,
    PERFECT = 2
}

/**
 * Enum for feedback types
 */
export enum FeedbackType {
    PERFECT = 0,
    GOOD = 1,
    MISS = 2,
    TIME_WARNING = 3
}

/**
 * Constants for the Pitch Detection Game
 */
export class PitchConstants {
    // Game duration in seconds
    public static readonly GAME_DURATION: number = 60;
    
    // Warning times in seconds
    public static readonly WARNING_TIME_1: number = 30;
    public static readonly WARNING_TIME_2: number = 10;
    
    // Note frequency ranges (Hz)
    public static readonly NOTE_FREQUENCIES: { [key in MusicalNote]: [number, number] } = {
        [MusicalNote.DO]: [261.63 - 10, 261.63 + 10],  // C4
        [MusicalNote.RE]: [293.66 - 10, 293.66 + 10],  // D4
        [MusicalNote.MI]: [329.63 - 10, 329.63 + 10],  // E4
        [MusicalNote.FA]: [349.23 - 10, 349.23 + 10],  // F4
        [MusicalNote.SOL]: [392.00 - 10, 392.00 + 10], // G4
        [MusicalNote.LA]: [440.00 - 10, 440.00 + 10],  // A4
        [MusicalNote.SI]: [493.88 - 10, 493.88 + 10]   // B4
    };
    
    // Note names
    public static readonly NOTE_NAMES: string[] = [
        "Do", "Re", "Mi", "Fa", "Sol", "La", "Si"
    ];
    
    // Center frequencies for notes (Hz)
    public static readonly CENTER_FREQUENCIES: { [key in MusicalNote]: number } = {
        [MusicalNote.DO]: 261.63,  // C4
        [MusicalNote.RE]: 293.66,  // D4
        [MusicalNote.MI]: 329.63,  // E4
        [MusicalNote.FA]: 349.23,  // F4
        [MusicalNote.SOL]: 392.00, // G4
        [MusicalNote.LA]: 440.00,  // A4
        [MusicalNote.SI]: 493.88   // B4
    };
    
    // Note frequency ranges (Hz) - Alias for compatibility
    // Updated ranges based on +/- 100 cents (1 semitone) for better tolerance and overlapping ranges
    public static readonly FREQUENCY_RANGES: { [key in MusicalNote]: [number, number] } = {
        [MusicalNote.DO]: [247.22, 277.18],  // C4 +/- 100 cents
        [MusicalNote.RE]: [277.18, 311.13],  // D4 +/- 100 cents
        [MusicalNote.MI]: [311.13, 349.23],  // E4 +/- 100 cents
        [MusicalNote.FA]: [329.63, 369.99],  // F4 +/- 100 cents
        [MusicalNote.SOL]: [369.99, 415.30], // G4 +/- 100 cents
        [MusicalNote.LA]: [415.30, 466.16],  // A4 +/- 100 cents
        [MusicalNote.SI]: [466.16, 523.25]   // B4 +/- 100 cents
    };
    
    // Animation names
    public static readonly ANIMATIONS: { [key in MusicalNote]: string } = {
        [MusicalNote.DO]: "pitch_do",
        [MusicalNote.RE]: "pitch_re",
        [MusicalNote.MI]: "pitch_mi",
        [MusicalNote.FA]: "pitch_fa",
        [MusicalNote.SOL]: "pitch_sol",
        [MusicalNote.LA]: "pitch_la",
        [MusicalNote.SI]: "pitch_si"
    };
    
    // Animation names - Alias for compatibility
    public static readonly NOTE_ANIMATIONS: { [key in MusicalNote]: string } = {
        [MusicalNote.DO]: "pitch_do",
        [MusicalNote.RE]: "pitch_re",
        [MusicalNote.MI]: "pitch_mi",
        [MusicalNote.FA]: "pitch_fa",
        [MusicalNote.SOL]: "pitch_sol",
        [MusicalNote.LA]: "pitch_la",
        [MusicalNote.SI]: "pitch_si"
    };
    // Event names
    public static readonly EVENTS = {
        PITCH_DETECTED: "pitch_detected",
        TIME_WARNING: "time_warning",
        GAME_OVER: "game_over",
        NOTE_MATCHED: "note_matched",
        SEQUENCE_COMPLETE: "sequence_complete"
    };
    
    // Accuracy thresholds
    public static readonly ACCURACY_THRESHOLDS = {
        PERFECT: 3, // Hz difference for perfect match
        GOOD: 7     // Hz difference for good match
    };
}
