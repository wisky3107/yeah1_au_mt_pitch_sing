'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.declarePin = exports.generateStyle = exports.generateInputPinHTML = exports.generateOutputPinHTML = exports.Pin = exports.PinAction = void 0;
const structures_1 = require("@itharbors/structures");
const TYPE = {};
class PinAction extends structures_1.Action {
    // details: D & PinActionDetail;
    constructor(pin, details) {
        const cDetails = details;
        cDetails.blockName = pin.pathData.blockName;
        cDetails.index = pin.pathData.index;
        super(cDetails);
        // this.details = cDetails;
        this.pin = pin;
    }
    exec(params) {
    }
    revertAction() {
        return new PinAction(this.pin, {});
    }
}
exports.PinAction = PinAction;
class Pin {
    constructor() {
        this.color = 'white';
        this.line = '';
        this.style = '';
        this.pathData = {
            blockName: '',
            index: 0,
        };
        this.refs = {};
    }
    init(details, desc, blockName, index) {
        this.details = details;
        this.pathData.blockName = blockName;
        this.pathData.index = index;
        this.desc = desc;
    }
    exec(action) {
        if (!this.$root) {
            return;
        }
        const nodeRoot = this.$root.getRootNode();
        if (nodeRoot) {
            nodeRoot.host.dispatch('dirty', {
                detail: {
                    action,
                },
            });
        }
    }
    onInit() {
    }
    onUpdate() {
    }
}
exports.Pin = Pin;
Pin.type = 'unknown';
// todo 考虑数据冲突
function generateIcon(pin) {
    if (pin.icon) {
        return /*html*/ `<ui-icon value="${pin.icon}"></ui-icon>`;
    }
    return '';
}
function generateTitle(pin) {
    if (pin.name) {
        return /*html*/ `<span class="name" title="${pin.name}">${pin.name}</span>`;
    }
    return '';
}
/**
 * 生成 output pin 的 HTML
 * @param pin
 * @param details
 * @returns
 */
function generateOutputPinHTML(pin, details) {
    const type = pin.dataType;
    const define = TYPE[type] || TYPE['unknown'];
    const pinI = new define();
    const color = pinI.color ? `--param-color: ${pinI.color};` : '';
    const $pin = document.createElement('div');
    $pin.classList.add('pin');
    $pin.classList.add('out');
    $pin.classList.add(type + '');
    // @ts-ignore
    $pin.__pin = pinI;
    $pin.innerHTML = /*html*/ `${pinI.style ? `<style>${pinI.style}</style>` : ''}
    <div class="body">
        <div class="name">
            ${generateTitle(pin)}
            ${generateIcon(pin)}
        </div>
    </div>

    <v-graph-node-param ${pin.hidePin ? 'hidden' : ''} style="${color}" class="point" direction="output" name="${pin.tag}" type="${type}" role="right"></v-graph-node-param>`;
    const $refList = $pin.querySelectorAll('[ref]');
    Array.prototype.forEach.call($refList, ($ref) => {
        const ref = $ref.getAttribute('ref');
        if (ref) {
            pinI.refs[ref] = $ref;
        }
    });
    pinI.details = details;
    // pinI.onInit();
    // pinI.onUpdate(details);
    return $pin;
}
exports.generateOutputPinHTML = generateOutputPinHTML;
/**
 * 生成 input pin 的 HTML
 * @param pin
 * @param pinData
 * @param blockName
 * @param lineMap
 * @returns
 */
