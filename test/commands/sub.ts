/* eslint-disable no-console */

import util from 'util';
import { Command } from '../../src';

export default class SubCommand extends Command {
    constructor() {
        super('sub', {
            args: [
                {
                    id: 'thing'
                }
            ]
        });
    }

    exec(message, args) {
        message.channel.send(util.inspect(args, { depth: 1 }), { code: 'js' });
    }
}
