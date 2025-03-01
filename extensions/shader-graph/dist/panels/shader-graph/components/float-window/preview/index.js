"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.component = exports.getConfig = exports.DefaultConfig = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const vue_js_1 = require("vue/dist/vue.js");
const base_1 = tslib_1.__importDefault(require("../base"));
const common_1 = require("../common");
const internal_1 = require("../internal");
const shader_graph_1 = require("../../../../../shader-graph");
const utils_1 = require("../utils");
const BOX_MESH = '1263d74c-8167-4928-91a6-4e2672411f47@a804a';
exports.DefaultConfig = {
    key: 'preview',
    tab: {
        name: 'i18n:shader-graph.preview.menu_name',
        show: true,
        height: 80,
    },
    base: {
        title: 'i18n:shader-graph.preview.title',
        width: '223px',
        height: '228px',
        minWidth: '223px',
        minHeight: '228px',
        defaultShow: false,
    },
    position: {
        right: '28px',
        bottom: '0',
    },
    events: {
        resizer: true,
        drag: true,
        enableAspectRatio: true,
        target: internal_1.FloatWindowDragTarget.header,
    },
    details: {
        primitive: BOX_MESH,
        lightEnable: true,
    },
};
function getConfig() {
    const newConfig = JSON.parse(JSON.stringify(exports.DefaultConfig));
    const config = shader_graph_1.GraphConfigMgr.Instance.getFloatingWindowConfigByName(exports.DefaultConfig.key);
    if (config) {
        newConfig.details = (0, lodash_1.merge)({}, newConfig.details, config);
    }
    return newConfig;
}
exports.getConfig = getConfig;
exports.component = (0, vue_js_1.defineComponent)({
    components: {
        BaseFloatWindow: base_1.default,
    },
    props: {
        ...common_1.commonProps,
    },
    emits: [...common_1.commonEmits],
    setup(props, ctx) {
        const common = (0, common_1.commonLogic)(props, ctx);
        const glPreview = (0, vue_js_1.ref)();
        const initPreviewDone = (0, vue_js_1.ref)(false);
        const initGL = (0, vue_js_1.ref)(false);
        const previewDirty = (0, vue_js_1.ref)(true);
        const loading = (0, vue_js_1.ref)(true);
        const animationId = (0, vue_js_1.ref)(-1);
        const lightRef = (0, vue_js_1.ref)();
        const previewCanvas = (0, vue_js_1.ref)();
        const previewConfig = (0, vue_js_1.ref)({
            primitive: '',
            lightEnable: false,
        });
        async function callPreview(funcName, ...args) {
            if (!initPreviewDone.value)
                return;
            await Editor.Message.request('scene', 'call-preview-function', 'shader-graph-preview', funcName, ...args);
            previewDirty.value = true;
        }
        async function updateConfigToPreview(config) {
            await callPreview('setLightEnable', config.lightEnable);
            await callPreview('setPrimitive', config.primitive);
        }
        async function updateMaterial() {
            if (!initPreviewDone.value || !common.isShow())
                return;
            loading.value = true;
            await shader_graph_1.MessageMgr.Instance.callSceneMethod('updateMaterial', [shader_graph_1.GraphDataMgr.Instance.getCurrentGraphData()]);
            loading.value = false;
            previewDirty.value = true;
        }
        const aspectRatio = -1;
        async function refreshPreview() {
            if (previewDirty.value) {
                previewDirty.value = false;
                const canvas = previewCanvas.value;
                if (!canvas)
                    return;
                const width = canvas.clientWidth === 0 ? canvas.parentNode.clientWidth : canvas.clientWidth;
                const height = width;
                // 等比缩放
                if (canvas.width !== width || !initGL.value) {
                    initGL.value = true;
                    await glPreview.value.initGL(canvas, { width, height });
                    await glPreview.value.resizeGL(width, height);
                }
                const data = await glPreview.value.queryPreviewData({
                    width,
                    height: height,
                });
                glPreview.value.drawGL(data);
            }
            cancelAnimationFrame(animationId.value);
            animationId.value = requestAnimationFrame(() => {
                refreshPreview();
            });
        }
        async function onMouseDownOnCanvas(event) {
            await callPreview('onMouseDown', { x: event.x, y: event.y, button: event.button });
            async function mousemove(event) {
                await callPreview('onMouseMove', {
                    movementX: event.movementX,
                    movementY: event.movementY,
                });
            }
            async function mouseup(event) {
                await callPreview('onMouseUp', {
                    x: event.x,
                    y: event.y,
                });
                document.removeEventListener('mousemove', mousemove);
                document.removeEventListener('mouseup', mouseup);
                previewDirty.value = false;
            }
            document.addEventListener('mousemove', mousemove);
            document.addEventListener('mouseup', mouseup);
        }
        async function onMouseWheelOnCanvas(event) {
            const scale = event.deltaY * 0.01;
            await callPreview('setZoom', scale);
        }
        function addEventListenerToCanvas() {
            const canvas = previewCanvas.value;
            canvas.addEventListener('mousedown', onMouseDownOnCanvas);
            canvas.addEventListener('mousewheel', onMouseWheelOnCanvas);
        }
        function removeEventListenerToCanvas() {
            const canvas = previewCanvas.value;
            canvas.removeEventListener('mousedown', onMouseDownOnCanvas);
            canvas.removeEventListener('mousewheel', onMouseWheelOnCanvas);
        }
        const onSizeChangedDebounced = (0, lodash_1.debounce)(() => {
            if (!common.isShow())
                return;
            initPreview().then(() => {
                previewDirty.value = true;
            });
        }, 50);
        common.onSizeChanged = () => {
            onSizeChangedDebounced();
        };
        const onPreviewChangeDebounced = (0, lodash_1.debounce)(async (dirty, type) => {
            if (!common.isShow())
                return;
            if (dirty && type !== 'position-changed') {
                await initPreview();
                await updateMaterial();
            }
        }, 50);
        async function onInitPreview() {
            if (!common.isShow() || !shader_graph_1.GraphAssetMgr.Instance.uuid)
                return;
            await initPreview();
            const { primitive, lightEnable } = props.config.details;
            if (previewConfig.value.primitive !== primitive ||
                previewConfig.value.lightEnable !== lightEnable) {
                previewConfig.value = {
                    primitive: primitive || BOX_MESH,
                    lightEnable: lightEnable,
                };
                applyPreviewConfigToUI();
            }
            await updateMaterial();
        }
        shader_graph_1.MessageMgr.Instance.register(shader_graph_1.MessageType.SceneReady, onInitPreview);
        shader_graph_1.MessageMgr.Instance.register(shader_graph_1.MessageType.SetGraphDataToForge, onInitPreview);
        shader_graph_1.MessageMgr.Instance.register(shader_graph_1.MessageType.DirtyChanged, onPreviewChangeDebounced);
        async function initPreview(force = false) {
            if (!initPreviewDone.value || force) {
                initPreviewDone.value = true;
                await shader_graph_1.MessageMgr.Instance.callSceneMethod('initPreview', [previewConfig.value]);
                // @ts-expect-error
                const GlPreview = Editor._Module.require('PreviewExtends').default;
                glPreview.value = new GlPreview('shader-graph-preview', 'query-shader-graph-preview-data');
                glPreview.value.init({
                    width: previewCanvas.value.clientWidth,
                    height: previewCanvas.value.clientHeight,
                });
                addEventListenerToCanvas();
                refreshPreview();
            }
        }
        common.onShow = async () => {
            if (await shader_graph_1.MessageMgr.Instance.checkSceneReady()) {
                await onInitPreview();
            }
        };
        function reset() {
            initPreviewDone.value = false;
            initGL.value = false;
            removeEventListenerToCanvas();
            cancelAnimationFrame(animationId.value);
        }
        const commonHide = common.hide;
        common.hide = async () => {
            commonHide();
            reset();
            await shader_graph_1.GraphConfigMgr.Instance.autoSave();
        };
        const commonShow = common.show;
        common.show = async (position) => {
            if (!(0, utils_1.validatePosition)(position)) {
                const config = shader_graph_1.GraphConfigMgr.Instance.getFloatingWindowConfigByName(exports.DefaultConfig.key);
                position = (0, utils_1.validatePosition)(config?.position) ? config?.position : exports.DefaultConfig.position;
            }
            commonShow(position);
        };
        async function onClose() {
            common.hide();
        }
        async function onRefresh() {
            reset();
            initGL.value = false;
            await initPreview(true);
            await updateMaterial();
        }
        function applyPreviewConfigToUI() {
            onLightChange(previewConfig.value.lightEnable, false);
        }
        function onLightChange(enabled, save = true) {
            if (enabled) {
                lightRef.value?.setAttribute('pressed', '');
            }
            else {
                lightRef.value?.removeAttribute('pressed');
            }
            const { primitive } = previewConfig.value;
            previewConfig.value = {
                primitive: primitive,
                lightEnable: enabled,
            };
            updateConfigToPreview(previewConfig.value);
            if (save) {
                shader_graph_1.GraphConfigMgr.Instance.saveDetails(exports.DefaultConfig.key, previewConfig.value);
            }
        }
        function onPrimitiveChange(event) {
            callPreview('resetCamera');
            const target = event.target;
            const { lightEnable } = previewConfig.value;
            previewConfig.value = {
                primitive: target.value,
                lightEnable: lightEnable,
            };
            updateConfigToPreview(previewConfig.value);
            shader_graph_1.GraphConfigMgr.Instance.saveDetails(exports.DefaultConfig.key, previewConfig.value);
        }
        return {
            ...common,
            previewCanvas,
            previewConfig,
            loading,
            onClose,
            onRefresh,
            lightRef,
            onLightChange,
            onPrimitiveChange,
        };
    },
    template: (0, common_1.commonTemplate)({
        css: 'preview',
        header: `
<ui-label class="title-label" value="i18n:shader-graph.preview.title"></ui-label>
<ui-icon class="close" transparent
  tooltip="i18n:shader-graph.preview.close.tooltip"
  value="collapse-right"
  @click="onClose"
></ui-icon>
        `,
        section: `
            <canvas ref="previewCanvas"></canvas>
            <ui-loading class="loading" v-show="loading"></ui-loading>
            <div class="tools">
              <ui-icon class="light"
                ref="lightRef"
                value="spot-light"
                @mousedown.stop="onLightChange(previewConfig.lightEnable=!previewConfig.lightEnable)"
              ></ui-icon>
              <ui-icon
                type="icon"
                class="refresh"
                value="refresh"
                @mousedown.stop="onRefresh" 
              ></ui-icon>
            </div>
            <div class="primitive-group">
                <ui-label slot="label" value="i18n:shader-graph.preview.mesh"></ui-label>
                <ui-asset slot="content" droppable="cc.Mesh" 
                    :value="previewConfig.primitive"
                    @change.stop="onPrimitiveChange"
                ></ui-asset>
            </div>
        `,
        footer: ``,
    }),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvcGFuZWxzL3NoYWRlci1ncmFwaC9jb21wb25lbnRzL2Zsb2F0LXdpbmRvdy9wcmV2aWV3L2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxtQ0FBeUM7QUFDekMsNENBQXVEO0FBRXZELDJEQUFzQztBQUN0QyxzQ0FBa0Y7QUFDbEYsMENBQXVFO0FBQ3ZFLDhEQUFtSDtBQUVuSCxvQ0FBNEM7QUFFNUMsTUFBTSxRQUFRLEdBQUcsNENBQTRDLENBQUM7QUFFakQsUUFBQSxhQUFhLEdBQXNCO0lBQzVDLEdBQUcsRUFBRSxTQUFTO0lBQ2QsR0FBRyxFQUFFO1FBQ0QsSUFBSSxFQUFFLHFDQUFxQztRQUMzQyxJQUFJLEVBQUUsSUFBSTtRQUNWLE1BQU0sRUFBRSxFQUFFO0tBQ2I7SUFDRCxJQUFJLEVBQUU7UUFDRixLQUFLLEVBQUUsaUNBQWlDO1FBQ3hDLEtBQUssRUFBRSxPQUFPO1FBQ2QsTUFBTSxFQUFFLE9BQU87UUFDZixRQUFRLEVBQUUsT0FBTztRQUNqQixTQUFTLEVBQUUsT0FBTztRQUNsQixXQUFXLEVBQUUsS0FBSztLQUNyQjtJQUNELFFBQVEsRUFBRTtRQUNOLEtBQUssRUFBRSxNQUFNO1FBQ2IsTUFBTSxFQUFFLEdBQUc7S0FDZDtJQUNELE1BQU0sRUFBRTtRQUNKLE9BQU8sRUFBRSxJQUFJO1FBQ2IsSUFBSSxFQUFFLElBQUk7UUFDVixpQkFBaUIsRUFBRSxJQUFJO1FBQ3ZCLE1BQU0sRUFBRSxnQ0FBcUIsQ0FBQyxNQUFNO0tBQ3ZDO0lBQ0QsT0FBTyxFQUFFO1FBQ0wsU0FBUyxFQUFFLFFBQVE7UUFDbkIsV0FBVyxFQUFFLElBQUk7S0FDcEI7Q0FDSixDQUFDO0FBRUYsU0FBZ0IsU0FBUztJQUNyQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMscUJBQWEsQ0FBQyxDQUFDLENBQUM7SUFDNUQsTUFBTSxNQUFNLEdBQUcsNkJBQWMsQ0FBQyxRQUFRLENBQUMsNkJBQTZCLENBQUMscUJBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN4RixJQUFJLE1BQU0sRUFBRTtRQUNSLFNBQVMsQ0FBQyxPQUFPLEdBQUcsSUFBQSxjQUFLLEVBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDNUQ7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNyQixDQUFDO0FBUEQsOEJBT0M7QUFFWSxRQUFBLFNBQVMsR0FBRyxJQUFBLHdCQUFlLEVBQUM7SUFDckMsVUFBVSxFQUFFO1FBQ1IsZUFBZSxFQUFmLGNBQWU7S0FDbEI7SUFFRCxLQUFLLEVBQUU7UUFDSCxHQUFHLG9CQUFXO0tBQ2pCO0lBRUQsS0FBSyxFQUFFLENBQUMsR0FBRyxvQkFBVyxDQUFDO0lBRXZCLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRztRQUNaLE1BQU0sTUFBTSxHQUFHLElBQUEsb0JBQVcsRUFBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDdkMsTUFBTSxTQUFTLEdBQUcsSUFBQSxZQUFHLEdBQUUsQ0FBQztRQUN4QixNQUFNLGVBQWUsR0FBRyxJQUFBLFlBQUcsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUNuQyxNQUFNLE1BQU0sR0FBRyxJQUFBLFlBQUcsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUMxQixNQUFNLFlBQVksR0FBRyxJQUFBLFlBQUcsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixNQUFNLE9BQU8sR0FBRyxJQUFBLFlBQUcsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUMxQixNQUFNLFdBQVcsR0FBRyxJQUFBLFlBQUcsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVCLE1BQU0sUUFBUSxHQUFHLElBQUEsWUFBRyxHQUFlLENBQUM7UUFDcEMsTUFBTSxhQUFhLEdBQUcsSUFBQSxZQUFHLEdBQUUsQ0FBQztRQUM1QixNQUFNLGFBQWEsR0FBRyxJQUFBLFlBQUcsRUFBZ0I7WUFDckMsU0FBUyxFQUFFLEVBQUU7WUFDYixXQUFXLEVBQUUsS0FBSztTQUNyQixDQUFDLENBQUM7UUFFSCxLQUFLLFVBQVUsV0FBVyxDQUFDLFFBQWdCLEVBQUUsR0FBRyxJQUFXO1lBQ3ZELElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSztnQkFBRSxPQUFPO1lBQ25DLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLHVCQUF1QixFQUFFLHNCQUFzQixFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzFHLFlBQVksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQzlCLENBQUM7UUFFRCxLQUFLLFVBQVUscUJBQXFCLENBQUMsTUFBcUI7WUFDdEQsTUFBTSxXQUFXLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sV0FBVyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVELEtBQUssVUFBVSxjQUFjO1lBQ3pCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtnQkFBRSxPQUFPO1lBRXZELE9BQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLE1BQU0seUJBQVUsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLGdCQUFnQixFQUFFLENBQUMsMkJBQVksQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0csT0FBTyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDdEIsWUFBWSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDOUIsQ0FBQztRQUVELE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLEtBQUssVUFBVSxjQUFjO1lBQ3pCLElBQUksWUFBWSxDQUFDLEtBQUssRUFBRTtnQkFDcEIsWUFBWSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7Z0JBRTNCLE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxNQUFNO29CQUFFLE9BQU87Z0JBRXBCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxXQUFXLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztnQkFDNUYsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDO2dCQUVyQixPQUFPO2dCQUNQLElBQUksTUFBTSxDQUFDLEtBQUssS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO29CQUN6QyxNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztvQkFDcEIsTUFBTSxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztvQkFDeEQsTUFBTSxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7aUJBQ2pEO2dCQUNELE1BQU0sSUFBSSxHQUFHLE1BQU0sU0FBUyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztvQkFDaEQsS0FBSztvQkFDTCxNQUFNLEVBQUUsTUFBTTtpQkFDakIsQ0FBQyxDQUFDO2dCQUNILFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ2hDO1lBRUQsb0JBQW9CLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hDLFdBQVcsQ0FBQyxLQUFLLEdBQUcscUJBQXFCLENBQUMsR0FBRyxFQUFFO2dCQUMzQyxjQUFjLEVBQUUsQ0FBQztZQUNyQixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFFRCxLQUFLLFVBQVUsbUJBQW1CLENBQUMsS0FBaUI7WUFDaEQsTUFBTSxXQUFXLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBRW5GLEtBQUssVUFBVSxTQUFTLENBQUMsS0FBaUI7Z0JBQ3RDLE1BQU0sV0FBVyxDQUFDLGFBQWEsRUFBRTtvQkFDN0IsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO29CQUMxQixTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7aUJBQzdCLENBQUMsQ0FBQztZQUNQLENBQUM7WUFFRCxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQWlCO2dCQUNwQyxNQUFNLFdBQVcsQ0FBQyxXQUFXLEVBQUU7b0JBQzNCLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDVixDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7aUJBQ2IsQ0FBQyxDQUFDO2dCQUVILFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3JELFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRWpELFlBQVksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQy9CLENBQUM7WUFDRCxRQUFRLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2xELFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVELEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxLQUFpQjtZQUNqRCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUNsQyxNQUFNLFdBQVcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUVELFNBQVMsd0JBQXdCO1lBQzdCLE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUM7WUFDbkMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQsU0FBUywyQkFBMkI7WUFDaEMsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQztZQUNuQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFFRCxNQUFNLHNCQUFzQixHQUFHLElBQUEsaUJBQVEsRUFBQyxHQUFHLEVBQUU7WUFDekMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Z0JBQUUsT0FBTztZQUU3QixXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNwQixZQUFZLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUM5QixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVQLE1BQU0sQ0FBQyxhQUFhLEdBQUcsR0FBRyxFQUFFO1lBQ3hCLHNCQUFzQixFQUFFLENBQUM7UUFDN0IsQ0FBQyxDQUFDO1FBRUYsTUFBTSx3QkFBd0IsR0FBRyxJQUFBLGlCQUFRLEVBQUMsS0FBSyxFQUFFLEtBQWMsRUFBRSxJQUFhLEVBQUUsRUFBRTtZQUM5RSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtnQkFBRSxPQUFPO1lBRTdCLElBQUksS0FBSyxJQUFJLElBQUksS0FBSyxrQkFBa0IsRUFBRTtnQkFDdEMsTUFBTSxXQUFXLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxjQUFjLEVBQUUsQ0FBQzthQUMxQjtRQUNMLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVQLEtBQUssVUFBVSxhQUFhO1lBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyw0QkFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJO2dCQUFFLE9BQU87WUFFN0QsTUFBTSxXQUFXLEVBQUUsQ0FBQztZQUNwQixNQUFNLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBUSxDQUFDO1lBQ3pELElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxTQUFTLEtBQUssU0FBUztnQkFDM0MsYUFBYSxDQUFDLEtBQUssQ0FBQyxXQUFXLEtBQUssV0FBVyxFQUFFO2dCQUNqRCxhQUFhLENBQUMsS0FBSyxHQUFHO29CQUNsQixTQUFTLEVBQUUsU0FBUyxJQUFJLFFBQVE7b0JBQ2hDLFdBQVcsRUFBRSxXQUFXO2lCQUMzQixDQUFDO2dCQUNGLHNCQUFzQixFQUFFLENBQUM7YUFDNUI7WUFDRCxNQUFNLGNBQWMsRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCx5QkFBVSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsMEJBQVcsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDcEUseUJBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLDBCQUFXLENBQUMsbUJBQW1CLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDN0UseUJBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLDBCQUFXLENBQUMsWUFBWSxFQUFFLHdCQUF3QixDQUFDLENBQUM7UUFFakYsS0FBSyxVQUFVLFdBQVcsQ0FBQyxLQUFLLEdBQUcsS0FBSztZQUNwQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssSUFBSSxLQUFLLEVBQUU7Z0JBQ2pDLGVBQWUsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO2dCQUM3QixNQUFNLHlCQUFVLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDaEYsbUJBQW1CO2dCQUNuQixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDbkUsU0FBUyxDQUFDLEtBQUssR0FBRyxJQUFJLFNBQVMsQ0FBQyxzQkFBc0IsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO2dCQUMzRixTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztvQkFDakIsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLLENBQUMsV0FBVztvQkFDdEMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxLQUFLLENBQUMsWUFBWTtpQkFDM0MsQ0FBQyxDQUFDO2dCQUNILHdCQUF3QixFQUFFLENBQUM7Z0JBQzNCLGNBQWMsRUFBRSxDQUFDO2FBQ3BCO1FBQ0wsQ0FBQztRQUVELE1BQU0sQ0FBQyxNQUFNLEdBQUcsS0FBSyxJQUFJLEVBQUU7WUFDdkIsSUFBSSxNQUFNLHlCQUFVLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxFQUFFO2dCQUM3QyxNQUFNLGFBQWEsRUFBRSxDQUFDO2FBQ3pCO1FBQ0wsQ0FBQyxDQUFDO1FBRUYsU0FBUyxLQUFLO1lBQ1YsZUFBZSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDOUIsTUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDckIsMkJBQTJCLEVBQUUsQ0FBQztZQUM5QixvQkFBb0IsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDL0IsTUFBTSxDQUFDLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTtZQUNyQixVQUFVLEVBQUUsQ0FBQztZQUNiLEtBQUssRUFBRSxDQUFDO1lBQ1IsTUFBTSw2QkFBYyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QyxDQUFDLENBQUM7UUFFRixNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQy9CLE1BQU0sQ0FBQyxJQUFJLEdBQUcsS0FBSyxFQUFFLFFBQTJFLEVBQUUsRUFBRTtZQUNoRyxJQUFJLENBQUMsSUFBQSx3QkFBZ0IsRUFBQyxRQUFRLENBQUMsRUFBRTtnQkFDN0IsTUFBTSxNQUFNLEdBQUcsNkJBQWMsQ0FBQyxRQUFRLENBQUMsNkJBQTZCLENBQUMscUJBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEYsUUFBUSxHQUFHLElBQUEsd0JBQWdCLEVBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxxQkFBYSxDQUFDLFFBQVEsQ0FBQzthQUM3RjtZQUNELFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6QixDQUFDLENBQUM7UUFFRixLQUFLLFVBQVUsT0FBTztZQUNsQixNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDbEIsQ0FBQztRQUVELEtBQUssVUFBVSxTQUFTO1lBQ3BCLEtBQUssRUFBRSxDQUFDO1lBQ1IsTUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDckIsTUFBTSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEIsTUFBTSxjQUFjLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRUQsU0FBUyxzQkFBc0I7WUFDM0IsYUFBYSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFRCxTQUFTLGFBQWEsQ0FBQyxPQUFnQixFQUFFLElBQUksR0FBRyxJQUFJO1lBQ2hELElBQUksT0FBTyxFQUFFO2dCQUNULFFBQVEsQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQzthQUMvQztpQkFBTTtnQkFDSCxRQUFRLENBQUMsS0FBSyxFQUFFLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUM5QztZQUVELE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDO1lBQzFDLGFBQWEsQ0FBQyxLQUFLLEdBQUc7Z0JBQ2xCLFNBQVMsRUFBRSxTQUFTO2dCQUNwQixXQUFXLEVBQUUsT0FBTzthQUN2QixDQUFDO1lBQ0YscUJBQXFCLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNDLElBQUksSUFBSSxFQUFFO2dCQUNOLDZCQUFjLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxxQkFBYSxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDL0U7UUFDTCxDQUFDO1FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxLQUFrQjtZQUN6QyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDM0IsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQTBCLENBQUM7WUFDaEQsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUM7WUFDNUMsYUFBYSxDQUFDLEtBQUssR0FBRztnQkFDbEIsU0FBUyxFQUFFLE1BQU0sQ0FBQyxLQUFLO2dCQUN2QixXQUFXLEVBQUUsV0FBVzthQUMzQixDQUFDO1lBQ0YscUJBQXFCLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNDLDZCQUFjLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxxQkFBYSxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVELE9BQU87WUFDSCxHQUFHLE1BQU07WUFFVCxhQUFhO1lBQ2IsYUFBYTtZQUViLE9BQU87WUFFUCxPQUFPO1lBQ1AsU0FBUztZQUVULFFBQVE7WUFFUixhQUFhO1lBQ2IsaUJBQWlCO1NBQ3BCLENBQUM7SUFDTixDQUFDO0lBRUQsUUFBUSxFQUFFLElBQUEsdUJBQWMsRUFBQztRQUNyQixHQUFHLEVBQUUsU0FBUztRQUNkLE1BQU0sRUFBRTs7Ozs7OztTQU9QO1FBQ0QsT0FBTyxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztTQXVCUjtRQUNELE1BQU0sRUFBRSxFQUFFO0tBQ2IsQ0FBQztDQUNMLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG1lcmdlLCBkZWJvdW5jZSB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBkZWZpbmVDb21wb25lbnQsIHJlZiB9IGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5cbmltcG9ydCBCYXNlRmxvYXRXaW5kb3cgZnJvbSAnLi4vYmFzZSc7XG5pbXBvcnQgeyBjb21tb25FbWl0cywgY29tbW9uTG9naWMsIGNvbW1vblByb3BzLCBjb21tb25UZW1wbGF0ZSB9IGZyb20gJy4uL2NvbW1vbic7XG5pbXBvcnQgeyBGbG9hdFdpbmRvd0NvbmZpZywgRmxvYXRXaW5kb3dEcmFnVGFyZ2V0IH0gZnJvbSAnLi4vaW50ZXJuYWwnO1xuaW1wb3J0IHsgR3JhcGhEYXRhTWdyLCBNZXNzYWdlTWdyLCBHcmFwaENvbmZpZ01nciwgTWVzc2FnZVR5cGUsIEdyYXBoQXNzZXRNZ3IgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9zaGFkZXItZ3JhcGgnO1xuaW1wb3J0IHsgUHJldmlld0NvbmZpZyB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL2NvbnRyaWJ1dGlvbnMvaW50ZXJuYWwnO1xuaW1wb3J0IHsgdmFsaWRhdGVQb3NpdGlvbiB9IGZyb20gJy4uL3V0aWxzJztcblxuY29uc3QgQk9YX01FU0ggPSAnMTI2M2Q3NGMtODE2Ny00OTI4LTkxYTYtNGUyNjcyNDExZjQ3QGE4MDRhJztcblxuZXhwb3J0IGNvbnN0IERlZmF1bHRDb25maWc6IEZsb2F0V2luZG93Q29uZmlnID0ge1xuICAgIGtleTogJ3ByZXZpZXcnLFxuICAgIHRhYjoge1xuICAgICAgICBuYW1lOiAnaTE4bjpzaGFkZXItZ3JhcGgucHJldmlldy5tZW51X25hbWUnLFxuICAgICAgICBzaG93OiB0cnVlLFxuICAgICAgICBoZWlnaHQ6IDgwLFxuICAgIH0sXG4gICAgYmFzZToge1xuICAgICAgICB0aXRsZTogJ2kxOG46c2hhZGVyLWdyYXBoLnByZXZpZXcudGl0bGUnLFxuICAgICAgICB3aWR0aDogJzIyM3B4JyxcbiAgICAgICAgaGVpZ2h0OiAnMjI4cHgnLFxuICAgICAgICBtaW5XaWR0aDogJzIyM3B4JyxcbiAgICAgICAgbWluSGVpZ2h0OiAnMjI4cHgnLFxuICAgICAgICBkZWZhdWx0U2hvdzogZmFsc2UsXG4gICAgfSxcbiAgICBwb3NpdGlvbjoge1xuICAgICAgICByaWdodDogJzI4cHgnLFxuICAgICAgICBib3R0b206ICcwJyxcbiAgICB9LFxuICAgIGV2ZW50czoge1xuICAgICAgICByZXNpemVyOiB0cnVlLFxuICAgICAgICBkcmFnOiB0cnVlLFxuICAgICAgICBlbmFibGVBc3BlY3RSYXRpbzogdHJ1ZSxcbiAgICAgICAgdGFyZ2V0OiBGbG9hdFdpbmRvd0RyYWdUYXJnZXQuaGVhZGVyLFxuICAgIH0sXG4gICAgZGV0YWlsczoge1xuICAgICAgICBwcmltaXRpdmU6IEJPWF9NRVNILFxuICAgICAgICBsaWdodEVuYWJsZTogdHJ1ZSxcbiAgICB9LFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbmZpZygpIHtcbiAgICBjb25zdCBuZXdDb25maWcgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KERlZmF1bHRDb25maWcpKTtcbiAgICBjb25zdCBjb25maWcgPSBHcmFwaENvbmZpZ01nci5JbnN0YW5jZS5nZXRGbG9hdGluZ1dpbmRvd0NvbmZpZ0J5TmFtZShEZWZhdWx0Q29uZmlnLmtleSk7XG4gICAgaWYgKGNvbmZpZykge1xuICAgICAgICBuZXdDb25maWcuZGV0YWlscyA9IG1lcmdlKHt9LCBuZXdDb25maWcuZGV0YWlscywgY29uZmlnKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld0NvbmZpZztcbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudCA9IGRlZmluZUNvbXBvbmVudCh7XG4gICAgY29tcG9uZW50czoge1xuICAgICAgICBCYXNlRmxvYXRXaW5kb3csXG4gICAgfSxcblxuICAgIHByb3BzOiB7XG4gICAgICAgIC4uLmNvbW1vblByb3BzLFxuICAgIH0sXG5cbiAgICBlbWl0czogWy4uLmNvbW1vbkVtaXRzXSxcblxuICAgIHNldHVwKHByb3BzLCBjdHgpIHtcbiAgICAgICAgY29uc3QgY29tbW9uID0gY29tbW9uTG9naWMocHJvcHMsIGN0eCk7XG4gICAgICAgIGNvbnN0IGdsUHJldmlldyA9IHJlZigpO1xuICAgICAgICBjb25zdCBpbml0UHJldmlld0RvbmUgPSByZWYoZmFsc2UpO1xuICAgICAgICBjb25zdCBpbml0R0wgPSByZWYoZmFsc2UpO1xuICAgICAgICBjb25zdCBwcmV2aWV3RGlydHkgPSByZWYodHJ1ZSk7XG4gICAgICAgIGNvbnN0IGxvYWRpbmcgPSByZWYodHJ1ZSk7XG4gICAgICAgIGNvbnN0IGFuaW1hdGlvbklkID0gcmVmKC0xKTtcbiAgICAgICAgY29uc3QgbGlnaHRSZWYgPSByZWY8SFRNTEVsZW1lbnQ+KCk7XG4gICAgICAgIGNvbnN0IHByZXZpZXdDYW52YXMgPSByZWYoKTtcbiAgICAgICAgY29uc3QgcHJldmlld0NvbmZpZyA9IHJlZjxQcmV2aWV3Q29uZmlnPih7XG4gICAgICAgICAgICBwcmltaXRpdmU6ICcnLFxuICAgICAgICAgICAgbGlnaHRFbmFibGU6IGZhbHNlLFxuICAgICAgICB9KTtcblxuICAgICAgICBhc3luYyBmdW5jdGlvbiBjYWxsUHJldmlldyhmdW5jTmFtZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICAgICAgaWYgKCFpbml0UHJldmlld0RvbmUudmFsdWUpIHJldHVybjtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NhbGwtcHJldmlldy1mdW5jdGlvbicsICdzaGFkZXItZ3JhcGgtcHJldmlldycsIGZ1bmNOYW1lLCAuLi5hcmdzKTtcbiAgICAgICAgICAgIHByZXZpZXdEaXJ0eS52YWx1ZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBhc3luYyBmdW5jdGlvbiB1cGRhdGVDb25maWdUb1ByZXZpZXcoY29uZmlnOiBQcmV2aWV3Q29uZmlnKSB7XG4gICAgICAgICAgICBhd2FpdCBjYWxsUHJldmlldygnc2V0TGlnaHRFbmFibGUnLCBjb25maWcubGlnaHRFbmFibGUpO1xuICAgICAgICAgICAgYXdhaXQgY2FsbFByZXZpZXcoJ3NldFByaW1pdGl2ZScsIGNvbmZpZy5wcmltaXRpdmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gdXBkYXRlTWF0ZXJpYWwoKSB7XG4gICAgICAgICAgICBpZiAoIWluaXRQcmV2aWV3RG9uZS52YWx1ZSB8fCAhY29tbW9uLmlzU2hvdygpKSByZXR1cm47XG5cbiAgICAgICAgICAgIGxvYWRpbmcudmFsdWUgPSB0cnVlO1xuICAgICAgICAgICAgYXdhaXQgTWVzc2FnZU1nci5JbnN0YW5jZS5jYWxsU2NlbmVNZXRob2QoJ3VwZGF0ZU1hdGVyaWFsJywgW0dyYXBoRGF0YU1nci5JbnN0YW5jZS5nZXRDdXJyZW50R3JhcGhEYXRhKCldKTtcbiAgICAgICAgICAgIGxvYWRpbmcudmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgIHByZXZpZXdEaXJ0eS52YWx1ZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3BlY3RSYXRpbyA9IC0xO1xuICAgICAgICBhc3luYyBmdW5jdGlvbiByZWZyZXNoUHJldmlldygpIHtcbiAgICAgICAgICAgIGlmIChwcmV2aWV3RGlydHkudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBwcmV2aWV3RGlydHkudmFsdWUgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IHByZXZpZXdDYW52YXMudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKCFjYW52YXMpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gY2FudmFzLmNsaWVudFdpZHRoID09PSAwID8gY2FudmFzLnBhcmVudE5vZGUuY2xpZW50V2lkdGggOiBjYW52YXMuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gd2lkdGg7XG5cbiAgICAgICAgICAgICAgICAvLyDnrYnmr5TnvKnmlL5cbiAgICAgICAgICAgICAgICBpZiAoY2FudmFzLndpZHRoICE9PSB3aWR0aCB8fCAhaW5pdEdMLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGluaXRHTC52YWx1ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGdsUHJldmlldy52YWx1ZS5pbml0R0woY2FudmFzLCB7IHdpZHRoLCBoZWlnaHQgfSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGdsUHJldmlldy52YWx1ZS5yZXNpemVHTCh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGdsUHJldmlldy52YWx1ZS5xdWVyeVByZXZpZXdEYXRhKHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGdsUHJldmlldy52YWx1ZS5kcmF3R0woZGF0YSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW1hdGlvbklkLnZhbHVlKTtcbiAgICAgICAgICAgIGFuaW1hdGlvbklkLnZhbHVlID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZWZyZXNoUHJldmlldygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBhc3luYyBmdW5jdGlvbiBvbk1vdXNlRG93bk9uQ2FudmFzKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgICAgICAgICBhd2FpdCBjYWxsUHJldmlldygnb25Nb3VzZURvd24nLCB7IHg6IGV2ZW50LngsIHk6IGV2ZW50LnksIGJ1dHRvbjogZXZlbnQuYnV0dG9uIH0pO1xuXG4gICAgICAgICAgICBhc3luYyBmdW5jdGlvbiBtb3VzZW1vdmUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjYWxsUHJldmlldygnb25Nb3VzZU1vdmUnLCB7XG4gICAgICAgICAgICAgICAgICAgIG1vdmVtZW50WDogZXZlbnQubW92ZW1lbnRYLFxuICAgICAgICAgICAgICAgICAgICBtb3ZlbWVudFk6IGV2ZW50Lm1vdmVtZW50WSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXN5bmMgZnVuY3Rpb24gbW91c2V1cChldmVudDogTW91c2VFdmVudCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNhbGxQcmV2aWV3KCdvbk1vdXNlVXAnLCB7XG4gICAgICAgICAgICAgICAgICAgIHg6IGV2ZW50LngsXG4gICAgICAgICAgICAgICAgICAgIHk6IGV2ZW50LnksXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3VzZW1vdmUpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBtb3VzZXVwKTtcblxuICAgICAgICAgICAgICAgIHByZXZpZXdEaXJ0eS52YWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW91c2Vtb3ZlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBtb3VzZXVwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIG9uTW91c2VXaGVlbE9uQ2FudmFzKGV2ZW50OiBXaGVlbEV2ZW50KSB7XG4gICAgICAgICAgICBjb25zdCBzY2FsZSA9IGV2ZW50LmRlbHRhWSAqIDAuMDE7XG4gICAgICAgICAgICBhd2FpdCBjYWxsUHJldmlldygnc2V0Wm9vbScsIHNjYWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXJUb0NhbnZhcygpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IHByZXZpZXdDYW52YXMudmFsdWU7XG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgb25Nb3VzZURvd25PbkNhbnZhcyk7XG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIG9uTW91c2VXaGVlbE9uQ2FudmFzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXJUb0NhbnZhcygpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IHByZXZpZXdDYW52YXMudmFsdWU7XG4gICAgICAgICAgICBjYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgb25Nb3VzZURvd25PbkNhbnZhcyk7XG4gICAgICAgICAgICBjYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIG9uTW91c2VXaGVlbE9uQ2FudmFzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9uU2l6ZUNoYW5nZWREZWJvdW5jZWQgPSBkZWJvdW5jZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWNvbW1vbi5pc1Nob3coKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpbml0UHJldmlldygpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHByZXZpZXdEaXJ0eS52YWx1ZSA9IHRydWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgNTApO1xuXG4gICAgICAgIGNvbW1vbi5vblNpemVDaGFuZ2VkID0gKCkgPT4ge1xuICAgICAgICAgICAgb25TaXplQ2hhbmdlZERlYm91bmNlZCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IG9uUHJldmlld0NoYW5nZURlYm91bmNlZCA9IGRlYm91bmNlKGFzeW5jIChkaXJ0eTogYm9vbGVhbiwgdHlwZT86IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKCFjb21tb24uaXNTaG93KCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKGRpcnR5ICYmIHR5cGUgIT09ICdwb3NpdGlvbi1jaGFuZ2VkJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGluaXRQcmV2aWV3KCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdXBkYXRlTWF0ZXJpYWwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgNTApO1xuXG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIG9uSW5pdFByZXZpZXcoKSB7XG4gICAgICAgICAgICBpZiAoIWNvbW1vbi5pc1Nob3coKSB8fCAhR3JhcGhBc3NldE1nci5JbnN0YW5jZS51dWlkKSByZXR1cm47XG5cbiAgICAgICAgICAgIGF3YWl0IGluaXRQcmV2aWV3KCk7XG4gICAgICAgICAgICBjb25zdCB7IHByaW1pdGl2ZSwgbGlnaHRFbmFibGUgfSA9IHByb3BzLmNvbmZpZy5kZXRhaWxzITtcbiAgICAgICAgICAgIGlmIChwcmV2aWV3Q29uZmlnLnZhbHVlLnByaW1pdGl2ZSAhPT0gcHJpbWl0aXZlIHx8XG4gICAgICAgICAgICAgICAgcHJldmlld0NvbmZpZy52YWx1ZS5saWdodEVuYWJsZSAhPT0gbGlnaHRFbmFibGUpIHtcbiAgICAgICAgICAgICAgICBwcmV2aWV3Q29uZmlnLnZhbHVlID0ge1xuICAgICAgICAgICAgICAgICAgICBwcmltaXRpdmU6IHByaW1pdGl2ZSB8fCBCT1hfTUVTSCxcbiAgICAgICAgICAgICAgICAgICAgbGlnaHRFbmFibGU6IGxpZ2h0RW5hYmxlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYXBwbHlQcmV2aWV3Q29uZmlnVG9VSSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgdXBkYXRlTWF0ZXJpYWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIE1lc3NhZ2VNZ3IuSW5zdGFuY2UucmVnaXN0ZXIoTWVzc2FnZVR5cGUuU2NlbmVSZWFkeSwgb25Jbml0UHJldmlldyk7XG4gICAgICAgIE1lc3NhZ2VNZ3IuSW5zdGFuY2UucmVnaXN0ZXIoTWVzc2FnZVR5cGUuU2V0R3JhcGhEYXRhVG9Gb3JnZSwgb25Jbml0UHJldmlldyk7XG4gICAgICAgIE1lc3NhZ2VNZ3IuSW5zdGFuY2UucmVnaXN0ZXIoTWVzc2FnZVR5cGUuRGlydHlDaGFuZ2VkLCBvblByZXZpZXdDaGFuZ2VEZWJvdW5jZWQpO1xuXG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIGluaXRQcmV2aWV3KGZvcmNlID0gZmFsc2UpIHtcbiAgICAgICAgICAgIGlmICghaW5pdFByZXZpZXdEb25lLnZhbHVlIHx8IGZvcmNlKSB7XG4gICAgICAgICAgICAgICAgaW5pdFByZXZpZXdEb25lLnZhbHVlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBhd2FpdCBNZXNzYWdlTWdyLkluc3RhbmNlLmNhbGxTY2VuZU1ldGhvZCgnaW5pdFByZXZpZXcnLCBbcHJldmlld0NvbmZpZy52YWx1ZV0pO1xuICAgICAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgICAgICAgICAgICAgICBjb25zdCBHbFByZXZpZXcgPSBFZGl0b3IuX01vZHVsZS5yZXF1aXJlKCdQcmV2aWV3RXh0ZW5kcycpLmRlZmF1bHQ7XG4gICAgICAgICAgICAgICAgZ2xQcmV2aWV3LnZhbHVlID0gbmV3IEdsUHJldmlldygnc2hhZGVyLWdyYXBoLXByZXZpZXcnLCAncXVlcnktc2hhZGVyLWdyYXBoLXByZXZpZXctZGF0YScpO1xuICAgICAgICAgICAgICAgIGdsUHJldmlldy52YWx1ZS5pbml0KHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHByZXZpZXdDYW52YXMudmFsdWUuY2xpZW50V2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcHJldmlld0NhbnZhcy52YWx1ZS5jbGllbnRIZWlnaHQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYWRkRXZlbnRMaXN0ZW5lclRvQ2FudmFzKCk7XG4gICAgICAgICAgICAgICAgcmVmcmVzaFByZXZpZXcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbW1vbi5vblNob3cgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoYXdhaXQgTWVzc2FnZU1nci5JbnN0YW5jZS5jaGVja1NjZW5lUmVhZHkoKSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IG9uSW5pdFByZXZpZXcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgICAgICAgIGluaXRQcmV2aWV3RG9uZS52YWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgaW5pdEdMLnZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyVG9DYW52YXMoKTtcbiAgICAgICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW1hdGlvbklkLnZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbW1vbkhpZGUgPSBjb21tb24uaGlkZTtcbiAgICAgICAgY29tbW9uLmhpZGUgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb21tb25IaWRlKCk7XG4gICAgICAgICAgICByZXNldCgpO1xuICAgICAgICAgICAgYXdhaXQgR3JhcGhDb25maWdNZ3IuSW5zdGFuY2UuYXV0b1NhdmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBjb21tb25TaG93ID0gY29tbW9uLnNob3c7XG4gICAgICAgIGNvbW1vbi5zaG93ID0gYXN5bmMgKHBvc2l0aW9uPzogeyB0b3A/OiBzdHJpbmc7IHJpZ2h0Pzogc3RyaW5nOyBsZWZ0Pzogc3RyaW5nOyBib3R0b20/OiBzdHJpbmcgfSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWxpZGF0ZVBvc2l0aW9uKHBvc2l0aW9uKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IEdyYXBoQ29uZmlnTWdyLkluc3RhbmNlLmdldEZsb2F0aW5nV2luZG93Q29uZmlnQnlOYW1lKERlZmF1bHRDb25maWcua2V5KTtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHZhbGlkYXRlUG9zaXRpb24oY29uZmlnPy5wb3NpdGlvbikgPyBjb25maWc/LnBvc2l0aW9uIDogRGVmYXVsdENvbmZpZy5wb3NpdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbW1vblNob3cocG9zaXRpb24pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIG9uQ2xvc2UoKSB7XG4gICAgICAgICAgICBjb21tb24uaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gb25SZWZyZXNoKCkge1xuICAgICAgICAgICAgcmVzZXQoKTtcbiAgICAgICAgICAgIGluaXRHTC52YWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgYXdhaXQgaW5pdFByZXZpZXcodHJ1ZSk7XG4gICAgICAgICAgICBhd2FpdCB1cGRhdGVNYXRlcmlhbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYXBwbHlQcmV2aWV3Q29uZmlnVG9VSSgpIHtcbiAgICAgICAgICAgIG9uTGlnaHRDaGFuZ2UocHJldmlld0NvbmZpZy52YWx1ZS5saWdodEVuYWJsZSwgZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gb25MaWdodENoYW5nZShlbmFibGVkOiBib29sZWFuLCBzYXZlID0gdHJ1ZSkge1xuICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICBsaWdodFJlZi52YWx1ZT8uc2V0QXR0cmlidXRlKCdwcmVzc2VkJywgJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsaWdodFJlZi52YWx1ZT8ucmVtb3ZlQXR0cmlidXRlKCdwcmVzc2VkJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHsgcHJpbWl0aXZlIH0gPSBwcmV2aWV3Q29uZmlnLnZhbHVlO1xuICAgICAgICAgICAgcHJldmlld0NvbmZpZy52YWx1ZSA9IHtcbiAgICAgICAgICAgICAgICBwcmltaXRpdmU6IHByaW1pdGl2ZSxcbiAgICAgICAgICAgICAgICBsaWdodEVuYWJsZTogZW5hYmxlZCxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB1cGRhdGVDb25maWdUb1ByZXZpZXcocHJldmlld0NvbmZpZy52YWx1ZSk7XG4gICAgICAgICAgICBpZiAoc2F2ZSkge1xuICAgICAgICAgICAgICAgIEdyYXBoQ29uZmlnTWdyLkluc3RhbmNlLnNhdmVEZXRhaWxzKERlZmF1bHRDb25maWcua2V5LCBwcmV2aWV3Q29uZmlnLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG9uUHJpbWl0aXZlQ2hhbmdlKGV2ZW50OiBDdXN0b21FdmVudCkge1xuICAgICAgICAgICAgY2FsbFByZXZpZXcoJ3Jlc2V0Q2FtZXJhJyk7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICAgICAgICAgIGNvbnN0IHsgbGlnaHRFbmFibGUgfSA9IHByZXZpZXdDb25maWcudmFsdWU7XG4gICAgICAgICAgICBwcmV2aWV3Q29uZmlnLnZhbHVlID0ge1xuICAgICAgICAgICAgICAgIHByaW1pdGl2ZTogdGFyZ2V0LnZhbHVlLFxuICAgICAgICAgICAgICAgIGxpZ2h0RW5hYmxlOiBsaWdodEVuYWJsZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB1cGRhdGVDb25maWdUb1ByZXZpZXcocHJldmlld0NvbmZpZy52YWx1ZSk7XG4gICAgICAgICAgICBHcmFwaENvbmZpZ01nci5JbnN0YW5jZS5zYXZlRGV0YWlscyhEZWZhdWx0Q29uZmlnLmtleSwgcHJldmlld0NvbmZpZy52YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uY29tbW9uLFxuXG4gICAgICAgICAgICBwcmV2aWV3Q2FudmFzLFxuICAgICAgICAgICAgcHJldmlld0NvbmZpZyxcblxuICAgICAgICAgICAgbG9hZGluZyxcblxuICAgICAgICAgICAgb25DbG9zZSxcbiAgICAgICAgICAgIG9uUmVmcmVzaCxcblxuICAgICAgICAgICAgbGlnaHRSZWYsXG5cbiAgICAgICAgICAgIG9uTGlnaHRDaGFuZ2UsXG4gICAgICAgICAgICBvblByaW1pdGl2ZUNoYW5nZSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgdGVtcGxhdGU6IGNvbW1vblRlbXBsYXRlKHtcbiAgICAgICAgY3NzOiAncHJldmlldycsXG4gICAgICAgIGhlYWRlcjogYFxuPHVpLWxhYmVsIGNsYXNzPVwidGl0bGUtbGFiZWxcIiB2YWx1ZT1cImkxOG46c2hhZGVyLWdyYXBoLnByZXZpZXcudGl0bGVcIj48L3VpLWxhYmVsPlxuPHVpLWljb24gY2xhc3M9XCJjbG9zZVwiIHRyYW5zcGFyZW50XG4gIHRvb2x0aXA9XCJpMThuOnNoYWRlci1ncmFwaC5wcmV2aWV3LmNsb3NlLnRvb2x0aXBcIlxuICB2YWx1ZT1cImNvbGxhcHNlLXJpZ2h0XCJcbiAgQGNsaWNrPVwib25DbG9zZVwiXG4+PC91aS1pY29uPlxuICAgICAgICBgLFxuICAgICAgICBzZWN0aW9uOiBgXG4gICAgICAgICAgICA8Y2FudmFzIHJlZj1cInByZXZpZXdDYW52YXNcIj48L2NhbnZhcz5cbiAgICAgICAgICAgIDx1aS1sb2FkaW5nIGNsYXNzPVwibG9hZGluZ1wiIHYtc2hvdz1cImxvYWRpbmdcIj48L3VpLWxvYWRpbmc+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbHNcIj5cbiAgICAgICAgICAgICAgPHVpLWljb24gY2xhc3M9XCJsaWdodFwiXG4gICAgICAgICAgICAgICAgcmVmPVwibGlnaHRSZWZcIlxuICAgICAgICAgICAgICAgIHZhbHVlPVwic3BvdC1saWdodFwiXG4gICAgICAgICAgICAgICAgQG1vdXNlZG93bi5zdG9wPVwib25MaWdodENoYW5nZShwcmV2aWV3Q29uZmlnLmxpZ2h0RW5hYmxlPSFwcmV2aWV3Q29uZmlnLmxpZ2h0RW5hYmxlKVwiXG4gICAgICAgICAgICAgID48L3VpLWljb24+XG4gICAgICAgICAgICAgIDx1aS1pY29uXG4gICAgICAgICAgICAgICAgdHlwZT1cImljb25cIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwicmVmcmVzaFwiXG4gICAgICAgICAgICAgICAgdmFsdWU9XCJyZWZyZXNoXCJcbiAgICAgICAgICAgICAgICBAbW91c2Vkb3duLnN0b3A9XCJvblJlZnJlc2hcIiBcbiAgICAgICAgICAgICAgPjwvdWktaWNvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInByaW1pdGl2ZS1ncm91cFwiPlxuICAgICAgICAgICAgICAgIDx1aS1sYWJlbCBzbG90PVwibGFiZWxcIiB2YWx1ZT1cImkxOG46c2hhZGVyLWdyYXBoLnByZXZpZXcubWVzaFwiPjwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgPHVpLWFzc2V0IHNsb3Q9XCJjb250ZW50XCIgZHJvcHBhYmxlPVwiY2MuTWVzaFwiIFxuICAgICAgICAgICAgICAgICAgICA6dmFsdWU9XCJwcmV2aWV3Q29uZmlnLnByaW1pdGl2ZVwiXG4gICAgICAgICAgICAgICAgICAgIEBjaGFuZ2Uuc3RvcD1cIm9uUHJpbWl0aXZlQ2hhbmdlXCJcbiAgICAgICAgICAgICAgICA+PC91aS1hc3NldD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgLFxuICAgICAgICBmb290ZXI6IGBgLFxuICAgIH0pLFxufSk7XG4iXX0=