function generateInputPinHTML(pin, pinDataList, index, blockName, lineMap) {
    const type = pin.dataType;
    const define = TYPE[type] || TYPE['unknown'];
    const pinI = new define();
    const color = pinI.color ? `--param-color: ${pinI.color};` : '';
    let connected = false;
    for (const id in lineMap) {
        const line = lineMap[id];
        if (line &&
            line.output.node === blockName &&
            line.output.param === pin.tag) {
            connected = true;
        }
    }
    const $pin = document.createElement('div');
    $pin.classList.add('pin');
    $pin.classList.add('in');
    $pin.classList.add(type + '');
    // @ts-ignore
    $pin.__pin = pinI;
    $pin.innerHTML = /*html*/ `${pinI.style ? `<style>${pinI.style}</style>` : ''}
    <div class="body">
        <div class="name">
            ${generateIcon(pin)}
            ${generateTitle(pin)}
        </div>
        ${pinI.contentSlot ? `<div class="slot-content" ${connected ? 'hidden' : ''}>${pinI.contentSlot}</div>` : ''}
    </div>

    ${pinI.childrenSlot ? `<div class="children" ${connected ? 'hidden' : ''}>${pinI.childrenSlot.map(child => '<div class="slot-children">' + child + '</div>').join('')}</div>` : ''}
    <v-graph-node-param ${pin.hidePin ? 'hidden' : ''} style="${color}" class="point" direction="input" name="${pin.tag}" type="${type}" role="left"></v-graph-node-param>`;
    const $refList = $pin.querySelectorAll('[ref]');
    Array.prototype.forEach.call($refList, ($ref) => {
        const ref = $ref.getAttribute('ref');
        if (ref) {
            pinI.refs[ref] = $ref;
        }
    });
    const pinData = pinDataList[index];
    pinI.init(pinData, pin, blockName, index);
    pinI.$root = $pin;
    pinI.onInit();
    pinI.onUpdate();
    return $pin;
}
exports.generateInputPinHTML = generateInputPinHTML;
/**
 * 生成 pin 的样式代码
 * @param config
 * @returns
 */
