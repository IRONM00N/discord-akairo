import Provider from './Provider';
// @ts-ignore
import type { Model } from 'mongoose'

/**
 * Provider using the `Mongoose` library.
 * @extends {Provider}
 */
export default class MongooseProvider extends Provider {
    /**
     * Mongoose model.
     * @type {Model}
     */
    public model: Model<any>;

    /**
     * @param {Model} model - A Mongoose model.
     */
    public constructor(model: Model<any>) {
        super();
        
        this.model = model;
    }

    /**
     * Initializes the provider.
     * @returns {Promise<void>}
     */
    public async init(): Promise<void> {
        const guilds = await this.model.find();
        for (const i in guilds) {
            const guild = guilds[i];
            this.items.set(guild.id, guild.settings);
        }
    }

    /**
     * Gets a value.
     * @param {string} id - guildID.
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
     * @param {string} id - guildID.
     * @param {string} key - The key to set.
     * @param {any} value - The value.
     * @returns {Promise<any>} - Mongoose query object|document
     */
    public async set(id: string, key: string, value: any): Promise<any> {
        const data = this.items.get(id) || {};
        data[key] = value;
        this.items.set(id, data);

        const doc = await this.getDocument(id);
        doc.settings[key] = value;
        doc.markModified('settings');
        return doc.save();
    }

    /**
     * Deletes a value.
     * @param {string} id - guildID.
     * @param {string} key - The key to delete.
     * @returns {Promise<any>} - Mongoose query object|document
     */
    public async delete(id: string, key: string): Promise<any> {
        const data = this.items.get(id) || {};
        delete data[key];

        const doc = await this.getDocument(id);
        delete doc.settings[key];
        doc.markModified('settings');
        return doc.save();
    }

    /**
     * Removes a document.
     * @param {string} id - GuildID.
     * @returns {Promise<void>}
     */
    public async clear(id: string): Promise<void> {
        this.items.delete(id);
        const doc = await this.getDocument(id);
        if (doc) await doc.remove();
    }

    /**
     * Gets a document by guildID.
     * @param {string} id - guildID.
     * @returns {Promise<any>} - Mongoose query object|document
     */
    public async getDocument(id: string): Promise<any> {
        const obj = await this.model.findOne({ id });
        if (!obj) {
            // eslint-disable-next-line new-cap
            const newDoc = await new this.model({ id, settings: {} }).save();
            return newDoc;
        }

        return obj;
    }
}
