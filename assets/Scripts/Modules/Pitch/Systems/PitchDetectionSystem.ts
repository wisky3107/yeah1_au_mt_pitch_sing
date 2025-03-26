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
    private smoothingFactor: number = 0.8;
    private lastFrequency: number = 0;
    private lastNote: MusicalNote = null;
    private noteStabilityCounter: Map<MusicalNote, number> = new Map();
    private noteStabilityThreshold: number = 3; // Number of consecutive detections to confirm a note
    
    // Volume threshold for detection
    @property({ range: [0, 1], slide: true, tooltip: "Minimum volume level to detect pitch" })
    private volumeThreshold: number = 0.05;
    
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
    public async requestMicrophoneAccess(): Promise<boolean> {
        try {
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('getUserMedia is not supported in this browser');
                return false;
            }
            
            // Request microphone access
            this.microphoneStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: false
                }
            });
            
            // Create microphone source
            this.microphone = this.audioContext.createMediaStreamSource(this.microphoneStream);
            
            // Connect microphone to analyzer
            this.microphone.connect(this.analyzer);
            
            console.log('Microphone access granted');
            return true;
        } catch (error) {
            console.error('Failed to access microphone:', error);
            return false;
        }
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
        
        // Map frequency to note
        const { note, accuracy } = this.mapFrequencyToNote(smoothedFrequency);
        
        // Update note stability
        if (note !== null) {
            this.updateNoteStability(note);
            
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
        if (rms < this.volumeThreshold) {
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
        let peak = 0;
        for (let i = 1; i < bufferSize; i++) {
            if (correlation[i] > correlation[peak]) {
                peak = i;
            }
        }
        
        // Refine the peak by interpolating
        let peakValue = correlation[peak];
        let leftValue = correlation[peak - 1];
        let rightValue = correlation[peak + 1];
        let refinedPeak = peak + 0.5 * (leftValue - rightValue) / (leftValue - 2 * peakValue + rightValue);
        
        // Calculate the frequency
        let frequency = this.audioContext.sampleRate / refinedPeak;
        
        return frequency;
    }
    
    /**
     * Map frequency to musical note
     * @param frequency Frequency in Hz
     * @returns Musical note and accuracy
     */
    private mapFrequencyToNote(frequency: number): { note: MusicalNote | null, accuracy: PitchAccuracy } {
        if (frequency <= 0) {
            return { note: null, accuracy: PitchAccuracy.MISS };
        }
        
        // Check each note's frequency range
        for (let noteValue = 0; noteValue < 7; noteValue++) {
            const note = noteValue as MusicalNote;
            const [minFreq, maxFreq] = PitchConstants.FREQUENCY_RANGES[note];
            
            if (frequency >= minFreq && frequency <= maxFreq) {
                // Calculate how close to the center of the range
                const centerFreq = (minFreq + maxFreq) / 2;
                const distance = Math.abs(frequency - centerFreq);
                const rangeWidth = (maxFreq - minFreq) / 2;
                const normalizedDistance = distance / rangeWidth;
                
                // Determine accuracy based on distance from center
                let accuracy: PitchAccuracy;
                if (normalizedDistance < 0.3) {
                    accuracy = PitchAccuracy.PERFECT;
                } else if (normalizedDistance < 0.7) {
                    accuracy = PitchAccuracy.GOOD;
                } else {
                    accuracy = PitchAccuracy.MISS;
                }
                
                return { note, accuracy };
            }
        }
        
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
