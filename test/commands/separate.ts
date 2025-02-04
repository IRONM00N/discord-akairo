/* eslint-disable no-console */

import util from 'util';
import { Command } from '../../src';

export default class SeparateCommand extends Command {
    constructor() {
        super('separate', {
            aliases: ['separate', 'sep'],
            args: [
                {
                    id: 'integers',
                    match: 'separate',
                    type: 'integer',
                    prompt: {
                        start: 'Give me some integers!',
                        retry: (msg, { phrase }) => `"${phrase}" is not an integer, try again!`
                    }
                }
            ]
        });
    }

    exec(message, args) {
        message.channel.send(util.inspect(args, { depth: 1 }), { code: 'js' });
    }
}
