import { Collection } from 'discord.js';
import { patchAbstract } from '../util/Util';

/**
 * A provider for key-value storage.
 * Must be implemented.
 */
export default abstract class Provider {
    /**
     * Cached entries.
     * @type {Collection<string, Object>}
     */
    public items: Collection<string, any>;

    public constructor() {
        this.items = new Collection();
    }

    /**
     * Initializes the provider.
     * @abstract
     * @returns {any}
     */
    public abstract init(): any;

    /**
     * Gets a value.
     * @abstract
     * @param {string} id - ID of entry.
     * @param {string} key - The key to get.
     * @param {any} [defaultValue] - Default value if not found or null.
     * @returns {any}
     */
    public abstract get(id: string, key: string, defaultValue?: any): any;

    /**
     * Sets a value.
     * @abstract
     * @param {string} id - ID of entry.
     * @param {string} key - The key to set.
     * @param {any} value - The value.
     * @returns {any}
     */
    public abstract set(id: string, key: string, value: any): any;

    /**
     * Deletes a value.
     * @abstract
     * @param {string} id - ID of entry.
     * @param {string} key - The key to delete.
     * @returns {any}
     */
    public abstract delete(id: string, key: string): any;

    /**
     * Clears an entry.
     * @abstract
     * @param {string} id - ID of entry.
     * @returns {any}
     */
    public abstract clear(id: string): any;
}

patchAbstract(Provider, 'init');
patchAbstract(Provider, 'get');
patchAbstract(Provider, 'set');
patchAbstract(Provider, 'delete');
patchAbstract(Provider, 'clear');

/**
 * Options to use for providers.
 */
export interface ProviderOptions {
    /**
     * Column for the unique key, defaults to 'id'.
     * @default 'id'
     */
    idColumn?: string

    /**
     * Column for JSON data.
     * If not provided, the provider will use all columns of the table.
     * If provided, only one column will be used, but it will be more flexible due to being parsed as JSON.
     * For Sequelize, note that the model has to specify the type of the column as JSON or JSONB.
     */
    dataColumn?: string
}
