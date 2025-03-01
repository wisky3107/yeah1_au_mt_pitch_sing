"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.component = exports.getConfig = exports.DefaultConfig = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const internal_1 = require("../internal");
const block_forge_1 = require("../../../../../block-forge");
const base_1 = tslib_1.__importDefault(require("../base"));
const shader_graph_1 = require("../../../../../shader-graph");
const common_1 = require("../common");
const vue_js_1 = require("vue/dist/vue.js");
exports.DefaultConfig = {
    key: 'graph-property',
    tab: {
        name: 'i18n:shader-graph.graph_property.menu_name',
        show: true,
        height: 80,
    },
    base: {
        title: 'i18n:shader-graph.graph_property.title',
        width: '300px',
        height: '240px',
        minWidth: '300px',
        minHeight: '240px',
        defaultShow: false,
    },
    position: {
        top: '28px',
        right: '28px',
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
    directives: {
        focus: (el) => {
            // 不延迟的话，无法 focus，可能是时机问题
            setTimeout(() => {
                el.focus();
            });
        },
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
        const common = (0, common_1.commonLogic)(props, ctx);
        const deleteStyleRef = (0, vue_js_1.ref)();
        const loading = (0, vue_js_1.ref)(false);
        const popupMenuRef = (0, vue_js_1.ref)(false);
        const menusRef = (0, vue_js_1.ref)([]);
        const propertyRefs = (0, vue_js_1.ref)([]);
        const propertyMap = new Map();
        function updateMenuByShaderPropertyDefines() {
            menusRef.value = [];
            (0, shader_graph_1.iteratePropertyDefines)((propertyDefine) => {
                if (propertyDefine.details.menu) {
                    menusRef.value.push({
                        label: propertyDefine.details.menu,
                        data: propertyDefine,
                    });
                }
            });
        }
        async function updateProperties() {
            loading.value = true;
            updateMenuByShaderPropertyDefines();
            propertyMap.clear();
            await shader_graph_1.GraphPropertyMgr.Instance.iterateProperties(async (property, propertyDefine) => {
                await createPropertyItem(property, propertyDefine);
            });
            propertyRefs.value = [];
            propertyMap.forEach((item) => {
                shader_graph_1.Menu.Instance.addItemPath(item.menu, item.addOptions);
                propertyRefs.value.push(item);
            });
            loading.value = false;
        }
        const updatePropertiesDebounce = (0, lodash_1.debounce)(async () => {
            await updateProperties();
        }, 100);
        shader_graph_1.MessageMgr.Instance.register([
            shader_graph_1.MessageType.EnterGraph,
            shader_graph_1.MessageType.Restore,
            shader_graph_1.MessageType.SetGraphDataToForge,
        ], () => {
            if (!common.isShow())
                return;
            updatePropertiesDebounce();
        });
        async function createPropertyItem(propertyData, propertyDefine) {
            if (!propertyData || !propertyDefine) {
                console.debug('data undefined or define ', propertyData, propertyDefine);
                return;
            }
            const menu = `Variables/${propertyData.name}`;
            const valueDump = await shader_graph_1.MessageMgr.Instance.callSceneMethod('queryPropertyValueDumpByType', [
                propertyData.type, propertyData.outputPins[0].value,
            ]);
            const propertyItem = {
                menu: menu,
                rename: false,
                showDelete: false,
                valueDump: valueDump,
                addOptions: {
                    type: propertyDefine.declareType,
                    details: {
                        propertyID: propertyData.id,
                        baseType: propertyDefine.type,
                        title: propertyData.name,
                        outputPins: propertyData.outputPins,
                    },
                },
                ...propertyData,
            };
            propertyMap.set(propertyData.id, propertyItem);
            return propertyItem;
        }
        async function addProperty(propertyDefine) {
            const variableData = shader_graph_1.GraphPropertyMgr.Instance.addProperty(propertyDefine);
            const item = await createPropertyItem(variableData, propertyDefine);
            if (item) {
                item.rename = true;
                propertyRefs.value.push(item);
                shader_graph_1.Menu.Instance.addItemPath(item.menu, item.addOptions);
            }
            popupMenuRef.value = false;
            document.removeEventListener('mouseup', onFullscreenMouseUp);
        }
        function onDelete(index) {
            const propertyData = shader_graph_1.GraphPropertyMgr.Instance.removeProperty(index);
            const propertyItem = propertyRefs.value.splice(index, 1)[0];
            if (propertyData && propertyItem) {
                shader_graph_1.Menu.Instance.removeItemPath(propertyItem.menu);
            }
        }
        // 用于隐藏 menu
        function onFullscreenMouseUp() {
            if (popupMenuRef.value) {
                setTimeout(() => {
                    popupMenuRef.value = false;
                    document.removeEventListener('mouseup', onFullscreenMouseUp);
                }, 10);
            }
        }
        function onPopupMenu() {
            popupMenuRef.value = true;
            document.addEventListener('mouseup', onFullscreenMouseUp);
        }
        function goToRename(event, variable) {
            variable.rename = true;
        }
        function onRender(value) {
            return JSON.stringify(value);
        }
        function onRenameSubmit(name, variableItem) {
            variableItem.rename = false;
            variableItem.showDelete = false;
            if (name === variableItem.name || !name)
                return;
            if (shader_graph_1.GraphPropertyMgr.Instance.exitsProperty(name)) {
                console.warn('rename failed, a great name');
                return;
            }
            shader_graph_1.Menu.Instance.removeItemPath(variableItem.menu);
            variableItem.menu = `Variables/${name}`;
            variableItem.name = name;
            variableItem.addOptions.details.title = name;
            shader_graph_1.Menu.Instance.addItemPath(variableItem.menu, variableItem.addOptions);
            const variableData = shader_graph_1.GraphPropertyMgr.Instance.getPropertyByID(variableItem.id);
            if (variableData) {
                variableData.name = name;
                shader_graph_1.GraphPropertyMgr.Instance.updateProperty(variableItem.id, variableData);
            }
            else {
                console.error('rename failed, variable data not found by ID: ' + variableItem.id);
            }
            variableItem.rename = false;
        }
        function onRenameCancel(variable) {
            variable.rename = false;
        }
        function onMouseEnter(variable) {
            if (variable.rename)
                return;
            variable.showDelete = true;
        }
        function onMouseLeave(variable) {
            if (variable.rename)
                return;
            variable.showDelete = false;
        }
        function onDumpConfirm(event, variable) {
            const dump = event.target && event.target.dump;
            if (dump) {
                variable.valueDump = dump;
                variable.outputPins[0].value = dump.value;
                shader_graph_1.GraphPropertyMgr.Instance.updatePropertyValue(variable.id, {
                    id: variable.id,
                    name: variable.name,
                    type: variable.type,
                    declareType: variable.declareType,
                    outputPins: variable.outputPins,
                });
            }
        }
        function onDragStart($event, variable) {
            const addOptions = {
                type: variable.declareType,
                details: {
                    propertyID: variable.id,
                    baseType: variable.type,
                    title: variable.name,
                    outputPins: variable.outputPins,
                },
            };
            $event.dataTransfer?.setData('value', JSON.stringify(addOptions));
            shader_graph_1.MessageMgr.Instance.send(shader_graph_1.MessageType.DraggingProperty);
        }
        function show() {
            common.show();
            updatePropertiesDebounce();
        }
        return {
            ...common,
            loading,
            propertyRefs,
            menusRef,
            popupMenuRef,
            deleteStyleRef,
            addProperty,
            onPopupMenu,
            onRender,
            onDelete,
            onDumpConfirm,
            goToRename,
            onRenameSubmit,
            onRenameCancel,
            onMouseEnter,
            onMouseLeave,
            onDragStart,
            show,
        };
    },
    template: (0, common_1.commonTemplate)({
        css: 'graph-property',
        section: `
<div class="property-title">
    <ui-label class="name" 
        value="i18n:shader-graph.graph_property.add">
    </ui-label>
    <ui-icon class="add"  
        value="add-more"
        @click.stop="onPopupMenu()"
        tooltip="i18n:shader-graph.graph_property.add">
    </ui-icon>
</div>

<div class="property-contents">
    <div
        class="item"
        v-for="(property, index) in propertyRefs" 
        :key="property.name + '' + index"
        @mouseenter="onMouseEnter(property)"
        @mouseleave="onMouseLeave(property)"
    >
        <ui-prop class="prop">   
            <ui-input slot="label" class="input"
                v-if="property.rename"
                :value="property.name"
                @blur="onRenameSubmit($event.target.value, property)"
                @keydown.stop
                @keydown.enter="$event.target.blur()"
                @keydown.esc="onRenameCancel(property)"
                @click.stop
                @dblclick.stop
                @change.stop
                v-focus
            ></ui-input>
            <ui-drag-item slot="label" class="label" type="property"
                @dragstart="onDragStart($event, property)"
                v-else
                @dblclick.stop="goToRename($event, property, index)"
            >
                <ui-icon class="key" value="key"></ui-icon>
                <ui-label
                    class="name"
                    :value="property.name"
                    :tooltip="property.name"
                ></ui-label>
            </ui-drag-item>
            <div slot="content" class="content">
                <ui-prop no-label
                    type="dump"
                    :render="onRender(property.valueDump)"
                    @confirm-dump="onDumpConfirm($event, property)"
                >
                </ui-prop>
            </div>
        </ui-prop>
        <div class="delete">
            <ui-icon class="icon" v-if="property.showDelete"
                :tooltip="'i18n:shader-graph.graph_property.delete'"
                value="close" 
                @click="onDelete(index)"
            ></ui-icon>
        </div>
    </div>
</div>

<div class="property-menu"
    v-if="popupMenuRef"
>
    <ui-label class="option" 
        v-for="(menu, index) in menusRef" 
        :key="menu.label + '' + index"
        :value="menu.label"
        @click.stop="addProperty(menu.data)"
    ></ui-label>
</div>
        `,
        footer: `
            <ui-loading class="loading" v-show="loading"></ui-loading>
        `,
    }),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvcGFuZWxzL3NoYWRlci1ncmFwaC9jb21wb25lbnRzL2Zsb2F0LXdpbmRvdy9ncmFwaC1wcm9wZXJ0eS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsbUNBQXlDO0FBS3pDLDBDQUF1RTtBQUN2RSw0REFBbUU7QUFDbkUsMkRBQXNDO0FBQ3RDLDhEQVNxQztBQUNyQyxzQ0FBcUU7QUFFckUsNENBQXVEO0FBVzFDLFFBQUEsYUFBYSxHQUFzQjtJQUM1QyxHQUFHLEVBQUUsZ0JBQWdCO0lBQ3JCLEdBQUcsRUFBRTtRQUNELElBQUksRUFBRSw0Q0FBNEM7UUFDbEQsSUFBSSxFQUFFLElBQUk7UUFDVixNQUFNLEVBQUUsRUFBRTtLQUNiO0lBQ0QsSUFBSSxFQUFFO1FBQ0YsS0FBSyxFQUFFLHdDQUF3QztRQUMvQyxLQUFLLEVBQUUsT0FBTztRQUNkLE1BQU0sRUFBRSxPQUFPO1FBQ2YsUUFBUSxFQUFFLE9BQU87UUFDakIsU0FBUyxFQUFFLE9BQU87UUFDbEIsV0FBVyxFQUFFLEtBQUs7S0FDckI7SUFDRCxRQUFRLEVBQUU7UUFDTixHQUFHLEVBQUUsTUFBTTtRQUNYLEtBQUssRUFBRSxNQUFNO0tBQ2hCO0lBQ0QsTUFBTSxFQUFFO1FBQ0osT0FBTyxFQUFFLElBQUk7UUFDYixJQUFJLEVBQUUsSUFBSTtRQUNWLE1BQU0sRUFBRSxnQ0FBcUIsQ0FBQyxNQUFNO0tBQ3ZDO0NBQ0osQ0FBQztBQUVGLFNBQWdCLFNBQVM7SUFDckIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLHFCQUFhLENBQUMsQ0FBQyxDQUFDO0lBQzVELE1BQU0sTUFBTSxHQUFHLDZCQUFjLENBQUMsUUFBUSxDQUFDLDZCQUE2QixDQUFDLHFCQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEYsSUFBSSxNQUFN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M0QsQ0FBQztRQUVELFNBQVMsSUFBSTtZQUNULE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNkLHdCQUF3QixFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUVELE9BQU87WUFDSCxHQUFHLE1BQU07WUFFVCxPQUFPO1lBRVAsWUFBWTtZQUNaLFFBQVE7WUFDUixZQUFZO1lBQ1osY0FBYztZQUVkLFdBQVc7WUFDWCxXQUFXO1lBQ1gsUUFBUTtZQUNSLFFBQVE7WUFFUixhQUFhO1lBRWIsVUFBVTtZQUNWLGNBQWM7WUFDZCxjQUFjO1lBQ2QsWUFBWTtZQUNaLFlBQVk7WUFFWixXQUFXO1lBRVgsSUFBSTtTQUNQLENBQUM7SUFDTixDQUFDO0lBRUQsUUFBUSxFQUFFLElBQUEsdUJBQWMsRUFBQztRQUNyQixHQUFHLEVBQUUsZ0JBQWdCO1FBQ3JCLE9BQU8sRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7U0EwRVI7UUFDRCxNQUFNLEVBQUU7O1NBRVA7S0FDSixDQUFDO0NBQ0wsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbWVyZ2UsIGRlYm91bmNlIH0gZnJvbSAnbG9kYXNoJztcblxuaW1wb3J0IHR5cGUgeyBJUHJvcGVydHkgfSBmcm9tICdAY29jb3MvY3JlYXRvci10eXBlcy9lZGl0b3IvcGFja2FnZXMvc2NlbmUvQHR5cGVzL3B1YmxpYyc7XG5pbXBvcnQgdHlwZSB7IFByb3BlcnR5RGVmaW5lIH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vLi4vQHR5cGVzL3NoYWRlci1ub2RlLXR5cGUnO1xuXG5pbXBvcnQgeyBGbG9hdFdpbmRvd0NvbmZpZywgRmxvYXRXaW5kb3dEcmFnVGFyZ2V0IH0gZnJvbSAnLi4vaW50ZXJuYWwnO1xuaW1wb3J0IHsgSFRNTEdyYXBoRm9yZ2VFbGVtZW50IH0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vYmxvY2stZm9yZ2UnO1xuaW1wb3J0IEJhc2VGbG9hdFdpbmRvdyBmcm9tICcuLi9iYXNlJztcbmltcG9ydCB7XG4gICAgUHJvcGVydHlEYXRhLFxuICAgIEdyYXBoUHJvcGVydHlNZ3IsXG4gICAgTWVudSxcbiAgICBHcmFwaEVkaXRvckFkZE9wdGlvbnMsXG4gICAgTWVzc2FnZU1ncixcbiAgICBNZXNzYWdlVHlwZSxcbiAgICBHcmFwaENvbmZpZ01ncixcbiAgICBpdGVyYXRlUHJvcGVydHlEZWZpbmVzLFxufSBmcm9tICcuLi8uLi8uLi8uLi8uLi9zaGFkZXItZ3JhcGgnO1xuaW1wb3J0IHsgY29tbW9uRW1pdHMsIGNvbW1vbkxvZ2ljLCBjb21tb25UZW1wbGF0ZSB9IGZyb20gJy4uL2NvbW1vbic7XG5cbmltcG9ydCB7IGRlZmluZUNvbXBvbmVudCwgcmVmIH0gZnJvbSAndnVlL2Rpc3QvdnVlLmpzJztcblxudHlwZSBQcm9wZXJ0eUl0ZW0gPSB7XG4gICAgbWVudTogc3RyaW5nO1xuICAgIHJlbmFtZTogYm9vbGVhbjtcbiAgICBzaG93RGVsZXRlOiBib29sZWFuO1xuICAgIHZhbHVlRHVtcDogSVByb3BlcnR5IHwgdW5kZWZpbmVkO1xuICAgIC8vXG4gICAgYWRkT3B0aW9uczogR3JhcGhFZGl0b3JBZGRPcHRpb25zO1xufSAmIFByb3BlcnR5RGF0YTtcblxuZXhwb3J0IGNvbnN0IERlZmF1bHRDb25maWc6IEZsb2F0V2luZG93Q29uZmlnID0ge1xuICAgIGtleTogJ2dyYXBoLXByb3BlcnR5JyxcbiAgICB0YWI6IHtcbiAgICAgICAgbmFtZTogJ2kxOG46c2hhZGVyLWdyYXBoLmdyYXBoX3Byb3BlcnR5Lm1lbnVfbmFtZScsXG4gICAgICAgIHNob3c6IHRydWUsXG4gICAgICAgIGhlaWdodDogODAsXG4gICAgfSxcbiAgICBiYXNlOiB7XG4gICAgICAgIHRpdGxlOiAnaTE4bjpzaGFkZXItZ3JhcGguZ3JhcGhfcHJvcGVydHkudGl0bGUnLFxuICAgICAgICB3aWR0aDogJzMwMHB4JyxcbiAgICAgICAgaGVpZ2h0OiAnMjQwcHgnLFxuICAgICAgICBtaW5XaWR0aDogJzMwMHB4JyxcbiAgICAgICAgbWluSGVpZ2h0OiAnMjQwcHgnLFxuICAgICAgICBkZWZhdWx0U2hvdzogZmFsc2UsXG4gICAgfSxcbiAgICBwb3NpdGlvbjoge1xuICAgICAgICB0b3A6ICcyOHB4JyxcbiAgICAgICAgcmlnaHQ6ICcyOHB4JyxcbiAgICB9LFxuICAgIGV2ZW50czoge1xuICAgICAgICByZXNpemVyOiB0cnVlLFxuICAgICAgICBkcmFnOiB0cnVlLFxuICAgICAgICB0YXJnZXQ6IEZsb2F0V2luZG93RHJhZ1RhcmdldC5oZWFkZXIsXG4gICAgfSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb25maWcoKSB7XG4gICAgY29uc3QgbmV3Q29uZmlnID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShEZWZhdWx0Q29uZmlnKSk7XG4gICAgY29uc3QgY29uZmlnID0gR3JhcGhDb25maWdNZ3IuSW5zdGFuY2UuZ2V0RmxvYXRpbmdXaW5kb3dDb25maWdCeU5hbWUoRGVmYXVsdENvbmZpZy5rZXkpO1xuICAgIGlmIChjb25maWcpIHtcbiAgICAgICAgbmV3Q29uZmlnLmRldGFpbHMgPSBtZXJnZSh7fSwgbmV3Q29uZmlnLmRldGFpbHMsIGNvbmZpZyk7XG4gICAgfVxuICAgIHJldHVybiBuZXdDb25maWc7XG59XG5cbmV4cG9ydCBjb25zdCBjb21wb25lbnQgPSBkZWZpbmVDb21wb25lbnQoe1xuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgQmFzZUZsb2F0V2luZG93LFxuICAgIH0sXG5cbiAgICBkaXJlY3RpdmVzOiB7XG4gICAgICAgIGZvY3VzOiAoZWwpID0+IHtcbiAgICAgICAgICAgIC8vIOS4jeW7tui/n+eahOivne+8jOaXoOazlSBmb2N1c++8jOWPr+iDveaYr+aXtuacuumXrumimFxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZWwuZm9jdXMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBwcm9wczoge1xuICAgICAgICBmb3JnZToge1xuICAgICAgICAgICAgdHlwZTogSFRNTEdyYXBoRm9yZ2VFbGVtZW50LFxuICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsLFxuICAgICAgICB9LFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIHR5cGU6IE9iamVjdCBhcyAoKSA9PiBGbG9hdFdpbmRvd0NvbmZpZyxcbiAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbCxcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgZW1pdHM6IFsuLi5jb21tb25FbWl0c10sXG5cbiAgICBzZXR1cChwcm9wcywgY3R4KSB7XG4gICAgICAgIGNvbnN0IGNvbW1vbiA9IGNvbW1vbkxvZ2ljKHByb3BzLCBjdHgpO1xuICAgICAgICBjb25zdCBkZWxldGVTdHlsZVJlZiA9IHJlZigpO1xuICAgICAgICBjb25zdCBsb2FkaW5nID0gcmVmKGZhbHNlKTtcbiAgICAgICAgY29uc3QgcG9wdXBNZW51UmVmID0gcmVmKGZhbHNlKTtcbiAgICAgICAgY29uc3QgbWVudXNSZWYgPSByZWY8eyBsYWJlbDogc3RyaW5nOyBkYXRhOiBQcm9wZXJ0eURlZmluZSB9W10+KFtdKTtcbiAgICAgICAgY29uc3QgcHJvcGVydHlSZWZzID0gcmVmPFByb3BlcnR5SXRlbVtdPihbXSk7XG5cbiAgICAgICAgY29uc3QgcHJvcGVydHlNYXA6IE1hcDxzdHJpbmcsIFByb3BlcnR5SXRlbT4gPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgZnVuY3Rpb24gdXBkYXRlTWVudUJ5U2hhZGVyUHJvcGVydHlEZWZpbmVzKCkge1xuICAgICAgICAgICAgbWVudXNSZWYudmFsdWUgPSBbXTtcbiAgICAgICAgICAgIGl0ZXJhdGVQcm9wZXJ0eURlZmluZXMoKHByb3BlcnR5RGVmaW5lOiBQcm9wZXJ0eURlZmluZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eURlZmluZS5kZXRhaWxzLm1lbnUpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVudXNSZWYudmFsdWUucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogcHJvcGVydHlEZWZpbmUuZGV0YWlscy5tZW51LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogcHJvcGVydHlEZWZpbmUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gdXBkYXRlUHJvcGVydGllcygpIHtcbiAgICAgICAgICAgIGxvYWRpbmcudmFsdWUgPSB0cnVlO1xuICAgICAgICAgICAgdXBkYXRlTWVudUJ5U2hhZGVyUHJvcGVydHlEZWZpbmVzKCk7XG5cbiAgICAgICAgICAgIHByb3BlcnR5TWFwLmNsZWFyKCk7XG4gICAgICAgICAgICBhd2FpdCBHcmFwaFByb3BlcnR5TWdyLkluc3RhbmNlLml0ZXJhdGVQcm9wZXJ0aWVzKGFzeW5jIChwcm9wZXJ0eTogUHJvcGVydHlEYXRhLCBwcm9wZXJ0eURlZmluZTogUHJvcGVydHlEZWZpbmUgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjcmVhdGVQcm9wZXJ0eUl0ZW0ocHJvcGVydHksIHByb3BlcnR5RGVmaW5lKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBwcm9wZXJ0eVJlZnMudmFsdWUgPSBbXTtcbiAgICAgICAgICAgIHByb3BlcnR5TWFwLmZvckVhY2goKGl0ZW06IFByb3BlcnR5SXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIE1lbnUuSW5zdGFuY2UuYWRkSXRlbVBhdGgoaXRlbS5tZW51LCBpdGVtLmFkZE9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHByb3BlcnR5UmVmcy52YWx1ZS5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsb2FkaW5nLnZhbHVlID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1cGRhdGVQcm9wZXJ0aWVzRGVib3VuY2UgPSBkZWJvdW5jZShhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCB1cGRhdGVQcm9wZXJ0aWVzKCk7XG4gICAgICAgIH0sIDEwMCk7XG5cbiAgICAgICAgTWVzc2FnZU1nci5JbnN0YW5jZS5yZWdpc3RlcihbXG4gICAgICAgICAgICBNZXNzYWdlVHlwZS5FbnRlckdyYXBoLFxuICAgICAgICAgICAgTWVzc2FnZVR5cGUuUmVzdG9yZSxcbiAgICAgICAgICAgIE1lc3NhZ2VUeXBlLlNldEdyYXBoRGF0YVRvRm9yZ2UsXG4gICAgICAgIF0sICgpID0+IHtcbiAgICAgICAgICAgIGlmICghY29tbW9uLmlzU2hvdygpKSByZXR1cm47XG4gICAgICAgICAgICB1cGRhdGVQcm9wZXJ0aWVzRGVib3VuY2UoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gY3JlYXRlUHJvcGVydHlJdGVtKHByb3BlcnR5RGF0YT86IFByb3BlcnR5RGF0YSwgcHJvcGVydHlEZWZpbmU/OiBQcm9wZXJ0eURlZmluZSkge1xuICAgICAgICAgICAgaWYgKCFwcm9wZXJ0eURhdGEgfHwgIXByb3BlcnR5RGVmaW5lKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnZGF0YSB1bmRlZmluZWQgb3IgZGVmaW5lICcsIHByb3BlcnR5RGF0YSwgcHJvcGVydHlEZWZpbmUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbWVudSA9IGBWYXJpYWJsZXMvJHtwcm9wZXJ0eURhdGEubmFtZX1gO1xuXG4gICAgICAgICAgICBjb25zdCB2YWx1ZUR1bXAgPSBhd2FpdCBNZXNzYWdlTWdyLkluc3RhbmNlLmNhbGxTY2VuZU1ldGhvZCgncXVlcnlQcm9wZXJ0eVZhbHVlRHVtcEJ5VHlwZScsIFtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eURhdGEudHlwZSwgcHJvcGVydHlEYXRhLm91dHB1dFBpbnNbMF0udmFsdWUsXG4gICAgICAgICAgICBdKTtcblxuICAgICAgICAgICAgY29uc3QgcHJvcGVydHlJdGVtOiBQcm9wZXJ0eUl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgbWVudTogbWVudSxcbiAgICAgICAgICAgICAgICByZW5hbWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHNob3dEZWxldGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHZhbHVlRHVtcDogdmFsdWVEdW1wLFxuICAgICAgICAgICAgICAgIGFkZE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogcHJvcGVydHlEZWZpbmUuZGVjbGFyZVR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5SUQ6IHByb3BlcnR5RGF0YS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhc2VUeXBlOiBwcm9wZXJ0eURlZmluZS50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHByb3BlcnR5RGF0YS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0UGluczogcHJvcGVydHlEYXRhLm91dHB1dFBpbnMsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAuLi5wcm9wZXJ0eURhdGEsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBwcm9wZXJ0eU1hcC5zZXQocHJvcGVydHlEYXRhLmlkLCBwcm9wZXJ0eUl0ZW0pO1xuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5SXRlbTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIGFkZFByb3BlcnR5KHByb3BlcnR5RGVmaW5lOiBQcm9wZXJ0eURlZmluZSkge1xuICAgICAgICAgICAgY29uc3QgdmFyaWFibGVEYXRhID0gR3JhcGhQcm9wZXJ0eU1nci5JbnN0YW5jZS5hZGRQcm9wZXJ0eShwcm9wZXJ0eURlZmluZSk7XG4gICAgICAgICAgICBjb25zdCBpdGVtOiBQcm9wZXJ0eUl0ZW0gfCB1bmRlZmluZWQgPSBhd2FpdCBjcmVhdGVQcm9wZXJ0eUl0ZW0odmFyaWFibGVEYXRhLCBwcm9wZXJ0eURlZmluZSk7XG4gICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIGl0ZW0ucmVuYW1lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eVJlZnMudmFsdWUucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICBNZW51Lkluc3RhbmNlLmFkZEl0ZW1QYXRoKGl0ZW0ubWVudSwgaXRlbS5hZGRPcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvcHVwTWVudVJlZi52YWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uRnVsbHNjcmVlbk1vdXNlVXApO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gb25EZWxldGUoaW5kZXg6IG51bWJlcikge1xuICAgICAgICAgICAgY29uc3QgcHJvcGVydHlEYXRhID0gR3JhcGhQcm9wZXJ0eU1nci5JbnN0YW5jZS5yZW1vdmVQcm9wZXJ0eShpbmRleCk7XG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eUl0ZW0gPSBwcm9wZXJ0eVJlZnMudmFsdWUuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eURhdGEgJiYgcHJvcGVydHlJdGVtKSB7XG4gICAgICAgICAgICAgICAgTWVudS5JbnN0YW5jZS5yZW1vdmVJdGVtUGF0aChwcm9wZXJ0eUl0ZW0ubWVudSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnlKjkuo7pmpDol48gbWVudVxuICAgICAgICBmdW5jdGlvbiBvbkZ1bGxzY3JlZW5Nb3VzZVVwKCkge1xuICAgICAgICAgICAgaWYgKHBvcHVwTWVudVJlZi52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBwb3B1cE1lbnVSZWYudmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uRnVsbHNjcmVlbk1vdXNlVXApO1xuICAgICAgICAgICAgICAgIH0sIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG9uUG9wdXBNZW51KCkge1xuICAgICAgICAgICAgcG9wdXBNZW51UmVmLnZhbHVlID0gdHJ1ZTtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBvbkZ1bGxzY3JlZW5Nb3VzZVVwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdvVG9SZW5hbWUoZXZlbnQ6IE1vdXNlRXZlbnQsIHZhcmlhYmxlOiBQcm9wZXJ0eUl0ZW0pIHtcbiAgICAgICAgICAgIHZhcmlhYmxlLnJlbmFtZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvblJlbmRlcih2YWx1ZTogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gb25SZW5hbWVTdWJtaXQobmFtZTogc3RyaW5nLCB2YXJpYWJsZUl0ZW06IFByb3BlcnR5SXRlbSkge1xuICAgICAgICAgICAgdmFyaWFibGVJdGVtLnJlbmFtZSA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyaWFibGVJdGVtLnNob3dEZWxldGUgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChuYW1lID09PSB2YXJpYWJsZUl0ZW0ubmFtZSB8fCAhbmFtZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoR3JhcGhQcm9wZXJ0eU1nci5JbnN0YW5jZS5leGl0c1Byb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdyZW5hbWUgZmFpbGVkLCBhIGdyZWF0IG5hbWUnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIE1lbnUuSW5zdGFuY2UucmVtb3ZlSXRlbVBhdGgodmFyaWFibGVJdGVtLm1lbnUpO1xuICAgICAgICAgICAgdmFyaWFibGVJdGVtLm1lbnUgPSBgVmFyaWFibGVzLyR7bmFtZX1gO1xuICAgICAgICAgICAgdmFyaWFibGVJdGVtLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgdmFyaWFibGVJdGVtLmFkZE9wdGlvbnMuZGV0YWlscy50aXRsZSA9IG5hbWU7XG4gICAgICAgICAgICBNZW51Lkluc3RhbmNlLmFkZEl0ZW1QYXRoKHZhcmlhYmxlSXRlbS5tZW51LCB2YXJpYWJsZUl0ZW0uYWRkT3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCB2YXJpYWJsZURhdGE6IFByb3BlcnR5RGF0YSB8IHVuZGVmaW5lZCA9IEdyYXBoUHJvcGVydHlNZ3IuSW5zdGFuY2UuZ2V0UHJvcGVydHlCeUlEKHZhcmlhYmxlSXRlbS5pZCk7XG4gICAgICAgICAgICBpZiAodmFyaWFibGVEYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyaWFibGVEYXRhLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgIEdyYXBoUHJvcGVydHlNZ3IuSW5zdGFuY2UudXBkYXRlUHJvcGVydHkodmFyaWFibGVJdGVtLmlkLCB2YXJpYWJsZURhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdyZW5hbWUgZmFpbGVkLCB2YXJpYWJsZSBkYXRhIG5vdCBmb3VuZCBieSBJRDogJyArIHZhcmlhYmxlSXRlbS5pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXJpYWJsZUl0ZW0ucmVuYW1lID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvblJlbmFtZUNhbmNlbCh2YXJpYWJsZTogUHJvcGVydHlJdGVtKSB7XG4gICAgICAgICAgICB2YXJpYWJsZS5yZW5hbWUgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG9uTW91c2VFbnRlcih2YXJpYWJsZTogUHJvcGVydHlJdGVtKSB7XG4gICAgICAgICAgICBpZiAodmFyaWFibGUucmVuYW1lKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhcmlhYmxlLnNob3dEZWxldGUgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gb25Nb3VzZUxlYXZlKHZhcmlhYmxlOiBQcm9wZXJ0eUl0ZW0pIHtcbiAgICAgICAgICAgIGlmICh2YXJpYWJsZS5yZW5hbWUpIHJldHVybjtcblxuICAgICAgICAgICAgdmFyaWFibGUuc2hvd0RlbGV0ZSA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gb25EdW1wQ29uZmlybShldmVudDogeyB0YXJnZXQ6IHsgZHVtcDogSVByb3BlcnR5IH0gfSwgdmFyaWFibGU6IFByb3BlcnR5SXRlbSkge1xuICAgICAgICAgICAgY29uc3QgZHVtcCA9IGV2ZW50LnRhcmdldCAmJiBldmVudC50YXJnZXQuZHVtcDtcbiAgICAgICAgICAgIGlmIChkdW1wKSB7XG4gICAgICAgICAgICAgICAgdmFyaWFibGUudmFsdWVEdW1wID0gZHVtcDtcbiAgICAgICAgICAgICAgICB2YXJpYWJsZS5vdXRwdXRQaW5zWzBdLnZhbHVlID0gZHVtcC52YWx1ZTtcbiAgICAgICAgICAgICAgICBHcmFwaFByb3BlcnR5TWdyLkluc3RhbmNlLnVwZGF0ZVByb3BlcnR5VmFsdWUodmFyaWFibGUuaWQsIHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHZhcmlhYmxlLmlkLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiB2YXJpYWJsZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiB2YXJpYWJsZS50eXBlLFxuICAgICAgICAgICAgICAgICAgICBkZWNsYXJlVHlwZTogdmFyaWFibGUuZGVjbGFyZVR5cGUsXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFBpbnM6IHZhcmlhYmxlLm91dHB1dFBpbnMsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvbkRyYWdTdGFydCgkZXZlbnQ6IERyYWdFdmVudCwgdmFyaWFibGU6IFByb3BlcnR5SXRlbSkge1xuICAgICAgICAgICAgY29uc3QgYWRkT3B0aW9uczogR3JhcGhFZGl0b3JBZGRPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IHZhcmlhYmxlLmRlY2xhcmVUeXBlLFxuICAgICAgICAgICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlJRDogdmFyaWFibGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIGJhc2VUeXBlOiB2YXJpYWJsZS50eXBlLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogdmFyaWFibGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0UGluczogdmFyaWFibGUub3V0cHV0UGlucyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICRldmVudC5kYXRhVHJhbnNmZXI/LnNldERhdGEoJ3ZhbHVlJywgSlNPTi5zdHJpbmdpZnkoYWRkT3B0aW9ucykpO1xuICAgICAgICAgICAgTWVzc2FnZU1nci5JbnN0YW5jZS5zZW5kKE1lc3NhZ2VUeXBlLkRyYWdnaW5nUHJvcGVydHkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2hvdygpIHtcbiAgICAgICAgICAgIGNvbW1vbi5zaG93KCk7XG4gICAgICAgICAgICB1cGRhdGVQcm9wZXJ0aWVzRGVib3VuY2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5jb21tb24sXG5cbiAgICAgICAgICAgIGxvYWRpbmcsXG5cbiAgICAgICAgICAgIHByb3BlcnR5UmVmcyxcbiAgICAgICAgICAgIG1lbnVzUmVmLFxuICAgICAgICAgICAgcG9wdXBNZW51UmVmLFxuICAgICAgICAgICAgZGVsZXRlU3R5bGVSZWYsXG5cbiAgICAgICAgICAgIGFkZFByb3BlcnR5LFxuICAgICAgICAgICAgb25Qb3B1cE1lbnUsXG4gICAgICAgICAgICBvblJlbmRlcixcbiAgICAgICAgICAgIG9uRGVsZXRlLFxuXG4gICAgICAgICAgICBvbkR1bXBDb25maXJtLFxuXG4gICAgICAgICAgICBnb1RvUmVuYW1lLFxuICAgICAgICAgICAgb25SZW5hbWVTdWJtaXQsXG4gICAgICAgICAgICBvblJlbmFtZUNhbmNlbCxcbiAgICAgICAgICAgIG9uTW91c2VFbnRlcixcbiAgICAgICAgICAgIG9uTW91c2VMZWF2ZSxcblxuICAgICAgICAgICAgb25EcmFnU3RhcnQsXG5cbiAgICAgICAgICAgIHNob3csXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHRlbXBsYXRlOiBjb21tb25UZW1wbGF0ZSh7XG4gICAgICAgIGNzczogJ2dyYXBoLXByb3BlcnR5JyxcbiAgICAgICAgc2VjdGlvbjogYFxuPGRpdiBjbGFzcz1cInByb3BlcnR5LXRpdGxlXCI+XG4gICAgPHVpLWxhYmVsIGNsYXNzPVwibmFtZVwiIFxuICAgICAgICB2YWx1ZT1cImkxOG46c2hhZGVyLWdyYXBoLmdyYXBoX3Byb3BlcnR5LmFkZFwiPlxuICAgIDwvdWktbGFiZWw+XG4gICAgPHVpLWljb24gY2xhc3M9XCJhZGRcIiAgXG4gICAgICAgIHZhbHVlPVwiYWRkLW1vcmVcIlxuICAgICAgICBAY2xpY2suc3RvcD1cIm9uUG9wdXBNZW51KClcIlxuICAgICAgICB0b29sdGlwPVwiaTE4bjpzaGFkZXItZ3JhcGguZ3JhcGhfcHJvcGVydHkuYWRkXCI+XG4gICAgPC91aS1pY29uPlxuPC9kaXY+XG5cbjxkaXYgY2xhc3M9XCJwcm9wZXJ0eS1jb250ZW50c1wiPlxuICAgIDxkaXZcbiAgICAgICAgY2xhc3M9XCJpdGVtXCJcbiAgICAgICAgdi1mb3I9XCIocHJvcGVydHksIGluZGV4KSBpbiBwcm9wZXJ0eVJlZnNcIiBcbiAgICAgICAgOmtleT1cInByb3BlcnR5Lm5hbWUgKyAnJyArIGluZGV4XCJcbiAgICAgICAgQG1vdXNlZW50ZXI9XCJvbk1vdXNlRW50ZXIocHJvcGVydHkpXCJcbiAgICAgICAgQG1vdXNlbGVhdmU9XCJvbk1vdXNlTGVhdmUocHJvcGVydHkpXCJcbiAgICA+XG4gICAgICAgIDx1aS1wcm9wIGNsYXNzPVwicHJvcFwiPiAgIFxuICAgICAgICAgICAgPHVpLWlucHV0IHNsb3Q9XCJsYWJlbFwiIGNsYXNzPVwiaW5wdXRcIlxuICAgICAgICAgICAgICAgIHYtaWY9XCJwcm9wZXJ0eS5yZW5hbWVcIlxuICAgICAgICAgICAgICAgIDp2YWx1ZT1cInByb3BlcnR5Lm5hbWVcIlxuICAgICAgICAgICAgICAgIEBibHVyPVwib25SZW5hbWVTdWJtaXQoJGV2ZW50LnRhcmdldC52YWx1ZSwgcHJvcGVydHkpXCJcbiAgICAgICAgICAgICAgICBAa2V5ZG93bi5zdG9wXG4gICAgICAgICAgICAgICAgQGtleWRvd24uZW50ZXI9XCIkZXZlbnQudGFyZ2V0LmJsdXIoKVwiXG4gICAgICAgICAgICAgICAgQGtleWRvd24uZXNjPVwib25SZW5hbWVDYW5jZWwocHJvcGVydHkpXCJcbiAgICAgICAgICAgICAgICBAY2xpY2suc3RvcFxuICAgICAgICAgICAgICAgIEBkYmxjbGljay5zdG9wXG4gICAgICAgICAgICAgICAgQGNoYW5nZS5zdG9wXG4gICAgICAgICAgICAgICAgdi1mb2N1c1xuICAgICAgICAgICAgPjwvdWktaW5wdXQ+XG4gICAgICAgICAgICA8dWktZHJhZy1pdGVtIHNsb3Q9XCJsYWJlbFwiIGNsYXNzPVwibGFiZWxcIiB0eXBlPVwicHJvcGVydHlcIlxuICAgICAgICAgICAgICAgIEBkcmFnc3RhcnQ9XCJvbkRyYWdTdGFydCgkZXZlbnQsIHByb3BlcnR5KVwiXG4gICAgICAgICAgICAgICAgdi1lbHNlXG4gICAgICAgICAgICAgICAgQGRibGNsaWNrLnN0b3A9XCJnb1RvUmVuYW1lKCRldmVudCwgcHJvcGVydHksIGluZGV4KVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHVpLWljb24gY2xhc3M9XCJrZXlcIiB2YWx1ZT1cImtleVwiPjwvdWktaWNvbj5cbiAgICAgICAgICAgICAgICA8dWktbGFiZWxcbiAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJuYW1lXCJcbiAgICAgICAgICAgICAgICAgICAgOnZhbHVlPVwicHJvcGVydHkubmFtZVwiXG4gICAgICAgICAgICAgICAgICAgIDp0b29sdGlwPVwicHJvcGVydHkubmFtZVwiXG4gICAgICAgICAgICAgICAgPjwvdWktbGFiZWw+XG4gICAgICAgICAgICA8L3VpLWRyYWctaXRlbT5cbiAgICAgICAgICAgIDxkaXYgc2xvdD1cImNvbnRlbnRcIiBjbGFzcz1cImNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICA8dWktcHJvcCBuby1sYWJlbFxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwiZHVtcFwiXG4gICAgICAgICAgICAgICAgICAgIDpyZW5kZXI9XCJvblJlbmRlcihwcm9wZXJ0eS52YWx1ZUR1bXApXCJcbiAgICAgICAgICAgICAgICAgICAgQGNvbmZpcm0tZHVtcD1cIm9uRHVtcENvbmZpcm0oJGV2ZW50LCBwcm9wZXJ0eSlcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8L3VpLXByb3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC91aS1wcm9wPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZGVsZXRlXCI+XG4gICAgICAgICAgICA8dWktaWNvbiBjbGFzcz1cImljb25cIiB2LWlmPVwicHJvcGVydHkuc2hvd0RlbGV0ZVwiXG4gICAgICAgICAgICAgICAgOnRvb2x0aXA9XCInaTE4bjpzaGFkZXItZ3JhcGguZ3JhcGhfcHJvcGVydHkuZGVsZXRlJ1wiXG4gICAgICAgICAgICAgICAgdmFsdWU9XCJjbG9zZVwiIFxuICAgICAgICAgICAgICAgIEBjbGljaz1cIm9uRGVsZXRlKGluZGV4KVwiXG4gICAgICAgICAgICA+PC91aS1pY29uPlxuICAgICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuXG48ZGl2IGNsYXNzPVwicHJvcGVydHktbWVudVwiXG4gICAgdi1pZj1cInBvcHVwTWVudVJlZlwiXG4+XG4gICAgPHVpLWxhYmVsIGNsYXNzPVwib3B0aW9uXCIgXG4gICAgICAgIHYtZm9yPVwiKG1lbnUsIGluZGV4KSBpbiBtZW51c1JlZlwiIFxuICAgICAgICA6a2V5PVwibWVudS5sYWJlbCArICcnICsgaW5kZXhcIlxuICAgICAgICA6dmFsdWU9XCJtZW51LmxhYmVsXCJcbiAgICAgICAgQGNsaWNrLnN0b3A9XCJhZGRQcm9wZXJ0eShtZW51LmRhdGEpXCJcbiAgICA+PC91aS1sYWJlbD5cbjwvZGl2PlxuICAgICAgICBgLFxuICAgICAgICBmb290ZXI6IGBcbiAgICAgICAgICAgIDx1aS1sb2FkaW5nIGNsYXNzPVwibG9hZGluZ1wiIHYtc2hvdz1cImxvYWRpbmdcIj48L3VpLWxvYWRpbmc+XG4gICAgICAgIGAsXG4gICAgfSksXG59KTtcbiJdfQ==