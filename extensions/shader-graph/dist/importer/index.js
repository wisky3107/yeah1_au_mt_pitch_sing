"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
exports.methods = {
    async registerShaderGraphImporter380() {
        const { ShaderGraph380 } = await Promise.resolve().then(() => __importStar(require('./shader-graph-3.8')));
        return {
            extname: ['.shadergraph'],
            importer: ShaderGraph380,
        };
    },
    async registerShaderGraphImporter() {
        return (await Promise.resolve().then(() => __importStar(require('./shader-graph-handler')))).default;
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW1wb3J0ZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFYSxRQUFBLE9BQU8sR0FBRztJQUNuQixLQUFLLENBQUMsOEJBQThCO1FBQ2hDLE1BQU0sRUFBRSxjQUFjLEVBQUUsR0FBRyx3REFBYSxvQkFBb0IsR0FBQyxDQUFDO1FBQzlELE9BQU87WUFDSCxPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUM7WUFDekIsUUFBUSxFQUFFLGNBQWM7U0FDM0IsQ0FBQztJQUNOLENBQUM7SUFFRCxLQUFLLENBQUMsMkJBQTJCO1FBQzdCLE9BQU8sQ0FBQyx3REFBYSx3QkFBd0IsR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0lBQzVELENBQUM7Q0FDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2hhZGVyR3JhcGgzODAgfSBmcm9tICcuL3NoYWRlci1ncmFwaC0zLjgnO1xuXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICBhc3luYyByZWdpc3RlclNoYWRlckdyYXBoSW1wb3J0ZXIzODAoKSB7XG4gICAgICAgIGNvbnN0IHsgU2hhZGVyR3JhcGgzODAgfSA9IGF3YWl0IGltcG9ydCgnLi9zaGFkZXItZ3JhcGgtMy44Jyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBleHRuYW1lOiBbJy5zaGFkZXJncmFwaCddLFxuICAgICAgICAgICAgaW1wb3J0ZXI6IFNoYWRlckdyYXBoMzgwLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBhc3luYyByZWdpc3RlclNoYWRlckdyYXBoSW1wb3J0ZXIoKSB7XG4gICAgICAgIHJldHVybiAoYXdhaXQgaW1wb3J0KCcuL3NoYWRlci1ncmFwaC1oYW5kbGVyJykpLmRlZmF1bHQ7XG4gICAgfSxcbn07XG4iXX0=