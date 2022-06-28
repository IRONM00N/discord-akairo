import type { Message, PermissionResolvable } from 'discord.js';
import { patchAbstract } from '../../util/Util';
import AkairoModule, { AkairoModuleOptions } from '../AkairoModule';
import Argument from './arguments/Argument';
import ArgumentRunner from './arguments/ArgumentRunner';
import ContentParser from './ContentParser';

/**
 * Represents a command.
 * @extends {AkairoModule}
 */
export default abstract class Command extends AkairoModule {
    /**
     * Command names.
     * @type {string[]}
     */
    public aliases: string[];

    /** @internal */
    private contentParser: ContentParser;

    /** @internal */
    private argumentRunner: ArgumentRunner;

    /** @internal */
    private argumentGenerator: ArgumentGenerator;

    /**
     * Usable only in this channel type.
     * @type {?string}
     */
    public channel: 'guild' | 'dm' | null;

    /**
     * Usable only by the client owner.
     * @type {boolean}
     */
    public ownerOnly: boolean;

    /**
     * Whether or not this command can be ran by an edit.
     * @type {boolean}
     */
    public editable: boolean;

    /**
     * Whether or not to type during command execution.
     * @type {boolean}
     */
    public typing: boolean;

    /**
     * Cooldown in milliseconds.
     * @type {?number}
     */
    public cooldown?: number;

    /**
     * Uses allowed before cooldown.
     * @type {number}
     */
    public ratelimit: number;

    /**
     * Default prompt options.
     * @type {DefaultArgumentOptions}
     */
    public argumentDefaults: DefaultArgumentOptions;

    /**
     * Description of the command.
     * @type {string|any}
     */
    public description: string | any;

    /**
     * Command prefix overwrite.
     * @type {?string|string[]|PrefixSupplier}
     */
    public prefix?: string | string[] | PrefixSupplier;

    /**
     * @param {string} id - Command ID.
     * @param {CommandOptions} [options={}] - Options for the command.
     */
    public constructor(id: string, options: CommandOptions = {}) {
        super(id, { category: options.category });

        const {
            aliases = [],
            args = this.args || [],
            quoted = true,
            separator,
            channel = null,
            ownerOnly = false,
            editable = true,
            typing = false,
            cooldown = null,
            ratelimit = 1,
            argumentDefaults = {},
            description = '',
            prefix = this.prefix,
            clientPermissions = this.clientPermissions,
            userPermissions = this.userPermissions,
            regex = this.regex,
            condition = this.condition || (() => false),
            before = this.before || (() => undefined),
            lock,
            ignoreCooldown,
            ignorePermissions,
            flags = [],
            optionFlags = []
        } = options;

        this.aliases = aliases;

        const { flagWords, optionFlagWords } = Array.isArray(args)
            ? ContentParser.getFlags(args)
            : { flagWords: flags, optionFlagWords: optionFlags };

        this.contentParser = new ContentParser({
            flagWords,
            optionFlagWords,
            quoted,
            separator
        });

        this.argumentRunner = new ArgumentRunner(this);
        this.argumentGenerator = Array.isArray(args)
            ? ArgumentRunner.fromArguments(args.map(arg => [arg.id, new Argument(this, arg)]))
            : args.bind(this);

        this.channel = channel;
        this.ownerOnly = Boolean(ownerOnly);
        this.editable = Boolean(editable);
        this.typing = Boolean(typing);
        this.cooldown = cooldown;
        this.ratelimit = ratelimit;
        this.argumentDefaults = argumentDefaults;
        this.description = Array.isArray(description) ? description.join('\n') : description;
        this.prefix = typeof prefix === 'function' ? prefix.bind(this) : prefix;

        /**
         * Permissions required to run command by the client.
         * @type {PermissionResolvable|PermissionResolvable[]|MissingPermissionSupplier}
         */
        this.clientPermissions = typeof clientPermissions === 'function' ? clientPermissions.bind(this) : clientPermissions;

        /**
         * Permissions required to run command by the user.
         * @type {PermissionResolvable|PermissionResolvable[]|MissingPermissionSupplier}
         */
        this.userPermissions = typeof userPermissions === 'function' ? userPermissions.bind(this) : userPermissions;

        /**
         * The regex trigger for this command.
         * @type {RegExp|RegexSupplier}
         */
        this.regex = typeof regex === 'function' ? regex.bind(this) : regex;

        /**
         * Checks if the command should be ran by using an arbitrary condition.
         * @method
         * @param {Message} message - Message being handled.
         * @returns {boolean}
         */
        this.condition = condition.bind(this);

        /**
         * Runs before argument parsing and execution.
         * @method
         * @param {Message} message - Message being handled.
         * @returns {any}
         */
        this.before = before.bind(this);

        /**
         * The key supplier for the locker.
         * @type {?KeySupplier}
         */
        this.lock = lock;

        if (typeof lock === 'string') {
            this.lock = {
                guild: message => message.guild && message.guild.id,
                channel: message => message.channel.id,
                user: message => message.author.id
            }[lock];
        }

        if (this.lock) {
            /**
             * Stores the current locks.
             * @type {?Set<string>}
             */
            this.locker = new Set();
        }

        /**
         * ID of user(s) to ignore cooldown or a function to ignore.
         * @type {?Snowflake|Snowflake[]|IgnoreCheckPredicate}
         */
        this.ignoreCooldown = typeof ignoreCooldown === 'function' ? ignoreCooldown.bind(this) : ignoreCooldown;

        /**
         * ID of user(s) to ignore `userPermissions` checks or a function to ignore.
         * @type {?Snowflake|Snowflake[]|IgnoreCheckPredicate}
         */
        this.ignorePermissions = typeof ignorePermissions === 'function' ? ignorePermissions.bind(this) : ignorePermissions;

        /**
         * The ID of this command.
         * @name Command#id
         * @type {string}
         */

        /**
         * The command handler.
         * @name Command#handler
         * @type {CommandHandler}
         */
    }

