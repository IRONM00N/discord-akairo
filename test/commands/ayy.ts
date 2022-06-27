const { Command } = require('../../src');

class AyyCommand extends Command {
    constructor() {
        super('ayy', {
            regex: /^ayy+$/i
        });
    }

    exec(message) {
        return message.reply('lmao');
    }
}

module.exports = AyyCommand;
