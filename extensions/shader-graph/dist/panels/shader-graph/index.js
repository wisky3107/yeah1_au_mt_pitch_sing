"use strict";
'use state';
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vue_js_1 = tslib_1.__importDefault(require("vue/dist/vue.js"));
const view_1 = tslib_1.__importDefault(require("./view"));
const Shortcuts = tslib_1.__importStar(require("./shortcuts"));
const shader_graph_1 = require("../../shader-graph");
const shader_graph_2 = require("../../shader-graph");
let vm = null;
const options = {
    listeners: {},
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/shader-graph/style.css'), 'utf-8'),
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/shader-graph/index.html'), 'utf-8'),
    $: {
        forge: '#graph-forge',
        shaderGraph: '#shader-graph',
    },
    methods: {
        async openAsset(assetUuid, lastAssetUuid) {
            if (!vm)
                return;
            Editor.Panel.focus(shader_graph_1.PANEL_NAME);
            await shader_graph_1.GraphConfigMgr.Instance.autoSave(lastAssetUuid);
            await shader_graph_1.GraphAssetMgr.Instance.openAsset();
        },
        async onSceneReady() {
            if (!vm)
                return;
            if (shader_graph_1.GraphDataMgr.Instance.getDirty()) {
                await shader_graph_1.GraphAssetMgr.Instance.checkIfSave();
            }
            shader_graph_1.MessageMgr.Instance.setSceneReady(true);
            await (0, shader_graph_2.declareGraphBlock)();
            await shader_graph_1.GraphAssetMgr.Instance.load();
            shader_graph_1.MaskMgr.Instance.hide(shader_graph_2.MaskType.WaitLoad);
            shader_graph_1.MaskMgr.Instance.hide(shader_graph_2.MaskType.WaitSceneReady);
        },
        async onSceneClose() {
            if (!vm)
                return;
            shader_graph_1.MessageMgr.Instance.setSceneReady(false);
            shader_graph_1.MaskMgr.Instance.show(shader_graph_2.MaskType.WaitSceneReady);
        },
        onPopupCreateMenu() {
            if (!vm)
                return;
            shader_graph_1.Menu.Instance.popupCreateMenu();
        },
        onAssetAdd(uuid, info) {
            if (!vm || info.importer !== 'shader-graph')
                return;
            shader_graph_1.GraphAssetMgr.Instance.assetAdd(uuid, info);
        },
        onAssetDelete(uuid, info) {
            if (!vm || info.importer !== 'shader-graph')
                return;
            shader_graph_1.GraphAssetMgr.Instance.assetDelete(uuid, info);
        },
        onAssetChange(uuid, info) {
            if (!vm || info.importer !== 'shader-graph')
                return;
            shader_graph_1.GraphAssetMgr.Instance.assetChange(uuid, info);
        },
        ...Shortcuts,
    },
    async ready() {
        vm?.$destroy();
        vm = new vue_js_1.default({
            extends: view_1.default,
        });
        // 创建 shader graph View
        vm.$mount(this.$.shaderGraph);
    },
    async beforeClose() {
        await shader_graph_1.GraphConfigMgr.Instance.autoSave();
        if (shader_graph_1.GraphDataMgr.Instance.getDirty()) {
            await shader_graph_1.GraphAssetMgr.Instance.checkIfSave();
        }
    },
    close() {
        shader_graph_1.MessageMgr.Instance.unregisterAll();
        vm?.$destroy();
        vm = null;
    },
};
// @ts-ignore
module.exports = Editor.Panel.define(options);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcGFuZWxzL3NoYWRlci1ncmFwaC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsV0FBVyxDQUFDOzs7QUFDWix1Q0FBd0M7QUFDeEMsK0JBQTRCO0FBQzVCLHFFQUFrQztBQUVsQywwREFBaUM7QUFFakMsK0RBQXlDO0FBQ3pDLHFEQVE0QjtBQUU1QixxREFBaUU7QUFFakUsSUFBSSxFQUFFLEdBQVEsSUFBSSxDQUFDO0FBRW5CLE1BQU0sT0FBTyxHQUFHO0lBQ1osU0FBUyxFQUFFLEVBQUU7SUFDYixLQUFLLEVBQUUsSUFBQSx1QkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSx3Q0FBd0MsQ0FBQyxFQUFFLE9BQU8sQ0FBQztJQUN2RixRQUFRLEVBQUUsSUFBQSx1QkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSx5Q0FBeUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQztJQUMzRixDQUFDLEVBQUU7UUFDQyxLQUFLLEVBQUUsY0FBYztRQUNyQixXQUFXLEVBQUUsZUFBZTtLQUMvQjtJQUNELE9BQU8sRUFBRTtRQUNMLEtBQUssQ0FBQyxTQUFTLENBQUMsU0FBaUIsRUFBRSxhQUFxQjtZQUNwRCxJQUFJLENBQUMsRUFBRTtnQkFBRSxPQUFPO1lBQ2hCLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLHlCQUFVLENBQUMsQ0FBQztZQUUvQixNQUFNLDZCQUFjLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN0RCxNQUFNLDRCQUFhLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzdDLENBQUM7UUFDRCxLQUFLLENBQUMsWUFBWTtZQUNkLElBQUksQ0FBQyxFQUFFO2dCQUFFLE9BQU87WUFFaEIsSUFBSSwyQkFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDbEMsTUFBTSw0QkFBYSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQzthQUM5QztZQUVELHlCQUFVLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4QyxNQUFNLElBQUEsZ0NBQWlCLEdBQUUsQ0FBQztZQUMxQixNQUFNLDRCQUFhLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3BDLHNCQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyx1QkFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pDLHNCQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyx1QkFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFDRCxLQUFLLENBQUMsWUFBWTtZQUNkLElBQUksQ0FBQyxFQUFFO2dCQUFFLE9BQU87WUFFaEIseUJBQVUsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pDLHNCQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyx1QkFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFDRCxpQkFBaUI7WUFDYixJQUFJLENBQUMsRUFBRTtnQkFBRSxPQUFPO1lBRWhCLG1CQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3BDLENBQUM7UUFDRCxVQUFVLENBQUMsSUFBWSxFQUFFLElBQWU7WUFDcEMsSUFBSSxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLGNBQWM7Z0JBQUUsT0FBTztZQUVwRCw0QkFBYSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFDRCxhQUFhLENBQUMsSUFBWSxFQUFFLElBQWU7WUFDdkMsSUFBSSxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLGNBQWM7Z0JBQUUsT0FBTztZQUVwRCw0QkFBYSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFDRCxhQUFhLENBQUMsSUFBWSxFQUFFLElBQWU7WUFDdkMsSUFBSSxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLGNBQWM7Z0JBQUUsT0FBTztZQUVwRCw0QkFBYSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFDRCxHQUFHLFNBQVM7S0FDZjtJQUNELEtBQUssQ0FBQyxLQUFLO1FBQ1AsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDO1FBQ2YsRUFBRSxHQUFHLElBQUksZ0JBQUcsQ0FBQztZQUNULE9BQU8sRUFBRSxjQUFXO1NBQ3ZCLENBQUMsQ0FBQztRQUVILHVCQUF1QjtRQUN2QixFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUNELEtBQUssQ0FBQyxXQUFXO1FBQ2IsTUFBTSw2QkFBYyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN6QyxJQUFJLDJCQUFZLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFO1lBQ2xDLE1BQU0sNEJBQWEsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDOUM7SUFDTCxDQUFDO0lBQ0QsS0FBSztRQUNELHlCQUFVLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3BDLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQztRQUNmLEVBQUUsR0FBRyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0osQ0FBQztBQUVGLGFBQWE7QUFDYixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdGF0ZSc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgVnVlIGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5cbmltcG9ydCBTaGFkZXJHcmFwaCBmcm9tICcuL3ZpZXcnO1xuXG5pbXBvcnQgKiBhcyBTaG9ydGN1dHMgZnJvbSAnLi9zaG9ydGN1dHMnO1xuaW1wb3J0IHtcbiAgICBHcmFwaEFzc2V0TWdyLFxuICAgIEdyYXBoRGF0YU1ncixcbiAgICBNYXNrTWdyLFxuICAgIE1lbnUsXG4gICAgTWVzc2FnZU1ncixcbiAgICBHcmFwaENvbmZpZ01ncixcbiAgICBQQU5FTF9OQU1FLFxufSBmcm9tICcuLi8uLi9zaGFkZXItZ3JhcGgnO1xuaW1wb3J0IHsgQXNzZXRJbmZvIH0gZnJvbSAnQGNvY29zL2NyZWF0b3ItdHlwZXMvZWRpdG9yL3BhY2thZ2VzL2Fzc2V0LWRiL0B0eXBlcy9wdWJsaWMnO1xuaW1wb3J0IHsgTWFza1R5cGUsIGRlY2xhcmVHcmFwaEJsb2NrIH0gZnJvbSAnLi4vLi4vc2hhZGVyLWdyYXBoJztcblxubGV0IHZtOiBhbnkgPSBudWxsO1xuXG5jb25zdCBvcHRpb25zID0ge1xuICAgIGxpc3RlbmVyczoge30sXG4gICAgc3R5bGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL3N0YXRpYy9zaGFkZXItZ3JhcGgvc3R5bGUuY3NzJyksICd1dGYtOCcpLFxuICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvc2hhZGVyLWdyYXBoL2luZGV4Lmh0bWwnKSwgJ3V0Zi04JyksXG4gICAgJDoge1xuICAgICAgICBmb3JnZTogJyNncmFwaC1mb3JnZScsXG4gICAgICAgIHNoYWRlckdyYXBoOiAnI3NoYWRlci1ncmFwaCcsXG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIGFzeW5jIG9wZW5Bc3NldChhc3NldFV1aWQ6IHN0cmluZywgbGFzdEFzc2V0VXVpZDogc3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAoIXZtKSByZXR1cm47XG4gICAgICAgICAgICBFZGl0b3IuUGFuZWwuZm9jdXMoUEFORUxfTkFNRSk7XG5cbiAgICAgICAgICAgIGF3YWl0IEdyYXBoQ29uZmlnTWdyLkluc3RhbmNlLmF1dG9TYXZlKGxhc3RBc3NldFV1aWQpO1xuICAgICAgICAgICAgYXdhaXQgR3JhcGhBc3NldE1nci5JbnN0YW5jZS5vcGVuQXNzZXQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgYXN5bmMgb25TY2VuZVJlYWR5KCkge1xuICAgICAgICAgICAgaWYgKCF2bSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoR3JhcGhEYXRhTWdyLkluc3RhbmNlLmdldERpcnR5KCkpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBHcmFwaEFzc2V0TWdyLkluc3RhbmNlLmNoZWNrSWZTYXZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIE1lc3NhZ2VNZ3IuSW5zdGFuY2Uuc2V0U2NlbmVSZWFkeSh0cnVlKTtcbiAgICAgICAgICAgIGF3YWl0IGRlY2xhcmVHcmFwaEJsb2NrKCk7XG4gICAgICAgICAgICBhd2FpdCBHcmFwaEFzc2V0TWdyLkluc3RhbmNlLmxvYWQoKTtcbiAgICAgICAgICAgIE1hc2tNZ3IuSW5zdGFuY2UuaGlkZShNYXNrVHlwZS5XYWl0TG9hZCk7XG4gICAgICAgICAgICBNYXNrTWdyLkluc3RhbmNlLmhpZGUoTWFza1R5cGUuV2FpdFNjZW5lUmVhZHkpO1xuICAgICAgICB9LFxuICAgICAgICBhc3luYyBvblNjZW5lQ2xvc2UoKSB7XG4gICAgICAgICAgICBpZiAoIXZtKSByZXR1cm47XG5cbiAgICAgICAgICAgIE1lc3NhZ2VNZ3IuSW5zdGFuY2Uuc2V0U2NlbmVSZWFkeShmYWxzZSk7XG4gICAgICAgICAgICBNYXNrTWdyLkluc3RhbmNlLnNob3coTWFza1R5cGUuV2FpdFNjZW5lUmVhZHkpO1xuICAgICAgICB9LFxuICAgICAgICBvblBvcHVwQ3JlYXRlTWVudSgpIHtcbiAgICAgICAgICAgIGlmICghdm0pIHJldHVybjtcblxuICAgICAgICAgICAgTWVudS5JbnN0YW5jZS5wb3B1cENyZWF0ZU1lbnUoKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25Bc3NldEFkZCh1dWlkOiBzdHJpbmcsIGluZm86IEFzc2V0SW5mbykge1xuICAgICAgICAgICAgaWYgKCF2bSB8fCBpbmZvLmltcG9ydGVyICE9PSAnc2hhZGVyLWdyYXBoJykgcmV0dXJuO1xuXG4gICAgICAgICAgICBHcmFwaEFzc2V0TWdyLkluc3RhbmNlLmFzc2V0QWRkKHV1aWQsIGluZm8pO1xuICAgICAgICB9LFxuICAgICAgICBvbkFzc2V0RGVsZXRlKHV1aWQ6IHN0cmluZywgaW5mbzogQXNzZXRJbmZvKSB7XG4gICAgICAgICAgICBpZiAoIXZtIHx8IGluZm8uaW1wb3J0ZXIgIT09ICdzaGFkZXItZ3JhcGgnKSByZXR1cm47XG5cbiAgICAgICAgICAgIEdyYXBoQXNzZXRNZ3IuSW5zdGFuY2UuYXNzZXREZWxldGUodXVpZCwgaW5mbyk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uQXNzZXRDaGFuZ2UodXVpZDogc3RyaW5nLCBpbmZvOiBBc3NldEluZm8pIHtcbiAgICAgICAgICAgIGlmICghdm0gfHwgaW5mby5pbXBvcnRlciAhPT0gJ3NoYWRlci1ncmFwaCcpIHJldHVybjtcblxuICAgICAgICAgICAgR3JhcGhBc3NldE1nci5JbnN0YW5jZS5hc3NldENoYW5nZSh1dWlkLCBpbmZvKTtcbiAgICAgICAgfSxcbiAgICAgICAgLi4uU2hvcnRjdXRzLFxuICAgIH0sXG4gICAgYXN5bmMgcmVhZHkoKSB7XG4gICAgICAgIHZtPy4kZGVzdHJveSgpO1xuICAgICAgICB2bSA9IG5ldyBWdWUoe1xuICAgICAgICAgICAgZXh0ZW5kczogU2hhZGVyR3JhcGgsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOWIm+W7uiBzaGFkZXIgZ3JhcGggVmlld1xuICAgICAgICB2bS4kbW91bnQodGhpcy4kLnNoYWRlckdyYXBoKTtcbiAgICB9LFxuICAgIGFzeW5jIGJlZm9yZUNsb3NlKCkge1xuICAgICAgICBhd2FpdCBHcmFwaENvbmZpZ01nci5JbnN0YW5jZS5hdXRvU2F2ZSgpO1xuICAgICAgICBpZiAoR3JhcGhEYXRhTWdyLkluc3RhbmNlLmdldERpcnR5KCkpIHtcbiAgICAgICAgICAgIGF3YWl0IEdyYXBoQXNzZXRNZ3IuSW5zdGFuY2UuY2hlY2tJZlNhdmUoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIE1lc3NhZ2VNZ3IuSW5zdGFuY2UudW5yZWdpc3RlckFsbCgpO1xuICAgICAgICB2bT8uJGRlc3Ryb3koKTtcbiAgICAgICAgdm0gPSBudWxsO1xuICAgIH0sXG59O1xuXG4vLyBAdHMtaWdub3JlXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvci5QYW5lbC5kZWZpbmUob3B0aW9ucyk7XG4iXX0=