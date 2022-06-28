/* eslint-disable no-console */

import util from 'util';
import { Argument, Command } from '../../src';
const { compose, range, union } = Argument;

export default class TestCommand extends Command {
    constructor() {
        super('test', {
            aliases: ['test', 'test-a'],
            cooldown: 5000,
            prefix: ['$', '%'],
            args: [
                {
                    id: 'x',
                    match: 'rest',
                    type: compose((m, s) => s.replace(/\s/g, ''), range(union('integer', 'emojint'), 0, 50))
                }
            ]
        });
    }

    exec(message, args) {
        message.channel.send(util.inspect(args, { depth: 1 }), { code: 'js' });
    }
}

