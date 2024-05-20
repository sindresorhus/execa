#!/usr/bin/env node
import {sendMessage, getOneMessage} from '../../index.js';
import {alwaysPass} from '../helpers/ipc.js';

const message = await getOneMessage({filter: alwaysPass});
const [secondMessage] = await Promise.all([
	getOneMessage({filter: alwaysPass}),
	sendMessage(message),
]);
await sendMessage(secondMessage);