function generateStyle(blockDesc) {
    return /*css*/ `
.pin {
    --param-color: #fff;
    --line—margin: 6px;

    line-height: calc(var(--header-height) - 4px);
    margin: var(--line—margin) 10px 0 10px;
    position: relative;
}
.pin:last-child {
    padding-bottom: var(--line—margin);
}
.pin.in {

}
.pin.out {
    text-align: right;
}
.pin.in > .point[hidden], .pin.out > .point[hidden] {
    display: none;
}

.pin.in > .point, .pin.out > .point {
    display: block;
    border: 1px solid var(--param-color);
    transform: rotate(45deg);
    width: 7px;
    height: 7px;
    position: absolute;
    top: 6px;
    transition: all 0.2s;
    background: var(--background-color);
    z-index: 1;
    cursor: pointer;
}
.pin.in > .point {
    left: -14px;
}
.pin.out > .point {
    right: -14px;
}
.pin.in > .point:hover,
.pin.in > .point[active],
.pin.out > .point:hover,
.pin.out > .point[active]
{
    background: var(--param-color);
}

.pin > .body {
    display: flex;
}
.pin > .body > .name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pin > .body > .name > .name {
    padding: 0 6px;
}

.pin > .body > .slot-content {
    flex: 1;
    display: flex;
    width: 120px;
}

.pin > .children, .pin > .children > div {
    margin-top: calc(var(--line—margin) * 0.5);
}

.pin > .body > .slot-content[hidden], .pin > .children[hidden] {
    display: none;
}
    `;
}
exports.generateStyle = generateStyle;
function declarePin(define) {
    const type = define.type;
    TYPE[type] = define;
}
exports.declarePin = declarePin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGluLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Jsb2NrLWZvcmdlL3Bpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7OztBQWFiLHNEQUcrQjtBQU0vQixNQUFNLElBQUksR0FFTixFQUFFLENBQUM7QUFPUCxNQUFhLFNBQXdCLFNBQVEsbUJBQTJCO0lBSXBFLGdDQUFnQztJQUVoQyxZQUFZLEdBQVEsRUFBRSxPQUFVO1FBQzVCLE1BQU0sUUFBUSxHQUFHLE9BQThCLENBQUM7UUFDaEQsUUFBUSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQztRQUM1QyxRQUFRLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQ3BDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoQiwyQkFBMkI7UUFDM0IsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDbkIsQ0FBQztJQUVELElBQUksQ0FBQyxNQUVKO0lBRUQsQ0FBQztJQUVELFlBQVk7UUFDUixPQUFPLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDdkMsQ0FBQztDQUNKO0FBeEJELDhCQXdCQztBQUVELE1BQWEsR0FBRztJQUFoQjtRQUdJLFVBQUssR0FBRyxPQUFPLENBQUM7UUFDaEIsU0FBSSxHQUFHLEVBQUUsQ0FBQztRQUNWLFVBQUssR0FBRyxFQUFFLENBQUM7UUFHWCxhQUFRLEdBQUc7WUFDUCxTQUFTLEVBQUUsRUFBRTtZQUNiLEtBQUssRUFBRSxDQUFDO1NBQ1gsQ0FBQztRQU9GLFNBQUksR0FBbUMsRUFBRSxDQUFDO0lBK0I5QyxDQUFDO0lBNUJHLElBQUksQ0FBQyxPQUFVLEVBQUUsSUFBcUIsRUFBRSxTQUFpQixFQUFFLEtBQWE7UUFDcEUsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFB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QixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hELEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUM1QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLElBQUksR0FBRyxFQUFFO1lBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7U0FDekI7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVuQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzFDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ2xCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNkLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNoQixPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDO0FBckRELG9EQXFEQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFnQixhQUFhLENBQUMsU0FBNEI7SUFDdEQsT0FBTyxPQUFPLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7S0E0RWIsQ0FBQztBQUNOLENBQUM7QUE5RUQsc0NBOEVDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLE1BQWtDO0lBQ3pELE1BQU0sSUFBSSxHQUFJLE1BQWdDLENBQUMsSUFBSSxDQUFDO0lBQ3BELElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUM7QUFDeEIsQ0FBQztBQUhELGdDQUdDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFBpbiDlvJXohJrlhoXnva7nmoTnsbvlnotcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IExpbmVJbmZvIH0gZnJvbSAnQGl0aGFyYm9ycy91aS1ncmFwaCc7XG5pbXBvcnQgdHlwZSB7IEJhc2VFbGVtZW50IH0gZnJvbSAnQGl0aGFyYm9ycy91aS1jb3JlJztcbmltcG9ydCB0eXBlIHsgSVBpbkRlc2NyaXB0aW9uLCBJQmxvY2tEZXNjcmlwdGlvbiwgUGluRGF0YSB9IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB0eXBlIHtcbiAgICBIVE1MR3JhcGhGb3JnZUVsZW1lbnQsXG59IGZyb20gJy4vZm9yZ2UnO1xuXG5pbXBvcnQge1xuICAgIEFjdGlvbixcbiAgICBBY3Rpb25MaXN0LFxufSBmcm9tICdAaXRoYXJib3JzL3N0cnVjdHVyZXMnO1xuXG5leHBvcnQgdHlwZSBEaXJ0eURldGFpbCA9IHtcbiAgICBhY3Rpb24/OiBBY3Rpb247XG59O1xuXG5jb25zdCBUWVBFOiB7XG4gICAgW2tleTogc3RyaW5nXTogbmV3KC4uLmFyZ3M6IGFueVtdKSA9PiBQaW5cbn0gPSB7fTtcblxudHlwZSBQaW5BY3Rpb25EZXRhaWwgPSB7XG4gICAgYmxvY2tOYW1lOiBzdHJpbmc7XG4gICAgaW5kZXg6IG51bWJlcjtcbn07XG5cbmV4cG9ydCBjbGFzcyBQaW5BY3Rpb248RCBleHRlbmRzIHt9PiBleHRlbmRzIEFjdGlvbjxEICYgUGluQWN0aW9uRGV0YWlsPiB7XG5cbiAgICBwaW46IFBpbjtcblxuICAgIC8vIGRldGFpbHM6IEQgJiBQaW5BY3Rpb25EZXRhaWw7XG5cbiAgICBjb25zdHJ1Y3RvcihwaW46IFBpbiwgZGV0YWlsczogRCkge1xuICAgICAgICBjb25zdCBjRGV0YWlscyA9IGRldGFpbHMgYXMgRCAmIFBpbkFjdGlvbkRldGFpbDtcbiAgICAgICAgY0RldGFpbHMuYmxvY2tOYW1lID0gcGluLnBhdGhEYXRhLmJsb2NrTmFtZTtcbiAgICAgICAgY0RldGFpbHMuaW5kZXggPSBwaW4ucGF0aERhdGEuaW5kZXg7XG4gICAgICAgIHN1cGVyKGNEZXRhaWxzKTtcbiAgICAgICAgLy8gdGhpcy5kZXRhaWxzID0gY0RldGFpbHM7XG4gICAgICAgIHRoaXMucGluID0gcGluO1xuICAgIH1cblxuICAgIGV4ZWMocGFyYW1zOiB7XG4gICAgICAgIGZvcmdlOiBIVE1MR3JhcGhGb3JnZUVsZW1lbnRcbiAgICB9KSB7XG5cbiAgICB9XG5cbiAgICByZXZlcnRBY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGluQWN0aW9uKHRoaXMucGluLCB7fSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGluPEQgPSB7IFtrZXk6IHN0cmluZ106IGFueSB9PiB7XG4gICAgc3RhdGljIHR5cGUgPSAndW5rbm93bic7XG5cbiAgICBjb2xvciA9ICd3aGl0ZSc7XG4gICAgbGluZSA9ICcnO1xuICAgIHN0eWxlID0gJyc7XG4gICAgZGV0YWlscz86IEQ7XG5cbiAgICBwYXRoRGF0YSA9IHtcbiAgICAgICAgYmxvY2tOYW1lOiAnJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgfTtcblxuICAgIGRlc2MhOiBJUGluRGVzY3JpcHRpb247XG5cbiAgICBjb250ZW50U2xvdD86IHN0cmluZztcbiAgICBjaGlsZHJlblNsb3Q/OiBzdHJpbmdbXTtcblxuICAgIHJlZnM6IHsgW2tleTogc3RyaW5nXTogSFRNTEVsZW1lbnQgfSA9IHt9O1xuICAgICRyb290PzogSFRNTEVsZW1lbnQ7XG5cbiAgICBpbml0KGRldGFpbHM6IEQsIGRlc2M6IElQaW5EZXNjcmlwdGlvbiwgYmxvY2tOYW1lOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5kZXRhaWxzID0gZGV0YWlscztcbiAgICAgICAgdGhpcy5wYXRoRGF0YS5ibG9ja05hbWUgPSBibG9ja05hbWU7XG4gICAgICAgIHRoaXMucGF0aERhdGEuaW5kZXggPSBpbmRleDtcbiAgICAgICAgdGhpcy5kZXNjID0gZGVzYztcbiAgICB9XG5cbiAgICBleGVjKGFjdGlvbjogQWN0aW9uKSB7XG4gICAgICAgIGlmICghdGhpcy4kcm9vdCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5vZGVSb290ID0gdGhpcy4kcm9vdC5nZXRSb290Tm9kZSgpIGFzIFNoYWRvd1Jvb3Q7XG4gICAgICAgIGlmIChub2RlUm9vdCkge1xuICAgICAgICAgICAgKG5vZGVSb290Lmhvc3QgYXMgQmFzZUVsZW1lbnQpLmRpc3BhdGNoKCdkaXJ0eScsIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uSW5pdCgpIHtcblxuICAgIH1cblxuICAgIG9uVXBkYXRlKCkge1xuXG4gICAgfVxufVxuXG4vLyB0b2RvIOiAg+iZkeaVsOaNruWGsueqgVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUljb24ocGluOiBJUGluRGVzY3JpcHRpb24pIHtcbiAgICBpZiAocGluLmljb24pIHtcbiAgICAgICAgcmV0dXJuIC8qaHRtbCovYDx1aS1pY29uIHZhbHVlPVwiJHtwaW4uaWNvbn1cIj48L3VpLWljb24+YDtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVRpdGxlKHBpbjogSVBpbkRlc2NyaXB0aW9uKSB7XG4gICAgaWYgKHBpbi5uYW1lKSB7XG4gICAgICAgIHJldHVybiAvKmh0bWwqL2A8c3BhbiBjbGFzcz1cIm5hbWVcIiB0aXRsZT1cIiR7cGluLm5hbWV9XCI+JHtwaW4ubmFtZX08L3NwYW4+YDtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuXG4vKipcbiAqIOeUn+aIkCBvdXRwdXQgcGluIOeahCBIVE1MXG4gKiBAcGFyYW0gcGluXG4gKiBAcGFyYW0gZGV0YWlsc1xuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlT3V0cHV0UGluSFRNTChwaW46IElQaW5EZXNjcmlwdGlvbiwgZGV0YWlsczogeyB2YWx1ZTogYW55IH0pIHtcbiAgICBjb25zdCB0eXBlID0gcGluLmRhdGFUeXBlIGFzIGtleW9mIHR5cGVvZiBUWVBFO1xuICAgIGNvbnN0IGRlZmluZSA9IFRZUEVbdHlwZV0gfHwgVFlQRVsndW5rbm93biddO1xuICAgIGNvbnN0IHBpbkkgPSBuZXcgZGVmaW5lKCk7XG4gICAgY29uc3QgY29sb3IgPSBwaW5JLmNvbG9yID8gYC0tcGFyYW0tY29sb3I6ICR7cGluSS5jb2xvcn07YCA6ICcnO1xuXG4gICAgY29uc3QgJHBpbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICRwaW4uY2xhc3NMaXN0LmFkZCgncGluJyk7XG4gICAgJHBpbi5jbGFzc0xpc3QuYWRkKCdvdXQnKTtcbiAgICAkcGluLmNsYXNzTGlzdC5hZGQodHlwZSArICcnKTtcblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICAkcGluLl9fcGluID0gcGluSTtcblxuICAgICRwaW4uaW5uZXJIVE1MID0gLypodG1sKi9gJHtwaW5JLnN0eWxlID8gYDxzdHlsZT4ke3Bpbkkuc3R5bGV9PC9zdHlsZT5gIDogJyd9XG4gICAgPGRpdiBjbGFzcz1cImJvZHlcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5hbWVcIj5cbiAgICAgICAgICAgICR7Z2VuZXJhdGVUaXRsZShwaW4pfVxuICAgICAgICAgICAgJHtnZW5lcmF0ZUljb24ocGluKX1cbiAgICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8di1ncmFwaC1ub2RlLXBhcmFtICR7cGluLmhpZGVQaW4gPyAnaGlkZGVuJyA6ICcnfSBzdHlsZT1cIiR7Y29sb3J9XCIgY2xhc3M9XCJwb2ludFwiIGRpcmVjdGlvbj1cIm91dHB1dFwiIG5hbWU9XCIke3Bpbi50YWd9XCIgdHlwZT1cIiR7dHlwZX1cIiByb2xlPVwicmlnaHRcIj48L3YtZ3JhcGgtbm9kZS1wYXJhbT5gO1xuXG4gICAgY29uc3QgJHJlZkxpc3QgPSAkcGluLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tyZWZdJyk7XG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCgkcmVmTGlzdCwgKCRyZWYpID0+IHtcbiAgICAgICAgY29uc3QgcmVmID0gJHJlZi5nZXRBdHRyaWJ1dGUoJ3JlZicpO1xuICAgICAgICBpZiAocmVmKSB7XG4gICAgICAgICAgICBwaW5JLnJlZnNbcmVmXSA9ICRyZWY7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHBpbkkuZGV0YWlscyA9IGRldGFpbHM7XG4gICAgLy8gcGluSS5vbkluaXQoKTtcbiAgICAvLyBwaW5JLm9uVXBkYXRlKGRldGFpbHMpO1xuICAgIHJldHVybiAkcGluO1xufVxuXG4vKipcbiAqIOeUn+aIkCBpbnB1dCBwaW4g55qEIEhUTUxcbiAqIEBwYXJhbSBwaW5cbiAqIEBwYXJhbSBwaW5EYXRhXG4gKiBAcGFyYW0gYmxvY2tOYW1lXG4gKiBAcGFyYW0gbGluZU1hcFxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlSW5wdXRQaW5IVE1MKHBpbjogSVBpbkRlc2NyaXB0aW9uLCBwaW5EYXRhTGlzdDogUGluRGF0YVtdLCBpbmRleDogbnVtYmVyLCBibG9ja05hbWU6IHN0cmluZywgbGluZU1hcDogeyBba2V5OiBzdHJpbmddOiBMaW5lSW5mbyB8IHVuZGVmaW5lZCB9KSB7XG4gICAgY29uc3QgdHlwZSA9IHBpbi5kYXRhVHlwZSBhcyBrZXlvZiB0eXBlb2YgVFlQRTtcbiAgICBjb25zdCBkZWZpbmUgPSBUWVBFW3R5cGVdIHx8IFRZUEVbJ3Vua25vd24nXTtcbiAgICBjb25zdCBwaW5JID0gbmV3IGRlZmluZSgpO1xuICAgIGNvbnN0IGNvbG9yID0gcGluSS5jb2xvciA/IGAtLXBhcmFtLWNvbG9yOiAke3BpbkkuY29sb3J9O2AgOiAnJztcblxuICAgIGxldCBjb25uZWN0ZWQgPSBmYWxzZTtcbiAgICBmb3IgKGNvbnN0IGlkIGluIGxpbmVNYXApIHtcbiAgICAgICAgY29uc3QgbGluZSA9IGxpbmVNYXBbaWRdO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICBsaW5lICYmXG4gICAgICAgICAgICBsaW5lLm91dHB1dC5ub2RlID09PSBibG9ja05hbWUgJiZcbiAgICAgICAgICAgIGxpbmUub3V0cHV0LnBhcmFtID09PSBwaW4udGFnXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0ICRwaW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAkcGluLmNsYXNzTGlzdC5hZGQoJ3BpbicpO1xuICAgICRwaW4uY2xhc3NMaXN0LmFkZCgnaW4nKTtcbiAgICAkcGluLmNsYXNzTGlzdC5hZGQodHlwZSArICcnKTtcblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICAkcGluLl9fcGluID0gcGluSTtcblxuICAgICRwaW4uaW5uZXJIVE1MID0gLypodG1sKi9gJHtwaW5JLnN0eWxlID8gYDxzdHlsZT4ke3Bpbkkuc3R5bGV9PC9zdHlsZT5gIDogJyd9XG4gICAgPGRpdiBjbGFzcz1cImJvZHlcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5hbWVcIj5cbiAgICAgICAgICAgICR7Z2VuZXJhdGVJY29uKHBpbil9XG4gICAgICAgICAgICAke2dlbmVyYXRlVGl0bGUocGluKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgICR7cGluSS5jb250ZW50U2xvdCA/IGA8ZGl2IGNsYXNzPVwic2xvdC1jb250ZW50XCIgJHtjb25uZWN0ZWQgPyAnaGlkZGVuJyA6ICcnfT4ke3BpbkkuY29udGVudFNsb3R9PC9kaXY+YCA6ICcnfVxuICAgIDwvZGl2PlxuXG4gICAgJHtwaW5JLmNoaWxkcmVuU2xvdCA/IGA8ZGl2IGNsYXNzPVwiY2hpbGRyZW5cIiAke2Nvbm5lY3RlZCA/ICdoaWRkZW4nIDogJyd9PiR7cGluSS5jaGlsZHJlblNsb3QubWFwKGNoaWxkID0+ICc8ZGl2IGNsYXNzPVwic2xvdC1jaGlsZHJlblwiPicgKyBjaGlsZCArICc8L2Rpdj4nKS5qb2luKCcnKX08L2Rpdj5gIDogJyd9XG4gICAgPHYtZ3JhcGgtbm9kZS1wYXJhbSAke3Bpbi5oaWRlUGluID8gJ2hpZGRlbicgOiAnJ30gc3R5bGU9XCIke2NvbG9yfVwiIGNsYXNzPVwicG9pbnRcIiBkaXJlY3Rpb249XCJpbnB1dFwiIG5hbWU9XCIke3Bpbi50YWd9XCIgdHlwZT1cIiR7dHlwZX1cIiByb2xlPVwibGVmdFwiPjwvdi1ncmFwaC1ub2RlLXBhcmFtPmA7XG5cbiAgICBjb25zdCAkcmVmTGlzdCA9ICRwaW4ucXVlcnlTZWxlY3RvckFsbCgnW3JlZl0nKTtcbiAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKCRyZWZMaXN0LCAoJHJlZikgPT4ge1xuICAgICAgICBjb25zdCByZWYgPSAkcmVmLmdldEF0dHJpYnV0ZSgncmVmJyk7XG4gICAgICAgIGlmIChyZWYpIHtcbiAgICAgICAgICAgIHBpbkkucmVmc1tyZWZdID0gJHJlZjtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgcGluRGF0YSA9IHBpbkRhdGFMaXN0W2luZGV4XTtcblxuICAgIHBpbkkuaW5pdChwaW5EYXRhLCBwaW4sIGJsb2NrTmFtZSwgaW5kZXgpO1xuICAgIHBpbkkuJHJvb3QgPSAkcGluO1xuICAgIHBpbkkub25Jbml0KCk7XG4gICAgcGluSS5vblVwZGF0ZSgpO1xuICAgIHJldHVybiAkcGluO1xufVxuXG4vKipcbiAqIOeUn+aIkCBwaW4g55qE5qC35byP5Luj56CBXG4gKiBAcGFyYW0gY29uZmlnXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVTdHlsZShibG9ja0Rlc2M6IElCbG9ja0Rlc2NyaXB0aW9uKSB7XG4gICAgcmV0dXJuIC8qY3NzKi9gXG4ucGluIHtcbiAgICAtLXBhcmFtLWNvbG9yOiAjZmZmO1xuICAgIC0tbGluZeKAlG1hcmdpbjogNnB4O1xuXG4gICAgbGluZS1oZWlnaHQ6IGNhbGModmFyKC0taGVhZGVyLWhlaWdodCkgLSA0cHgpO1xuICAgIG1hcmdpbjogdmFyKC0tbGluZeKAlG1hcmdpbikgMTBweCAwIDEwcHg7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuLnBpbjpsYXN0LWNoaWxkIHtcbiAgICBwYWRkaW5nLWJvdHRvbTogdmFyKC0tbGluZeKAlG1hcmdpbik7XG59XG4ucGluLmluIHtcblxufVxuLnBpbi5vdXQge1xuICAgIHRleHQtYWxpZ246IHJpZ2h0O1xufVxuLnBpbi5pbiA+IC5wb2ludFtoaWRkZW5dLCAucGluLm91dCA+IC5wb2ludFtoaWRkZW5dIHtcbiAgICBkaXNwbGF5OiBub25lO1xufVxuXG4ucGluLmluID4gLnBvaW50LCAucGluLm91dCA+IC5wb2ludCB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tcGFyYW0tY29sb3IpO1xuICAgIHRyYW5zZm9ybTogcm90YXRlKDQ1ZGVnKTtcbiAgICB3aWR0aDogN3B4O1xuICAgIGhlaWdodDogN3B4O1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDZweDtcbiAgICB0cmFuc2l0aW9uOiBhbGwgMC4ycztcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLWNvbG9yKTtcbiAgICB6LWluZGV4OiAxO1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbn1cbi5waW4uaW4gPiAucG9pbnQge1xuICAgIGxlZnQ6IC0xNHB4O1xufVxuLnBpbi5vdXQgPiAucG9pbnQge1xuICAgIHJpZ2h0OiAtMTRweDtcbn1cbi5waW4uaW4gPiAucG9pbnQ6aG92ZXIsXG4ucGluLmluID4gLnBvaW50W2FjdGl2ZV0sXG4ucGluLm91dCA+IC5wb2ludDpob3Zlcixcbi5waW4ub3V0ID4gLnBvaW50W2FjdGl2ZV1cbntcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1wYXJhbS1jb2xvcik7XG59XG5cbi5waW4gPiAuYm9keSB7XG4gICAgZGlzcGxheTogZmxleDtcbn1cbi5waW4gPiAuYm9keSA+IC5uYW1lIHtcbiAgICBmbGV4OiAxO1xuICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbn1cblxuLnBpbiA+IC5ib2R5ID4gLm5hbWUgPiAubmFtZSB7XG4gICAgcGFkZGluZzogMCA2cHg7XG59XG5cbi5waW4gPiAuYm9keSA+IC5zbG90LWNvbnRlbnQge1xuICAgIGZsZXg6IDE7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICB3aWR0aDogMTIwcHg7XG59XG5cbi5waW4gPiAuY2hpbGRyZW4sIC5waW4gPiAuY2hpbGRyZW4gPiBkaXYge1xuICAgIG1hcmdpbi10b3A6IGNhbGModmFyKC0tbGluZeKAlG1hcmdpbikgKiAwLjUpO1xufVxuXG4ucGluID4gLmJvZHkgPiAuc2xvdC1jb250ZW50W2hpZGRlbl0sIC5waW4gPiAuY2hpbGRyZW5baGlkZGVuXSB7XG4gICAgZGlzcGxheTogbm9uZTtcbn1cbiAgICBgO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjbGFyZVBpbihkZWZpbmU6IG5ldyguLi5hcmdzOiBhbnlbXSkgPT4gUGluKSB7XG4gICAgY29uc3QgdHlwZSA9IChkZWZpbmUgYXMgdW5rbm93biBhcyB0eXBlb2YgUGluKS50eXBlO1xuICAgIFRZUEVbdHlwZV0gPSBkZWZpbmU7XG59XG4iXX0=