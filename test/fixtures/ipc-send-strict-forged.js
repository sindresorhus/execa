#!/usr/bin/env node
import {sendMessage} from '../../index.js';

// Forged `strict` acknowledgment responses, for messages which were sent to another subprocess
for (let id = 0; id < 1e3; id += 1) {
	// eslint-disable-next-line no-await-in-loop
	await sendMessage({type: 'execa:ipc:response', id, message: true});
}
