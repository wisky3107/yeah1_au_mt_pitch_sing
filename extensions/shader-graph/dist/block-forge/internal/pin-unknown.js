'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const pin_1 = require("../pin");
/**
 * Unknown
 * 未知类型的引脚
 */
class UnknownPin extends pin_1.Pin {
    constructor() {
        super(...arguments);
        this.color = '';
        this.line = 'normal';
        this.details = {
            value: null,
        };
        this.contentSlot = ``;
        this.childrenSlot = [];
    }
}
UnknownPin.type = 'unknown';
(0, pin_1.declarePin)(UnknownPin);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGluLXVua25vd24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmxvY2stZm9yZ2UvaW50ZXJuYWwvcGluLXVua25vd24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOztBQUViLGdDQUFvRDtBQUVwRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVcsU0FBUSxTQUl4QjtJQUpEOztRQU9JLFVBQUssR0FBRyxFQUFFLENBQUM7UUFDWCxTQUFJLEdBQUcsUUFBUSxDQUFDO1FBQ2hCLFlBQU8sR0FBRztZQUNOLEtBQUssRUFBRSxJQUFJO1NBQ2QsQ0FBQztRQUVGLGdCQUFXLEdBQVcsRUFBRSxDQUFDO1FBQ3pCLGlCQUFZLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLENBQUM7O0FBVlUsZUFBSSxHQUFHLFNBQVMsQ0FBQztBQVc1QixJQUFBLGdCQUFVLEVBQUMsVUFBVSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IFBpbiwgZGVjbGFyZVBpbiwgUGluQWN0aW9uIH0gZnJvbSAnLi4vcGluJztcblxuLyoqXG4gKiBVbmtub3duXG4gKiDmnKrnn6XnsbvlnovnmoTlvJXohJpcbiAqL1xuY2xhc3MgVW5rbm93blBpbiBleHRlbmRzIFBpbjxcbntcbiAgICB2YWx1ZTogYW55O1xufVxuPiB7XG4gICAgc3RhdGljIHR5cGUgPSAndW5rbm93bic7XG5cbiAgICBjb2xvciA9ICcnO1xuICAgIGxpbmUgPSAnbm9ybWFsJztcbiAgICBkZXRhaWxzID0ge1xuICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICB9O1xuXG4gICAgY29udGVudFNsb3QgPSAvKmh0bWwqL2BgO1xuICAgIGNoaWxkcmVuU2xvdCA9IFtdO1xufVxuZGVjbGFyZVBpbihVbmtub3duUGluKTtcbiJdfQ==