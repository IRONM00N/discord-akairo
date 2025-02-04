import AkairoError from './AkairoError';

/** @internal */
export function isPromise<T>(value: T | Promise<T>): value is Promise<T>{
    return value
    && typeof value.then === 'function'
    && typeof value.catch === 'function';
}

/** @internal */
export function isEventEmitter(value) {
    return value
    && typeof value.on === 'function'
    && typeof value.emit === 'function';
}

/** @internal */
export function prefixCompare(aKey, bKey) {
    if (aKey === '' && bKey === '') return 0;
    if (aKey === '') return 1;
    if (bKey === '') return -1;
    if (typeof aKey === 'function' && typeof bKey === 'function') return 0;
    if (typeof aKey === 'function') return 1;
    if (typeof bKey === 'function') return -1;
    return aKey.length === bKey.length
        ? aKey.localeCompare(bKey)
        : bKey.length - aKey.length;
}

/** @internal */
export function intoArray(x) {
    if (Array.isArray(x)) {
        return x;
    }

    return [x];
}

/** @internal */
export function intoCallable(thing) {
    if (typeof thing === 'function') {
        return thing;
    }

    return () => thing;
}

/** @internal */
export function flatMap(xs, f) {
    const res = [];
    for (const x of xs) {
        res.push(...f(x));
    }

    return res;
}

/** @internal */
export function deepAssign(o1, ...os) {
    for (const o of os) {
        for (const [k, v] of Object.entries(o)) {
            const vIsObject = v && typeof v === 'object';
            const o1kIsObject = Object.prototype.hasOwnProperty.call(o1, k) && o1[k] && typeof o1[k] === 'object';
            if (vIsObject && o1kIsObject) {
                deepAssign(o1[k], v);
            } else {
                o1[k] = v;
            }
        }
    }

    return o1;
}

/** @internal */
export function choice(...xs) {
    for (const x of xs) {
        if (x != null) {
            return x;
        }
    }

    return null;
}

/** @internal */
export function patchAbstract(Class: Function, method: string): void {
    Object.defineProperty(Class.prototype, method, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function () {
            throw new AkairoError("NOT_IMPLEMENTED", this.constructor.name, method);
        }
    });
}
