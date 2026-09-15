/// <reference types="ember__runloop" />
import { EmberRunTimer } from '@ember/runloop/types';
interface MapLike<K extends object, V> {
    delete(key: K): boolean;
    get(key: K): V;
    has(key: K): boolean;
    set(key: K, value: V): this;
}
type Destroyable = Record<string, any>;
type TaskOrName = Function | string;
type Token = string | number;
type Timer = EmberRunTimer | number;
type EmberRunQueues = 'sync' | 'actions' | 'routerTransitions' | 'render' | 'afterRender' | 'destroy';
interface TestTimeoutWithTimeout {
    timeout: number;
    scaling?: never;
}
interface TestTimeoutWithScaling {
    timeout?: never;
    scaling: number;
}
type TestTimeoutOptions = TestTimeoutWithTimeout | TestTimeoutWithScaling;
export { MapLike, Destroyable, TaskOrName, Token, Timer, EmberRunQueues, TestTimeoutWithTimeout, TestTimeoutWithScaling, TestTimeoutOptions };
