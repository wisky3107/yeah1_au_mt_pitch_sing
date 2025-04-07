import { _decorator, Component, Node, screen, sys, UITransform, Widget, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIScreenScaler')
export class UIScreenScaler extends Component {
    @property(Node)
    targetNode: Node = null;

    @property
    designWidth: number = 1080;

    @property
    designHeight: number = 1920;

    private widget: Widget = null;
    private transform: UITransform = null;

    onLoad() {
        if (!this.targetNode) {
            this.targetNode = this.node;
        }

        this.widget = this.targetNode.getComponent(Widget);
        if (!this.widget) {
            this.widget = this.targetNode.addComponent(Widget);
        }
        this.transform = this.targetNode.getComponent(UITransform);

        // Register for window resize events
        view.on('design-resolution-changed', this.onScreenResize, this);
        view.on('canvas-resize', this.onScreenResize, this);

        // Initial setup
        this.onScreenResize();
    }

    onDestroy() {
        // Unregister from window resize events
        view.off('design-resolution-changed', this.onScreenResize, this);
        view.off('canvas-resize', this.onScreenResize, this);
    }

    private onScreenResize() {
        const visibleSize = view.getVisibleSize();
        const isMobile = sys.platform === sys.Platform.MOBILE_BROWSER;

        if (isMobile) {
            // For mobile, stretch both horizontally and vertically
            this.widget.isAlignLeft = true;
            this.widget.isAlignRight = true;
            this.widget.isAlignTop = true;
            this.widget.isAlignBottom = true;
            this.widget.left = 0;
            this.widget.right = 0;
            this.widget.top = 0;
            this.widget.bottom = 0;
        } else {
            // For desktop web, handle different aspect ratios
            const targetRatio = 9 / 16;
            const currentRatio = visibleSize.width / visibleSize.height;

            if (currentRatio > targetRatio) {
                // Screen is wider than 16:9
                const targetWidth = visibleSize.height * targetRatio;
                const horizontalOffset = (visibleSize.width - targetWidth) / 2;

                this.widget.isAlignLeft = true;
                this.widget.isAlignRight = true;
                this.widget.isAlignTop = true;
                this.widget.isAlignBottom = true;
                this.widget.left = horizontalOffset;
                this.widget.right = horizontalOffset;
                this.widget.top = 0;
                this.widget.bottom = 0;
            } else {
                // Screen ratio is between 9:16 and 16:9
                this.widget.isAlignLeft = true;
                this.widget.isAlignRight = true;
                this.widget.isAlignTop = true;
                this.widget.isAlignBottom = true;
                this.widget.left = 0;
                this.widget.right = 0;
                this.widget.top = 0;
                this.widget.bottom = 0;
            }
        }

        // Update widget
        this.widget.updateAlignment();
    }
} 