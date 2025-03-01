"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonTemplate = exports.commonLogic = exports.commonProps = exports.commonEmits = void 0;
const vue_js_1 = require("vue/dist/vue.js");
const block_forge_1 = require("../../../../block-forge");
exports.commonEmits = [
    'hide',
];
exports.commonProps = {
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
};
const commonLogic = (props, ctx) => {
    const floatWindowRef = (0, vue_js_1.ref)();
    const headerTitle = (0, vue_js_1.ref)('');
    const hide = () => {
        floatWindowRef.value?.hide();
    };
    const isShow = () => {
        return floatWindowRef.value?.isShow;
    };
    const show = (position) => {
        floatWindowRef.value?.show(position);
    };
    const getRect = () => {
        const floatWindow = floatWindowRef.value;
        return {
            x: parseInt(floatWindow.$el.style.left) || 0,
            y: parseInt(floatWindow.$el.style.top) || 0,
            width: parseInt(floatWindow.$el.style.width),
            height: parseInt(floatWindow.$el.style.height),
        };
    };
    const onClickHide = () => {
        hide();
    };
    function syncBase() {
        const base = props.config.base;
        headerTitle.value = base.title;
    }
    (0, vue_js_1.watch)(() => props.config.base, () => {
        syncBase();
    });
    (0, vue_js_1.onMounted)(() => {
        (0, vue_js_1.nextTick)(() => {
            syncBase();
        });
    });
    function onSizeChanged() {
    }
    function onShow() {
    }
    function onHide() {
        ctx.emit('hide', props.config.key);
    }
    return {
        floatWindowRef,
        headerTitle,
        isShow,
        show,
        hide,
        onClickHide,
        getRect,
        onShow,
        onHide,
        onSizeChanged,
    };
};
exports.commonLogic = commonLogic;
const commonTemplate = (config) => {
    return `
      <BaseFloatWindow
          ref="floatWindowRef"
          :forge="forge"
          :config="config"
          class="${config.css}"
          @show="onShow"
          @hide="onHide"
          @size-changed="onSizeChanged"
      >
        <template v-if="${config.header !== undefined}" #header>
          ${config.header}
        </template>
        <template v-else #header>
           <div class="title">
              <ui-label :value=headerTitle></ui-label>
           </div>
           <ui-icon class="hide-button" value="collapse-right" @click="onClickHide"></ui-icon>
        </template>
        
        <template #section>
          ${config.section}
        </template>
        <template #footer>
          ${config.footer}
        </template>
      </BaseFloatWindow>
    `;
};
exports.commonTemplate = commonTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3BhbmVscy9zaGFkZXItZ3JhcGgvY29tcG9uZW50cy9mbG9hdC13aW5kb3cvY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDRDQUFrRTtBQUdsRSx5REFBZ0U7QUFJbkQsUUFBQSxXQUFXLEdBQUc7SUFDdkIsTUFBTTtDQUNULENBQUM7QUFFVyxRQUFBLFdBQVcsR0FBRztJQUN2QixLQUFLLEVBQUU7UUFDSCxJQUFJLEVBQUUsbUNBQXFCO1FBQzNCLFFBQVEsRUFBRSxJQUFJO1FBQ2QsT0FBTyxFQUFFLElBQUk7S0FDaEI7SUFDRCxNQUFNLEVBQUU7UUFDSixJQUFJLEVBQUUsTUFBaUM7UUFDdkMsUUFBUSxFQUFFLElBQUk7UUFDZCxPQUFPLEVBQUUsSUFBSTtLQUNoQjtDQUNKLENBQUM7QUFFSyxNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQWtFLEVBQUUsR0FBcUMsRUFBRSxFQUFFO0lBQ3JJLE1BQU0sY0FBYyxHQUFHLElBQUEsWUFBRyxHQUEwQixDQUFDO0lBQ3JELE1BQU0sV0FBVyxHQUFHLElBQUEsWUFBRyxFQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRTVCLE1BQU0sSUFBSSxHQUFHLEdBQUcsRUFBRTtRQUNkLGNBQWMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDakMsQ0FBQyxDQUFDO0lBRUYsTUFBTSxNQUFNLEdBQUcsR0FBRyxFQUFFO1FBQ2hCLE9BQU8sY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUM7SUFDeEMsQ0FBQyxDQUFDO0lBRUYsTUFBTSxJQUFJLEdBQUcsQ0FBQyxRQUE0RSxFQUFFLEVBQUU7UUFDMUYsY0FBYyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDO0lBRUYsTUFBTSxPQUFPLEdBQUcsR0FBRyxFQUFFO1FBQ2pCLE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxLQUFNLENBQUM7UUFDMUMsT0FBTztZQUNILENBQUMsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztZQUM1QyxDQUFDLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDM0MsS0FBSyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFDNUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7U0FDakQsQ0FBQztJQUNOLENBQUMsQ0FBQztJQUVGLE1BQU0sV0FBVyxHQUFHLEdBQUcsRUFBRTtRQUNyQixJQUFJLEVBQUUsQ0FBQztJQUNYLENBQUMsQ0FBQztJQUVGLFNBQVMsUUFBUTtRQUNiLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQy9CLFdBQVcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNuQyxDQUFDO0lBRUQsSUFBQSxjQUFLLEVBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO1FBQ2hDLFFBQVEsRUFBRSxDQUFDO0lBQ2YsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFBLGtCQUFTLEVBQUMsR0FBRyxFQUFFO1FBQ1gsSUFBQSxpQkFBUSxFQUFDLEdBQUcsRUFBRTtZQUNWLFFBQVEsRUFBRSxDQUFDO1FBQ2YsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztJQUVILFNBQVMsYUFBYTtJQUV0QixDQUFDO0lBRUQsU0FBUyxNQUFNO0lBRWYsQ0FBQztJQUVELFNBQVMsTUFBTTtRQUNYLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELE9BQU87UUFDSCxjQUFjO1FBQ2QsV0FBVztRQUVYLE1BQU07UUFFTixJQUFJO1FBQ0osSUFBSTtRQUNKLFdBQVc7UUFDWCxPQUFPO1FBRVAsTUFBTTtRQUNOLE1BQU07UUFDTixhQUFhO0tBQ2hCLENBQUM7QUFDTixDQUFDLENBQUM7QUF4RVcsUUFBQSxXQUFXLGVBd0V0QjtBQUVLLE1BQU0sY0FBYyxHQUFHLENBQUMsTUFBNEUsRUFBRSxFQUFFO0lBQzNHLE9BQU87Ozs7O21CQUtRLE1BQU0sQ0FBQyxHQUFHOzs7OzswQkFLSCxNQUFNLENBQUMsTUFBTSxLQUFLLFNBQVM7WUFDekMsTUFBTSxDQUFDLE1BQU07Ozs7Ozs7Ozs7WUFVYixNQUFNLENBQUMsT0FBTzs7O1lBR2QsTUFBTSxDQUFDLE1BQU07OztLQUdwQixDQUFDO0FBQ04sQ0FBQyxDQUFDO0FBN0JXLFFBQUEsY0FBYyxrQkE2QnpCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbmV4dFRpY2ssIG9uTW91bnRlZCwgcmVmLCB3YXRjaCB9IGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5pbXBvcnQgeyBTZXR1cENvbnRleHQgfSBmcm9tICd2dWUvdHlwZXMvdjMtc2V0dXAtY29udGV4dCc7XG5cbmltcG9ydCB7IEhUTUxHcmFwaEZvcmdlRWxlbWVudCB9IGZyb20gJy4uLy4uLy4uLy4uL2Jsb2NrLWZvcmdlJztcbmltcG9ydCBCYXNlRmxvYXRXaW5kb3cgZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7IEZsb2F0V2luZG93Q29uZmlnIH0gZnJvbSAnLi9pbnRlcm5hbCc7XG5cbmV4cG9ydCBjb25zdCBjb21tb25FbWl0cyA9IFtcbiAgICAnaGlkZScsXG5dO1xuXG5leHBvcnQgY29uc3QgY29tbW9uUHJvcHMgPSB7XG4gICAgZm9yZ2U6IHtcbiAgICAgICAgdHlwZTogSFRNTEdyYXBoRm9yZ2VFbGVtZW50LFxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogbnVsbCxcbiAgICB9LFxuICAgIGNvbmZpZzoge1xuICAgICAgICB0eXBlOiBPYmplY3QgYXMgKCkgPT4gRmxvYXRXaW5kb3dDb25maWcsXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiBudWxsLFxuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3QgY29tbW9uTG9naWMgPSAocHJvcHM6IHsgZm9yZ2U6IEhUTUxHcmFwaEZvcmdlRWxlbWVudCwgY29uZmlnOiBGbG9hdFdpbmRvd0NvbmZpZyB9LCBjdHg6IFNldHVwQ29udGV4dCB8IFNldHVwQ29udGV4dDxhbnk+KSA9PiB7XG4gICAgY29uc3QgZmxvYXRXaW5kb3dSZWYgPSByZWY8dHlwZW9mIEJhc2VGbG9hdFdpbmRvdz4oKTtcbiAgICBjb25zdCBoZWFkZXJUaXRsZSA9IHJlZignJyk7XG5cbiAgICBjb25zdCBoaWRlID0gKCkgPT4ge1xuICAgICAgICBmbG9hdFdpbmRvd1JlZi52YWx1ZT8uaGlkZSgpO1xuICAgIH07XG5cbiAgICBjb25zdCBpc1Nob3cgPSAoKSA9PiB7XG4gICAgICAgIHJldHVybiBmbG9hdFdpbmRvd1JlZi52YWx1ZT8uaXNTaG93O1xuICAgIH07XG5cbiAgICBjb25zdCBzaG93ID0gKHBvc2l0aW9uPzogeyB0b3A/OiBzdHJpbmc7IHJpZ2h0Pzogc3RyaW5nOyBsZWZ0Pzogc3RyaW5nOyBib3R0b20/OiBzdHJpbmc7IH0pID0+IHtcbiAgICAgICAgZmxvYXRXaW5kb3dSZWYudmFsdWU/LnNob3cocG9zaXRpb24pO1xuICAgIH07XG5cbiAgICBjb25zdCBnZXRSZWN0ID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBmbG9hdFdpbmRvdyA9IGZsb2F0V2luZG93UmVmLnZhbHVlITtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHBhcnNlSW50KGZsb2F0V2luZG93LiRlbC5zdHlsZS5sZWZ0KSB8fCAwLFxuICAgICAgICAgICAgeTogcGFyc2VJbnQoZmxvYXRXaW5kb3cuJGVsLnN0eWxlLnRvcCkgfHwgMCxcbiAgICAgICAgICAgIHdpZHRoOiBwYXJzZUludChmbG9hdFdpbmRvdy4kZWwuc3R5bGUud2lkdGgpLFxuICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludChmbG9hdFdpbmRvdy4kZWwuc3R5bGUuaGVpZ2h0KSxcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgY29uc3Qgb25DbGlja0hpZGUgPSAoKSA9PiB7XG4gICAgICAgIGhpZGUoKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gc3luY0Jhc2UoKSB7XG4gICAgICAgIGNvbnN0IGJhc2UgPSBwcm9wcy5jb25maWcuYmFzZTtcbiAgICAgICAgaGVhZGVyVGl0bGUudmFsdWUgPSBiYXNlLnRpdGxlO1xuICAgIH1cblxuICAgIHdhdGNoKCgpID0+IHByb3BzLmNvbmZpZy5iYXNlLCAoKSA9PiB7XG4gICAgICAgIHN5bmNCYXNlKCk7XG4gICAgfSk7XG5cbiAgICBvbk1vdW50ZWQoKCkgPT4ge1xuICAgICAgICBuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICBzeW5jQmFzZSgpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIG9uU2l6ZUNoYW5nZWQoKSB7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvblNob3coKSB7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbkhpZGUoKSB7XG4gICAgICAgIGN0eC5lbWl0KCdoaWRlJywgcHJvcHMuY29uZmlnLmtleSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmxvYXRXaW5kb3dSZWYsXG4gICAgICAgIGhlYWRlclRpdGxlLFxuXG4gICAgICAgIGlzU2hvdyxcblxuICAgICAgICBzaG93LFxuICAgICAgICBoaWRlLFxuICAgICAgICBvbkNsaWNrSGlkZSxcbiAgICAgICAgZ2V0UmVjdCxcblxuICAgICAgICBvblNob3csXG4gICAgICAgIG9uSGlkZSxcbiAgICAgICAgb25TaXplQ2hhbmdlZCxcbiAgICB9O1xufTtcblxuZXhwb3J0IGNvbnN0IGNvbW1vblRlbXBsYXRlID0gKGNvbmZpZzogeyBjc3M/OiBzdHJpbmcsIGhlYWRlcj86IHN0cmluZywgc2VjdGlvbj86IHN0cmluZywgZm9vdGVyPzogc3RyaW5nIH0pID0+IHtcbiAgICByZXR1cm4gYFxuICAgICAgPEJhc2VGbG9hdFdpbmRvd1xuICAgICAgICAgIHJlZj1cImZsb2F0V2luZG93UmVmXCJcbiAgICAgICAgICA6Zm9yZ2U9XCJmb3JnZVwiXG4gICAgICAgICAgOmNvbmZpZz1cImNvbmZpZ1wiXG4gICAgICAgICAgY2xhc3M9XCIke2NvbmZpZy5jc3N9XCJcbiAgICAgICAgICBAc2hvdz1cIm9uU2hvd1wiXG4gICAgICAgICAgQGhpZGU9XCJvbkhpZGVcIlxuICAgICAgICAgIEBzaXplLWNoYW5nZWQ9XCJvblNpemVDaGFuZ2VkXCJcbiAgICAgID5cbiAgICAgICAgPHRlbXBsYXRlIHYtaWY9XCIke2NvbmZpZy5oZWFkZXIgIT09IHVuZGVmaW5lZH1cIiAjaGVhZGVyPlxuICAgICAgICAgICR7Y29uZmlnLmhlYWRlcn1cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgPHRlbXBsYXRlIHYtZWxzZSAjaGVhZGVyPlxuICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGl0bGVcIj5cbiAgICAgICAgICAgICAgPHVpLWxhYmVsIDp2YWx1ZT1oZWFkZXJUaXRsZT48L3VpLWxhYmVsPlxuICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgPHVpLWljb24gY2xhc3M9XCJoaWRlLWJ1dHRvblwiIHZhbHVlPVwiY29sbGFwc2UtcmlnaHRcIiBAY2xpY2s9XCJvbkNsaWNrSGlkZVwiPjwvdWktaWNvbj5cbiAgICAgICAgPC90ZW1wbGF0ZT5cbiAgICAgICAgXG4gICAgICAgIDx0ZW1wbGF0ZSAjc2VjdGlvbj5cbiAgICAgICAgICAke2NvbmZpZy5zZWN0aW9ufVxuICAgICAgICA8L3RlbXBsYXRlPlxuICAgICAgICA8dGVtcGxhdGUgI2Zvb3Rlcj5cbiAgICAgICAgICAke2NvbmZpZy5mb290ZXJ9XG4gICAgICAgIDwvdGVtcGxhdGU+XG4gICAgICA8L0Jhc2VGbG9hdFdpbmRvdz5cbiAgICBgO1xufTtcbiJdfQ==