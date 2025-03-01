"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewManager = void 0;
const shader_graph_preview_1 = require("./shader-graph-preview");
class PreviewManager {
    constructor() {
        this.loaded = false;
    }
    async load() {
        if (!this.loaded) {
            // 要确保编辑器预览插件比这个先注册
            const ccePreview = cce.Preview;
            await ccePreview.initPreview('shader-graph-preview', 'query-shader-graph-preview-data', shader_graph_preview_1.shaderGraphPreview);
            this.loaded = true;
        }
    }
    unload() { }
}
exports.PreviewManager = PreviewManager;
const previewManager = new PreviewManager();
exports.default = previewManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29udHJpYnV0aW9ucy9wcmV2aWV3L2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlFQUE0RDtBQUc1RCxNQUFhLGNBQWM7SUFBM0I7UUFDSSxXQUFNLEdBQUcsS0FBSyxDQUFDO0lBVW5CLENBQUM7SUFURyxLQUFLLENBQUMsSUFBSTtRQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2QsbUJBQW1CO1lBQ25CLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUM7WUFDL0IsTUFBTSxVQUFVLENBQUMsV0FBVyxDQUFDLHNCQUFzQixFQUFFLGlDQUFpQyxFQUFFLHlDQUFrQixDQUFDLENBQUM7WUFDNUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7U0FDdEI7SUFDTCxDQUFDO0lBQ0QsTUFBTSxLQUFJLENBQUM7Q0FDZDtBQVhELHdDQVdDO0FBQ0QsTUFBTSxjQUFjLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztBQUM1QyxrQkFBZSxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzaGFkZXJHcmFwaFByZXZpZXcgfSBmcm9tICcuL3NoYWRlci1ncmFwaC1wcmV2aWV3JztcbmRlY2xhcmUgY29uc3QgY2NlOiBhbnk7XG5cbmV4cG9ydCBjbGFzcyBQcmV2aWV3TWFuYWdlciB7XG4gICAgbG9hZGVkID0gZmFsc2U7XG4gICAgYXN5bmMgbG9hZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxvYWRlZCkge1xuICAgICAgICAgICAgLy8g6KaB56Gu5L+d57yW6L6R5Zmo6aKE6KeI5o+S5Lu25q+U6L+Z5Liq5YWI5rOo5YaMXG4gICAgICAgICAgICBjb25zdCBjY2VQcmV2aWV3ID0gY2NlLlByZXZpZXc7XG4gICAgICAgICAgICBhd2FpdCBjY2VQcmV2aWV3LmluaXRQcmV2aWV3KCdzaGFkZXItZ3JhcGgtcHJldmlldycsICdxdWVyeS1zaGFkZXItZ3JhcGgtcHJldmlldy1kYXRhJywgc2hhZGVyR3JhcGhQcmV2aWV3KTtcbiAgICAgICAgICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1bmxvYWQoKSB7fVxufVxuY29uc3QgcHJldmlld01hbmFnZXIgPSBuZXcgUHJldmlld01hbmFnZXIoKTtcbmV4cG9ydCBkZWZhdWx0IHByZXZpZXdNYW5hZ2VyO1xuIl19