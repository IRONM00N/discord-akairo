/* eslint-disable no-console */

import { Listener } from '../../src';

export default class MessageListener extends Listener {
    constructor() {
        super('message', {
            emitter: 'client',
            event: 'message',
            category: 'client'
        });
    }

    exec(msg) {
        console.log(msg.content);
    }
}
