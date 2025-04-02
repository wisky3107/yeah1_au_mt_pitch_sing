import { _decorator, Component, Node, Prefab, Vec3, instantiate, tween, Color } from 'cc';
import { PitchBase } from './PitchBase';

const { ccclass, property } = _decorator;

/**
 * Handles waveform visualization for pitch detection
 * Displays real-time audio visualization around a microphone icon
 */
@ccclass('PitchWaveform')
export class PitchWaveform extends Component {
    // Waveform visualization properties
    @property({ type: [Node], group: { name: "Visualization", id: "visualization" } })
    private waveformLines: Node[] = [];

    @property({ type: Number, group: { name: "Visualization", id: "visualization" } })
    private numVisualizerLines: number = 64;

    @property({ type: Number, group: { name: "Visualization", id: "visualization" } })
    private visualizerRadius: number = 100;

    @property({ type: Number, group: { name: "Visualization", id: "visualization" } })
    private visualizerMinScale: number = 0.3;

    @property({ type: Number, group: { name: "Visualization", id: "visualization" } })
    private visualizerMaxScale: number = 1.5;

    @property({ type: Prefab, group: { name: "Visualization", id: "visualization" } })
    private waveformLinePrefab: Prefab = null;

    @property({ type: Node, group: { name: "Visualization", id: "visualization" } })
    private microphoneNode: Node = null;

    // Visualization optimization properties
    private lineTweens: any[] = [];
    private previousScales: number[] = [];
    private readonly SCALE_CHANGE_THRESHOLD: number = 0.01;
    private readonly TWEEN_DURATION: number = 0.1;

    /**
     * Initialize the waveform visualization
     */
    public initialize(microphone: Node = null): void {
        if (microphone) {
            this.microphoneNode = microphone;
        }

        if (!this.microphoneNode || !this.waveformLinePrefab) return;

        // Clear existing lines and tweens
        this.clearWaveformVisualization();

        // Create visualization lines
        for (let i = 0; i < this.numVisualizerLines; i++) {
            // Instantiate the line prefab
            const line = instantiate(this.waveformLinePrefab);
            if (!line) continue;

            // Position the line around the microphone in a circle
            const angle = (i / this.numVisualizerLines) * Math.PI * 2;
            const x = Math.cos(angle) * this.visualizerRadius;
            const y = Math.sin(angle) * this.visualizerRadius;
            line.setPosition(new Vec3(x, y, 0));
            line.setRotationFromEuler(0, 0, angle * (180 / Math.PI));

            // Set initial scale
            line.setScale(new Vec3(0.0, 1.0, 1.0));

            this.microphoneNode.addChild(line);
            line.setSiblingIndex(0);
            this.waveformLines.push(line);
            this.previousScales[i] = this.visualizerMinScale;
            this.lineTweens[i] = null;
        }
    }

    /**
     * Clear the waveform visualization
     */
    public clearWaveformVisualization(): void {
        // Stop all active tweens
        this.lineTweens.forEach(tween => {
            if (tween) tween.stop();
        });
        this.lineTweens = [];
        this.previousScales = [];

        // Destroy all lines
        this.waveformLines.forEach(line => {
            if (line) line.destroy();
        });
        this.waveformLines = [];
    }

    /**
     * Update the waveform visualization based on volume and frequency
     * @param volume Current audio volume
     * @param frequency Current detected frequency
     * @param pitchBase PitchBase instance that provides analyzer data
     */
    public updateWaveformVisualization(volume: number, frequency: number, pitchBase: PitchBase): void {
        if (!this.microphoneNode || this.waveformLines.length === 0) return;

        // Get analyzer data from pitch base
        const analyzerData = pitchBase.getAnalyzerData();
        if (!analyzerData) return;

        // Calculate data sampling interval for smoother visualization
        const samplingInterval = Math.floor(analyzerData.length / this.numVisualizerLines);

        // Update each line based on the analyzer data
        for (let i = 0; i < this.waveformLines.length; i++) {
            const line = this.waveformLines[i];
            if (!line) continue;

            // Get the frequency data for this line using improved sampling
            const dataIndex = Math.min(i * samplingInterval, analyzerData.length - 1);

            // Average multiple samples for smoother visualization
            let value = 0;
            const sampleCount = 3; // Number of samples to average
            for (let j = 0; j < sampleCount; j++) {
                const sampleIndex = Math.min(dataIndex + j, analyzerData.length - 1);
                value += analyzerData[sampleIndex];
            }
            value /= sampleCount;

            // Calculate scale based on the frequency data with volume influence
            const targetScale = this.visualizerMinScale +
                (value * (this.visualizerMaxScale - this.visualizerMinScale)) *
                Math.max(0.3, Math.min(1.0, volume * 2));

            // Only update if the scale change is significant
            if (Math.abs(targetScale - this.previousScales[i]) > this.SCALE_CHANGE_THRESHOLD) {
                // Stop existing tween
                if (this.lineTweens[i]) {
                    this.lineTweens[i].stop();
                }

                // Create and store new tween
                this.lineTweens[i] = tween(line)
                    .to(this.TWEEN_DURATION, { scale: new Vec3(targetScale, 1.0, 1.0) }, { easing: 'quadOut' })
                    .start();

                this.previousScales[i] = targetScale;
            }
        }
    }

    onDestroy() {
        this.clearWaveformVisualization();
    }
}
