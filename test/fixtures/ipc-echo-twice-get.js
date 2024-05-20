#!/usr/bin/env node
import {sendMessage, getOneMessage} from '../../index.js';

const message = await getOneMessage();
const [secondMessage] = await Promise.all([
	getOneMessage(),
	sendMessage(message),
]);
await sendMessage(await secondMessage);
