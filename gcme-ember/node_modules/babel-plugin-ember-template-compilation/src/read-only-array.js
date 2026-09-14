"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readOnlyArray = readOnlyArray;
const mutationMethods = [
    'copyWithin',
    'fill',
    'pop',
    'push',
    'reverse',
    'shift',
    'sort',
    'splice',
    'unshift',
];
function readOnlyArray(array, message = 'Forbidden array mutation') {
    return new Proxy(array, {
        get(target, prop) {
            if (typeof prop === 'string' && mutationMethods.includes(prop)) {
                return () => {
                    throw new Error(message);
                };
            }
            return Reflect.get(target, prop);
        },
        set(_target, _prop) {
            throw new Error(message);
        },
        deleteProperty() {
            throw new Error(message);
        },
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhZC1vbmx5LWFycmF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVhZC1vbmx5LWFycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBWUEsc0NBaUJDO0FBN0JELE1BQU0sZUFBZSxHQUFHO0lBQ3RCLFlBQVk7SUFDWixNQUFNO0lBQ04sS0FBSztJQUNMLE1BQU07SUFDTixTQUFTO0lBQ1QsT0FBTztJQUNQLE1BQU07SUFDTixRQUFRO0lBQ1IsU0FBUztDQUNWLENBQUM7QUFFRixTQUFnQixhQUFhLENBQUksS0FBVSxFQUFFLE9BQU8sR0FBRywwQkFBMEI7SUFDL0UsT0FBTyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7UUFDdEIsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJO1lBQ2QsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMvRCxPQUFPLEdBQUcsRUFBRTtvQkFDVixNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMzQixDQUFDLENBQUM7WUFDSixDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBQ0QsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLO1lBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUNELGNBQWM7WUFDWixNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNCLENBQUM7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgbXV0YXRpb25NZXRob2RzID0gW1xuICAnY29weVdpdGhpbicsXG4gICdmaWxsJyxcbiAgJ3BvcCcsXG4gICdwdXNoJyxcbiAgJ3JldmVyc2UnLFxuICAnc2hpZnQnLFxuICAnc29ydCcsXG4gICdzcGxpY2UnLFxuICAndW5zaGlmdCcsXG5dO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVhZE9ubHlBcnJheTxUPihhcnJheTogVFtdLCBtZXNzYWdlID0gJ0ZvcmJpZGRlbiBhcnJheSBtdXRhdGlvbicpIHtcbiAgcmV0dXJuIG5ldyBQcm94eShhcnJheSwge1xuICAgIGdldCh0YXJnZXQsIHByb3ApIHtcbiAgICAgIGlmICh0eXBlb2YgcHJvcCA9PT0gJ3N0cmluZycgJiYgbXV0YXRpb25NZXRob2RzLmluY2x1ZGVzKHByb3ApKSB7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIFJlZmxlY3QuZ2V0KHRhcmdldCwgcHJvcCk7XG4gICAgfSxcbiAgICBzZXQoX3RhcmdldCwgX3Byb3ApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICB9LFxuICAgIGRlbGV0ZVByb3BlcnR5KCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIH0sXG4gIH0pO1xufVxuIl19