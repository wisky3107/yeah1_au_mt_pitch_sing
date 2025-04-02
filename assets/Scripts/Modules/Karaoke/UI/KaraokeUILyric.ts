import { _decorator, Component, UITransform, tween, Node, Vec3, UIOpacity, Label, Color } from 'cc';

const { ccclass, property } = _decorator;

/**
 * Component for individual lyric display in the karaoke UI
 * To be used as a prefab for object pooling
 */
@ccclass('KaraokeUILyric')
export class KaraokeUILyric extends Component {
    @property({ type: Label, tooltip: "Label component for the lyric" })
    private label: Label = null;

    @property({ tooltip: "Duration of fade out animation in seconds" })
    private fadeOutDuration: number = 0.5;

    @property({ tooltip: "Color for current lyric" })
    private currentColor: Color = new Color(255, 255, 255, 255);

    @property({ tooltip: "Color for past lyric" })
    private pastColor: Color = new Color(136, 136, 136, 255);

    @property({ tooltip: "Color for future lyric" })
    private futureColor: Color = new Color(204, 204, 204, 255);

    private _index: number = -1;
    private _isInUse: boolean = false;
    private _currentTween: any = null;
    private _uiOpacity: UIOpacity = null;

    onLoad() {
        // Get or add UIOpacity component
        this._uiOpacity = this.getComponent(UIOpacity);
        if (!this._uiOpacity) {
            this._uiOpacity = this.addComponent(UIOpacity);
        }
    }

    /**
     * Initialize with lyric text and index
     */
    public init(text: string, index: number): void {
        this._index = index;
        this._isInUse = true;

        // Stop any existing animation
        this.stopFadeAnimation();

        // Reset opacity
        if (this._uiOpacity) {
            this._uiOpacity.opacity = 255;
        }

        if (this.label) {
            this.label.string = text;
        }
    }

    /**
     * Set the highlight state of the lyric
     */
    public setHighlightState(state: 'current' | 'past' | 'future'): void {
        if (!this.label) return;

        switch (state) {
            case 'current':
                this.label.color = this.currentColor;
                this.label.isBold = true;
                break;
            case 'past':
                this.label.color = this.pastColor;
                this.label.isBold = false;
                break;
            case 'future':
                this.label.color = this.futureColor;
                this.label.isBold = false;
                break;
        }
    }

    /**
     * Fade out the lyric and call onComplete callback when done
     */
    public fadeOut(onComplete?: () => void): void {
        // Stop any existing animation
        this.stopFadeAnimation();

        // Ensure we have UIOpacity component
        if (!this._uiOpacity) {
            this._uiOpacity = this.getComponent(UIOpacity);
            if (!this._uiOpacity) {
                this._uiOpacity = this.addComponent(UIOpacity);
            }
        }

        // Start fade out animation
        this._currentTween = tween(this._uiOpacity)
            .to(this.fadeOutDuration, { opacity: 0 })
            .call(() => {
                this._currentTween = null;
                if (onComplete) {
                    onComplete();
                }
            })
            .start();
    }

    /**
     * Stop current fade animation if it exists
     */
    private stopFadeAnimation(): void {
        if (this._currentTween) {
            this._currentTween.stop();
            this._currentTween = null;
        }
    }

    /**
     * Get the height of this lyric component
     */
    public getHeight(): number {
        return this.getAccurateHeight();
        // const transform = this.getComponent(UITransform);
        // return transform ? transform.height : 50;
    }

    /**
     * Get accurate height after forcing layout update
     */
    public getAccurateHeight(): number {
        // Force update layout
        if (this.label) {
            this.label.updateRenderData(true);
        }
        
        const transform = this.getComponent(UITransform);
        return transform ? transform.height : 50;
    }

    /**
     * Get the lyric index
     */
    public getIndex(): number {
        return this._index;
    }

    /**
     * Check if this lyric is currently in use
     */
    public isInUse(): boolean {
        return this._isInUse;
    }

    /**
     * Recycle this lyric object (return to pool)
     */
    public recycle(): void {
        // Stop any running animations
        this.stopFadeAnimation();
        
        // Reset opacity
        if (this._uiOpacity) {
            this._uiOpacity.opacity = 255;
        }
        
        this._isInUse = false;
        this._index = -1;
        // Don't need to reset string as it will be overwritten when reused
    }

    /**
     * Get height in the next frame with callback
     * @param callback Function to call with the accurate height
     */
    public getHeightNextFrame(callback: (height: number) => void): void {
        this.scheduleOnce(() => {
            const transform = this.getComponent(UITransform);
            const height = transform ? transform.height : 50;
            callback(height);
        }, 0);
    }
} 