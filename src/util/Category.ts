import { Collection } from 'discord.js';
import AkairoModule from '../struct/AkairoModule';

/**
 * A group of modules.
 * @extends {Collection}
 */
export default class Category<K extends string, V extends AkairoModule> extends Collection<K, V> {
    /**
     * ID of the category.
     * @type {string}
     */
    public id: string;

    /**
     * @param {string} id - ID of the category.
     * @param {Iterable} [iterable] - Entries to set.
     */
    public constructor(id: string, iterable?: Iterable<[K, V][]>) {
        super(iterable);

        this.id = id;
    }

    /**
     * Calls `reload()` on all items in this category.
     * @returns {Category}
     */
    public reloadAll(): this {
        for (const m of Array.from(this.values())) {
            if (m.filepath) m.reload();
        }

        return this;
    }

    /**
     * Calls `remove()` on all items in this category.
     * @returns {Category}
     */
    public removeAll(): this {
        for (const m of Array.from(this.values())) {
            if (m.filepath) m.remove();
        }

        return this;
    }

    /**
     * Returns the ID.
     * @returns {string}
     */
    public toString(): string {
        return this.id;
    }
}
