import AkairoError from '../util/AkairoError';
import { AkairoHandlerEvents } from '../util/Constants';
import AkairoModule from './AkairoModule';
import Category from '../util/Category';
import { Collection } from 'discord.js';
import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';

/**
 * Base class for handling modules.
 * @param {AkairoClient} client - The Akairo client.
 * @param {AkairoHandlerOptions} options - Options for module loading and handling.
 * @extends {EventEmitter}
 */
export default abstract class AkairoHandler extends EventEmitter {
    /**
     * The Akairo client.
     * @type {AkairoClient}
     */
    public client: AkairoClient;

    /**
     * The main directory to modules.
     * @type {string}
     */
    public directory: string;

    /**
     * Class to handle.
     * @type {Function}
     */
    public classToHandle: Function;

    /**
     * File extensions to load.
     * @type {Set<string>}
     */
    public extensions: Set<string>;

    /**
     * Whether or not to automate category names.
     * @type {boolean}
     */
    public automateCategories: boolean;

    /**
     * Function that filters files when loading.
     * @type {LoadPredicate}
     */
    public loadFilter: LoadPredicate;

    /**
     * Modules loaded, mapped by ID to AkairoModule.
     * @type {Collection<string, AkairoModule>}
     */
    public modules: Collection<string, AkairoModule>;

    /**
     * Categories, mapped by ID to Category.
     * @type {Collection<string, Category>}
     */
    public categories: Collection<string, Category<string, AkairoModule>>;

    public constructor(client: AkairoClient, options: AkairoHandlerOptions) {
        const {
            directory,
            classToHandle = AkairoModule,
            extensions = ['.js', '.json', '.ts'],
            automateCategories = false,
            loadFilter = (() => true)
        } = options

        super();

        this.client = client;
        this.directory = directory;
        this.classToHandle = classToHandle;
        this.extensions = new Set(extensions);
        this.automateCategories = Boolean(automateCategories);
        this.loadFilter = loadFilter;
        this.modules = new Collection();
        this.categories = new Collection();
    }

    /**
     * Registers a module.
     * @param {AkairoModule} mod - Module to use.
     * @param {string} [filepath] - Filepath of module.
     * @returns {void}
     */
    public register(mod: AkairoModule, filepath?: string): void {
        mod.filepath = filepath;
        mod.client = this.client;
        mod.handler = this;
        this.modules.set(mod.id, mod);

        if (mod.categoryID === 'default' && this.automateCategories) {
            const dirs = path.dirname(filepath).split(path.sep);
            mod.categoryID = dirs[dirs.length - 1];
        }

        if (!this.categories.has(mod.categoryID)) {
            this.categories.set(mod.categoryID, new Category(mod.categoryID));
        }

        const category = this.categories.get(mod.categoryID);
        mod.category = category;
        category.set(mod.id, mod);
    }

    /**
     * Deregisters a module.
     * @param {AkairoModule} mod - Module to use.
     * @returns {void}
     */
    deregister(mod) {
        if (mod.filepath) delete require.cache[require.resolve(mod.filepath)];
        this.modules.delete(mod.id);
        mod.category.delete(mod.id);
    }

    /**
     * Loads a module, can be a module class or a filepath.
     * @param {string|Function} thing - Module class or path to module.
     * @param {boolean} [isReload=false] - Whether this is a reload or not.
     * @returns {AkairoModule}
     */
    load(thing, isReload = false) {
        const isClass = typeof thing === 'function';
        if (!isClass && !this.extensions.has(path.extname(thing))) return undefined;

        let mod = isClass
            ? thing
            : function findExport(m) {
                if (!m) return null;
                if (m.prototype instanceof this.classToHandle) return m;
                return m.default ? findExport.call(this, m.default) : null;
            }.call(this, require(thing));

        if (mod && mod.prototype instanceof this.classToHandle) {
            mod = new mod(this); // eslint-disable-line new-cap
        } else {
            if (!isClass) delete require.cache[require.resolve(thing)];
            return undefined;
        }

        if (this.modules.has(mod.id)) throw new AkairoError('ALREADY_LOADED', this.classToHandle.name, mod.id);

        this.register(mod, isClass ? null : thing);
        this.emit(AkairoHandlerEvents.LOAD, mod, isReload);
        return mod;
    }

