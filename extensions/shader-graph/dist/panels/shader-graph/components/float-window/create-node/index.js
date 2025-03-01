"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.component = exports.getConfig = exports.DefaultConfig = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const vue_js_1 = require("vue/dist/vue.js");
const internal_1 = require("../internal");
const block_forge_1 = require("../../../../../block-forge");
const base_1 = tslib_1.__importDefault(require("../base"));
const common_1 = require("../common");
const shader_graph_1 = require("../../../../../shader-graph");
const utils_1 = require("../utils");
const shader_graph_2 = require("../../../../../shader-graph");
exports.DefaultConfig = {
    key: 'create-node',
    tab: {
        name: 'i18n:shader-graph.create_node.menu_name',
        show: false,
    },
    dontSave: true,
    base: {
        title: 'i18n:shader-graph.create_node.title',
        width: '380px',
        height: '250px',
        minWidth: '200px',
        minHeight: '200px',
        defaultShow: false,
    },
    position: {
        top: '200px',
        left: '200px',
    },
    events: {
        limitless: true,
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
    emits: [...common_1.commonEmits],
    setup(props, ctx) {
        const commonObject = (0, common_1.commonLogic)(props, ctx);
        const searchValue = (0, vue_js_1.ref)('');
        const searchInputRef = (0, vue_js_1.ref)();
        const menuRef = (0, vue_js_1.ref)();
        const foldValue = (0, vue_js_1.ref)(true);
        const onCreateMenuChange = () => {
            updateMenuTreeTemplate();
        };
        const onShowCreateNodeWindow = () => {
            const floatWindowRef = commonObject.floatWindowRef.value;
            const floatWindowConfig = floatWindowRef?.$options.propsData.config;
            if (floatWindowRef && floatWindowConfig) {
                if (commonObject.isShow()) {
                    return;
                }
                const $shaderGraph = floatWindowRef.$parent.$parent.$el;
                const shaderGraphRect = (0, utils_1.getBoundingClientRect)($shaderGraph);
                const inPanel = (0, shader_graph_2.contains)(shader_graph_1.GraphEditorMgr.Instance.mousePoint, {
                    x: shaderGraphRect.left,
                    y: shaderGraphRect.top,
                    width: shaderGraphRect.width,
                    height: shaderGraphRect.height,
                });
                // 如果鼠标不在面板中就不弹窗
                if (!inPanel)
                    return;
                const floatWindowRect = commonObject.getRect();
                const width = floatWindowRect.width || floatWindowConfig.base.width;
                const height = floatWindowRect.height || floatWindowConfig.base.height;
                const offsetX = 300, offsetY = 0;
                let x = shader_graph_1.GraphEditorMgr.Instance.mousePointInPanel.x - offsetX;
                const titleBarHeight = (0, utils_1.getTitleBarHeight)(); // 系统 titleBar 的高度
                let y = shader_graph_1.GraphEditorMgr.Instance.mousePointInPanel.y - titleBarHeight - offsetY;
                if (x < 0) {
                    x = 0;
                }
                else if (x + floatWindowRect.width > shaderGraphRect.width - 28) {
                    x = shaderGraphRect.width - floatWindowRect.width - 28;
                }
                if (y < 0) {
                    y = 0;
                }
                else if (y + floatWindowRect.height > shaderGraphRect.bottom - 40) {
                    y = shaderGraphRect.bottom - floatWindowRect.height - 40;
                }
                foldValue.value = true;
                updateMenuTreeTemplate();
                commonObject.show({
                    left: x + 'px',
                    top: y + 'px',
                });
                window.addEventListener('keyup', onKeyup);
                (0, vue_js_1.nextTick)(() => {
                    searchValue.value = '';
                    menuRef.value.clear();
                    menuRef.value.select(menuRef.value.list[2]);
                    menuRef.value.positioning(menuRef.value.list[2]);
                    searchInputRef.value.focus();
                });
            }
        };
        (0, vue_js_1.onMounted)(() => {
            shader_graph_1.MessageMgr.Instance.register(shader_graph_2.MessageType.CreateMenuChange, onCreateMenuChange);
            shader_graph_1.MessageMgr.Instance.register(shader_graph_2.MessageType.ShowCreateNodeWindow, onShowCreateNodeWindow);
        });
        (0, vue_js_1.onUnmounted)(() => {
            shader_graph_1.MessageMgr.Instance.unregister(shader_graph_2.MessageType.CreateMenuChange, onCreateMenuChange);
            shader_graph_1.MessageMgr.Instance.unregister(shader_graph_2.MessageType.ShowCreateNodeWindow, onShowCreateNodeWindow);
        });
        function createNode(addOptions) {
            if (!addOptions)
                return;
            const floatWindowRef = commonObject.floatWindowRef.value;
            const $shaderGraph = floatWindowRef.$parent.$parent.$el;
            shader_graph_1.GraphEditorMgr.Instance.add(addOptions);
            onClose();
        }
        let initialized = false;
        function updateMenuTreeTemplate() {
            if (!initialized) {
                initialized = true;
                menuRef.value.setTemplate('text', `<span class="name"></span>`);
                menuRef.value.setTemplateInit('text', ($text) => {
                    $text.$name = $text.querySelector('.name');
                });
                menuRef.value.setRender('text', ($text, data) => {
                    $text.$name.innerHTML = data.detail.value;
                });
                menuRef.value.setTemplateInit('item', ($div) => {
                    $div.addEventListener('click', (event) => {
                        menuRef.value.clear();
                        menuRef.value.select($div.data);
                        menuRef.value.render();
                        createNode($div.data.detail.addOptions);
                    });
                });
                menuRef.value.css = `
                    .item {
                        text-align: center;
                        line-height: 24px;
                    }
                    .content .fixed .list > ui-drag-item[selected] {
                        background-color: #094A5D;
                    }
                `;
            }
            menuRef.value.tree = (0, utils_1.convertMenuData)(shader_graph_1.Menu.Instance.getShaderNodeMenu(), false);
            menuRef.value.render();
        }
        function getSelectedCreateNodeItem(item, list, arrow = 'down') {
            let index = item.index;
            if (arrow === 'down') {
                index++;
                if (index > list.length - 1)
                    index = 0;
                item = list[index];
                // while (item && item.children.length > 0) {
                //     index++;
                //     if (index > list.length - 1) index = 0;
                //
                //     item = list[index];
                // }
            }
            else if (arrow === 'up') {
                index--;
                if (index < 0)
                    index = list.length - 1;
                item = list[index];
                // while (item && item.children.length > 0) {
                //     index--;
                //     if (index < 0) index = list.length - 1;
                //
                //     item = list[index];
                // }
            }
            return item;
        }
        function onKeyup(event) {
            const which = event.which;
            // 'Escape' 退出
            if (which === 27) {
                onClose();
                return;
            }
            const $dom = menuRef.value;
            const item = $dom.selectItems[$dom.selectItems.length - 1];
            if (!item)
                return;
            let selectItem = undefined;
            switch (which) {
                case 13: // Enter
                    if (!item.detail.addOptions)
                        return;
                    createNode(item.detail.addOptions);
                    return;
                case 40: // ArrowDown
                    selectItem = getSelectedCreateNodeItem(item, $dom.list, 'down');
                    break;
                case 38: // ArrowUp
                    selectItem = getSelectedCreateNodeItem(item, $dom.list, 'up');
                    break;
                case 37: // ArrowLeft
                    if (!item.fold && item.parent) {
                        $dom.collapse(item.parent);
                    }
                    if (item.parent.parent) {
                        $dom.clear();
                        $dom.select(item.parent);
                    }
                    break;
                case 39: // ArrowRight
                    if (item.fold && item.children.length > 0) {
                        $dom.expand(item);
                    }
                    if (item.children[0]) {
                        $dom.clear();
                        $dom.select(item.children[0]);
                    }
                    break;
            }
            if (selectItem !== undefined) {
                $dom.clear();
                $dom.select(selectItem);
                $dom.positioning(selectItem);
            }
            $dom.render();
        }
        function onSearchInputChange(value) {
            if (searchValue.value === value)
                return;
            searchValue.value = value;
            setTimeout(() => {
                let selectItem;
                let treeData = (0, utils_1.convertMenuData)(shader_graph_1.Menu.Instance.getShaderNodeMenu(), false);
                if (value) {
                    const result = (0, utils_1.filterMenuByKeyword)(treeData, value);
                    treeData = result.filterTree;
                    selectItem = result.firstSelect;
                }
                const $dom = menuRef.value;
                $dom.tree = treeData;
                if (treeData.length > 0) {
                    $dom.clear();
                    $dom.select(selectItem);
                    menuRef.value.positioning(selectItem);
                    $dom.render();
                }
            }, 50);
        }
        function onClose() {
            window.removeEventListener('keyup', onKeyup);
            searchValue.value = '';
            commonObject.hide();
        }
        (0, vue_js_1.onUnmounted)(() => {
            onClose();
        });
        commonObject.onSizeChanged = () => {
            setTimeout(() => {
                if (menuRef.value) {
                    menuRef.value.render();
                }
            }, 100);
        };
        return {
            ...commonObject,
            searchValue,
            searchInputRef,
            menuRef,
            onClose,
            onSearchInputChange,
        };
    },
    template: (0, common_1.commonTemplate)({
        css: 'create-node',
        header: `
<ui-label class="title-label" value="i18n:shader-graph.create_node.title"></ui-label>
<ui-button class="close" transparent
  tooltip="i18n:shader-graph.create_node.close.tooltip"
  @click="onClose"
>
  <ui-icon value="close"></ui-icon>
</ui-button>
        `,
        section: `
<div class="search-group">
  <ui-icon class="icon" value="search"></ui-icon>
  <ui-input ref="searchInputRef" class="input"
    :value="searchValue"
    placeholder="i18n:shader-graph.create_node.search_input.placeholder"
    @change="onSearchInputChange($event.target.value)"
  ></ui-input>
</div>

<ui-tree ref="menuRef" class="menus"></ui-tree>
        `,
        footer: `
        `,
    }),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvcGFuZWxzL3NoYWRlci1ncmFwaC9jb21wb25lbnRzL2Zsb2F0LXdpbmRvdy9jcmVhdGUtbm9kZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsbUNBQStCO0FBRS9CLDRDQUF5RjtBQUV6RiwwQ0FBdUU7QUFDdkUsNERBQW1FO0FBQ25FLDJEQUFzQztBQUN0QyxzQ0FBcUU7QUFFckUsOERBQXNIO0FBQ3RILG9DQUEwRztBQUUxRyw4REFBb0U7QUFFdkQsUUFBQSxhQUFhLEdBQXNCO0lBQzVDLEdBQUcsRUFBRSxhQUFhO0lBQ2xCLEdBQUcsRUFBRTtRQUNELElBQUksRUFBRSx5Q0FBeUM7UUFDL0MsSUFBSSxFQUFFLEtBQUs7S0FDZDtJQUNELFFBQVEsRUFBRSxJQUFJO0lBQ2QsSUFBSSxFQUFFO1FBQ0YsS0FBSyxFQUFFLHFDQUFxQztRQUM1QyxLQUFLLEVBQUUsT0FBTztRQUNkLE1BQU0sRUFBRSxPQUFPO1FBQ2YsUUFBUSxFQUFFLE9BQU87UUFDakIsU0FBUyxFQUFFLE9BQU87UUFDbEIsV0FBVyxFQUFFLEtBQUs7S0FDckI7SUFDRCxRQUFRLEVBQUU7UUFDTixHQUFHLEVBQUUsT0FBTztRQUNaLElBQUksRUFBRSxPQUFPO0tBQ2hCO0lBQ0QsTUFBTSxFQUFFO1FBQ0osU0FBUyxFQUFFLElBQUk7UUFDZixPQUFPLEVBQUUsSUFBSTtRQUNiLElBQUksRUFBRSxJQUFJO1FBQ1YsTUFBTSxFQUFFLGdDQUFxQixDQUFDLE1BQU07S0FDdkM7Q0FDSixDQUFDO0FBRUYsU0FBZ0IsU0FBUztJQUNyQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMscUJBQWEsQ0FBQyxDQUFDLENBQUM7SUFDNUQsTUFBTSxNQUFNLEdBQUcsNkJBQWMsQ0FBQyxRQUFRLENBQUMsNkJBQTZCLENBQUMs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UUFDRCxPQUFPLEVBQUU7Ozs7Ozs7Ozs7O1NBV1I7UUFDRCxNQUFNLEVBQUU7U0FDUDtLQUNKLENBQUM7Q0FDTCxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBtZXJnZSB9IGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCB7IGRlZmluZUNvbXBvbmVudCwgcmVmLCBuZXh0VGljaywgb25Nb3VudGVkLCBvblVubW91bnRlZCB9IGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5cbmltcG9ydCB7IEZsb2F0V2luZG93Q29uZmlnLCBGbG9hdFdpbmRvd0RyYWdUYXJnZXQgfSBmcm9tICcuLi9pbnRlcm5hbCc7XG5pbXBvcnQgeyBIVE1MR3JhcGhGb3JnZUVsZW1lbnQgfSBmcm9tICcuLi8uLi8uLi8uLi8uLi9ibG9jay1mb3JnZSc7XG5pbXBvcnQgQmFzZUZsb2F0V2luZG93IGZyb20gJy4uL2Jhc2UnO1xuaW1wb3J0IHsgY29tbW9uRW1pdHMsIGNvbW1vbkxvZ2ljLCBjb21tb25UZW1wbGF0ZSB9IGZyb20gJy4uL2NvbW1vbic7XG5cbmltcG9ydCB7IEdyYXBoQ29uZmlnTWdyLCBHcmFwaEVkaXRvck1nciwgTWVudSwgR3JhcGhFZGl0b3JBZGRPcHRpb25zLCBNZXNzYWdlTWdyIH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vc2hhZGVyLWdyYXBoJztcbmltcG9ydCB7IGNvbnZlcnRNZW51RGF0YSwgZmlsdGVyTWVudUJ5S2V5d29yZCwgZ2V0Qm91bmRpbmdDbGllbnRSZWN0LCBnZXRUaXRsZUJhckhlaWdodCB9IGZyb20gJy4uL3V0aWxzJztcblxuaW1wb3J0IHsgY29udGFpbnMsIE1lc3NhZ2VUeXBlIH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vc2hhZGVyLWdyYXBoJztcblxuZXhwb3J0IGNvbnN0IERlZmF1bHRDb25maWc6IEZsb2F0V2luZG93Q29uZmlnID0ge1xuICAgIGtleTogJ2NyZWF0ZS1ub2RlJyxcbiAgICB0YWI6IHtcbiAgICAgICAgbmFtZTogJ2kxOG46c2hhZGVyLWdyYXBoLmNyZWF0ZV9ub2RlLm1lbnVfbmFtZScsXG4gICAgICAgIHNob3c6IGZhbHNlLFxuICAgIH0sXG4gICAgZG9udFNhdmU6IHRydWUsXG4gICAgYmFzZToge1xuICAgICAgICB0aXRsZTogJ2kxOG46c2hhZGVyLWdyYXBoLmNyZWF0ZV9ub2RlLnRpdGxlJyxcbiAgICAgICAgd2lkdGg6ICczODBweCcsXG4gICAgICAgIGhlaWdodDogJzI1MHB4JyxcbiAgICAgICAgbWluV2lkdGg6ICcyMDBweCcsXG4gICAgICAgIG1pbkhlaWdodDogJzIwMHB4JyxcbiAgICAgICAgZGVmYXVsdFNob3c6IGZhbHNlLFxuICAgIH0sXG4gICAgcG9zaXRpb246IHtcbiAgICAgICAgdG9wOiAnMjAwcHgnLFxuICAgICAgICBsZWZ0OiAnMjAwcHgnLFxuICAgIH0sXG4gICAgZXZlbnRzOiB7XG4gICAgICAgIGxpbWl0bGVzczogdHJ1ZSxcbiAgICAgICAgcmVzaXplcjogdHJ1ZSxcbiAgICAgICAgZHJhZzogdHJ1ZSxcbiAgICAgICAgdGFyZ2V0OiBGbG9hdFdpbmRvd0RyYWdUYXJnZXQuaGVhZGVyLFxuICAgIH0sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnKCkge1xuICAgIGNvbnN0IG5ld0NvbmZpZyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoRGVmYXVsdENvbmZpZykpO1xuICAgIGNvbnN0IGNvbmZpZyA9IEdyYXBoQ29uZmlnTWdyLkluc3RhbmNlLmdldEZsb2F0aW5nV2luZG93Q29uZmlnQnlOYW1lKERlZmF1bHRDb25maWcua2V5KTtcbiAgICBpZiAoY29uZmlnKSB7XG4gICAgICAgIG5ld0NvbmZpZy5kZXRhaWxzID0gbWVyZ2Uoe30sIG5ld0NvbmZpZy5kZXRhaWxzLCBjb25maWcpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3Q29uZmlnO1xufVxuXG5leHBvcnQgY29uc3QgY29tcG9uZW50ID0gZGVmaW5lQ29tcG9uZW50KHtcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIEJhc2VGbG9hdFdpbmRvdyxcbiAgICB9LFxuXG4gICAgcHJvcHM6IHtcbiAgICAgICAgZm9yZ2U6IHtcbiAgICAgICAgICAgIHR5cGU6IEhUTUxHcmFwaEZvcmdlRWxlbWVudCxcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbCxcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICB0eXBlOiBPYmplY3QgYXMgKCkgPT4gRmxvYXRXaW5kb3dDb25maWcsXG4gICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIGVtaXRzOiBbLi4uY29tbW9uRW1pdHNdLFxuXG4gICAgc2V0dXAocHJvcHMsIGN0eCkge1xuICAgICAgICBjb25zdCBjb21tb25PYmplY3QgPSBjb21tb25Mb2dpYyhwcm9wcywgY3R4KTtcbiAgICAgICAgY29uc3Qgc2VhcmNoVmFsdWUgPSByZWYoJycpO1xuICAgICAgICBjb25zdCBzZWFyY2hJbnB1dFJlZiA9IHJlZigpO1xuICAgICAgICBjb25zdCBtZW51UmVmID0gcmVmKCk7XG4gICAgICAgIGNvbnN0IGZvbGRWYWx1ZSA9IHJlZih0cnVlKTtcblxuICAgICAgICBjb25zdCBvbkNyZWF0ZU1lbnVDaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB1cGRhdGVNZW51VHJlZVRlbXBsYXRlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgb25TaG93Q3JlYXRlTm9kZVdpbmRvdyA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZsb2F0V2luZG93UmVmID0gY29tbW9uT2JqZWN0LmZsb2F0V2luZG93UmVmLnZhbHVlO1xuICAgICAgICAgICAgY29uc3QgZmxvYXRXaW5kb3dDb25maWcgPSBmbG9hdFdpbmRvd1JlZj8uJG9wdGlvbnMucHJvcHNEYXRhLmNvbmZpZztcbiAgICAgICAgICAgIGlmIChmbG9hdFdpbmRvd1JlZiAmJiBmbG9hdFdpbmRvd0NvbmZpZykge1xuICAgICAgICAgICAgICAgIGlmIChjb21tb25PYmplY3QuaXNTaG93KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCAkc2hhZGVyR3JhcGggPSBmbG9hdFdpbmRvd1JlZi4kcGFyZW50LiRwYXJlbnQuJGVsO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNoYWRlckdyYXBoUmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdCgkc2hhZGVyR3JhcGgpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaW5QYW5lbCA9IGNvbnRhaW5zKEdyYXBoRWRpdG9yTWdyLkluc3RhbmNlLm1vdXNlUG9pbnQsIHtcbiAgICAgICAgICAgICAgICAgICAgeDogc2hhZGVyR3JhcGhSZWN0LmxlZnQsXG4gICAgICAgICAgICAgICAgICAgIHk6IHNoYWRlckdyYXBoUmVjdC50b3AsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBzaGFkZXJHcmFwaFJlY3Qud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogc2hhZGVyR3JhcGhSZWN0LmhlaWdodCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzpvKDmoIfkuI3lnKjpnaLmnb/kuK3lsLHkuI3lvLnnqpdcbiAgICAgICAgICAgICAgICBpZiAoIWluUGFuZWwpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGZsb2F0V2luZG93UmVjdCA9IGNvbW1vbk9iamVjdC5nZXRSZWN0KCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBmbG9hdFdpbmRvd1JlY3Qud2lkdGggfHwgZmxvYXRXaW5kb3dDb25maWcuYmFzZS53aWR0aDtcbiAgICAgICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBmbG9hdFdpbmRvd1JlY3QuaGVpZ2h0IHx8IGZsb2F0V2luZG93Q29uZmlnLmJhc2UuaGVpZ2h0O1xuICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldFggPSAzMDAsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldFkgPSAwO1xuICAgICAgICAgICAgICAgIGxldCB4ID0gR3JhcGhFZGl0b3JNZ3IuSW5zdGFuY2UubW91c2VQb2ludEluUGFuZWwueCAtIG9mZnNldFg7XG4gICAgICAgICAgICAgICAgY29uc3QgdGl0bGVCYXJIZWlnaHQgPSBnZXRUaXRsZUJhckhlaWdodCgpOyAvLyDns7vnu58gdGl0bGVCYXIg55qE6auY5bqmXG4gICAgICAgICAgICAgICAgbGV0IHkgPSBHcmFwaEVkaXRvck1nci5JbnN0YW5jZS5tb3VzZVBvaW50SW5QYW5lbC55IC0gdGl0bGVCYXJIZWlnaHQgLSBvZmZzZXRZO1xuXG4gICAgICAgICAgICAgICAgaWYgKHggPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHggPSAwO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeCArIGZsb2F0V2luZG93UmVjdC53aWR0aCA+IHNoYWRlckdyYXBoUmVjdC53aWR0aCAtIDI4KSB7XG4gICAgICAgICAgICAgICAgICAgIHggPSBzaGFkZXJHcmFwaFJlY3Qud2lkdGggLSBmbG9hdFdpbmRvd1JlY3Qud2lkdGggLSAyODtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHkgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHkgPSAwO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeSArIGZsb2F0V2luZG93UmVjdC5oZWlnaHQgPiBzaGFkZXJHcmFwaFJlY3QuYm90dG9tIC0gNDApIHtcbiAgICAgICAgICAgICAgICAgICAgeSA9IHNoYWRlckdyYXBoUmVjdC5ib3R0b20gLSBmbG9hdFdpbmRvd1JlY3QuaGVpZ2h0IC0gNDA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9sZFZhbHVlLnZhbHVlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB1cGRhdGVNZW51VHJlZVRlbXBsYXRlKCk7XG4gICAgICAgICAgICAgICAgY29tbW9uT2JqZWN0LnNob3coe1xuICAgICAgICAgICAgICAgICAgICBsZWZ0OiB4ICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgdG9wOiB5ICsgJ3B4JyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBvbktleXVwKTtcblxuICAgICAgICAgICAgICAgIG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoVmFsdWUudmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgbWVudVJlZi52YWx1ZS5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICBtZW51UmVmLnZhbHVlLnNlbGVjdChtZW51UmVmLnZhbHVlLmxpc3RbMl0pO1xuICAgICAgICAgICAgICAgICAgICBtZW51UmVmLnZhbHVlLnBvc2l0aW9uaW5nKG1lbnVSZWYudmFsdWUubGlzdFsyXSk7XG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaElucHV0UmVmLnZhbHVlLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgb25Nb3VudGVkKCgpID0+IHtcbiAgICAgICAgICAgIE1lc3NhZ2VNZ3IuSW5zdGFuY2UucmVnaXN0ZXIoTWVzc2FnZVR5cGUuQ3JlYXRlTWVudUNoYW5nZSwgb25DcmVhdGVNZW51Q2hhbmdlKTtcbiAgICAgICAgICAgIE1lc3NhZ2VNZ3IuSW5zdGFuY2UucmVnaXN0ZXIoTWVzc2FnZVR5cGUuU2hvd0NyZWF0ZU5vZGVXaW5kb3csIG9uU2hvd0NyZWF0ZU5vZGVXaW5kb3cpO1xuICAgICAgICB9KTtcblxuICAgICAgICBvblVubW91bnRlZCgoKSA9PiB7XG4gICAgICAgICAgICBNZXNzYWdlTWdyLkluc3RhbmNlLnVucmVnaXN0ZXIoTWVzc2FnZVR5cGUuQ3JlYXRlTWVudUNoYW5nZSwgb25DcmVhdGVNZW51Q2hhbmdlKTtcbiAgICAgICAgICAgIE1lc3NhZ2VNZ3IuSW5zdGFuY2UudW5yZWdpc3RlcihNZXNzYWdlVHlwZS5TaG93Q3JlYXRlTm9kZVdpbmRvdywgb25TaG93Q3JlYXRlTm9kZVdpbmRvdyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZU5vZGUoYWRkT3B0aW9uczogR3JhcGhFZGl0b3JBZGRPcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoIWFkZE9wdGlvbnMpIHJldHVybjtcbiAgICAgICAgICAgIGNvbnN0IGZsb2F0V2luZG93UmVmID0gY29tbW9uT2JqZWN0LmZsb2F0V2luZG93UmVmLnZhbHVlITtcbiAgICAgICAgICAgIGNvbnN0ICRzaGFkZXJHcmFwaCA9IGZsb2F0V2luZG93UmVmLiRwYXJlbnQuJHBhcmVudC4kZWw7XG4gICAgICAgICAgICBHcmFwaEVkaXRvck1nci5JbnN0YW5jZS5hZGQoYWRkT3B0aW9ucyk7XG4gICAgICAgICAgICBvbkNsb3NlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICAgICAgZnVuY3Rpb24gdXBkYXRlTWVudVRyZWVUZW1wbGF0ZSgpIHtcbiAgICAgICAgICAgIGlmICghaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgICAgICBpbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgbWVudVJlZi52YWx1ZS5zZXRUZW1wbGF0ZSgndGV4dCcsIGA8c3BhbiBjbGFzcz1cIm5hbWVcIj48L3NwYW4+YCk7XG4gICAgICAgICAgICAgICAgbWVudVJlZi52YWx1ZS5zZXRUZW1wbGF0ZUluaXQoJ3RleHQnLCAoJHRleHQ6IEhUTUxFbGVtZW50ICYgeyAkbmFtZTogSFRNTEVsZW1lbnQgfCBudWxsOyAkbGluazogSFRNTEVsZW1lbnQgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAkdGV4dC4kbmFtZSA9ICR0ZXh0LnF1ZXJ5U2VsZWN0b3IoJy5uYW1lJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbWVudVJlZi52YWx1ZS5zZXRSZW5kZXIoXG4gICAgICAgICAgICAgICAgICAgICd0ZXh0JyxcbiAgICAgICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgICAgICAgJHRleHQ6IEhUTUxFbGVtZW50ICYgeyAkbmFtZTogSFRNTEVsZW1lbnQ7ICRsaW5rOiBIVE1MRWxlbWVudCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogeyBkZXRhaWw6IHsgdmFsdWU6IHN0cmluZyB9OyBmb2xkOiBib29sZWFuIH0sXG4gICAgICAgICAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHRleHQuJG5hbWUuaW5uZXJIVE1MID0gZGF0YS5kZXRhaWwudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIG1lbnVSZWYudmFsdWUuc2V0VGVtcGxhdGVJbml0KCdpdGVtJywgKCRkaXY6IEhUTUxFbGVtZW50ICYgeyBkYXRhOiB7IGRldGFpbDogeyBhZGRPcHRpb25zOiBHcmFwaEVkaXRvckFkZE9wdGlvbnMgfSB9IH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgJGRpdi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVudVJlZi52YWx1ZS5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVudVJlZi52YWx1ZS5zZWxlY3QoJGRpdi5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lbnVSZWYudmFsdWUucmVuZGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVOb2RlKCRkaXYuZGF0YS5kZXRhaWwuYWRkT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgbWVudVJlZi52YWx1ZS5jc3MgPSBgXG4gICAgICAgICAgICAgICAgICAgIC5pdGVtIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmUtaGVpZ2h0OiAyNHB4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC5jb250ZW50IC5maXhlZCAubGlzdCA+IHVpLWRyYWctaXRlbVtzZWxlY3RlZF0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzA5NEE1RDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1lbnVSZWYudmFsdWUudHJlZSA9IGNvbnZlcnRNZW51RGF0YShNZW51Lkluc3RhbmNlLmdldFNoYWRlck5vZGVNZW51KCksIGZhbHNlKTtcbiAgICAgICAgICAgIG1lbnVSZWYudmFsdWUucmVuZGVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRTZWxlY3RlZENyZWF0ZU5vZGVJdGVtKFxuICAgICAgICAgICAgaXRlbTogeyBpbmRleDogbnVtYmVyOyBjaGlsZHJlbjogW10gfSxcbiAgICAgICAgICAgIGxpc3Q6IHsgaW5kZXg6IG51bWJlcjsgY2hpbGRyZW46IFtdIH1bXSxcbiAgICAgICAgICAgIGFycm93OiAnZG93bicgfCAndXAnID0gJ2Rvd24nLFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGxldCBpbmRleCA9IGl0ZW0uaW5kZXg7XG4gICAgICAgICAgICBpZiAoYXJyb3cgPT09ICdkb3duJykge1xuICAgICAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID4gbGlzdC5sZW5ndGggLSAxKSBpbmRleCA9IDA7XG5cbiAgICAgICAgICAgICAgICBpdGVtID0gbGlzdFtpbmRleF07XG4gICAgICAgICAgICAgICAgLy8gd2hpbGUgKGl0ZW0gJiYgaXRlbS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgIGluZGV4Kys7XG4gICAgICAgICAgICAgICAgLy8gICAgIGlmIChpbmRleCA+IGxpc3QubGVuZ3RoIC0gMSkgaW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLy8gICAgIGl0ZW0gPSBsaXN0W2luZGV4XTtcbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFycm93ID09PSAndXAnKSB7XG4gICAgICAgICAgICAgICAgaW5kZXgtLTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPCAwKSBpbmRleCA9IGxpc3QubGVuZ3RoIC0gMTtcblxuICAgICAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2luZGV4XTtcbiAgICAgICAgICAgICAgICAvLyB3aGlsZSAoaXRlbSAmJiBpdGVtLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgaW5kZXgtLTtcbiAgICAgICAgICAgICAgICAvLyAgICAgaWYgKGluZGV4IDwgMCkgaW5kZXggPSBsaXN0Lmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyAgICAgaXRlbSA9IGxpc3RbaW5kZXhdO1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gb25LZXl1cChldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgICAgICAgICAgY29uc3Qgd2hpY2ggPSBldmVudC53aGljaDtcbiAgICAgICAgICAgIC8vICdFc2NhcGUnIOmAgOWHulxuICAgICAgICAgICAgaWYgKHdoaWNoID09PSAyNykge1xuICAgICAgICAgICAgICAgIG9uQ2xvc2UoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCAkZG9tID0gbWVudVJlZi52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSAkZG9tLnNlbGVjdEl0ZW1zWyRkb20uc2VsZWN0SXRlbXMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAoIWl0ZW0pIHJldHVybjtcblxuICAgICAgICAgICAgbGV0IHNlbGVjdEl0ZW0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBzd2l0Y2ggKHdoaWNoKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAxMzogLy8gRW50ZXJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtLmRldGFpbC5hZGRPcHRpb25zKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGUoaXRlbS5kZXRhaWwuYWRkT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBjYXNlIDQwOiAvLyBBcnJvd0Rvd25cbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0SXRlbSA9IGdldFNlbGVjdGVkQ3JlYXRlTm9kZUl0ZW0oaXRlbSwgJGRvbS5saXN0LCAnZG93bicpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM4OiAvLyBBcnJvd1VwXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdEl0ZW0gPSBnZXRTZWxlY3RlZENyZWF0ZU5vZGVJdGVtKGl0ZW0sICRkb20ubGlzdCwgJ3VwJyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzc6IC8vIEFycm93TGVmdFxuICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uZm9sZCAmJiBpdGVtLnBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRvbS5jb2xsYXBzZShpdGVtLnBhcmVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0ucGFyZW50LnBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRvbS5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRvbS5zZWxlY3QoaXRlbS5wYXJlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzk6IC8vIEFycm93UmlnaHRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uZm9sZCAmJiBpdGVtLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkb20uZXhwYW5kKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmNoaWxkcmVuWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZG9tLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZG9tLnNlbGVjdChpdGVtLmNoaWxkcmVuWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzZWxlY3RJdGVtICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAkZG9tLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgJGRvbS5zZWxlY3Qoc2VsZWN0SXRlbSk7XG4gICAgICAgICAgICAgICAgJGRvbS5wb3NpdGlvbmluZyhzZWxlY3RJdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRkb20ucmVuZGVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvblNlYXJjaElucHV0Q2hhbmdlKHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgICAgICAgIGlmIChzZWFyY2hWYWx1ZS52YWx1ZSA9PT0gdmFsdWUpIHJldHVybjtcbiAgICAgICAgICAgIHNlYXJjaFZhbHVlLnZhbHVlID0gdmFsdWU7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBzZWxlY3RJdGVtO1xuICAgICAgICAgICAgICAgIGxldCB0cmVlRGF0YSA9IGNvbnZlcnRNZW51RGF0YShNZW51Lkluc3RhbmNlLmdldFNoYWRlck5vZGVNZW51KCksIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZmlsdGVyTWVudUJ5S2V5d29yZCh0cmVlRGF0YSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB0cmVlRGF0YSA9IHJlc3VsdC5maWx0ZXJUcmVlO1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RJdGVtID0gcmVzdWx0LmZpcnN0U2VsZWN0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCAkZG9tID0gbWVudVJlZi52YWx1ZTtcbiAgICAgICAgICAgICAgICAkZG9tLnRyZWUgPSB0cmVlRGF0YTtcbiAgICAgICAgICAgICAgICBpZiAodHJlZURhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAkZG9tLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICRkb20uc2VsZWN0KHNlbGVjdEl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICBtZW51UmVmLnZhbHVlLnBvc2l0aW9uaW5nKHNlbGVjdEl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAkZG9tLnJlbmRlcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG9uQ2xvc2UoKSB7XG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBvbktleXVwKTtcbiAgICAgICAgICAgIHNlYXJjaFZhbHVlLnZhbHVlID0gJyc7XG4gICAgICAgICAgICBjb21tb25PYmplY3QuaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgb25Vbm1vdW50ZWQoKCkgPT4ge1xuICAgICAgICAgICAgb25DbG9zZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb21tb25PYmplY3Qub25TaXplQ2hhbmdlZCA9ICgpID0+IHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChtZW51UmVmLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lbnVSZWYudmFsdWUucmVuZGVyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uY29tbW9uT2JqZWN0LFxuICAgICAgICAgICAgc2VhcmNoVmFsdWUsXG4gICAgICAgICAgICBzZWFyY2hJbnB1dFJlZixcbiAgICAgICAgICAgIG1lbnVSZWYsXG5cbiAgICAgICAgICAgIG9uQ2xvc2UsXG4gICAgICAgICAgICBvblNlYXJjaElucHV0Q2hhbmdlLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICB0ZW1wbGF0ZTogY29tbW9uVGVtcGxhdGUoe1xuICAgICAgICBjc3M6ICdjcmVhdGUtbm9kZScsXG4gICAgICAgIGhlYWRlcjogYFxuPHVpLWxhYmVsIGNsYXNzPVwidGl0bGUtbGFiZWxcIiB2YWx1ZT1cImkxOG46c2hhZGVyLWdyYXBoLmNyZWF0ZV9ub2RlLnRpdGxlXCI+PC91aS1sYWJlbD5cbjx1aS1idXR0b24gY2xhc3M9XCJjbG9zZVwiIHRyYW5zcGFyZW50XG4gIHRvb2x0aXA9XCJpMThuOnNoYWRlci1ncmFwaC5jcmVhdGVfbm9kZS5jbG9zZS50b29sdGlwXCJcbiAgQGNsaWNrPVwib25DbG9zZVwiXG4+XG4gIDx1aS1pY29uIHZhbHVlPVwiY2xvc2VcIj48L3VpLWljb24+XG48L3VpLWJ1dHRvbj5cbiAgICAgICAgYCxcbiAgICAgICAgc2VjdGlvbjogYFxuPGRpdiBjbGFzcz1cInNlYXJjaC1ncm91cFwiPlxuICA8dWktaWNvbiBjbGFzcz1cImljb25cIiB2YWx1ZT1cInNlYXJjaFwiPjwvdWktaWNvbj5cbiAgPHVpLWlucHV0IHJlZj1cInNlYXJjaElucHV0UmVmXCIgY2xhc3M9XCJpbnB1dFwiXG4gICAgOnZhbHVlPVwic2VhcmNoVmFsdWVcIlxuICAgIHBsYWNlaG9sZGVyPVwiaTE4bjpzaGFkZXItZ3JhcGguY3JlYXRlX25vZGUuc2VhcmNoX2lucHV0LnBsYWNlaG9sZGVyXCJcbiAgICBAY2hhbmdlPVwib25TZWFyY2hJbnB1dENoYW5nZSgkZXZlbnQudGFyZ2V0LnZhbHVlKVwiXG4gID48L3VpLWlucHV0PlxuPC9kaXY+XG5cbjx1aS10cmVlIHJlZj1cIm1lbnVSZWZcIiBjbGFzcz1cIm1lbnVzXCI+PC91aS10cmVlPlxuICAgICAgICBgLFxuICAgICAgICBmb290ZXI6IGBcbiAgICAgICAgYCxcbiAgICB9KSxcbn0pO1xuIl19