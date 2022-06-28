import { Command } from '../../src';

export default class AyyCommand extends Command {
    constructor() {
        super('ayy', {
            regex: /^ayy+$/i
        });
    }

    exec(message) {
        return message.reply('lmao');
    }
}
