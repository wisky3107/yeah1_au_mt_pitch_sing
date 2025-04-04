import { AudioClip } from "cc";
import { MTSongModel } from "../../../Models/Songs/MTSongModel";

export const MTConstant = {
    RESOURCE_MIDI_PATH: "magic_tiles/midi",
}

export interface BeatmapAudioData {
    clip: AudioClip;
    trackInfo: MidiTrackInfo;
    totalDuration: number;
    currentTime: number;
    isPlaying: boolean;
    isPaused: boolean;
}

export interface MidiTrackInfo {
    // MIDI track information
    channel: number;
    controlChanges: Record<number, any[]>;
    duration: number;
    endOfTrackTicks: number;
    startOfTrackTicks: number;
    instrument: {
        number: number;
        name: string;
    };
    notes: TrackNoteInfo[];
}

// Define the format of a single note in the beatmap
export interface TrackNoteInfo {
    midi: number;
    time: number;
    lane: number;
    duration: number;
    durationTicks: number;
    velocity: number;
    type: NoteType;
}

// Define the types of notes
export enum NoteType {
    TAP = 0,
    HOLD = 1,
    SLIDE = 2
}

// Define the full beatmap structure
export interface Beatmap {
    song: MTSongModel;
    notes: TrackNoteInfo[];
}
