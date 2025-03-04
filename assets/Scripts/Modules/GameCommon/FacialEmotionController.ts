import { _decorator, Component, Node, SkinnedMeshRenderer, Material } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined set of emotions that can be displayed on the face
 */
export enum FacialEmotion {
    NEUTRAL = 'neutral',
    HAPPY = 'happy',
    SAD = 'sad',
    ANGRY = 'angry',
    SURPRISED = 'surprised',
    FEAR = 'fear',
    DISGUST = 'disgust',
}

/**
 * Controls facial expressions using blend shapes (morph targets)
 */
@ccclass('FacialEmotionController')
export class FacialEmotionController extends Component {
    // The skinned mesh renderer component that contains the blend shapes
    @property({type: SkinnedMeshRenderer})
    faceRenderer: SkinnedMeshRenderer | null = null;

    // Mapping of emotion names to blend shape configurations
    // Each emotion can affect multiple blend shapes with different weights
    @property({
        tooltip: 'Define emotions with blend shape weights'
    })
    emotions: {
        name: string,
        blendShapes: { name: string, weight: number }[]
    }[] = [];

    // Current emotion being displayed
    private currentEmotion: string = FacialEmotion.NEUTRAL;
    
    // For smooth transitions between emotions
    private isTransitioning: boolean = false;
    private transitionTime: number = 0;
    private transitionDuration: number = 0.5; // seconds
    private fromWeights: Map<string, number> = new Map();
    private toWeights: Map<string, number> = new Map();
    private blendShapeNames: string[] = [];
    
    // Material for controlling blend shapes via shader properties
    private faceMaterial: Material | null = null;

    start() {
        if (!this.faceRenderer) {
            console.error('Face renderer not assigned!');
            return;
        }

        // Get the material from the renderer
        if (this.faceRenderer.material) {
            this.faceMaterial = this.faceRenderer.material;
        }

        // Get all available blend shape names
        this.blendShapeNames = this.getBlendShapeNames();
        
        // Initialize with neutral expression
        this.setEmotion(FacialEmotion.NEUTRAL);
    }

    /**
     * Get all blend shape names from the mesh
     * Note: This is implementation-specific and may need to be adjusted
     * based on how your model's blend shapes are named
     */
    private getBlendShapeNames(): string[] {
        // This is a placeholder - you'll need to implement this based on your model
        // In Cocos Creator, you might need to inspect the model asset or use a naming convention
        
        // Example: If your model has blend shapes like "Happy", "Sad", etc.
        return ['eyeBrowUp', 'eyeBrowDown', 'eyeClose', 'mouthOpen', 'mouthSmile', 'mouthFrown'];
    }

    update(deltaTime: number) {
        // Handle smooth transitions between emotions
        if (this.isTransitioning && this.faceMaterial) {
            this.transitionTime += deltaTime;
            const t = Math.min(this.transitionTime / this.transitionDuration, 1.0);
            
            // Apply interpolated weights to each blend shape
            for (const name of this.blendShapeNames) {
                const fromWeight = this.fromWeights.get(name) || 0;
                const toWeight = this.toWeights.get(name) || 0;
                const weight = this.lerp(fromWeight, toWeight, this.easeInOutQuad(t));
                
                // Apply the weight to the blend shape
                this.applyBlendShapeWeight(name, weight);
            }
            
            if (this.transitionTime >= this.transitionDuration) {
                this.isTransitioning = false;
            }
        }
    }

    /**
     * Apply a weight to a specific blend shape
     * This is implementation-specific and depends on your model
     */
    private applyBlendShapeWeight(name: string, weight: number) {
        if (!this.faceMaterial) return;
        
        // In Cocos Creator, blend shapes are typically controlled via shader properties
        // The exact property name depends on your shader setup
        const propertyName = `blendShape_${name}`;
        
        // Set the blend shape weight as a shader property
        this.faceMaterial.setProperty(propertyName, weight);
    }

    /**
     * Set a facial emotion with an optional transition duration
     * @param emotion The emotion to display
     * @param transitionDuration Time in seconds to transition to this emotion (0 for instant)
     */
    public setEmotion(emotion: string, transitionDuration: number = 0.5) {
        if (!this.faceMaterial) return;
        
        // Find the emotion configuration
        const emotionConfig = this.emotions.find(e => e.name === emotion);
        if (!emotionConfig) {
            console.warn(`Emotion "${emotion}" not found`);
            return;
        }

        // Store current weights for transition
        if (transitionDuration > 0) {
            this.fromWeights.clear();
            
            // Store current weights of all blend shapes
            for (const name of this.blendShapeNames) {
                // Get current weight
                const currentWeight = this.getCurrentBlendShapeWeight(name);
                this.fromWeights.set(name, currentWeight);
            }
            
            // Prepare target weights
            this.toWeights.clear();
            for (const blendShape of emotionConfig.blendShapes) {
                this.toWeights.set(blendShape.name, blendShape.weight);
            }
            
            // Start transition
            this.isTransitioning = true;
            this.transitionTime = 0;
            this.transitionDuration = transitionDuration;
        } else {
            // Reset all blend shapes to 0
            for (const name of this.blendShapeNames) {
                this.applyBlendShapeWeight(name, 0);
            }
            
            // Apply the new emotion immediately
            for (const blendShape of emotionConfig.blendShapes) {
                this.applyBlendShapeWeight(blendShape.name, blendShape.weight);
            }
        }
        
        this.currentEmotion = emotion;
    }

    /**
     * Get the current weight of a blend shape
     * This is implementation-specific and depends on your model
     */
    private getCurrentBlendShapeWeight(name: string): number {
        if (!this.faceMaterial) return 0;
        
        // Get the blend shape weight from the shader property
        const propertyName = `blendShape_${name}`;
        
        // Try to get the property value, default to 0 if not found
        try {
            const value = this.faceMaterial.getProperty(propertyName);
            return typeof value === 'number' ? value : 0;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Get the current emotion
     */
    public getCurrentEmotion(): string {
        return this.currentEmotion;
    }

    /**
     * Linear interpolation helper
     */
    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }
    
    /**
     * Easing function for smoother transitions
     */
    private easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
} 