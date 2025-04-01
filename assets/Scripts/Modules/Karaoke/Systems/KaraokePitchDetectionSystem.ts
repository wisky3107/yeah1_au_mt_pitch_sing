import { _decorator, Component, Node, EventTarget, game } from 'cc';
import { KaraokeConstants, PitchAccuracy } from './KaraokeConstants';
import { PitchDetectionResult } from '../Data/KaraokeTypes';

const { ccclass, property } = _decorator;

/**
 * Pitch Detection System for the Karaoke application
 * Handles microphone input and real-time pitch detection
 */
@ccclass('KaraokePitchDetectionSystem')
export class KaraokePitchDetectionSystem extends Component {
    //#region Singleton
    private static _instance: KaraokePitchDetectionSystem = null;
    private static eventTarget: EventTarget = new EventTarget();

    public static get instance(): KaraokePitchDetectionSystem {
        return this._instance;
    }
    //#endregion

    //#region Audio Properties
    private audioContext: AudioContext = null;
    private analyzer: AnalyserNode = null;
    private microphone: MediaStreamAudioSourceNode = null;
    private microphoneStream: MediaStream = null;
    private analyzerBuffer: Float32Array = null;
    private bufferSize: number = 2048;
    //#endregion

    //#region Detection Properties
    private isDetecting: boolean = false;
    private detectionInterval: number = null;
    private detectionIntervalMs: number = KaraokeConstants.PITCH_DETECTION_INTERVAL_MS;
    private smoothingFactor: number = 0.6;
    private lastFrequency: number = 0;
    //#endregion

    //#region Configuration Properties
    @property({ range: [0, 1], slide: true, tooltip: "Minimum volume level to detect pitch", group: { name: "Detection Settings", id: "detection" } })
    private volumeThreshold: number = KaraokeConstants.VOLUME_THRESHOLD;
    //#endregion

    //#region Lifecycle Methods
    onLoad() {
        // Set up singleton instance
        if (KaraokePitchDetectionSystem._instance !== null) {
            this.node.destroy();
            return;
        }

        KaraokePitchDetectionSystem._instance = this;
    }

    onDestroy() {
        // Clean up resources
        this.stopDetection();

        if (this.microphoneStream) {
            this.microphoneStream.getTracks().forEach(track => track.stop());
            this.microphoneStream = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
    //#endregion

    //#region Initialization Methods
    public async initialize(): Promise<boolean> {
        try {
            // Check if AudioContext is supported
            if (!window.AudioContext && !window['webkitAudioContext']) {
                console.error('AudioContext is not supported in this browser');
                return false;
            }

            // Create audio context
            const AudioContextClass = window.AudioContext || window['webkitAudioContext'];
            this.audioContext = new AudioContextClass();

            // Create analyzer
            this.analyzer = this.audioContext.createAnalyser();
            this.analyzer.fftSize = this.bufferSize;
            this.analyzer.smoothingTimeConstant = 0.8;

            // Create buffer
            this.analyzerBuffer = new Float32Array(this.analyzer.frequencyBinCount);

            console.log('Karaoke pitch detection system initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize karaoke pitch detection system:', error);
            return false;
        }
    }

    public requestMicrophoneAccess(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                // Find the correct getUserMedia function
                let getUserMediaPromiseFn: (constraints: MediaStreamConstraints) => Promise<MediaStream>;

                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    // Standard Promise-based API
                    getUserMediaPromiseFn = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
                } else {
                    // Check for older versions (callback-based)
                    const getUserMediaFn = (
                        (navigator as any).getUserMedia ||
                        (navigator as any).webkitGetUserMedia ||
                        (navigator as any).mozGetUserMedia ||
                        (navigator as any).msGetUserMedia
                    );

                    // Create a promise wrapper if older API is available
                    if (getUserMediaFn) {
                        getUserMediaPromiseFn = (constraints: MediaStreamConstraints): Promise<MediaStream> => {
                            return new Promise<MediaStream>((res, rej) => {
                                getUserMediaFn(constraints, res, rej);
                            });
                        };
                    }
                }

                // Check if any getUserMedia is supported
                if (!getUserMediaPromiseFn) {
                    console.error('getUserMedia is not supported in this browser');
                    resolve(false);
                    return;
                }

                // Define constraints
                const constraints: MediaStreamConstraints = {
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: false
                    }
                };

                // Access microphone
                this.microphoneStream = await getUserMediaPromiseFn(constraints);

                // Check if AudioContext is ready (sometimes needs user interaction to start)
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }

                // Create microphone source
                this.microphone = this.audioContext.createMediaStreamSource(this.microphoneStream);

