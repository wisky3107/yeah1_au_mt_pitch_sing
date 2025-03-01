"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyData = void 0;
const utils_1 = require("./utils");
/**
 * 用存储 Graph Property 数据
 */
class PropertyData {
    constructor() {
        this.id = (0, utils_1.generateUUID)();
        this.type = '';
        this.name = '';
        /**
         * 声明的类型，目前是 PropertyNode
         */
        this.declareType = 'PropertyNode';
        this.outputPins = [];
    }
}
exports.PropertyData = PropertyData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NoYWRlci1ncmFwaC9pbnRlcmZhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsbUNBQXVDO0FBRXZDOztHQUVHO0FBQ0gsTUFBYSxZQUFZO0lBQXpCO1FBQ0ksT0FBRSxHQUFXLElBQUEsb0JBQVksR0FBRSxDQUFDO1FBQzVCLFNBQUksR0FBRyxFQUFFLENBQUM7UUFDVixTQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ1Y7O1dBRUc7UUFDSCxnQkFBVyxHQUFHLGNBQWMsQ0FBQztRQUM3QixlQUFVLEdBQWMsRUFBRSxDQUFDO0lBQy9CLENBQUM7Q0FBQTtBQVRELG9DQVNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBQaW5EYXRhIH0gZnJvbSAnLi4vYmxvY2stZm9yZ2UvaW50ZXJmYWNlJztcbmltcG9ydCB7IGdlbmVyYXRlVVVJRCB9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIOeUqOWtmOWCqCBHcmFwaCBQcm9wZXJ0eSDmlbDmja5cbiAqL1xuZXhwb3J0IGNsYXNzIFByb3BlcnR5RGF0YSB7XG4gICAgaWQ6IHN0cmluZyA9IGdlbmVyYXRlVVVJRCgpO1xuICAgIHR5cGUgPSAnJztcbiAgICBuYW1lID0gJyc7XG4gICAgLyoqXG4gICAgICog5aOw5piO55qE57G75Z6L77yM55uu5YmN5pivIFByb3BlcnR5Tm9kZVxuICAgICAqL1xuICAgIGRlY2xhcmVUeXBlID0gJ1Byb3BlcnR5Tm9kZSc7XG4gICAgb3V0cHV0UGluczogUGluRGF0YVtdID0gW107XG59XG5cbi8qKlxuICog6IqC54K555qE5LiA5Lqb6ZmE5bim5L+h5oGvXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSU5vZGVEZXRhaWxzIHtcbiAgICBwcm9wZXJ0eUlEPzogc3RyaW5nO1xuICAgIHRpdGxlPzogc3RyaW5nO1xuICAgIHN1YkdyYXBoPzogc3RyaW5nO1xuICAgIGlucHV0UGlucz86IFBpbkRhdGFbXSxcbiAgICBvdXRwdXRQaW5zPzogUGluRGF0YVtdLFxuXG4gICAgW2tleTogc3RyaW5nXTogYW55O1xufVxuIl19