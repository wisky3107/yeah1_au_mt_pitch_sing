import { _decorator, Component, Node } from 'cc';
import { KaraokeConstants, PitchAccuracy } from './KaraokeConstants';
import { PitchDetectionResult } from '../Data/KaraokeTypes';
import { PitchBase } from '../../GameCommon/Pitch/PitchBase';

const { ccclass, property } = _decorator;

/**
 * Pitch Detection System for the Karaoke application
 * Handles microphone input and real-time pitch detection
 */
@ccclass('KaraokePitchDetectionSystem')
export class KaraokePitchDetectionSystem extends PitchBase {
    //#region Lifecycle Methods
    onLoad() {

        // Override base class settings with karaoke-specific ones
        this.detectionIntervalMs = KaraokeConstants.PITCH_DETECTION_INTERVAL_MS;
    }


    //#endregion

    //#region Detection Methods
    protected detectPitch(): void {
        if (!this.analyzer || !this.isDetecting) return;

        // Get volume level
        const volume = this.getVolumeLevel();

        // Skip detection if volume is too low
        if (volume < this.volumeThreshold) {
            this.emitPitchDetected(0, false, PitchAccuracy.MISS, volume);
            return;
        }

        //by pass the frequency logic
        // // Detect pitch using autocorrelation algorithm
        // const frequency = this.detectPitchAutocorrelation();

        // // Skip if invalid frequency
        // if (frequency <= 0) {
        //     this.emitPitchDetected(0, false, PitchAccuracy.MISS, volume);
        //     return;
        // }

        // // Apply smoothing to frequency
        // const smoothedFrequency = this.lastFrequency > 0
        //     ? this.lastFrequency * this.smoothingFactor + frequency * (1 - this.smoothingFactor)
        //     : frequency;

        // this.lastFrequency = smoothedFrequency;

        // // Determine accuracy
        // const accuracy = this.calculateAccuracy(smoothedFrequency);

        // // Emit pitch detected event
        this.emitPitchDetected(0, true, 1, volume);
    }

    private calculateAccuracy(frequency: number): PitchAccuracy {
        // If using with specific note targets, we would compare with target frequency
        // For karaoke, we just return GOOD if we're detecting valid pitch
        return frequency > 0 ? PitchAccuracy.GOOD : PitchAccuracy.MISS;
    }

    private emitPitchDetected(frequency: number, detected: boolean, accuracy: PitchAccuracy, volume: number): void {
        const result: PitchDetectionResult = {
            frequency,
            detected,
            accuracy,
            volume
        };

        this.emit(KaraokeConstants.EVENTS.PITCH_DETECTED, result);
    }
    //#endregion

    //#region Utility Methods
    /**
    * Get the current analyzer data for visualization
    * @returns Float32Array of analyzer data, or null if analyzer is not initialized
    */
    public getAnalyzerData(): Float32Array | null {
        if (!this.analyzer || !this.analyzerBuffer) return null;

        // Get frequency data for visualization
        this.analyzer.getFloatFrequencyData(this.analyzerBuffer);

        // Normalize the data to 0-1 range
        const normalizedData = new Float32Array(this.analyzerBuffer.length);
        for (let i = 0; i < this.analyzerBuffer.length; i++) {
            // Convert from dB (-100 to 0) to 0-1 range
            normalizedData[i] = (this.analyzerBuffer[i] + 100) / 100;
        }

        return normalizedData;
    }

    public setVolumeThreshold(threshold: number): void {
        this.volumeThreshold = Math.max(0, Math.min(1, threshold));
    }

    public getVolumeThreshold(): number {
        return this.volumeThreshold;
    }
    //#endregion
} 