                // Connect microphone to analyzer
                this.microphone.connect(this.analyzer);

                console.log('Microphone access granted');
                resolve(true);
            } catch (error) {
                console.error('Error accessing microphone:', error);
                resolve(false);
            }
        });
    }
    //#endregion

    //#region Detection Methods
    public startDetection(): void {
        if (this.isDetecting) return;

        this.isDetecting = true;
        this.detectionInterval = setInterval(() => {
            this.detectPitch();
        }, this.detectionIntervalMs);

        console.log('Pitch detection started');
    }

    public stopDetection(): void {
        if (!this.isDetecting) return;

        this.isDetecting = false;

        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }

        console.log('Pitch detection stopped');
    }

    private detectPitch(): void {
        if (!this.analyzer || !this.isDetecting) return;

        // Get volume level
        const volume = this.getVolumeLevel();

        // Skip detection if volume is too low
        if (volume < this.volumeThreshold) {
            this.emitPitchDetected(0, false, PitchAccuracy.MISS, volume);
            return;
        }

        // Detect pitch using autocorrelation algorithm
        const frequency = this.detectPitchAutocorrelation();

        // Skip if invalid frequency
        if (frequency <= 0) {
            this.emitPitchDetected(0, false, PitchAccuracy.MISS, volume);
            return;
        }

        // Apply smoothing to frequency
        const smoothedFrequency = this.lastFrequency > 0
            ? this.lastFrequency * this.smoothingFactor + frequency * (1 - this.smoothingFactor)
            : frequency;

        this.lastFrequency = smoothedFrequency;

        // Determine accuracy
        const accuracy = this.calculateAccuracy(smoothedFrequency);

        // Emit pitch detected event
        this.emitPitchDetected(smoothedFrequency, true, accuracy, volume);
    }

    private detectPitchAutocorrelation(): number {
        // Get audio data
        this.analyzer.getFloatTimeDomainData(this.analyzerBuffer);

        const bufferSize = this.analyzerBuffer.length;
        const sampleRate = this.audioContext.sampleRate;

        // Find the root-mean-square of the signal
        let sumOfSquares = 0;
        for (let i = 0; i < bufferSize; i++) {
            const val = this.analyzerBuffer[i];
            sumOfSquares += val * val;
        }

        const rootMeanSquare = Math.sqrt(sumOfSquares / bufferSize);

        // Return 0 if the signal is too quiet
        if (rootMeanSquare < 0.01) {
            return 0;
        }

        // Autocorrelation
        let bestOffset = -1;
        let bestCorrelation = 0;
        let correlation = 0;

        // Minimum and maximum frequencies to detect (in Hz)
        const minFreq = 85;  // approximately lowest vocal note E2
        const maxFreq = 1050; // approximately highest vocal note C6

        // Convert to periods
        const minPeriod = Math.floor(sampleRate / maxFreq);
        const maxPeriod = Math.floor(sampleRate / minFreq);

        // Perform autocorrelation within the acceptable range
        for (let offset = minPeriod; offset <= maxPeriod; offset++) {
            correlation = 0;

            for (let i = 0; i < bufferSize - offset; i++) {
                correlation += this.analyzerBuffer[i] * this.analyzerBuffer[i + offset];
            }

            // Normalize
            correlation /= bufferSize - offset;

            // Track the highest correlation and corresponding offset
            if (correlation > bestCorrelation) {
                bestCorrelation = correlation;
                bestOffset = offset;
            }
        }

        // If we found a good correlation
        if (bestCorrelation > 0.01) {
            // Convert period to frequency
            return sampleRate / bestOffset;
        }

        return 0; // No valid pitch detected
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

        KaraokePitchDetectionSystem.emit(KaraokeConstants.EVENTS.PITCH_DETECTED, result);
    }
    //#endregion

    //#region Utility Methods
    public getVolumeLevel(): number {
        if (!this.analyzer) return 0;

        // Get the frequency data
        const freqData = new Uint8Array(this.analyzer.frequencyBinCount);
        this.analyzer.getByteFrequencyData(freqData);

        // Calculate the average amplitude
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) {
            sum += freqData[i];
        }

        // Return normalized volume level (0-1)
        return sum / (freqData.length * 255);
    }

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

    //#region Event Methods
    public static on(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget.on(eventName, callback, target);
    }

    public static off(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget.off(eventName, callback, target);
    }

    private static emit(eventName: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any): void {
        this.eventTarget.emit(eventName, arg1, arg2, arg3, arg4, arg5);
    }
    //#endregion
} 