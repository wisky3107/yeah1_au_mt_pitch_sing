import { _decorator, Component, Label, Node, ProgressBar, Sprite } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';

const { ccclass, property } = _decorator;

interface ProcessLoadingData {
    message?: string;
    progress?: number;
    getProgress?: () => number;
}

/**
 * A loading popup that displays a progress bar and optional message
 */
@ccclass('PopupProcessLoading')
export class PopupProcessLoading extends PopupBase {
    @property(Label)
    private lbMessage: Label = null;

    @property(Sprite)
    private progressBar: Sprite = null;

    @property(Label)
    private lbProgress: Label = null;

    private currentProgress: number = 0;

    /**
     * Shows the loading popup with optional message and progress
     * @param data Loading data containing message and progress
     * @param callback Callback when show animation completes
     */
    show(data: ProcessLoadingData, callback?: () => void): void {
        super.show(data, callback);
        
        if (!data) return;

        // Set message if provided
        if (this.lbMessage) {
            this.lbMessage.string = data.message || "Loading...";
        }

        // Initialize progress
        this.currentProgress = data.progress || 0;
        
        this.updateProgress(this.currentProgress);
    }

    private updateProgress(progress: number): void {
        // Clamp progress between 0 and 1
        const clampedProgress = Math.max(0, Math.min(1, progress));
        
        // Update progress bar
        if (this.progressBar) {
            this.progressBar.fillRange = clampedProgress;
        }

        // Update progress label if present
        if (this.lbProgress) {
            this.lbProgress.string = `${Math.floor(clampedProgress * 100)}%`;
        }
    }

    public setProgress(progress: number): void {
        this.currentProgress = progress;
        this.updateProgress(progress);
    }

    public setMessage(message: string): void {
        if (this.lbMessage) {
            this.lbMessage.string = message;
        }
    }
} 