#!/usr/bin/env node
import process from 'node:process';
import {getOneMessage} from '../../index.js';

const messagePromise = getOneMessage();
// Execa handles incoming messages on the next macrotask, so this disconnects before it does
process.once('message', () => {
	process.disconnect();
});
process.send('.');
console.log(JSON.stringify(await messagePromise));
