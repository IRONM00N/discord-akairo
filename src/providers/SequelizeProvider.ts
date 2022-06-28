import Provider, { ProviderOptions } from './Provider';
// @ts-ignore
import type { Model, ModelStatic } from 'sequelize';

/**
 * Provider using the `sequelize` library.
 * @extends {Provider}
 */
export default class SequelizeProvider extends Provider {
    /**
     * Sequelize model.
     * @type {Model}
     */
    public table: ModelStatic<Model>;

    /**
     * Column for ID.
     * @type {string}
     */
    public idColumn: string;

    /**
     * Column for JSON data.
     * @type {?string}
     */
    public dataColumn?: string;

    /**
     * @param {ModelStatic<Model>} table - A Sequelize model.
     * @param {ProviderOptions} [options={}] - Options to use.     
     */
    public constructor(table: ModelStatic<Model>, options: ProviderOptions = {}) {
        const { idColumn = 'id', dataColumn } = options;
        super();

        this.table = table;
        this.idColumn = idColumn;
        this.dataColumn = dataColumn;
    }

    /**
     * Initializes the provider.
     * @returns {Promise<void>}
     */
    public async init(): Promise<void> {
        const rows = await this.table.findAll();
        for (const row of rows) {
            this.items.set(row[this.idColumn], this.dataColumn ? row[this.dataColumn] : row);
        }
    }

    /**
     * Gets a value.
     * @param {string} id - ID of entry.
     * @param {string} key - The key to get.
     * @param {any} [defaultValue] - Default value if not found or null.
     * @returns {any}
     */
    public get(id: string, key: string, defaultValue: any): any {
        if (this.items.has(id)) {
            const value = this.items.get(id)[key];
            return value == null ? defaultValue : value;
        }

        return defaultValue;
    }

    /**
     * Sets a value.
     * @param {string} id - ID of entry.
     * @param {string} key - The key to set.
     * @param {any} value - The value.
     * @returns {Promise<[Model, boolean | null]>}
     */
    public set(id: string, key: string, value: any): Promise<[Model, boolean | null]> {
        const data = this.items.get(id) || {};
        data[key] = value;
        this.items.set(id, data);

        if (this.dataColumn) {
            return this.table.upsert({
                [this.idColumn]: id,
                [this.dataColumn]: data
            });
        }

        return this.table.upsert({
            [this.idColumn]: id,
            [key]: value
        });
    }

    /**
     * Deletes a value.
     * @param {string} id - ID of entry.
     * @param {string} key - The key to delete.
     * @returns {Promise<[Model, boolean | null]>}
     */
    public delete(id: string, key: string): Promise<[Model, boolean | null]> {
        const data = this.items.get(id) || {};
        delete data[key];

        if (this.dataColumn) {
            return this.table.upsert({
                [this.idColumn]: id,
                [this.dataColumn]: data
            });
        }

        return this.table.upsert({
            [this.idColumn]: id,
            [key]: null
        });
    }

    /**
     * Clears an entry.
     * @param {string} id - ID of entry.
     * @returns {Promise<number>}
     */
    public clear(id: string): Promise<number> {
        this.items.delete(id);
        return this.table.destroy({ where: { [this.idColumn]: id } });
    }
}
