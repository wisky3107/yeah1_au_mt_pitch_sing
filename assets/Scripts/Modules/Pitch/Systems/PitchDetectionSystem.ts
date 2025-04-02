import { _decorator, Component, Node, EventTarget, AudioSource, game, sys } from 'cc';
import { PitchConstants, MusicalNote, PitchAccuracy } from './PitchConstants';
import { PitchBase } from '../../GameCommon/Pitch/PitchBase';
const { ccclass, property } = _decorator;

/**
 * Pitch detection result interface
 */
interface PitchDetectionResult {
    frequency: number;
    note: MusicalNote | null;
    accuracy: PitchAccuracy;
    volume: number;
}

/**
 * Pitch Detection System for the Pitch Detection Game
 * Handles microphone input and real-time pitch detection
 */
@ccclass('PitchDetectionSystem')
export class PitchDetectionSystem extends PitchBase {
    //#region Detection Properties
    private noteStabilityCounter: Map<MusicalNote, number> = new Map();
    private noteStabilityThreshold: number = 2;
    //#endregion

    //#region Calibration Properties
    private isCalibrating: boolean = false;
    private calibrationCallback: (success: boolean) => void = null;
    //#endregion

    //#region Lifecycle Methods
    onLoad() {
        // Initialize note stability counter
        for (let i = 0; i < 7; i++) {
            this.noteStabilityCounter.set(i as MusicalNote, 0);
        }
    }
    //#endregion

    //#region Pitch Detection Methods
    protected detectPitch(): void {
        if (!this.analyzer || !this.isDetecting) return;

        // Get frequency data
        this.analyzer.getFloatTimeDomainData(this.analyzerBuffer);

        // Calculate volume
        let sum = 0;
        for (let i = 0; i < this.analyzerBuffer.length; i++) {
            sum += this.analyzerBuffer[i] * this.analyzerBuffer[i];
        }
        const volume = Math.sqrt(sum / this.analyzerBuffer.length);

        // Log volume level periodically
        if (Math.random() < 0.1) { // Log about 10% of the time to avoid console spam
            console.log('Current volume:', volume.toFixed(4), 'Threshold:', this.volumeThreshold);
        }

        // Skip detection if volume is too low
        if (volume < this.volumeThreshold) {
            this.resetNoteStability();
            this.emitPitchDetected(0, null, PitchAccuracy.MISS, volume);
            return;
        }

        // Detect pitch using autocorrelation
        const frequency = this.detectPitchAutocorrelation();

        // Apply smoothing
        const smoothedFrequency = this.smoothingFactor * this.lastFrequency + (1 - this.smoothingFactor) * frequency;
        this.lastFrequency = smoothedFrequency;

        // Log smoothed frequency periodically
        if (Math.random() < 0.1) {
            console.log('Smoothed frequency:', smoothedFrequency.toFixed(2), 'Hz');
        }

        // Map frequency to note
        const { note, accuracy } = this.mapFrequencyToNote(smoothedFrequency);

        // Update note stability
        if (note !== null) {
            this.updateNoteStability(note);

            // Log stability counter periodically
            if (Math.random() < 0.1) {
                console.log('Note stability counter:', {
                    note: PitchConstants.NOTE_NAMES[note],
                    count: this.noteStabilityCounter.get(note),
                    threshold: this.noteStabilityThreshold
                });
            }

            // Emit event if note is stable
            if (this.noteStabilityCounter.get(note) >= this.noteStabilityThreshold) {
                this.emitPitchDetected(smoothedFrequency, note, accuracy, volume);
            }
        } else {
            this.resetNoteStability();
            this.emitPitchDetected(smoothedFrequency, null, PitchAccuracy.MISS, volume);
        }
    }

