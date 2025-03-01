"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const shader_graph_1 = tslib_1.__importDefault(require("./shader-graph"));
const shader_graph_2 = require("../shader-graph");
module.paths.push((0, path_1.join)(Editor.App.path, 'node_modules'));
const { Asset } = require('@editor/asset-db');
const ShaderGraphHandler = {
    name: shader_graph_1.default.name,
    extends: 'effect',
    assetType: shader_graph_1.default.assetType,
    iconInfo: {
        default: {
            type: 'image',
            value: 'packages://shader-graph/static/asset-icon.png',
        },
    },
    createInfo: {
        generateMenuInfo() {
            return [
                {
                    label: `i18n:${shader_graph_2.PACKAGE_NAME}.menu.import`,
                    fullFileName: 'New Shader Graph.shadergraph',
                    template: 'db://test.shadergraph',
                    submenu: [
                        {
                            label: 'Surface',
                            fullFileName: 'New Shader Graph.shadergraph',
                            template: 'Surface', // 无用
                        },
                        {
                            label: 'Unlit',
                            fullFileName: 'New Shader Graph.shadergraph',
                            template: 'Unlit', // 无用
                        },
                    ],
                },
            ];
        },
        async create(options) {
            try {
                let shaderGraph = '';
                const name = (0, shader_graph_2.getName)(options.target);
                switch (options.template) {
                    case 'Surface':
                        shaderGraph = await shader_graph_2.GraphDataMgr.createDefaultShaderGraph('SurfaceMasterNode', 'Graph', name);
                        break;
                    case 'Unlit':
                        shaderGraph = await shader_graph_2.GraphDataMgr.createDefaultShaderGraph('UnlitMasterNode', 'Graph', name);
                        break;
                }
                (0, fs_extra_1.writeFileSync)(options.target, shaderGraph);
            }
            catch (e) {
                console.error(e);
            }
            return options.target;
        },
    },
    // @ts-expect-error
    async open(asset) {
        Editor.Message.send('shader-graph', 'open', asset.uuid);
        return true;
    },
    importer: {
        version: shader_graph_1.default.version,
        migrations: [],
        // @ts-expect-error
        async before(asset) {
            if (!shader_graph_1.default.existsCacheEffect(asset)) {
                await shader_graph_1.default.generateEffectByAsset(asset);
            }
            shader_graph_1.default.cacheSourceMap.set(asset.uuid, asset._source);
            // @ts-ignore
            asset._source = shader_graph_1.default.getTempEffectCodePath(asset);
            return true;
        },
        // @ts-expect-error
        async after(asset) {
            const source = shader_graph_1.default.cacheSourceMap.get(asset.uuid);
            if (source) {
                // @ts-ignore
                asset._source = source;
                shader_graph_1.default.cacheSourceMap.delete(asset.uuid);
            }
            return true;
        },
    },
};
exports.default = ShaderGraphHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhZGVyLWdyYXBoLWhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW1wb3J0ZXIvc2hhZGVyLWdyYXBoLWhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsdUNBQXlDO0FBQ3pDLCtCQUE0QjtBQUU1QiwwRUFBeUM7QUFDekMsa0RBQXNFO0FBRXRFLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUEsV0FBSSxFQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFFekQsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBRTlDLE1BQU0sa0JBQWtCLEdBQUc7SUFFdkIsSUFBSSxFQUFFLHNCQUFXLENBQUMsSUFBSTtJQUV0QixPQUFPLEVBQUUsUUFBUTtJQUVqQixTQUFTLEVBQUUsc0JBQVcsQ0FBQyxTQUFTO0lBRWhDLFFBQVEsRUFBRTtRQUNOLE9BQU8sRUFBRTtZQUNMLElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFLCtDQUErQztTQUN6RDtLQUNKO0lBRUQsVUFBVSxFQUFFO1FBQ1IsZ0JBQWdCO1lBQ1osT0FBTztnQkFDSDtvQkFDSSxLQUFLLEVBQUUsUUFBUSwyQkFBWSxjQUFjO29CQUN6QyxZQUFZLEVBQUUsOEJBQThCO29CQUM1QyxRQUFRLEVBQUUsdUJBQXVCO29CQUNqQyxPQUFPLEVBQUU7d0JBQ0w7NEJBQ0ksS0FBSyxFQUFFLFNBQVM7NEJBQ2hCLFlBQVksRUFBRSw4QkFBOEI7NEJBQzVDLFFBQVEsRUFBRSxTQUFTLEVBQUUsS0FBSzt5QkFDN0I7d0JBQ0Q7NEJBQ0ksS0FBSyxFQUFFLE9BQU87NEJBQ2QsWUFBWSxFQUFFLDhCQUE4Qjs0QkFDNUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLO3lCQUMzQjtxQkFDSjtpQkFDSjthQUNKLENBQUM7UUFDTixDQUFDO1FBQ0QsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUE2QztZQUN0RCxJQUFJO2dCQUNBLElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxJQUFJLEdBQUcsSUFBQSxzQkFBTyxFQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDckMsUUFBUSxPQUFPLENBQUMsUUFBUSxFQUFFO29CQUN0QixLQUFLLFNBQVM7d0JBQ1YsV0FBVyxHQUFHLE1BQU0sMkJBQVksQ0FBQyx3QkFBd0IsQ0FBQyxtQkFBbUIsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQzlGLE1BQU07b0JBQ1YsS0FBSyxPQUFPO3dCQUNSLFdBQVcsR0FBRyxNQUFNLDJCQUFZLENBQUMsd0JBQXdCLENBQUMsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUM1RixNQUFNO2lCQUNiO2dCQUNELElBQUEsd0JBQWEsRUFBQyxPQUFPLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2FBQzlDO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1IsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNwQjtZQUNELE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUMxQixDQUFDO0tBQ0o7SUFFRCxtQkFBbUI7SUFDbkIsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFZO1FBQ25CLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxRQUFRLEVBQUU7UUFDTixPQUFPLEVBQUUsc0JBQVcsQ0FBQyxPQUFPO1FBRTVCLFVBQVUsRUFBRSxFQUFFO1FBRWQsbUJBQW1CO1FBQ25CLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBWTtZQUNyQixJQUFJLENBQUMsc0JBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDdkMsTUFBTSxzQkFBVyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ2xEO1lBQ0Qsc0JBQVcsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFELGFBQWE7WUFDYixLQUFLLENBQUMsT0FBTyxHQUFHLHNCQUFXLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekQsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELG1CQUFtQjtRQUNuQixLQUFLLENBQUMsS0FBSyxDQUFDLEtBQVk7WUFDcEIsTUFBTSxNQUFNLEdBQUcsc0JBQVcsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxRCxJQUFJLE1BQU0sRUFBRTtnQkFDUixhQUFhO2dCQUNiLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO2dCQUN2QixzQkFBVyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ2pEO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztLQUNKO0NBQ0osQ0FBQztBQUVGLGtCQUFlLGtCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgd3JpdGVGaWxlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcblxuaW1wb3J0IHNoYWRlckdyYXBoIGZyb20gJy4vc2hhZGVyLWdyYXBoJztcbmltcG9ydCB7IFBBQ0tBR0VfTkFNRSwgR3JhcGhEYXRhTWdyLCBnZXROYW1lIH0gZnJvbSAnLi4vc2hhZGVyLWdyYXBoJztcblxubW9kdWxlLnBhdGhzLnB1c2goam9pbihFZGl0b3IuQXBwLnBhdGgsICdub2RlX21vZHVsZXMnKSk7XG5cbmNvbnN0IHsgQXNzZXQgfSA9IHJlcXVpcmUoJ0BlZGl0b3IvYXNzZXQtZGInKTtcblxuY29uc3QgU2hhZGVyR3JhcGhIYW5kbGVyID0ge1xuXG4gICAgbmFtZTogc2hhZGVyR3JhcGgubmFtZSxcblxuICAgIGV4dGVuZHM6ICdlZmZlY3QnLFxuXG4gICAgYXNzZXRUeXBlOiBzaGFkZXJHcmFwaC5hc3NldFR5cGUsXG5cbiAgICBpY29uSW5mbzoge1xuICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UnLFxuICAgICAgICAgICAgdmFsdWU6ICdwYWNrYWdlczovL3NoYWRlci1ncmFwaC9zdGF0aWMvYXNzZXQtaWNvbi5wbmcnLFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBjcmVhdGVJbmZvOiB7XG4gICAgICAgIGdlbmVyYXRlTWVudUluZm8oKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IGBpMThuOiR7UEFDS0FHRV9OQU1FfS5tZW51LmltcG9ydGAsXG4gICAgICAgICAgICAgICAgICAgIGZ1bGxGaWxlTmFtZTogJ05ldyBTaGFkZXIgR3JhcGguc2hhZGVyZ3JhcGgnLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJ2RiOi8vdGVzdC5zaGFkZXJncmFwaCcsIC8vIOaXoOeUqFxuICAgICAgICAgICAgICAgICAgICBzdWJtZW51OiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdTdXJmYWNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdWxsRmlsZU5hbWU6ICdOZXcgU2hhZGVyIEdyYXBoLnNoYWRlcmdyYXBoJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJ1N1cmZhY2UnLCAvLyDml6DnlKhcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdVbmxpdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVsbEZpbGVOYW1lOiAnTmV3IFNoYWRlciBHcmFwaC5zaGFkZXJncmFwaCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6ICdVbmxpdCcsIC8vIOaXoOeUqFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSxcbiAgICAgICAgYXN5bmMgY3JlYXRlKG9wdGlvbnM6IHsgdGFyZ2V0OiBzdHJpbmcsIHRlbXBsYXRlOiBzdHJpbmcgfSk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgc2hhZGVyR3JhcGggPSAnJztcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gZ2V0TmFtZShvcHRpb25zLnRhcmdldCk7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLnRlbXBsYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ1N1cmZhY2UnOlxuICAgICAgICAgICAgICAgICAgICAgICAgc2hhZGVyR3JhcGggPSBhd2FpdCBHcmFwaERhdGFNZ3IuY3JlYXRlRGVmYXVsdFNoYWRlckdyYXBoKCdTdXJmYWNlTWFzdGVyTm9kZScsICdHcmFwaCcsIG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ1VubGl0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYWRlckdyYXBoID0gYXdhaXQgR3JhcGhEYXRhTWdyLmNyZWF0ZURlZmF1bHRTaGFkZXJHcmFwaCgnVW5saXRNYXN0ZXJOb2RlJywgJ0dyYXBoJywgbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd3JpdGVGaWxlU3luYyhvcHRpb25zLnRhcmdldCwgc2hhZGVyR3JhcGgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy50YXJnZXQ7XG4gICAgICAgIH0sXG4gICAgfSxcblxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgICBhc3luYyBvcGVuKGFzc2V0OiBBc3NldCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdzaGFkZXItZ3JhcGgnLCAnb3BlbicsIGFzc2V0LnV1aWQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgaW1wb3J0ZXI6IHtcbiAgICAgICAgdmVyc2lvbjogc2hhZGVyR3JhcGgudmVyc2lvbixcblxuICAgICAgICBtaWdyYXRpb25zOiBbXSxcblxuICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gICAgICAgIGFzeW5jIGJlZm9yZShhc3NldDogQXNzZXQpIHtcbiAgICAgICAgICAgIGlmICghc2hhZGVyR3JhcGguZXhpc3RzQ2FjaGVFZmZlY3QoYXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2hhZGVyR3JhcGguZ2VuZXJhdGVFZmZlY3RCeUFzc2V0KGFzc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNoYWRlckdyYXBoLmNhY2hlU291cmNlTWFwLnNldChhc3NldC51dWlkLCBhc3NldC5fc291cmNlKTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGFzc2V0Ll9zb3VyY2UgPSBzaGFkZXJHcmFwaC5nZXRUZW1wRWZmZWN0Q29kZVBhdGgoYXNzZXQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxuICAgICAgICBhc3luYyBhZnRlcihhc3NldDogQXNzZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IHNoYWRlckdyYXBoLmNhY2hlU291cmNlTWFwLmdldChhc3NldC51dWlkKTtcbiAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgYXNzZXQuX3NvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgICAgICAgICBzaGFkZXJHcmFwaC5jYWNoZVNvdXJjZU1hcC5kZWxldGUoYXNzZXQudXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgU2hhZGVyR3JhcGhIYW5kbGVyO1xuIl19