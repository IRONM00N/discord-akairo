/* eslint-disable no-console */

import util from 'util';
import { Command, Flag } from '../../src';

export default class FCommand extends Command {
    constructor() {
        super('f', {
            aliases: ['f'],
            args: [
                {
                    id: 'x',
                    type: (msg, phrase) => {
                        if (phrase.length > 10) {
                            return Flag.fail(phrase);
                        }

                        return phrase;
                    },
                    default: (msg, value) => {
                        console.log('failed', value);
                        return 1;
                    }
                }
            ]
        });
    }

    exec(message, args) {
        message.channel.send(util.inspect(args, { depth: 1 }), { code: 'js' });
    }
}
