import { _decorator, Component, Node, UITransform, Vec3, tween, instantiate, Layers, Label } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { UIRunningLabel } from '../../../Common/UI/UIRunningLabel';
import { GameManager } from '../../../Managers/GameManager';

const { ccclass, property } = _decorator;

/**
 * Popup that highlights nodes on screen with a dialog box containing running text
 */
@ccclass('PopupHighlight')
export class PopupHighlight extends PopupBase {
    @property(UIRunningLabel)
    lbMessage: UIRunningLabel = null;

    @property(Node)
    nodeDialog: Node = null;

    @property(Label)
    lbFandomName: Label = null;

    @property(Node)
    nodeHighlightContainer: Node = null;

    @property
    private dialogAnimDuration: number = 0.5;

    private message: string = '';
    private isTextDone: boolean = false;
    private clonedNodes: Node[] = [];
    private originalNodes: Node[] = [];
    private onDone: () => void = null;

    /**
     * Shows the highlight popup with the given message and nodes to highlight
     * @param data Data containing message text and nodes to highlight
     * @param callback Callback when show animation completes
     */
    show(data: { message: string, nodes: Node[], onDone: () => void }, callback?: () => void): void {
        super.show(data, callback);

        if (!data) return;
        this.onDone = data.onDone;

        this.message = data.message;
        this.originalNodes = data.nodes || [];
        this.isTextDone = false;

        // Clear any previous cloned nodes
        this.clearClonedNodes();

        // Clone all the original nodes
        if (this.originalNodes.length > 0) {
            this.cloneNodes();
        }
        
        const fandomModel = GameManager.instance.getFandomModel();
        const currentCharacter = fandomModel.getCurrentFandomCharacter();
        this.lbFandomName.string = currentCharacter.name;
    }

    /**
     * Called after show animation completes
     */
    shown(): void {
        super.shown();
        // Position the dialog node
        this.positionDialogNode(() => {
            // Start the running text animation
            this.lbMessage.setText(this.message, 1.0, () => {
                this.isTextDone = true;
            });
        });
    }

    /**
     * Clones all the original nodes to be highlighted
     */
    private cloneNodes(): void {
        this.originalNodes.forEach(originalNode => {
            if (!originalNode) return;

            const clonedNode = instantiate(originalNode);
            clonedNode.setParent(this.nodeHighlightContainer, true);

            // Keep track of cloned nodes
            this.clonedNodes.push(clonedNode);

            // Copy world position and scale
            const worldPos = originalNode.worldPosition.clone();
            clonedNode.worldPosition = worldPos;

            clonedNode.layer = this.node.layer; 
            clonedNode.children.forEach(child => {
                child.layer = clonedNode.layer;
            });

            // Copy world scale
            const worldScale = originalNode.worldScale.clone();
            clonedNode.worldScale = worldScale;
        });
    }

    /**
     * Calculates the min/max Y positions of all cloned nodes and positions the dialog
     */
    private positionDialogNode(onDone: () => void): void {
        if (this.clonedNodes.length === 0 || !this.nodeDialog) return;

        let minY = Number.MAX_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;

        // Find min and max Y positions of all cloned nodes
        this.clonedNodes.forEach(node => {
            const uiTransform = node.getComponent(UITransform);
            if (!uiTransform) return;

            const nodePos = node.position;
            const nodeHeight = uiTransform.height;

            const topY = nodePos.y + nodeHeight / 2;
            const bottomY = nodePos.y - nodeHeight / 2;

            minY = Math.min(minY, bottomY);
            maxY = Math.max(maxY, topY);
        });

        // Set dialog position based on empty space
        const dialogHeight = this.nodeDialog.getComponent(UITransform)?.height || 0;

        // Initial hidden position (off-screen)
        const startPos = new Vec3(0, minY - dialogHeight - 50, 0);
        this.nodeDialog.position = startPos;

        // Determine target position based on the condition
        let targetPos: Vec3;
        if (dialogHeight - maxY > minY) {
            targetPos = new Vec3(0, maxY + dialogHeight / 2 + 20, 0);
        } else {
            targetPos = new Vec3(0, minY - dialogHeight / 2 - 20, 0);
        }

        // Tween dialog into position
        tween(this.nodeDialog)
            .to(this.dialogAnimDuration, { position: targetPos }, { easing: 'backOut' })
            .call(() => {
                onDone?.();
            })
            .start();
    }

    /**
     * Clears all cloned nodes
     */
    private clearClonedNodes(): void {
        this.clonedNodes.forEach(node => {
            if (node && node.isValid) {
                node.removeFromParent();
                node.destroy();
            }
        });
        this.clonedNodes = [];
    }

    /**
     * Called when the entire popup is touched
     */
    onTouch_Popup(): void {
        if (this.isTextDone) {
            this.doUImanagerHide();
            return;
        }

        // Skip text animation and show full text immediately
        this.lbMessage.setText(this.message, 0.0, () => {
            this.isTextDone = true;
        });
    }



    hided(): void {
        super.hided();
        this.clearClonedNodes();
        this.onDone?.();
        this.onDone = null;
    }
} 