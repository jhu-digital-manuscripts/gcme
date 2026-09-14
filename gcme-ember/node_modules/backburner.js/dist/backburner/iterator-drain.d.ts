export interface Iterable {
    next: () => {
        done: boolean;
        value?: any;
    };
}
export default function (fn: () => Iterable): void;
