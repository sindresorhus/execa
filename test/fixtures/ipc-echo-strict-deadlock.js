#!/usr/bin/env node
import {sendMessage, getOneMessage} from '../../index.js';

// The pattern recommended to avoid a deadlock, when the other process is not listening
const [message] = await Promise.all([
	getOneMessage(),
	sendMessage('.', {strict: true}),
]);
await sendMessage(message);
