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
    // Singleton instance
    private static _instance: PitchDetectionSystem = null;
    
    // Event target for pitch detection events
    private static eventTarget: EventTarget = new EventTarget();
    
    // Audio context and analyzer
    private audioContext: AudioContext = null;
    private analyzer: AnalyserNode = null;
    private microphone: MediaStreamAudioSourceNode = null;
    private microphoneStream: MediaStream = null;
    
    // Buffer for audio analysis
    private analyzerBuffer: Float32Array = null;
    private bufferSize: number = 2048;
    
    // Detection state
    private isDetecting: boolean = false;
    private detectionInterval: number = null;
    private detectionIntervalMs: number = 50; // Detection interval in milliseconds
    
    // Smoothing for pitch detection
    private smoothingFactor: number = 0.6;
    private lastFrequency: number = 0;
    private lastNote: MusicalNote = null;
    private noteStabilityCounter: Map<MusicalNote, number> = new Map();
    private noteStabilityThreshold: number = 2;
    
    // Volume threshold for detection
    @property({ range: [0, 1], slide: true, tooltip: "Minimum volume level to detect pitch" })
    private volumeThreshold: number = 0.005;
    
    // Calibration
    private isCalibrating: boolean = false;
    private calibrationCallback: (success: boolean) => void = null;
    
    /**
     * Get the singleton instance
     */
    public static get instance(): PitchDetectionSystem {
        return this._instance;
    }
    
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
    
    /**
     * Initialize the pitch detection system
     * @returns Promise that resolves when initialization is complete
     */
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
    
    /**
     * Request microphone access
     * @returns Promise that resolves when microphone access is granted
     */
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
    
    /**
     * Start pitch detection
     */
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
    
    /**
     * Stop pitch detection
     */
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
    
    /**
     * Detect pitch from microphone input
     */
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
    
    /**
     * Detect pitch using autocorrelation algorithm
     * @returns Detected frequency
     */
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
        // Note: Volume check already done in detectPitch, but keeping RMS check here is fine too.
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
        // We need to start searching for the peak from a non-zero index
        // to avoid detecting DC offset or very low frequencies.
        // Let's find the first minimum and start searching after that.
        let firstMinimum = -1;
        for(let i = 1; i < bufferSize / 2; i++) { // Search only in the first half
            if (correlation[i] < correlation[i-1] && correlation[i] < correlation[i+1]) {
                firstMinimum = i;
                break;
            }
        }
        
        // If no clear minimum found, maybe the signal is noisy or constant?
        // Or if the minimum is too close to the start.
        if (firstMinimum <= 1) {
             firstMinimum = 1; // Default to starting search from index 1
        }
        
        // Find the absolute peak after the first minimum
        let peakIndex = firstMinimum;
        for (let i = firstMinimum + 1; i < bufferSize / 2; i++) { // Search only in the first half
            if (correlation[i] > correlation[peakIndex]) {
                peakIndex = i;
            }
        }
        
        // Check if a peak was actually found (correlation[peakIndex] should be positive)
        if (correlation[peakIndex] <= 0 || peakIndex === 0) {
            return 0; // No reliable peak found
        }
        
        // Refine the peak by interpolating using quadratic interpolation
        // Ensure we don't go out of bounds
        let refinedPeak = peakIndex;
        if (peakIndex > 0 && peakIndex < bufferSize - 1) {
            let peakValue = correlation[peakIndex];
            let leftValue = correlation[peakIndex - 1];
            let rightValue = correlation[peakIndex + 1];
            // Formula for quadratic interpolation of the peak
            let interpolation = 0.5 * (leftValue - rightValue) / (leftValue - 2 * peakValue + rightValue);
             // Check if interpolation is NaN or infinite, which can happen if denominator is zero
             if (isFinite(interpolation)) {
                 refinedPeak += interpolation;
             } else {
             }
        }
        
        // Calculate the frequency
        let frequency = 0;
        if (refinedPeak > 0) { // Avoid division by zero
             frequency = this.audioContext.sampleRate / refinedPeak;
        } else {
             console.log('Autocorrelation: Refined peak is zero or negative.');
        }
        
        // Basic sanity check for frequency range (e.g., human voice/instrument range)
        if (frequency < 50 || frequency > 2000) { // Adjust range as needed
             // console.log(`Autocorrelation: Frequency ${frequency.toFixed(2)} out of expected range (50-2000 Hz). Returning 0.`);
            // return 0; // Optionally filter out out-of-range frequencies
        }
        
        return frequency;
    }
    
    /**
     * Map frequency to musical note
     * @param frequency Frequency in Hz
     * @returns Musical note and accuracy
     */
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
                if (percentDiff <= 1.0) { // Within 1% of center frequency
                    accuracy = PitchAccuracy.PERFECT;
                } else if (percentDiff <= 2.5) { // Within 2.5% of center frequency
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
    
    /**
     * Update note stability counter
     * @param note Detected note
     */
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
    
    /**
     * Reset all note stability counters
     */
    private resetNoteStability(): void {
        for (let i = 0; i < 7; i++) {
            this.noteStabilityCounter.set(i as MusicalNote, 0);
        }
    }
    
    /**
     * Emit pitch detected event
     * @param frequency Detected frequency
     * @param note Detected note
     * @param accuracy Detection accuracy
     * @param volume Audio volume
     */
    private emitPitchDetected(frequency: number, note: MusicalNote | null, accuracy: PitchAccuracy, volume: number): void {
        const result: PitchDetectionResult = {
            frequency,
            note,
            accuracy,
            volume
        };
        
        PitchDetectionSystem.emit(PitchConstants.EVENTS.PITCH_DETECTED, result);
    }
    
    /**
     * Start calibration process
     * @param callback Callback function called when calibration is complete
     */
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
    
    /**
     * Get the current volume level
     * @returns Volume level (0-1)
     */
    public getVolumeLevel(): number {
        if (!this.analyzer) return 0;
        
        this.analyzer.getFloatTimeDomainData(this.analyzerBuffer);
        
        let sum = 0;
        for (let i = 0; i < this.analyzerBuffer.length; i++) {
            sum += this.analyzerBuffer[i] * this.analyzerBuffer[i];
        }
        
        return Math.sqrt(sum / this.analyzerBuffer.length);
    }
    
    /**
     * Set the volume threshold for detection
     * @param threshold Volume threshold (0-1)
     */
    public setVolumeThreshold(threshold: number): void {
        this.volumeThreshold = Math.max(0, Math.min(1, threshold));
    }
    
    /**
     * Get the current volume threshold
     * @returns Volume threshold (0-1)
     */
    public getVolumeThreshold(): number {
        return this.volumeThreshold;
    }
    
    /**
     * Add a listener for pitch detection events
     * @param eventName Event name
     * @param callback Callback function
     * @param target Target object
     */
    public static on(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget.on(eventName, callback, target);
    }
    
    /**
     * Remove a listener for pitch detection events
     * @param eventName Event name
     * @param callback Callback function
     * @param target Target object
     */
    public static off(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget.off(eventName, callback, target);
    }
    
    /**
     * Emit a pitch detection event
     * @param eventName Event name
     * @param arg1 First argument
     * @param arg2 Second argument
     * @param arg3 Third argument
     * @param arg4 Fourth argument
     * @param arg5 Fifth argument
     */
    private static emit(eventName: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any): void {
        this.eventTarget.emit(eventName, arg1, arg2, arg3, arg4, arg5);
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
}
