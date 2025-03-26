import { _decorator } from 'cc';
import { MusicalNote } from '../Systems/PitchConstants';
const { ccclass, property } = _decorator;

/**
 * Represents a single note in a sequence
 */
export interface SequenceNote {
    note: MusicalNote;
    duration: number; // Duration in seconds
}

/**
 * Represents a complete sequence of notes for a level
 */
@ccclass('PitchNoteSequence')
export class PitchNoteSequence {
    @property
    id: string = '';

    @property
    name: string = '';

    @property
    difficulty: number = 1; // 1-5 scale

    @property({ type: [Object] })
    notes: SequenceNote[] = [];

    /**
     * Get the total duration of the sequence
     * @returns Total duration in seconds
     */
    public getTotalDuration(): number {
        return this.notes.reduce((total, note) => total + note.duration, 0);
    }

    /**
     * Get the number of notes in the sequence
     * @returns Number of notes
     */
    public getNoteCount(): number {
        return this.notes.length;
    }
}

/**
 * Predefined note sequences for the game
 */
export class PitchSequenceLibrary {
    // Collection of predefined sequences
    private static sequences: PitchNoteSequence[] = [];

    /**
     * Initialize the sequence library with predefined sequences
     */
    public static initialize(): void {
        // Clear existing sequences
        this.sequences = [];

        // Add beginner sequence
        const beginnerSequence = new PitchNoteSequence();
        beginnerSequence.id = 'beginner_1';
        beginnerSequence.name = 'Beginner Melody';
        beginnerSequence.difficulty = 1;
        beginnerSequence.notes = [
            { note: MusicalNote.DO, duration: 1 },
            { note: MusicalNote.RE, duration: 1 },
            { note: MusicalNote.MI, duration: 1 },
            { note: MusicalNote.FA, duration: 1 },
            { note: MusicalNote.SOL, duration: 1 }
        ];
        this.sequences.push(beginnerSequence);

        // Add intermediate sequence
        const intermediateSequence = new PitchNoteSequence();
        intermediateSequence.id = 'intermediate_1';
        intermediateSequence.name = 'Intermediate Melody';
        intermediateSequence.difficulty = 2;
        intermediateSequence.notes = [
            { note: MusicalNote.DO, duration: 0.5 },
            { note: MusicalNote.MI, duration: 0.5 },
            { note: MusicalNote.SOL, duration: 0.5 },
            { note: MusicalNote.MI, duration: 0.5 },
            { note: MusicalNote.DO, duration: 1 },
            { note: MusicalNote.RE, duration: 0.5 },
            { note: MusicalNote.FA, duration: 0.5 },
            { note: MusicalNote.LA, duration: 0.5 },
            { note: MusicalNote.FA, duration: 0.5 },
            { note: MusicalNote.RE, duration: 1 }
        ];
        this.sequences.push(intermediateSequence);

        // Add advanced sequence
        const advancedSequence = new PitchNoteSequence();
        advancedSequence.id = 'advanced_1';
        advancedSequence.name = 'Advanced Melody';
        advancedSequence.difficulty = 3;
        advancedSequence.notes = [
            { note: MusicalNote.DO, duration: 0.5 },
            { note: MusicalNote.RE, duration: 0.5 },
            { note: MusicalNote.MI, duration: 0.5 },
            { note: MusicalNote.FA, duration: 0.5 },
            { note: MusicalNote.SOL, duration: 0.5 },
            { note: MusicalNote.LA, duration: 0.5 },
            { note: MusicalNote.SI, duration: 0.5 },
            { note: MusicalNote.LA, duration: 0.5 },
            { note: MusicalNote.SOL, duration: 0.5 },
            { note: MusicalNote.FA, duration: 0.5 },
            { note: MusicalNote.MI, duration: 0.5 },
            { note: MusicalNote.RE, duration: 0.5 },
            { note: MusicalNote.DO, duration: 1 }
        ];
        this.sequences.push(advancedSequence);
    }

    /**
     * Get all available sequences
     * @returns Array of all sequences
     */
    public static getAllSequences(): PitchNoteSequence[] {
        if (this.sequences.length === 0) {
            this.initialize();
        }
        return this.sequences;
    }

    /**
     * Get a sequence by ID
     * @param id Sequence ID
     * @returns The sequence or null if not found
     */
    public static getSequenceById(id: string): PitchNoteSequence | null {
        if (this.sequences.length === 0) {
            this.initialize();
        }
        return this.sequences.find(seq => seq.id === id) || null;
    }

    /**
     * Get sequences by difficulty level
     * @param difficulty Difficulty level (1-5)
     * @returns Array of sequences matching the difficulty
     */
    public static getSequencesByDifficulty(difficulty: number): PitchNoteSequence[] {
        if (this.sequences.length === 0) {
            this.initialize();
        }
        return this.sequences.filter(seq => seq.difficulty === difficulty);
    }
}
