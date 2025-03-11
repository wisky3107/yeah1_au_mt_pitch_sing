import { _decorator, Component, Node, Prefab, Button, UITransform, Sprite, SpriteFrame, Color, Label, UIOpacity, Vec2, Vec3, tween } from 'cc';
import { AuditionNoteType } from '../Systems/AuditionNotePool';
import { AuditionNote } from '../Systems/AuditionNote';
import { AuditionNoteVisual } from '../Prefabs/AuditionNoteVisual';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Editor helper for generating Audition note prefabs
 * This component provides a guide and utility for creating note prefabs
 * with proper visual and gameplay components
 */
@ccclass('AuditionNotePrefabGenerator')
@executeInEditMode
export class AuditionNotePrefabGenerator extends Component {
    // Prefab directory settings
    @property
    private prefabSavePath: string = 'assets/Prefabs/Audition/Notes';
    
    // Visual configuration
    @property
    private noteSize: number = 100;
    
    @property
    private leftNoteColor: Color = new Color(79, 195, 247);  // Light blue
    
    @property
    private rightNoteColor: Color = new Color(255, 112, 67); // Coral red
    
    @property
    private spaceNoteColor: Color = new Color(255, 235, 59); // Yellow
    
    @property
    private glowColor: Color = new Color(255, 255, 255, 180); // White with alpha
    
    // Test buttons (only in editor)
    @property(Button)
    private generateLeftNoteBtn: Button = null;
    
    @property(Button)
    private generateRightNoteBtn: Button = null;
    
    @property(Button)
    private generateSpaceNoteBtn: Button = null;
    
    // Status info
    @property(Label)
    private statusLabel: Label = null;
    
    // Editor flag - since this component has the @executeInEditMode decorator, 
    // this code will only run in the editor anyway
    onLoad() {
        // Set up button listeners
        if (this.generateLeftNoteBtn) {
            this.generateLeftNoteBtn.node.on(Button.EventType.CLICK, () => {
                this.generateNotePrefab(AuditionNoteType.LEFT);
            });
        }
        
        if (this.generateRightNoteBtn) {
            this.generateRightNoteBtn.node.on(Button.EventType.CLICK, () => {
                this.generateNotePrefab(AuditionNoteType.RIGHT);
            });
        }
        
        if (this.generateSpaceNoteBtn) {
            this.generateSpaceNoteBtn.node.on(Button.EventType.CLICK, () => {
                this.generateNotePrefab(AuditionNoteType.SPACE);
            });
        }
    }
    
    /**
     * Generate a note prefab of specified type
     * This provides a template structure for creating note prefabs in the editor
     * @param noteType Type of note to generate
     */
    private generateNotePrefab(noteType: AuditionNoteType): void {
        this.updateStatus(`Creating ${this.getNoteTypeName(noteType)} note prefab...`);
        
        // Create note node structure
        const noteNode = new Node(this.getNoteTypeName(noteType) + 'Note');
        
        // Set up transform
        const transform = noteNode.addComponent(UITransform);
        transform.width = this.noteSize;
        transform.height = this.noteSize;
        
        // Add opacity component for animations
        const opacity = noteNode.addComponent(UIOpacity);
        opacity.opacity = 255;
        
        // Create main note shape
        const noteShapeNode = new Node('NoteShape');
        noteShapeNode.parent = noteNode;
        
        const noteShapeTransform = noteShapeNode.addComponent(UITransform);
        noteShapeTransform.width = this.noteSize * 0.9;
        noteShapeTransform.height = this.noteSize * 0.9;
        
        const noteSprite = noteShapeNode.addComponent(Sprite);
        noteSprite.type = Sprite.Type.FILLED;
        noteSprite.fillType = Sprite.FillType.RADIAL;
        noteSprite.fillCenter = new Vec2(0.5, 0.5);
        noteSprite.fillStart = 0;
        noteSprite.fillRange = 1;
        
        // Set color based on note type
        switch (noteType) {
            case AuditionNoteType.LEFT:
                noteSprite.color = this.leftNoteColor;
                break;
            case AuditionNoteType.RIGHT:
                noteSprite.color = this.rightNoteColor;
                break;
            case AuditionNoteType.SPACE:
                noteSprite.color = this.spaceNoteColor;
                break;
        }
        
        // Create glow effect
        const glowNode = new Node('Glow');
        glowNode.parent = noteNode;
        glowNode.active = false; // Initially hidden
        
        const glowTransform = glowNode.addComponent(UITransform);
        glowTransform.width = this.noteSize * 1.2;
        glowTransform.height = this.noteSize * 1.2;
        
        const glowSprite = glowNode.addComponent(Sprite);
        glowSprite.type = Sprite.Type.FILLED;
        glowSprite.fillType = Sprite.FillType.RADIAL;
        glowSprite.fillCenter = new Vec2(0.5, 0.5);
        glowSprite.fillStart = 0;
        glowSprite.fillRange = 1;
        glowSprite.color = this.glowColor;
        
        // Create key label
        const keyLabelNode = new Node('KeyLabel');
        keyLabelNode.parent = noteNode;
        
        const keyLabelTransform = keyLabelNode.addComponent(UITransform);
        keyLabelTransform.width = this.noteSize * 0.8;
        keyLabelTransform.height = this.noteSize * 0.8;
        
        const keyLabel = keyLabelNode.addComponent(Label);
        keyLabel.fontSize = this.noteSize * 0.4;
        keyLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        keyLabel.verticalAlign = Label.VerticalAlign.CENTER;
        keyLabel.cacheMode = Label.CacheMode.NONE;
        
        // Set key label based on note type
        switch (noteType) {
            case AuditionNoteType.LEFT:
                keyLabel.string = '←';
                break;
            case AuditionNoteType.RIGHT:
                keyLabel.string = '→';
                break;
            case AuditionNoteType.SPACE:
                keyLabel.string = '↑';
                break;
        }
        
        // Add required components
        const noteComponent = noteNode.addComponent(AuditionNote);
        const noteVisual = noteNode.addComponent(AuditionNoteVisual);
        
        // Add a note that in actual runtime these components would be connected
        // but we can't directly set private properties in editor code
        this.updateStatus(`Components added. When using in the game, connect:
        - noteVisual.noteSprite to ${noteShapeNode.name}
        - noteVisual.glowSprite to ${glowNode.name}
        - noteVisual.keyLabel to ${keyLabelNode.name}
        - noteComponent.noteVisual to noteVisual`);
        
        this.updateStatus(`${this.getNoteTypeName(noteType)} note prefab structure created!`);
        this.updateStatus('To complete prefab creation:');
        this.updateStatus('1. Drag this node to your Assets folder');
        this.updateStatus('2. Create a prefab from it');
        this.updateStatus('3. Configure materials and textures');
        this.updateStatus('4. Connect the component references in the Inspector');
        
        // In Cocos Creator, you need to manually add the created node to the scene
        // and then drag it to the Assets panel to create a prefab
    }
    
    /**
     * Helper to get a user-friendly note type name
     */
    private getNoteTypeName(noteType: AuditionNoteType): string {
        switch (noteType) {
            case AuditionNoteType.LEFT:
                return 'Left';
            case AuditionNoteType.RIGHT:
                return 'Right';
            case AuditionNoteType.SPACE:
                return 'Space';
            default:
                return 'Unknown';
        }
    }
    
    /**
     * Update status message in editor
     */
    private updateStatus(message: string): void {
        console.log('[AuditionNotePrefabGenerator]', message);
        
        if (this.statusLabel) {
            this.statusLabel.string += message + '\n';
        }
    }
} 