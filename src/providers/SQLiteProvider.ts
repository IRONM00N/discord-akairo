import Provider, { ProviderOptions } from './Provider';
// @ts-ignore
import type { Database, ISqlite } from 'sqlite';
// @ts-ignore
import type { Statement } from 'sqlite3';

/**
 * Provider using the `sqlite` library.
 * @extends {Provider}
 */
export default class SQLiteProvider extends Provider {
    /**
     * SQLite database.
     * @type {Database}
     */
    public db: Database;

    /**
     * Name of the table.
     * @type {string}
     */
    public tableName: string;

    /**
     * Column for ID.
     * @type {string}
     */
    public idColumn: string;

    /**
     * Column for JSON data.
     * @type {?string}
     */
    public dataColumn?: string

    /**
     * @param {Database|Promise<Database>} db - SQLite database from `sqlite`.
     * @param {string} tableName - Name of table to handle.
     * @param {ProviderOptions} [options={}] - Options to use.
     */
    constructor(db: Promise<Database>|Database, tableName: string, options: ProviderOptions = {}) {
        const { idColumn = 'id', dataColumn } = options;
        super();

        this.db = <Database>db; // awaited in init()
        this.tableName = tableName;
        this.idColumn = idColumn;
        this.dataColumn = dataColumn;
    }

    /**
     * Initializes the provider.
     * @returns {Promise<void>}
     */
    public async init(): Promise<void> {
        const db = await this.db;
        this.db = db;

        const rows = await this.db.all(`SELECT * FROM ${this.tableName}`);
        for (const row of rows) {
            this.items.set(row[this.idColumn], this.dataColumn ? JSON.parse(row[this.dataColumn]) : row);
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
     * @returns {Promise<Statement>}
     */
    public set(id: string, key: string, value: any): Promise<ISqlite.RunResult<Statement>> {
        const data = this.items.get(id) || {};
        const exists = this.items.has(id);

        data[key] = value;
        this.items.set(id, data);

        if (this.dataColumn) {
            return this.db.run(exists
                ? `UPDATE ${this.tableName} SET ${this.dataColumn} = $value WHERE ${this.idColumn} = $id`
                : `INSERT INTO ${this.tableName} (${this.idColumn}, ${this.dataColumn}) VALUES ($id, $value)`, {
                $id: id,
                $value: JSON.stringify(data)
            });
        }

        return this.db.run(exists
            ? `UPDATE ${this.tableName} SET ${key} = $value WHERE ${this.idColumn} = $id`
            : `INSERT INTO ${this.tableName} (${this.idColumn}, ${key}) VALUES ($id, $value)`, {
            $id: id,
            $value: value
        });
    }

    /**
     * Deletes a value.
     * @param {string} id - ID of entry.
     * @param {string} key - The key to delete.
     * @returns {Promise<Statement>}
     */
    public delete(id: string, key: string): Promise<ISqlite.RunResult<Statement>> {
        const data = this.items.get(id) || {};
        delete data[key];

        if (this.dataColumn) {
            return this.db.run(`UPDATE ${this.tableName} SET ${this.dataColumn} = $value WHERE ${this.idColumn} = $id`, {
                $id: id,
                $value: JSON.stringify(data)
            });
        }

        return this.db.run(`UPDATE ${this.tableName} SET ${key} = $value WHERE ${this.idColumn} = $id`, {
            $id: id,
            $value: null
        });
    }

    /**
     * Clears an entry.
     * @param {string} id - ID of entry.
     * @returns {Promise<Statement>}
     */
    public clear(id: string): Promise<ISqlite.RunResult<Statement>> {
        this.items.delete(id);
        return this.db.run(`DELETE FROM ${this.tableName} WHERE ${this.idColumn} = $id`, { $id: id });
    }
}
