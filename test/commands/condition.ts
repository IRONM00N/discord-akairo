import { Command } from '../../src';

export default class ConditionalCommand extends Command {
    constructor() {
        super('condition');
    }

    condition(message) {
        return message.content === 'make me condition';
    }

    exec(message) {
        return message.util.reply('made you condition');
    }
}
