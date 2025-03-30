import { _decorator, Component, Node, Sprite, UITransform, Color, Gradient } from 'cc';
import { MusicalNote } from '../Systems/PitchConstants';
const { ccclass, property } = _decorator;

@ccclass('PitchTile')
export class PitchTile extends Component {
    @property(Sprite)
    private sprite: Sprite = null;

    @property(UITransform)
    private transform: UITransform = null;

    @property(Sprite)
    private progressSprite: Sprite = null;

    @property(UITransform)
    private progressTransform: UITransform = null;


    private note: MusicalNote = null;
    private duration: number = 0;
    private scrollSpeed: number = 0;
    private currentProgress: number = 0;
    private isActive: boolean = false;

    private readonly gradientColors: Color[] = [
        new Color(255, 255, 255, 150), // White
        new Color(255, 255, 0, 150),   // Yellow
        new Color(0, 255, 0, 150)      // Green
    ];

    private readonly gradientStops: number[] = [0, 0.8, 1];

    public initialize(note: MusicalNote, duration: number, scrollSpeed: number): void {
        this.note = note;
        this.duration = duration;
        this.scrollSpeed = scrollSpeed;
        this.currentProgress = 0;
        this.isActive = false;

        // Set width based on duration and scroll speed
        const width = duration * scrollSpeed;
        if (this.transform) {
            this.transform.setContentSize(width, this.transform.height);
        }

        // Reset progress sprite
        if (this.progressTransform) {
            this.progressTransform.setContentSize(0, this.progressTransform.height);
        }
        if (this.progressSprite) {
            this.progressSprite.color = this.gradientColors[0];
        }
    }

    public updateProgress(deltaTime: number): void {
        if (!this.isActive) return;

        this.currentProgress = Math.min(1, this.currentProgress + (deltaTime / this.duration));
        
        if (this.progressTransform && this.transform) {
            const targetWidth = this.transform.width * this.currentProgress;
            this.progressTransform.setContentSize(targetWidth, this.progressTransform.height);
            
            // Update color based on progress using gradient
            if (this.progressSprite) {
                this.progressSprite.color = this.getGradientColor(this.currentProgress);
            }
        }
    }

    public setActive(active: boolean): void {
        this.isActive = active;
        if (this.progressSprite) {
            this.progressSprite.color = active ? this.gradientColors[2] : this.gradientColors[0];
        }
    }

    private getGradientColor(progress: number): Color {
        // Find the two colors to interpolate between
        let startIndex = 0;
        let endIndex = 0;
        let t = 0;

        for (let i = 0; i < this.gradientStops.length - 1; i++) {
            if (progress >= this.gradientStops[i] && progress <= this.gradientStops[i + 1]) {
                startIndex = i;
                endIndex = i + 1;
                t = (progress - this.gradientStops[i]) / (this.gradientStops[i + 1] - this.gradientStops[i]);
                break;
            }
        }

        const startColor = this.gradientColors[startIndex];
        const endColor = this.gradientColors[endIndex];

        return new Color(
            startColor.r + (endColor.r - startColor.r) * t,
            startColor.g + (endColor.g - startColor.g) * t,
            startColor.b + (endColor.b - startColor.b) * t,
            255
        );
    }

    public getProgress(): number {
        return this.currentProgress;
    }

    public isComplete(): boolean {
        return this.currentProgress >= 1;
    }

    public getNote(): MusicalNote {
        return this.note;
    }

    public getDuration(): number {
        return this.duration;
    }

    public updateDurationProgress(progress: number): void {
        if (this.progressTransform && this.transform) {
            const targetWidth = this.transform.width * progress;
            this.progressTransform.setContentSize(targetWidth, this.progressTransform.height);
            
            // Update color based on progress using gradient
            if (this.progressSprite) {
                this.progressSprite.color = this.getGradientColor(progress);
            }
        }
    }
} 