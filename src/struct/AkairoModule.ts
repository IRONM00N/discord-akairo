import Category from '../util/Category';
import AkairoClient from './AkairoClient';
import AkairoHandler from './AkairoHandler';

/**
 * Base class for a module.
 */
export default abstract class AkairoModule {
    /**
     * ID of the module.
     * @type {string}
     */
    public id: string

    /**
     * ID of the category this belongs to.
     * @type {string}
     */
    public categoryID: string;

    /**
     * Category this belongs to.
     * @type {Category}
     */
    public category: Category<string, AkairoModule>;

    /**
     * The filepath.
     * @type {string}
     */
    public filepath: string;

    /**
     * The Akairo client.
     * @type {AkairoClient}
     */
    public client: AkairoClient;

    /**
     * The handler.
     * @type {AkairoHandler}
     */
    public handler: AkairoHandler;

    /**
     * @param {string} id - ID of module.
     * @param {AkairoModuleOptions} [options={}] - Options.
     */
    public constructor(id: string, options: AkairoModuleOptions = {}) {
        const { category = 'default' } = options;
        this.id = id;
        this.categoryID = category;
        this.category = null!;
        this.filepath = null!;
        this.client = null!;
        this.handler = null!;
    }

    /**
     * Reloads the module.
     * @returns {AkairoModule}
     */
    public reload(): this {
        return this.handler.reload(this.id);
    }

    /**
     * Removes the module.
     * @returns {AkairoModule}
     */
    public remove(): this {
        return this.handler.remove(this.id);
    }

    /**
     * Returns the ID.
     * @returns {string}
     */
    public toString(): string {
        return this.id;
    }
}


/**
 * Options for module
 */
export interface AkairoModuleOptions {
	/**
	 * Category ID for organization purposes.
	 * @default "default"
	 */
	category?: string;
};
