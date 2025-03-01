"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const header_1 = require("./header");
const resizer_1 = require("./resizer");
const block_forge_1 = require("../../../../../block-forge");
const internal_1 = require("../internal");
const vue_js_1 = require("vue/dist/vue.js");
const const_1 = require("./const");
const shader_graph_1 = require("../../../../../shader-graph");
exports.default = (0, vue_js_1.defineComponent)({
    name: 'BaseFloatWindow',
    props: {
        forge: {
            type: block_forge_1.HTMLGraphForgeElement,
            required: true,
            default: null,
        },
        config: {
            type: Object,
            required: true,
            default: null,
        },
    },
    emits: [
        'hide',
        'show',
        'size-changed',
    ],
    setup(props, ctx) {
        const isShow = (0, vue_js_1.ref)(false);
        const floatWindowRef = (0, vue_js_1.ref)();
        const headerRef = (0, vue_js_1.ref)();
        function syncPosition(rect) {
            if (rect.top !== undefined) {
                floatWindowRef.value.style.top = rect.top;
            }
            else {
                floatWindowRef.value.style.top = '';
            }
            if (rect.left !== undefined) {
                floatWindowRef.value.style.left = rect.left;
            }
            else {
                floatWindowRef.value.style.left = '';
            }
            if (rect.right !== undefined) {
                floatWindowRef.value.style.right = rect.right;
            }
            else {
                floatWindowRef.value.style.right = '';
            }
            if (rect.bottom !== undefined) {
                floatWindowRef.value.style.bottom = rect.bottom;
            }
            else {
                floatWindowRef.value.style.bottom = '';
            }
        }
        function hide() {
            isShow.value = false;
            floatWindowRef.value?.setAttribute('hidden', '');
            ctx.emit('hide');
        }
        function show(position) {
            syncPosition(position || props.config.position);
            if (isShow.value)
                return;
            isShow.value = true;
            (0, vue_js_1.nextTick)(() => {
                onResize();
                floatWindowRef.value?.removeAttribute('hidden');
                ctx.emit('show');
            });
        }
        function syncConfig() {
            if (!floatWindowRef.value || !props.forge)
                return;
            syncBase();
            syncEvents();
        }
        function syncBase() {
            const base = props.config.base;
            const details = props.config.details;
            floatWindowRef.value.style.height = details?.height || base.height;
            floatWindowRef.value.style.width = details?.width || base.width;
            (0, const_1.setMinSize)(parseFloat(base.minWidth), parseFloat(base.minHeight));
            (0, vue_js_1.nextTick)(() => {
                onResize();
            });
        }
        function syncEvents() {
            let target;
            if (props.config.events.target === internal_1.FloatWindowDragTarget.header) {
                target = headerRef.value;
            }
            else {
                target = floatWindowRef.value;
            }
            (0, header_1.useDragEvent)({
                config: props.config,
                $window: floatWindowRef.value,
                target: target,
                onChange: () => { },
            });
            (0, resizer_1.useResizer)({
                config: props.config,
                $window: floatWindowRef.value,
                onChange: () => {
                    ctx.emit('size-changed');
                },
            });
        }
        (0, vue_js_1.watch)(() => props.config.events, () => {
            syncEvents();
        });
        (0, vue_js_1.watch)(() => props.config.base, () => {
            syncBase();
        });
        function onResize() {
            if (isShow.value) {
                (0, resizer_1.adjustWindowPosition)(floatWindowRef.value, props.forge);
            }
        }
        (0, vue_js_1.onMounted)(() => {
            shader_graph_1.MessageMgr.Instance.register(shader_graph_1.MessageType.Resize, onResize);
            (0, vue_js_1.nextTick)(() => {
                syncConfig();
            });
        });
        (0, vue_js_1.onUnmounted)(() => {
            shader_graph_1.MessageMgr.Instance.unregister(shader_graph_1.MessageType.Resize, onResize);
        });
        return {
            floatWindowRef,
            headerRef,
            hide,
            show,
            syncConfig,
            onResize,
            isShow,
        };
    },
    template: `
    <div ref="floatWindowRef" class="float-window" hidden>
      <div ref="headerRef" class="header">
        <slot name="header"></slot>
      </div>
      <div class="section">
        <slot name="section"></slot>
      </div>
      <div class="footer">
        <slot name="footer"></slot>
      </div>
    </div>
        `,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvcGFuZWxzL3NoYWRlci1ncmFwaC9jb21wb25lbnRzL2Zsb2F0LXdpbmRvdy9iYXNlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQXdDO0FBQ3hDLHVDQUE2RDtBQUM3RCw0REFBbUU7QUFDbkUsMENBQXVFO0FBRXZFLDRDQUFnRztBQUNoRyxtQ0FBcUM7QUFDckMsOERBQXNFO0FBRXRFLGtCQUFlLElBQUEsd0JBQWUsRUFBQztJQUMzQixJQUFJLEVBQUUsaUJBQWlCO0lBRXZCLEtBQUssRUFBRTtRQUNILEtBQUssRUFBRTtZQUNILElBQUksRUFBRSxtQ0FBcUI7WUFDM0IsUUFBUSxFQUFFLElBQUk7WUFDZCxPQUFPLEVBQUUsSUFBSTtTQUNoQjtRQUNELE1BQU0sRUFBRTtZQUNKLElBQUksRUFBRSxNQUFpQztZQUN2QyxRQUFRLEVBQUUsSUFBSTtZQUNkLE9BQU8sRUFBRSxJQUFJO1NBQ2hCO0tBQ0o7SUFFRCxLQUFLLEVBQUU7UUFDSCxNQUFNO1FBQ04sTUFBTTtRQUNOLGNBQWM7S0FDakI7SUFFRCxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUc7UUFDWixNQUFNLE1BQU0sR0FBRyxJQUFBLFlBQUcsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUMxQixNQUFNLGNBQWMsR0FBRyxJQUFBLFlBQUcsR0FBRSxDQUFDO1FBQzdCLE1BQU0sU0FBUyxHQUFHLElBQUEsWUFBRyxHQUFFLENBQUM7UUFFeEIsU0FBUyxZQUFZLENBQUMsSUFBdUU7WUFDekYsSUFBSSxJQUFJLENBQUMsR0FBRyxLQUFLLFNBQVMsRUFBRTtnQkFDeEIsY0FBYyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7YUFDN0M7aUJBQU07Z0JBQ0gsY0FBYyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFH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RUFBQyxHQUFHLEVBQUU7Z0JBQ1YsVUFBVSxFQUFFLENBQUM7WUFDakIsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsb0JBQVcsRUFBQyxHQUFHLEVBQUU7WUFDYix5QkFBVSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsMEJBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDakUsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPO1lBQ0gsY0FBYztZQUNkLFNBQVM7WUFFVCxJQUFJO1lBQ0osSUFBSTtZQUNKLFVBQVU7WUFDVixRQUFRO1lBRVIsTUFBTTtTQUNULENBQUM7SUFDTixDQUFDO0lBRUQsUUFBUSxFQUFFOzs7Ozs7Ozs7Ozs7U0FZTDtDQUNSLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZURyYWdFdmVudCB9IGZyb20gJy4vaGVhZGVyJztcbmltcG9ydCB7IGFkanVzdFdpbmRvd1Bvc2l0aW9uLCB1c2VSZXNpemVyIH0gZnJvbSAnLi9yZXNpemVyJztcbmltcG9ydCB7IEhUTUxHcmFwaEZvcmdlRWxlbWVudCB9IGZyb20gJy4uLy4uLy4uLy4uLy4uL2Jsb2NrLWZvcmdlJztcbmltcG9ydCB7IEZsb2F0V2luZG93Q29uZmlnLCBGbG9hdFdpbmRvd0RyYWdUYXJnZXQgfSBmcm9tICcuLi9pbnRlcm5hbCc7XG5cbmltcG9ydCB7IGRlZmluZUNvbXBvbmVudCwgbmV4dFRpY2ssIG9uTW91bnRlZCwgb25Vbm1vdW50ZWQsIHJlZiwgd2F0Y2ggfSBmcm9tICd2dWUvZGlzdC92dWUuanMnO1xuaW1wb3J0IHsgc2V0TWluU2l6ZSB9IGZyb20gJy4vY29uc3QnO1xuaW1wb3J0IHsgTWVzc2FnZU1nciwgTWVzc2FnZVR5cGUgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9zaGFkZXItZ3JhcGgnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb21wb25lbnQoe1xuICAgIG5hbWU6ICdCYXNlRmxvYXRXaW5kb3cnLFxuXG4gICAgcHJvcHM6IHtcbiAgICAgICAgZm9yZ2U6IHtcbiAgICAgICAgICAgIHR5cGU6IEhUTUxHcmFwaEZvcmdlRWxlbWVudCxcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbCxcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICB0eXBlOiBPYmplY3QgYXMgKCkgPT4gRmxvYXRXaW5kb3dDb25maWcsXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIGVtaXRzOiBbXG4gICAgICAgICdoaWRlJyxcbiAgICAgICAgJ3Nob3cnLFxuICAgICAgICAnc2l6ZS1jaGFuZ2VkJyxcbiAgICBdLFxuXG4gICAgc2V0dXAocHJvcHMsIGN0eCkge1xuICAgICAgICBjb25zdCBpc1Nob3cgPSByZWYoZmFsc2UpO1xuICAgICAgICBjb25zdCBmbG9hdFdpbmRvd1JlZiA9IHJlZigpO1xuICAgICAgICBjb25zdCBoZWFkZXJSZWYgPSByZWYoKTtcblxuICAgICAgICBmdW5jdGlvbiBzeW5jUG9zaXRpb24ocmVjdDogeyB0b3A/OiBzdHJpbmc7IHJpZ2h0Pzogc3RyaW5nOyBsZWZ0Pzogc3RyaW5nOyBib3R0b20/OiBzdHJpbmc7IH0pIHtcbiAgICAgICAgICAgIGlmIChyZWN0LnRvcCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZmxvYXRXaW5kb3dSZWYudmFsdWUuc3R5bGUudG9wID0gcmVjdC50b3A7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZsb2F0V2luZG93UmVmLnZhbHVlLnN0eWxlLnRvcCA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlY3QubGVmdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZmxvYXRXaW5kb3dSZWYudmFsdWUuc3R5bGUubGVmdCA9IHJlY3QubGVmdDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmxvYXRXaW5kb3dSZWYudmFsdWUuc3R5bGUubGVmdCA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlY3QucmlnaHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGZsb2F0V2luZG93UmVmLnZhbHVlLnN0eWxlLnJpZ2h0ID0gcmVjdC5yaWdodDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmxvYXRXaW5kb3dSZWYudmFsdWUuc3R5bGUucmlnaHQgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZWN0LmJvdHRvbSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZmxvYXRXaW5kb3dSZWYudmFsdWUuc3R5bGUuYm90dG9tID0gcmVjdC5ib3R0b207XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZsb2F0V2luZG93UmVmLnZhbHVlLnN0eWxlLmJvdHRvbSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaGlkZSgpIHtcbiAgICAgICAgICAgIGlzU2hvdy52YWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgZmxvYXRXaW5kb3dSZWYudmFsdWU/LnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgJycpO1xuICAgICAgICAgICAgY3R4LmVtaXQoJ2hpZGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNob3cocG9zaXRpb24/OiB7IHRvcD86IHN0cmluZzsgcmlnaHQ/OiBzdHJpbmc7IGxlZnQ/OiBzdHJpbmc7IGJvdHRvbT86IHN0cmluZzsgfSkge1xuICAgICAgICAgICAgc3luY1Bvc2l0aW9uKHBvc2l0aW9uIHx8IHByb3BzLmNvbmZpZy5wb3NpdGlvbik7XG5cbiAgICAgICAgICAgIGlmIChpc1Nob3cudmFsdWUpIHJldHVybjtcbiAgICAgICAgICAgIGlzU2hvdy52YWx1ZSA9IHRydWU7XG5cbiAgICAgICAgICAgIG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICBvblJlc2l6ZSgpO1xuICAgICAgICAgICAgICAgIGZsb2F0V2luZG93UmVmLnZhbHVlPy5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpO1xuICAgICAgICAgICAgICAgIGN0eC5lbWl0KCdzaG93Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHN5bmNDb25maWcoKSB7XG4gICAgICAgICAgICBpZiAoIWZsb2F0V2luZG93UmVmLnZhbHVlIHx8ICFwcm9wcy5mb3JnZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBzeW5jQmFzZSgpO1xuICAgICAgICAgICAgc3luY0V2ZW50cygpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc3luY0Jhc2UoKSB7XG4gICAgICAgICAgICBjb25zdCBiYXNlID0gcHJvcHMuY29uZmlnLmJhc2U7XG4gICAgICAgICAgICBjb25zdCBkZXRhaWxzID0gcHJvcHMuY29uZmlnLmRldGFpbHM7XG4gICAgICAgICAgICBmbG9hdFdpbmRvd1JlZi52YWx1ZS5zdHlsZS5oZWlnaHQgPSBkZXRhaWxzPy5oZWlnaHQgfHwgYmFzZS5oZWlnaHQ7XG4gICAgICAgICAgICBmbG9hdFdpbmRvd1JlZi52YWx1ZS5zdHlsZS53aWR0aCA9IGRldGFpbHM/LndpZHRoIHx8IGJhc2Uud2lkdGg7XG5cbiAgICAgICAgICAgIHNldE1pblNpemUocGFyc2VGbG9hdChiYXNlLm1pbldpZHRoKSwgcGFyc2VGbG9hdChiYXNlLm1pbkhlaWdodCkpO1xuXG4gICAgICAgICAgICBuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgb25SZXNpemUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc3luY0V2ZW50cygpIHtcbiAgICAgICAgICAgIGxldCB0YXJnZXQ6IEhUTUxEaXZFbGVtZW50O1xuICAgICAgICAgICAgaWYgKHByb3BzLmNvbmZpZy5ldmVudHMudGFyZ2V0ID09PSBGbG9hdFdpbmRvd0RyYWdUYXJnZXQuaGVhZGVyKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gaGVhZGVyUmVmLnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBmbG9hdFdpbmRvd1JlZi52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVzZURyYWdFdmVudCh7XG4gICAgICAgICAgICAgICAgY29uZmlnOiBwcm9wcy5jb25maWcsXG4gICAgICAgICAgICAgICAgJHdpbmRvdzogZmxvYXRXaW5kb3dSZWYudmFsdWUsXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB0YXJnZXQsXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U6ICgpID0+IHt9LFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHVzZVJlc2l6ZXIoe1xuICAgICAgICAgICAgICAgIGNvbmZpZzogcHJvcHMuY29uZmlnLFxuICAgICAgICAgICAgICAgICR3aW5kb3c6IGZsb2F0V2luZG93UmVmLnZhbHVlLFxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5lbWl0KCdzaXplLWNoYW5nZWQnKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB3YXRjaCgoKSA9PiBwcm9wcy5jb25maWcuZXZlbnRzLCAoKSA9PiB7XG4gICAgICAgICAgICBzeW5jRXZlbnRzKCk7XG4gICAgICAgIH0pO1xuICAgICAgICB3YXRjaCgoKSA9PiBwcm9wcy5jb25maWcuYmFzZSwgKCkgPT4ge1xuICAgICAgICAgICAgc3luY0Jhc2UoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZnVuY3Rpb24gb25SZXNpemUoKSB7XG4gICAgICAgICAgICBpZiAoaXNTaG93LnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgYWRqdXN0V2luZG93UG9zaXRpb24oZmxvYXRXaW5kb3dSZWYudmFsdWUsIHByb3BzLmZvcmdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG9uTW91bnRlZCgoKSA9PiB7XG4gICAgICAgICAgICBNZXNzYWdlTWdyLkluc3RhbmNlLnJlZ2lzdGVyKE1lc3NhZ2VUeXBlLlJlc2l6ZSwgb25SZXNpemUpO1xuXG4gICAgICAgICAgICBuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgc3luY0NvbmZpZygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG9uVW5tb3VudGVkKCgpID0+IHtcbiAgICAgICAgICAgIE1lc3NhZ2VNZ3IuSW5zdGFuY2UudW5yZWdpc3RlcihNZXNzYWdlVHlwZS5SZXNpemUsIG9uUmVzaXplKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZsb2F0V2luZG93UmVmLFxuICAgICAgICAgICAgaGVhZGVyUmVmLFxuXG4gICAgICAgICAgICBoaWRlLFxuICAgICAgICAgICAgc2hvdyxcbiAgICAgICAgICAgIHN5bmNDb25maWcsXG4gICAgICAgICAgICBvblJlc2l6ZSxcblxuICAgICAgICAgICAgaXNTaG93LFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICB0ZW1wbGF0ZTogYFxuICAgIDxkaXYgcmVmPVwiZmxvYXRXaW5kb3dSZWZcIiBjbGFzcz1cImZsb2F0LXdpbmRvd1wiIGhpZGRlbj5cbiAgICAgIDxkaXYgcmVmPVwiaGVhZGVyUmVmXCIgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgICAgPHNsb3QgbmFtZT1cImhlYWRlclwiPjwvc2xvdD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInNlY3Rpb25cIj5cbiAgICAgICAgPHNsb3QgbmFtZT1cInNlY3Rpb25cIj48L3Nsb3Q+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmb290ZXJcIj5cbiAgICAgICAgPHNsb3QgbmFtZT1cImZvb3RlclwiPjwvc2xvdD5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgICAgICBgLFxufSk7XG4iXX0=