    protected detectPitchAutocorrelation(): number {
        const buffer = this.analyzerBuffer;
        const bufferSize = buffer.length;

        // Find the root-mean-square amplitude
        let rms = 0;
        for (let i = 0; i < bufferSize; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / bufferSize);

        // Return 0 if the signal is too quiet
        if (rms < this.volumeThreshold) {
            console.log('Autocorrelation RMS below threshold');
            return 0;
        }

        // Find the autocorrelation
        let correlation = new Float32Array(bufferSize);
        for (let i = 0; i < bufferSize; i++) {
            correlation[i] = 0;
            for (let j = 0; j < bufferSize - i; j++) {
                correlation[i] += buffer[j] * buffer[j + i];
            }
        }

        // Find the peak of the correlation
        let firstMinimum = -1;
        for (let i = 1; i < bufferSize / 2; i++) {
            if (correlation[i] < correlation[i - 1] && correlation[i] < correlation[i + 1]) {
                firstMinimum = i;
                break;
            }
        }

        if (firstMinimum <= 1) {
            firstMinimum = 1;
        }

        // Find the absolute peak after the first minimum
        let peakIndex = firstMinimum;
        for (let i = firstMinimum + 1; i < bufferSize / 2; i++) {
            if (correlation[i] > correlation[peakIndex]) {
                peakIndex = i;
            }
        }

        if (correlation[peakIndex] <= 0 || peakIndex === 0) {
            return 0;
        }

        // Refine the peak by interpolating using quadratic interpolation
        let refinedPeak = peakIndex;
        if (peakIndex > 0 && peakIndex < bufferSize - 1) {
            let peakValue = correlation[peakIndex];
            let leftValue = correlation[peakIndex - 1];
            let rightValue = correlation[peakIndex + 1];
            let interpolation = 0.5 * (leftValue - rightValue) / (leftValue - 2 * peakValue + rightValue);
            if (isFinite(interpolation)) {
                refinedPeak += interpolation;
            }
        }

        // Calculate the frequency
        let frequency = 0;
        if (refinedPeak > 0) {
            frequency = this.audioContext.sampleRate / refinedPeak;
        } else {
        }

        return frequency;
    }

    private mapFrequencyToNote(frequency: number): { note: MusicalNote | null, accuracy: PitchAccuracy } {
        if (frequency <= 0) {
            console.log('Invalid frequency detected:', frequency);
            return { note: null, accuracy: PitchAccuracy.MISS };
        }

        console.log('Detected frequency:', frequency.toFixed(2), 'Hz');

        // Check each note's frequency range
        for (let noteValue = 0; noteValue < 7; noteValue++) {
            const note = noteValue as MusicalNote;
            const [minFreq, maxFreq] = PitchConstants.FREQUENCY_RANGES[note];
            const centerFreq = PitchConstants.CENTER_FREQUENCIES[note];

            if (frequency >= minFreq && frequency <= maxFreq) {
                // Calculate the difference from center frequency
                const diffFromCenter = Math.abs(frequency - centerFreq);
                const percentDiff = (diffFromCenter / centerFreq) * 100;

                console.log(`Note ${PitchConstants.NOTE_NAMES[note]} detected:`, {
                    frequency: frequency.toFixed(2),
                    centerFreq: centerFreq.toFixed(2),
                    diffFromCenter: diffFromCenter.toFixed(2),
                    percentDiff: percentDiff.toFixed(2) + '%',
                    range: `[${minFreq.toFixed(2)}, ${maxFreq.toFixed(2)}]`
                });

                // Determine accuracy based on percentage difference from center
                let accuracy: PitchAccuracy;
                if (percentDiff <= 1.0) {
                    accuracy = PitchAccuracy.PERFECT;
                } else if (percentDiff <= 2.5) {
                    accuracy = PitchAccuracy.GOOD;
                } else {
                    accuracy = PitchAccuracy.MISS;
                }

                return { note, accuracy };
            }
        }

        return { note: null, accuracy: PitchAccuracy.MISS };
    }
    //#endregion

    //#region Note Stability Methods
    private updateNoteStability(note: MusicalNote): void {
        // Reset counters for other notes
        for (let i = 0; i < 7; i++) {
            if (i !== note) {
                this.noteStabilityCounter.set(i as MusicalNote, 0);
            }
        }

        // Increment counter for detected note
        const currentCount = this.noteStabilityCounter.get(note) || 0;
        this.noteStabilityCounter.set(note, currentCount + 1);
    }

    private resetNoteStability(): void {
        for (let i = 0; i < 7; i++) {
            this.noteStabilityCounter.set(i as MusicalNote, 0);
        }
    }
    //#endregion

    //#region Event Management
    private emitPitchDetected(frequency: number, note: MusicalNote | null, accuracy: PitchAccuracy, volume: number): void {
        const result: PitchDetectionResult = {
            frequency,
            note,
            accuracy,
            volume
        };

        this.emit(PitchConstants.EVENTS.PITCH_DETECTED, result);
    }
    //#endregion

    //#region Calibration Methods
    public startCalibration(callback: (success: boolean) => void): void {
        if (this.isCalibrating) return;

        this.isCalibrating = true;
        this.calibrationCallback = callback;

        // TODO: Implement calibration logic
        // For now, just simulate a successful calibration
        setTimeout(() => {
            this.isCalibrating = false;
            if (this.calibrationCallback) {
                this.calibrationCallback(true);
                this.calibrationCallback = null;
            }
        }, 2000);

        console.log('Calibration started');
    }
    //#endregion
}
