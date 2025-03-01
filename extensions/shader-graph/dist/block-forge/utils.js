'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPin = exports.createBlock = exports.createGraph = exports.dispatch = exports.generatePin = exports.generateBlock = exports.generateGraph = exports.generateUUID = exports.completeBlockTarget = void 0;
/**
 * 补全 target 上的配置对象
 * 将 extend 里的属性补充到 target 上
 * @param target
 * @param extend
 */
function completeBlockTarget(target, extend) {
    target.feature = Object.assign(Object.create(extend.feature || {}), target.feature || {});
    target.style = Object.assign(Object.create(extend.style || {}), target.style || {});
}
exports.completeBlockTarget = completeBlockTarget;
function generateUUID() {
    return 't_' + Date.now() + (Math.random() + '').substring(10);
}
exports.generateUUID = generateUUID;
function generateGraph(type, name) {
    return {
        type,
        name: name || type,
        nodes: {},
        lines: {},
        graphs: {},
        details: {},
    };
}
exports.generateGraph = generateGraph;
function generateBlock(type) {
    return {
        type,
        position: { x: 0, y: 0 },
        details: {},
    };
}
exports.generateBlock = generateBlock;
function generatePin(type) {
    return {
        dataType: type,
        value: {},
        details: {},
    };
}
exports.generatePin = generatePin;
/**
 * 发送一个自定义消息
 * @param elem
 * @param eventName
 * @param options
 */
function dispatch(elem, eventName, options) {
    const targetOptions = {
        bubbles: true,
        cancelable: true,
    };
    if (options) {
        Object.assign(targetOptions, options);
    }
    const event = new CustomEvent(eventName, targetOptions);
    elem.dispatchEvent(event);
}
exports.dispatch = dispatch;
/**
 *
 */
function createGraph(forge, type) {
    // TODO
}
exports.createGraph = createGraph;
/**
 *
 */
function createBlock() {
    // TODO
}
exports.createBlock = createBlock;
/**
 *
 */
