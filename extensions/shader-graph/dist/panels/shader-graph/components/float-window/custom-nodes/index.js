"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.component = exports.getConfig = exports.DefaultConfig = void 0;
const tslib_1 = require("tslib");
const vue_js_1 = require("vue/dist/vue.js");
const lodash_1 = require("lodash");
const base_1 = tslib_1.__importDefault(require("../base"));
const common_1 = require("../common");
const internal_1 = require("../internal");
const shader_graph_1 = require("../../../../../shader-graph");
exports.DefaultConfig = {
    key: 'custom-nodes',
    tab: {
        name: 'i18n:shader-graph.custom_nodes.menu_name',
        show: false,
    },
    base: {
        title: 'i18n:shader-graph.custom_nodes.title',
        minWidth: '240px',
        minHeight: '240px',
        defaultShow: false,
    },
    position: {
        right: '0',
        top: '360',
    },
    events: {
        resizer: true,
        drag: true,
        target: internal_1.FloatWindowDragTarget.header,
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
    emits: [
        ...common_1.commonEmits,
    ],
    setup(props, ctx) {
        return {
            ...(0, common_1.commonLogic)(props, ctx),
        };
    },
    template: (0, common_1.commonTemplate)({
        section: `
        
        `,
        footer: `
        
        `,
    }),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvcGFuZWxzL3NoYWRlci1ncmFwaC9jb21wb25lbnRzL2Zsb2F0LXdpbmRvdy9jdXN0b20tbm9kZXMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLDRDQUFrRDtBQUVsRCxtQ0FBK0I7QUFDL0IsMkRBQXNDO0FBQ3RDLHNDQUFrRjtBQUNsRiwwQ0FBdUU7QUFDdkUsOERBQTZEO0FBRWhELFFBQUEsYUFBYSxHQUFzQjtJQUM1QyxHQUFHLEVBQUUsY0FBYztJQUNuQixHQUFHLEVBQUU7UUFDRCxJQUFJLEVBQUUsMENBQTBDO1FBQ2hELElBQUksRUFBRSxLQUFLO0tBQ2Q7SUFDRCxJQUFJLEVBQUU7UUFDRixLQUFLLEVBQUUsc0NBQXNDO1FBQzdDLFFBQVEsRUFBRSxPQUFPO1FBQ2pCLFNBQVMsRUFBRSxPQUFPO1FBQ2xCLFdBQVcsRUFBRSxLQUFLO0tBQ3JCO0lBQ0QsUUFBUSxFQUFFO1FBQ04sS0FBSyxFQUFFLEdBQUc7UUFDVixHQUFHLEVBQUUsS0FBSztLQUNiO0lBQ0QsTUFBTSxFQUFFO1FBQ0osT0FBTyxFQUFFLElBQUk7UUFDYixJQUFJLEVBQUUsSUFBSTtRQUNWLE1BQU0sRUFBRSxnQ0FBcUIsQ0FBQyxNQUFNO0tBQ3ZDO0NBQ0osQ0FBQztBQUVGLFNBQWdCLFNBQVM7SUFDckIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLHFCQUFhLENBQUMsQ0FBQyxDQUFDO0lBQzVELE1BQU0sTUFBTSxHQUFHLDZCQUFjLENBQUMsUUFBUSxDQUFDLDZCQUE2QixDQUFDLHFCQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEYsSUFBSSxNQUFNLEVBQUU7UUFDUixTQUFTLENBQUMsT0FBTyxHQUFHLElBQUEsY0FBSyxFQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQzVEO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDckIsQ0FBQztBQVBELDhCQU9DO0FBRVksUUFBQSxTQUFTLEdBQUcsSUFBQSx3QkFBZSxFQUFDO0lBRXJDLFVBQVUsRUFBRTtRQUNSLGVBQWUsRUFBZixjQUFlO0tBQ2xCO0lBRUQsS0FBSyxFQUFFO1FBQ0gsR0FBRyxvQkFBVztLQUNqQjtJQUVELEtBQUssRUFBRTtRQUNILEdBQUcsb0JBQVc7S0FDakI7SUFFRCxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUc7UUFDWixPQUFPO1lBQ0gsR0FBRyxJQUFBLG9CQUFXLEVBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQztTQUU3QixDQUFDO0lBQ04sQ0FBQztJQUVELFFBQVEsRUFBRSxJQUFBLHVCQUFjLEVBQUM7UUFDckIsT0FBTyxFQUFFOztTQUVSO1FBQ0QsTUFBTSxFQUFFOztTQUVQO0tBQ0osQ0FBQztDQUNMLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRlZmluZUNvbXBvbmVudCB9IGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5cbmltcG9ydCB7IG1lcmdlIH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBCYXNlRmxvYXRXaW5kb3cgZnJvbSAnLi4vYmFzZSc7XG5pbXBvcnQgeyBjb21tb25FbWl0cywgY29tbW9uTG9naWMsIGNvbW1vblByb3BzLCBjb21tb25UZW1wbGF0ZSB9IGZyb20gJy4uL2NvbW1vbic7XG5pbXBvcnQgeyBGbG9hdFdpbmRvd0NvbmZpZywgRmxvYXRXaW5kb3dEcmFnVGFyZ2V0IH0gZnJvbSAnLi4vaW50ZXJuYWwnO1xuaW1wb3J0IHsgR3JhcGhDb25maWdNZ3IgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9zaGFkZXItZ3JhcGgnO1xuXG5leHBvcnQgY29uc3QgRGVmYXVsdENvbmZpZzogRmxvYXRXaW5kb3dDb25maWcgPSB7XG4gICAga2V5OiAnY3VzdG9tLW5vZGVzJyxcbiAgICB0YWI6IHtcbiAgICAgICAgbmFtZTogJ2kxOG46c2hhZGVyLWdyYXBoLmN1c3RvbV9ub2Rlcy5tZW51X25hbWUnLFxuICAgICAgICBzaG93OiBmYWxzZSxcbiAgICB9LFxuICAgIGJhc2U6IHtcbiAgICAgICAgdGl0bGU6ICdpMThuOnNoYWRlci1ncmFwaC5jdXN0b21fbm9kZXMudGl0bGUnLFxuICAgICAgICBtaW5XaWR0aDogJzI0MHB4JyxcbiAgICAgICAgbWluSGVpZ2h0OiAnMjQwcHgnLFxuICAgICAgICBkZWZhdWx0U2hvdzogZmFsc2UsXG4gICAgfSxcbiAgICBwb3NpdGlvbjoge1xuICAgICAgICByaWdodDogJzAnLFxuICAgICAgICB0b3A6ICczNjAnLFxuICAgIH0sXG4gICAgZXZlbnRzOiB7XG4gICAgICAgIHJlc2l6ZXI6IHRydWUsXG4gICAgICAgIGRyYWc6IHRydWUsXG4gICAgICAgIHRhcmdldDogRmxvYXRXaW5kb3dEcmFnVGFyZ2V0LmhlYWRlcixcbiAgICB9LFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbmZpZygpIHtcbiAgICBjb25zdCBuZXdDb25maWcgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KERlZmF1bHRDb25maWcpKTtcbiAgICBjb25zdCBjb25maWcgPSBHcmFwaENvbmZpZ01nci5JbnN0YW5jZS5nZXRGbG9hdGluZ1dpbmRvd0NvbmZpZ0J5TmFtZShEZWZhdWx0Q29uZmlnLmtleSk7XG4gICAgaWYgKGNvbmZpZykge1xuICAgICAgICBuZXdDb25maWcuZGV0YWlscyA9IG1lcmdlKHt9LCBuZXdDb25maWcuZGV0YWlscywgY29uZmlnKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld0NvbmZpZztcbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudCA9IGRlZmluZUNvbXBvbmVudCh7XG5cbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIEJhc2VGbG9hdFdpbmRvdyxcbiAgICB9LFxuXG4gICAgcHJvcHM6IHtcbiAgICAgICAgLi4uY29tbW9uUHJvcHMsXG4gICAgfSxcblxuICAgIGVtaXRzOiBbXG4gICAgICAgIC4uLmNvbW1vbkVtaXRzLFxuICAgIF0sXG5cbiAgICBzZXR1cChwcm9wcywgY3R4KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5jb21tb25Mb2dpYyhwcm9wcywgY3R4KSxcblxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICB0ZW1wbGF0ZTogY29tbW9uVGVtcGxhdGUoe1xuICAgICAgICBzZWN0aW9uOiBgXG4gICAgICAgIFxuICAgICAgICBgLFxuICAgICAgICBmb290ZXI6IGBcbiAgICAgICAgXG4gICAgICAgIGAsXG4gICAgfSksXG59KTtcblxuIl19