    /**
     * Executes the command.
     * @abstract
     * @param {Message} message - Message that triggered the command.
     * @param {any} args - Evaluated arguments.
     * @returns {any}
     */
    public abstract exec(message: Message, args: any): any;

    /**
     * Parses content using the command's arguments.
     * @param {Message} message - Message to use.
     * @param {string} content - String to parse.
     * @returns {Promise<Flag|any>}
     */
    public parse(message: Message, content: string): Promise<Flag | any> {
        const parsed = this.contentParser.parse(content);
        return this.argumentRunner.run(message, parsed, this.argumentGenerator);
    }
}

patchAbstract(Command, 'exec');

export default interface Command {
    before(message: Message): any;
    condition(message: Message): boolean;
    args(
        message: Message, 
        parsed: ContentParserResult, 
        state: ArgumentRunnerState
    ): Generator<
	    ArgumentOptions | Argument | Flag,
	    { [args: string]: any } | Flag,
	    Flag | any
    >;
}

export default interface Command {
    /**
     * Reloads the command.
     */
    reload(): this;

    /**
     * Removes the command.
     */
    remove(): this;
}

/** 
 * Options to use for command execution behavior.
 * Also includes properties from AkairoModuleOptions.
 */
export interface CommandOptions extends AkairoModuleOptions {
    /**
     * Command names.
     * @default []
     */
    aliases?: string[];

    /**
     * Argument options or generator.
     * @default []
     */
    args?: ArgumentOptions[] | ArgumentGenerator;

    /**
     * Whether or not to consider quotes.
     * @default true
     */
    quoted?: boolean;

    /**
     * Custom separator for argument input.
     */
    separator?: string;

    /**
     * Flags to use when using an ArgumentGenerator.
     * @default []
     */
    flags?: string[];

    /**
     * Option flags to use when using an ArgumentGenerator.
     * @default []
     */
    optionFlags?: string[];

    /**
     * Restricts channel to either 'guild' or 'dm'.
     */
    channel?: 'guild' | 'dm';

    /**
     * Whether or not to allow client owner(s) only.
     * @default false
     */
    ownerOnly?: boolean;

    /**
     * Whether or not to type in channel during execution.
     * @default false
     */
    typing?: boolean;

    /**
     * Whether or not message edits will run this command.
     * @default true
     */
    editable?: boolean;

    /**
     * The command cooldown in milliseconds.
     */
    cooldown?: number;

    /**
     * Amount of command uses allowed until cooldown.
     * @default 1
     */
    ratelimit?: number;

    /**
     * The prefix(es) to overwrite the global one for this command.
     */
    prefix?: string | string[] | PrefixSupplier;

    /**
     * Permissions required by the user to run this command.
     */
    userPermissions?: PermissionResolvable|PermissionResolvable[]|MissingPermissionSupplier;

    /**
     * Permissions required by the client to run this command.
     */
    clientPermissions?: PermissionResolvable|PermissionResolvable[]|MissingPermissionSupplier;

    /**
     * A regex to match in messages that are not directly commands.
     * The args object will have `match` and `matches` properties.
     */
    regex?: RegExp|RegexSupplier;

    /**
     * Whether or not to run on messages that are not directly commands.
     */
    condition?: ExecutionPredicate;

    /**
     * Function to run before argument parsing and execution.
     */
    before?: BeforeAction;

    /**
     * The key type or key generator for the locker. If lock is a string, it's expected one of 'guild', 'channel', or 'user'.
     */
    lock?: KeySupplier | 'guild' | 'channel' | 'user';
}

/**
 * @prop {Snowflake|Snowflake[]|IgnoreCheckPredicate} [ignoreCooldown] - ID of user(s) to ignore cooldown or a function to ignore.
 * @prop {Snowflake|Snowflake[]|IgnoreCheckPredicate} [ignorePermissions] - ID of user(s) to ignore `userPermissions` checks or a function to ignore.
 * @prop {DefaultArgumentOptions} [argumentDefaults] - The default argument options.
 * @prop {string} [description=''] - Description of the command.
 */

/**
 * A function to run before argument parsing and execution.
 * @typedef {Function} BeforeAction
 * @param {Message} message - Message that triggered the command.
 * @returns {any}
 */

/**
 * A function used to supply the key for the locker.
 * @typedef {Function} KeySupplier
 * @param {Message} message - Message that triggered the command.
 * @param {any} args - Evaluated arguments.
 * @returns {string}
 */

/**
 * A function used to check if the command should run arbitrarily.
 * @typedef {Function} ExecutionPredicate
 * @param {Message} message - Message to check.
 * @returns {boolean}
 */

/**
 * A function used to check if a message has permissions for the command.
 * A non-null return value signifies the reason for missing permissions.
 * @typedef {Function} MissingPermissionSupplier
 * @param {Message} message - Message that triggered the command.
 * @returns {any}
 */

/**
 * A function used to return a regular expression.
 * @typedef {Function} RegexSupplier
 * @param {Message} message - Message to get regex for.
 * @returns {RegExp}
 */

/**
 * Generator for arguments.
 * When yielding argument options, that argument is ran and the result of the processing is given.
 * The last value when the generator is done is the resulting `args` for the command's `exec`.
 * @typedef {GeneratorFunction} ArgumentGenerator
 * @param {Message} message - Message that triggered the command.
 * @param {ContentParserResult} parsed - Parsed content.
 * @param {ArgumentRunnerState} state - Argument processing state.
 * @returns {IterableIterator<ArgumentOptions|Flag>}
 */
