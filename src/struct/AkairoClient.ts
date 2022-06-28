import { Client, type UserResolvable, type Snowflake, type ClientOptions } from 'discord.js';
import ClientUtil from './ClientUtil';

/**
 * The Akairo framework client.
 * Creates the handlers and sets them up.
 * @param {AkairoOptions} [options={}] - Options for the client.
 * @param {ClientOptions} [clientOptions] - Options for Discord JS client.
 * If not specified, the previous options parameter is used instead.
 */
export default class AkairoClient extends Client {
    constructor(options: AkairoOptions = {}, clientOptions: ClientOptions) {
        super(clientOptions || options);

        const { ownerID = '' } = options;

        /**
         * The ID of the owner(s).
         * @type {Snowflake|Snowflake[]}
         */
        this.ownerID = ownerID;

        /**
         * Utility methods.
         * @type {ClientUtil}
         */
        this.util = new ClientUtil(this);
    }

    /**
     * Checks if a user is the owner of this bot.
     * @param {UserResolvable} user - User to check.
     * @returns {boolean}
     */
    public isOwner(user: UserResolvable): boolean {
        const id = this.users.resolveId(user);
        return Array.isArray(this.ownerID)
            ? this.ownerID.includes(id)
            : id === this.ownerID;
    }
}

/**
 * Options for the client.
 */
export interface AkairoOptions {
    /**
     * Discord ID of the client owner(s)
     * @default ''
     */
    ownerID?: Snowflake | Snowflake[];
}