    /**
     * Reads all modules from a directory and loads them.
     * @param {string} [directory] - Directory to load from.
     * Defaults to the directory passed in the constructor.
     * @param {LoadPredicate} [filter] - Filter for files, where true means it should be loaded.
     * Defaults to the filter passed in the constructor.
     * @returns {AkairoHandler}
     */
    loadAll(directory = this.directory, filter = this.loadFilter || (() => true)) {
        const filepaths = this.constructor.readdirRecursive(directory);
        for (let filepath of filepaths) {
            filepath = path.resolve(filepath);
            if (filter(filepath)) this.load(filepath);
        }

        return this;
    }

    /**
     * Removes a module.
     * @param {string} id - ID of the module.
     * @returns {AkairoModule}
     */
    remove(id) {
        const mod = this.modules.get(id.toString());
        if (!mod) throw new AkairoError('MODULE_NOT_FOUND', this.classToHandle.name, id);

        this.deregister(mod);

        this.emit(AkairoHandlerEvents.REMOVE, mod);
        return mod;
    }

    /**
     * Removes all modules.
     * @returns {AkairoHandler}
     */
    removeAll() {
        for (const m of Array.from(this.modules.values())) {
            if (m.filepath) this.remove(m.id);
        }

        return this;
    }

    /**
     * Reloads a module.
     * @param {string} id - ID of the module.
     * @returns {AkairoModule}
     */
    public reload(id: string): AkairoModule {
        const mod = this.modules.get(id.toString());
        if (!mod) throw new AkairoError('MODULE_NOT_FOUND', this.classToHandle.name, id);
        if (!mod.filepath) throw new AkairoError('NOT_RELOADABLE', this.classToHandle.name, id);

        this.deregister(mod);

        const filepath = mod.filepath;
        const newMod = this.load(filepath, true);
        return newMod;
    }

    /**
     * Reloads all modules.
     * @returns {AkairoHandler}
     */
    public reloadAll(): this {
        for (const m of Array.from(this.modules.values())) {
            if (m.filepath) this.reload(m.id);
        }

        return this;
    }

    /**
     * Finds a category by name.
     * @param {string} name - Name to find with.
     * @returns {Category}
     */
    public findCategory(name: string): Category<string, AkairoModule> {
        return this.categories.find(category => {
            return category.id.toLowerCase() === name.toLowerCase();
        });
    }

    /**
     * Reads files recursively from a directory.
     * @param {string} directory - Directory to read.
     * @returns {string[]}
     */
    public static readdirRecursive(directory: string): string[] {
        const result: string[] = [];

        (function read(dir) {
            const files = fs.readdirSync(dir);

            for (const file of files) {
                const filepath = path.join(dir, file);

                if (fs.statSync(filepath).isDirectory()) {
                    read(filepath);
                } else {
                    result.push(filepath);
                }
            }
        }(directory));

        return result;
    }
}

/**
 * Emitted when a module is loaded.
 * @event AkairoHandler#load
 * @param {AkairoModule} mod - Module loaded.
 * @param {boolean} isReload - Whether or not this was a reload.
 */

/**
 * Emitted when a module is removed.
 * @event AkairoHandler#remove
 * @param {AkairoModule} mod - Module removed.
 */

/**
 * Options for module loading and handling.
 * @typedef {Object} AkairoHandlerOptions
 * @prop {string} [directory] - Directory to modules.
 * @prop {Function} [classToHandle=AkairoModule] - Only classes that extends this class can be handled.
 * @prop {string[]|Set<string>} [extensions] - File extensions to load.
 * By default this is .js, .json, and .ts files.
 * @prop {boolean} [automateCategories=false] - Whether or not to set each module's category to its parent directory name.
 * @prop {LoadPredicate} [loadFilter] - Filter for files to be loaded.
 * Can be set individually for each handler by overriding the `loadAll` method.
 */

/**
 * Function for filtering files when loading.
 * True means the file should be loaded.
 * @typedef {Function} LoadPredicate
 * @param {String} filepath - Filepath of file.
 * @returns {boolean}
*/
