'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const pin_1 = require("../pin");
const mat4KeyList = [
    'm00', 'm01', 'm02', 'm03',
    'm04', 'm05', 'm06', 'm07',
    'm08', 'm09', 'm10', 'm11',
    'm12', 'm13', 'm14', 'm15',
];
class Mat4PinAction extends pin_1.PinAction {
    exec(params) {
        const $pin = params.forge.getPinElement(this.detail.blockName, 'input', this.detail.index);
        if ($pin) {
            // @ts-ignore
            const pin = $pin.__pin;
            pin.details.value[this.detail.key] = this.detail.target;
            pin.onUpdate();
        }
    }
    revertAction() {
        return new Mat4PinAction(this.pin, {
            key: this.detail.key,
            source: this.detail.target,
            target: this.detail.source,
        });
    }
}
class Mat4Pin extends pin_1.Pin {
    constructor() {
        super(...arguments);
        this.color = '#c5ae37';
        this.line = 'normal';
        this.details = {
            value: {
                m00: 0, m01: 0, m02: 0, m03: 0,
                m04: 0, m05: 0, m06: 0, m07: 0,
                m08: 0, m09: 0, m10: 0, m11: 0,
                m12: 0, m13: 0, m14: 0, m15: 0,
            },
        };
        this.contentSlot = ``;
        this.childrenSlot = [
            /*html*/ `<ui-num-input ref="m00"></ui-num-input><ui-num-input ref="m01"></ui-num-input><ui-num-input ref="m02"></ui-num-input><ui-num-input ref="m03"></ui-num-input>`,
            /*html*/ `<ui-num-input ref="m04"></ui-num-input><ui-num-input ref="m05"></ui-num-input><ui-num-input ref="m06"></ui-num-input><ui-num-input ref="m07"></ui-num-input>`,
            /*html*/ `<ui-num-input ref="m08"></ui-num-input><ui-num-input ref="m09"></ui-num-input><ui-num-input ref="m10"></ui-num-input><ui-num-input ref="m11"></ui-num-input>`,
            /*html*/ `<ui-num-input ref="m12"></ui-num-input><ui-num-input ref="m13"></ui-num-input><ui-num-input ref="m14"></ui-num-input><ui-num-input ref="m15"></ui-num-input>`,
        ];
        this.style = `
.mat4 .slot-children { display: flex; }
.mat4 .slot-children > * { padding: 0 2px;}
.mat4 .slot-children ui-num-input { flex: 1; width: 0; color: white; }
    `;
    }
    onInit() {
        mat4KeyList.forEach((key) => {
            const $el = this.refs[key];
            $el.value = this.details.value[key] + '';
            this.refs[key].addEventListener('confirm', () => {
                if (!this.details) {
                    this.details = {
                        value: {
                            m00: 0, m01: 0, m02: 0, m03: 0,
                            m04: 0, m05: 0, m06: 0, m07: 0,
                            m08: 0, m09: 0, m10: 0, m11: 0,
                            m12: 0, m13: 0, m14: 0, m15: 0,
                        },
                    };
                }
                const action = new Mat4PinAction(this, {
                    key,
                    source: this.details.value[key],
                    target: parseFloat($el.value),
                });
                this.exec(action);
            });
        });
    }
    onUpdate() {
        mat4KeyList.forEach((key) => {
            const $el = this.refs[key];
            $el.value = this.details.value[key] + '';
        });
    }
}
Mat4Pin.type = 'mat4';
(0, pin_1.declarePin)(Mat4Pin);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGluLW1hdDQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmxvY2stZm9yZ2UvaW50ZXJuYWwvcGluLW1hdDQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOztBQUdiLGdDQUFvRDtBQVlwRCxNQUFNLFdBQVcsR0FBZ0I7SUFDN0IsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSztJQUMxQixLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLO0lBQzFCLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUs7SUFDMUIsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSztDQUM3QixDQUFDO0FBV0YsTUFBTSxhQUFjLFNBQVEsZUFJMUI7SUFFRSxJQUFJLENBQUMsTUFFSjtRQUNHLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNGLElBQUksSUFBSSxFQUFFO1lBQ04sYUFBYTtZQUNiLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFnQixDQUFDO1lBQ2xDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDeEQsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ2xCO0lBQ0wsQ0FBQztJQUVELFlBQVk7UUFDUixPQUFPLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDL0IsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRztZQUNwQixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNO1lBQzFCLE1BQU0sRUFB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QUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM3QyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7O0FBMURNLFlBQUksR0FBRyxNQUFNLENBQUM7QUE0RHpCLElBQUEsZ0JBQVUsRUFBQyxPQUFPLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHR5cGUgeyBIVE1MR3JhcGhGb3JnZUVsZW1lbnQgfSBmcm9tICcuLi9mb3JnZSc7XG5pbXBvcnQgeyBQaW4sIGRlY2xhcmVQaW4sIFBpbkFjdGlvbiB9IGZyb20gJy4uL3Bpbic7XG5cbi8qKlxuICogVmVjNFxuICog5biD5bCU57G75Z6L55qE5byV6ISaXG4gKi9cbnR5cGUgTWF0NEtleUxpc3QgPSBbXG4gICAgJ20wMCcsICdtMDEnLCAnbTAyJywgJ20wMycsXG4gICAgJ20wNCcsICdtMDUnLCAnbTA2JywgJ20wNycsXG4gICAgJ20wOCcsICdtMDknLCAnbTEwJywgJ20xMScsXG4gICAgJ20xMicsICdtMTMnLCAnbTE0JywgJ20xNScsXG5dO1xuY29uc3QgbWF0NEtleUxpc3Q6IE1hdDRLZXlMaXN0ID0gW1xuICAgICdtMDAnLCAnbTAxJywgJ20wMicsICdtMDMnLFxuICAgICdtMDQnLCAnbTA1JywgJ20wNicsICdtMDcnLFxuICAgICdtMDgnLCAnbTA5JywgJ20xMCcsICdtMTEnLFxuICAgICdtMTInLCAnbTEzJywgJ20xNCcsICdtMTUnLFxuXTtcblxudHlwZSBNYXQ0RGV0YWlsID0ge1xuICAgIHZhbHVlOiB7XG4gICAgICAgIG0wMDogbnVtYmVyLCBtMDE6IG51bWJlciwgbTAyOiBudW1iZXIsIG0wMzogbnVtYmVyLFxuICAgICAgICBtMDQ6IG51bWJlciwgbTA1OiBudW1iZXIsIG0wNjogbnVtYmVyLCBtMDc6IG51bWJlcixcbiAgICAgICAgbTA4OiBudW1iZXIsIG0wOTogbnVtYmVyLCBtMTA6IG51bWJlciwgbTExOiBudW1iZXIsXG4gICAgICAgIG0xMjogbnVtYmVyLCBtMTM6IG51bWJlciwgbTE0OiBudW1iZXIsIG0xNTogbnVtYmVyLFxuICAgIH07XG59XG5cbmNsYXNzIE1hdDRQaW5BY3Rpb24gZXh0ZW5kcyBQaW5BY3Rpb248e1xuICAgIGtleToga2V5b2YgTWF0NERldGFpbFsndmFsdWUnXSxcbiAgICBzb3VyY2U6IG51bWJlcixcbiAgICB0YXJnZXQ6IG51bWJlcixcbn0+IHtcblxuICAgIGV4ZWMocGFyYW1zOiB7XG4gICAgICAgIGZvcmdlOiBIVE1MR3JhcGhGb3JnZUVsZW1lbnRcbiAgICB9KSB7XG4gICAgICAgIGNvbnN0ICRwaW4gPSBwYXJhbXMuZm9yZ2UuZ2V0UGluRWxlbWVudCh0aGlzLmRldGFpbC5ibG9ja05hbWUsICdpbnB1dCcsIHRoaXMuZGV0YWlsLmluZGV4KTtcbiAgICAgICAgaWYgKCRwaW4pIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHBpbiA9ICRwaW4uX19waW4gYXMgTWF0MlBpbjtcbiAgICAgICAgICAgIHBpbi5kZXRhaWxzLnZhbHVlW3RoaXMuZGV0YWlsLmtleV0gPSB0aGlzLmRldGFpbC50YXJnZXQ7XG4gICAgICAgICAgICBwaW4ub25VcGRhdGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldmVydEFjdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXQ0UGluQWN0aW9uKHRoaXMucGluLCB7XG4gICAgICAgICAgICBrZXk6IHRoaXMuZGV0YWlsLmtleSxcbiAgICAgICAgICAgIHNvdXJjZTogdGhpcy5kZXRhaWwudGFyZ2V0LFxuICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLmRldGFpbC5zb3VyY2UsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuY2xhc3MgTWF0NFBpbiBleHRlbmRzIFBpbjxNYXQ0RGV0YWlsPiB7XG4gICAgc3RhdGljIHR5cGUgPSAnbWF0NCc7XG5cbiAgICBjb2xvciA9ICcjYzVhZTM3JztcbiAgICBsaW5lID0gJ25vcm1hbCc7XG4gICAgZGV0YWlscyA9IHtcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICAgIG0wMDogMCwgbTAxOiAwLCBtMDI6IDAsIG0wMzogMCxcbiAgICAgICAgICAgIG0wNDogMCwgbTA1OiAwLCBtMDY6IDAsIG0wNzogMCxcbiAgICAgICAgICAgIG0wODogMCwgbTA5OiAwLCBtMTA6IDAsIG0xMTogMCxcbiAgICAgICAgICAgIG0xMjogMCwgbTEzOiAwLCBtMTQ6IDAsIG0xNTogMCxcbiAgICAgICAgfSxcbiAgICB9O1xuXG4gICAgY29udGVudFNsb3QgPSAvKmh0bWwqL2BgO1xuICAgIGNoaWxkcmVuU2xvdCA9IFtcbiAgICAgICAgLypodG1sKi9gPHVpLW51bS1pbnB1dCByZWY9XCJtMDBcIj48L3VpLW51bS1pbnB1dD48dWktbnVtLWlucHV0IHJlZj1cIm0wMVwiPjwvdWktbnVtLWlucHV0Pjx1aS1udW0taW5wdXQgcmVmPVwibTAyXCI+PC91aS1udW0taW5wdXQ+PHVpLW51bS1pbnB1dCByZWY9XCJtMDNcIj48L3VpLW51bS1pbnB1dD5gLFxuICAgICAgICAvKmh0bWwqL2A8dWktbnVtLWlucHV0IHJlZj1cIm0wNFwiPjwvdWktbnVtLWlucHV0Pjx1aS1udW0taW5wdXQgcmVmPVwibTA1XCI+PC91aS1udW0taW5wdXQ+PHVpLW51bS1pbnB1dCByZWY9XCJtMDZcIj48L3VpLW51bS1pbnB1dD48dWktbnVtLWlucHV0IHJlZj1cIm0wN1wiPjwvdWktbnVtLWlucHV0PmAsXG4gICAgICAgIC8qaHRtbCovYDx1aS1udW0taW5wdXQgcmVmPVwibTA4XCI+PC91aS1udW0taW5wdXQ+PHVpLW51bS1pbnB1dCByZWY9XCJtMDlcIj48L3VpLW51bS1pbnB1dD48dWktbnVtLWlucHV0IHJlZj1cIm0xMFwiPjwvdWktbnVtLWlucHV0Pjx1aS1udW0taW5wdXQgcmVmPVwibTExXCI+PC91aS1udW0taW5wdXQ+YCxcbiAgICAgICAgLypodG1sKi9gPHVpLW51bS1pbnB1dCByZWY9XCJtMTJcIj48L3VpLW51bS1pbnB1dD48dWktbnVtLWlucHV0IHJlZj1cIm0xM1wiPjwvdWktbnVtLWlucHV0Pjx1aS1udW0taW5wdXQgcmVmPVwibTE0XCI+PC91aS1udW0taW5wdXQ+PHVpLW51bS1pbnB1dCByZWY9XCJtMTVcIj48L3VpLW51bS1pbnB1dD5gLFxuICAgIF07XG5cbiAgICBzdHlsZSA9IGBcbi5tYXQ0IC5zbG90LWNoaWxkcmVuIHsgZGlzcGxheTogZmxleDsgfVxuLm1hdDQgLnNsb3QtY2hpbGRyZW4gPiAqIHsgcGFkZGluZzogMCAycHg7fVxuLm1hdDQgLnNsb3QtY2hpbGRyZW4gdWktbnVtLWlucHV0IHsgZmxleDogMTsgd2lkdGg6IDA7IGNvbG9yOiB3aGl0ZTsgfVxuICAgIGA7XG5cbiAgICBvbkluaXQoKSB7XG4gICAgICAgIG1hdDRLZXlMaXN0LmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgJGVsID0gdGhpcy5yZWZzW2tleV0gYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICAgICAgICAgICRlbC52YWx1ZSA9IHRoaXMuZGV0YWlscy52YWx1ZVtrZXldICsgJyc7XG5cbiAgICAgICAgICAgIHRoaXMucmVmc1trZXldLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbmZpcm0nLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmRldGFpbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXRhaWxzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtMDA6IDAsIG0wMTogMCwgbTAyOiAwLCBtMDM6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbTA0OiAwLCBtMDU6IDAsIG0wNjogMCwgbTA3OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0wODogMCwgbTA5OiAwLCBtMTA6IDAsIG0xMTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtMTI6IDAsIG0xMzogMCwgbTE0OiAwLCBtMTU6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBuZXcgTWF0NFBpbkFjdGlvbih0aGlzLCB7XG4gICAgICAgICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiB0aGlzLmRldGFpbHMudmFsdWVba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBwYXJzZUZsb2F0KCRlbC52YWx1ZSksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5leGVjKGFjdGlvbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgb25VcGRhdGUoKSB7XG4gICAgICAgIG1hdDRLZXlMaXN0LmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgJGVsID0gdGhpcy5yZWZzW2tleV0gYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICAgICAgICAgICRlbC52YWx1ZSA9IHRoaXMuZGV0YWlscy52YWx1ZVtrZXldICsgJyc7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmRlY2xhcmVQaW4oTWF0NFBpbik7XG4iXX0=