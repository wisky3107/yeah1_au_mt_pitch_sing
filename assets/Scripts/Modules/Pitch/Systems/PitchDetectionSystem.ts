import { _decorator, Component, Node, EventTarget, AudioSource, game, sys } from 'cc';
import { PitchConstants, MusicalNote, PitchAccuracy } from './PitchConstants';
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
export class PitchDetectionSystem extends Component {
    //#region Singleton
    private static _instance: PitchDetectionSystem = null;
    private static eventTarget: EventTarget = new EventTarget();
    
    public static get instance(): PitchDetectionSystem {
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
    private detectionIntervalMs: number = 50; // Detection interval in milliseconds
    private smoothingFactor: number = 0.6;
    private lastFrequency: number = 0;
    private lastNote: MusicalNote = null;
    private noteStabilityCounter: Map<MusicalNote, number> = new Map();
    private noteStabilityThreshold: number = 2;
    //#endregion

    //#region Configuration Properties
    @property({ range: [0, 1], slide: true, tooltip: "Minimum volume level to detect pitch", group: { name: "Detection Settings", id: "detection" } })
    private volumeThreshold: number = 0.005;
    //#endregion

    //#region Calibration Properties
    private isCalibrating: boolean = false;
    private calibrationCallback: (success: boolean) => void = null;
    //#endregion

    //#region Lifecycle Methods
    onLoad() {
        // Set up singleton instance
        if (PitchDetectionSystem._instance !== null) {
            this.node.destroy();
            return;
        }
        
        PitchDetectionSystem._instance = this;
        
        // Initialize note stability counter
        for (let i = 0; i < 7; i++) {
            this.noteStabilityCounter.set(i as MusicalNote, 0);
        }
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
            
            console.log('Pitch detection system initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize pitch detection system:', error);
            return false;
        }
    }

    public requestMicrophoneAccess(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                // Find the correct getUserMedia function
                let getUserMediaFn: (constraints: MediaStreamConstraints, successCallback: (stream: MediaStream) => void, errorCallback: (error: any) => void) => void;
                let getUserMediaPromiseFn: (constraints: MediaStreamConstraints) => Promise<MediaStream>;

                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    // Standard Promise-based API
                    getUserMediaPromiseFn = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
                } else {
                    // Check for older versions (callback-based)
                    getUserMediaFn = (
                        (navigator as any).getUserMedia ||
                        (navigator as any).webkitGetUserMedia ||
                        (navigator as any).mozGetUserMedia ||
                        (navigator as any).msGetUserMedia
                    );
                }

                // Check if any getUserMedia is supported
                if (!getUserMediaPromiseFn && !getUserMediaFn) {
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

                // Use the appropriate method
                try {
                    if (getUserMediaPromiseFn) {
                        // Modern Promise-based API
                        this.microphoneStream = await getUserMediaPromiseFn(constraints);
                    } else {
                        // Older callback-based API - Wrap in a Promise
                        this.microphoneStream = await new Promise<MediaStream>((res, rej) => {
                            getUserMediaFn(constraints, res, rej);
                        });
                    }
                } catch (err) {
                    console.error('Error accessing media devices.', err);
                    resolve(false);
                    return;
                }

                // Check if AudioContext is ready (sometimes needs user interaction to start)
                if (this.audioContext && this.audioContext.state === 'suspended') {
                   await this.audioContext.resume();
                }

                // Ensure AudioContext is available before creating source
                if (!this.audioContext) {
                     console.error('AudioContext not initialized before microphone access.');
                     // Attempt to reinitialize or handle gracefully
                     if (!(await this.initialize())) {
                         resolve(false);
                         return;
                     }
                     // If initialize creates the context, resume it if needed
                     if (this.audioContext && this.audioContext.state === 'suspended') {
                        await this.audioContext.resume();
                     }
                }
                
                // Defensive check again after potential re-initialization
                if (!this.audioContext) {
                     console.error('AudioContext still not available after attempting initialization.');
                     resolve(false);
                     return;
                }

                // Create microphone source
                this.microphone = this.audioContext.createMediaStreamSource(this.microphoneStream);
                
                // Connect microphone to analyzer
                this.microphone.connect(this.analyzer);
                
                console.log('Microphone access granted');
                resolve(true);
            } catch (error) {
                console.error('Failed to access microphone:', error);
                resolve(false);
            }
        });
    }
    //#endregion

    //#region Detection Control Methods
    public startDetection(): void {
        if (this.isDetecting) return;
        
        // Resume audio context if it's suspended
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isDetecting = true;
        
        // Start detection loop
        this.detectionInterval = setInterval(() => {
            this.detectPitch();
        }, this.detectionIntervalMs);
        
        console.log('Pitch detection started');
    }
    
    public stopDetection(): void {
        if (!this.isDetecting) return;
        
        this.isDetecting = false;
        
        // Stop detection loop
        if (this.detectionInterval !== null) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        
        console.log('Pitch detection stopped');
    }
    //#endregion

    //#region Pitch Detection Methods
    private detectPitch(): void {
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

    private detectPitchAutocorrelation(): number {
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
        for(let i = 1; i < bufferSize / 2; i++) {
            if (correlation[i] < correlation[i-1] && correlation[i] < correlation[i+1]) {
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
             console.log('Autocorrelation: Refined peak is zero or negative.');
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
        
        console.log('No matching note found for frequency:', frequency.toFixed(2), 'Hz');
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
        
        PitchDetectionSystem.emit(PitchConstants.EVENTS.PITCH_DETECTED, result);
    }
    
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

    //#region Volume Management
    public getVolumeLevel(): number {
        if (!this.analyzer) return 0;
        
        this.analyzer.getFloatTimeDomainData(this.analyzerBuffer);
        
        let sum = 0;
        for (let i = 0; i < this.analyzerBuffer.length; i++) {
            sum += this.analyzerBuffer[i] * this.analyzerBuffer[i];
        }
        
        return Math.sqrt(sum / this.analyzerBuffer.length);
    }
    
    public setVolumeThreshold(threshold: number): void {
        this.volumeThreshold = Math.max(0, Math.min(1, threshold));
    }
    
    public getVolumeThreshold(): number {
        return this.volumeThreshold;
    }
    //#endregion
}