function createPin() {
    // TODO
}
exports.createPin = createPin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYmxvY2stZm9yZ2UvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFLYjs7Ozs7R0FLRztBQUNILFNBQWdCLG1CQUFtQixDQUFDLE1BQXlCLEVBQUUsTUFBeUI7SUFDcEYsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzFGLE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQztBQUN4RixDQUFDO0FBSEQsa0RBR0M7QUFFRCxTQUFnQixZQUFZO0lBQ3hCLE9BQU8sSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDbEUsQ0FBQztBQUZELG9DQUVDO0FBRUQsU0FBZ0IsYUFBYSxDQUFDLElBQVksRUFBRSxJQUFhO0lBQ3JELE9BQU87UUFDSCxJQUFJO1FBQ0osSUFBSSxFQUFFLElBQUksSUFBSSxJQUFJO1FBQ2xCLEtBQUssRUFBRSxFQUFFO1FBQ1QsS0FBSyxFQUFFLEVBQUU7UUFDVCxNQUFNLEVBQUUsRUFBRTtRQUNWLE9BQU8sRUFBRSxFQUFFO0tBQ2QsQ0FBQztBQUNOLENBQUM7QUFURCxzQ0FTQztBQUVELFNBQWdCLGFBQWEsQ0FBQyxJQUFZO0lBQ3RDLE9BQU87UUFDSCxJQUFJO1FBQ0osUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1FBQ3hCLE9BQU8sRUFBRSxFQUFFO0tBQ2QsQ0FBQztBQUNOLENBQUM7QUFORCxzQ0FNQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxJQUFZO0lBQ3BDLE9BQU87UUFDSCxRQUFRLEVBQUUsSUFBSTtRQUNkLEtBQUssRUFBRSxFQUFFO1FBQ1QsT0FBTyxFQUFFLEVBQUU7S0FDZCxDQUFDO0FBQ04sQ0FBQztBQU5ELGtDQU1DO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixRQUFRLENBQUksSUFBaUIsRUFBRSxTQUFpQixFQUFFLE9BQW1DO0lBQ2pHLE1BQU0sYUFBYSxHQUFHO1FBQ2xCLE9BQU8sRUFBRSxJQUFJO1FBQ2IsVUFBVSxFQUFFLElBQUk7S0FDbkIsQ0FBQztJQUNGLElBQUksT0FBTyxFQUFFO1FBQ1QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDekM7SUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLFdBQVcsQ0FBSSxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDM0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM5QixDQUFDO0FBVkQsNEJBVUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLFdBQVcsQ0FBQyxLQUFnQixFQUFFLElBQVk7SUFDdEQsT0FBTztBQUNYLENBQUM7QUFGRCxrQ0FFQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsV0FBVztJQUN2QixPQUFPO0FBQ1gsQ0FBQztBQUZELGtDQUVDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixTQUFTO0lBQ3JCLE9BQU87QUFDWCxDQUFDO0FBRkQsOEJBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB0eXBlIHsgSUJsb2NrRGVzY3JpcHRpb24sIEdyYXBoRGF0YSwgQmxvY2tEYXRhLCBQaW5EYXRhLCBGb3JnZURhdGEgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQgdHlwZSB7IEdyYXBoTm9kZUVsZW1lbnQgfSBmcm9tICdAaXRoYXJib3JzL3VpLWdyYXBoL2Rpc3QvZWxlbWVudC9ncmFwaC1ub2RlJztcblxuLyoqXG4gKiDooaXlhaggdGFyZ2V0IOS4iueahOmFjee9ruWvueixoVxuICog5bCGIGV4dGVuZCDph4znmoTlsZ7mgKfooaXlhYXliLAgdGFyZ2V0IOS4ilxuICogQHBhcmFtIHRhcmdldFxuICogQHBhcmFtIGV4dGVuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGxldGVCbG9ja1RhcmdldCh0YXJnZXQ6IElCbG9ja0Rlc2NyaXB0aW9uLCBleHRlbmQ6IElCbG9ja0Rlc2NyaXB0aW9uKSB7XG4gICAgdGFyZ2V0LmZlYXR1cmUgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUoZXh0ZW5kLmZlYXR1cmUgfHwge30pLCB0YXJnZXQuZmVhdHVyZSB8fCB7fSk7XG4gICAgdGFyZ2V0LnN0eWxlID0gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKGV4dGVuZC5zdHlsZSB8fCB7fSksIHRhcmdldC5zdHlsZSB8fCB7fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVVVSUQoKSB7XG4gICAgcmV0dXJuICd0XycgKyBEYXRlLm5vdygpICsgKE1hdGgucmFuZG9tKCkgKyAnJykuc3Vic3RyaW5nKDEwKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlR3JhcGgodHlwZTogc3RyaW5nLCBuYW1lPzogc3RyaW5nKTogR3JhcGhEYXRhIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBuYW1lOiBuYW1lIHx8IHR5cGUsXG4gICAgICAgIG5vZGVzOiB7fSxcbiAgICAgICAgbGluZXM6IHt9LFxuICAgICAgICBncmFwaHM6IHt9LFxuICAgICAgICBkZXRhaWxzOiB7fSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVCbG9jayh0eXBlOiBzdHJpbmcpOiBCbG9ja0RhdGEge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIHBvc2l0aW9uOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgZGV0YWlsczoge30sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlUGluKHR5cGU6IHN0cmluZyk6IFBpbkRhdGEge1xuICAgIHJldHVybiB7XG4gICAgICAgIGRhdGFUeXBlOiB0eXBlLFxuICAgICAgICB2YWx1ZToge30sXG4gICAgICAgIGRldGFpbHM6IHt9LFxuICAgIH07XG59XG5cbi8qKlxuICog5Y+R6YCB5LiA5Liq6Ieq5a6a5LmJ5raI5oGvXG4gKiBAcGFyYW0gZWxlbSBcbiAqIEBwYXJhbSBldmVudE5hbWUgXG4gKiBAcGFyYW0gb3B0aW9ucyBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc3BhdGNoPFQ+KGVsZW06IEhUTUxFbGVtZW50LCBldmVudE5hbWU6IHN0cmluZywgb3B0aW9ucz86IEV2ZW50SW5pdCAmIHsgZGV0YWlsOiBUIH0pIHtcbiAgICBjb25zdCB0YXJnZXRPcHRpb25zID0ge1xuICAgICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgIH07XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbih0YXJnZXRPcHRpb25zLCBvcHRpb25zKTtcbiAgICB9XG4gICAgY29uc3QgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQ8VD4oZXZlbnROYW1lLCB0YXJnZXRPcHRpb25zKTtcbiAgICBlbGVtLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufVxuXG4vKipcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVHcmFwaChmb3JnZTogRm9yZ2VEYXRhLCB0eXBlOiBzdHJpbmcpIHtcbiAgICAvLyBUT0RPXG59XG5cbi8qKlxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUJsb2NrKCkge1xuICAgIC8vIFRPRE9cbn1cblxuLyoqXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGluKCkge1xuICAgIC8vIFRPRE9cbn1cbiJdfQ==