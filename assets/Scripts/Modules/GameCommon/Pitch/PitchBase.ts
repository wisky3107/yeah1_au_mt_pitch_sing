import { _decorator, Component, EventTarget } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Base class for pitch detection systems
 * Contains common functionality for microphone access and audio processing
 */
@ccclass('PitchBase')
export class PitchBase extends Component {
    //#region Event Management
    protected static eventTarget: EventTarget = new EventTarget();

    public static on(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget.on(eventName, callback, target);
    }

    public static off(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget.off(eventName, callback, target);
    }

    public static emit(eventName: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any): void {
        this.eventTarget.emit(eventName, arg1, arg2, arg3, arg4, arg5);
    }
    //#endregion

    //#region Audio Properties
    protected audioContext: AudioContext = null;
    protected analyzer: AnalyserNode = null;
    protected microphone: MediaStreamAudioSourceNode = null;
    protected microphoneStream: MediaStream = null;
    protected analyzerBuffer: Float32Array = null;
    protected bufferSize: number = 2048;
    //#endregion

    //#region Detection Properties
    protected isDetecting: boolean = false;
    protected detectionInterval: number = null;
    protected detectionIntervalMs: number = 50; // Default value, can be overridden by subclasses
    protected smoothingFactor: number = 0.6;
    protected lastFrequency: number = 0;
    //#endregion

    //#region Configuration Properties
    @property({ range: [0, 1], slide: true, tooltip: "Minimum volume level to detect pitch", group: { name: "Detection Settings", id: "detection" } })
    protected volumeThreshold: number = 0.005;
    //#endregion

    //#region Lifecycle Methods
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

    /**
     * Main pitch detection method to be implemented by subclasses
     */
    protected detectPitch(): void {
        // To be implemented by subclasses
    }
    //#endregion

    //#region Autocorrelation Algorithm
    /**
     * Detect pitch using autocorrelation algorithm
     * @returns The detected frequency in Hz, or 0 if no pitch detected
     */
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
            console.log('Autocorrelation: Refined peak is zero or negative.');
        }

        return frequency;
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
