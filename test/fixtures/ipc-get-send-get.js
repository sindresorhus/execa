#!/usr/bin/env node
import {argv} from 'node:process';
import {sendMessage, getOneMessage} from '../../index.js';
import {isAlwaysTrue} from '../helpers/ipc.js';

const filter = argv[2] === 'true' ? isAlwaysTrue : undefined;

const message = await getOneMessage({filter});
await Promise.all([
	getOneMessage({filter}),
	sendMessage(message),
]);
