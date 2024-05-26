#!/usr/bin/env node
import process from 'node:process';
import {once} from 'node:events';
import {getCancelSignal, sendMessage} from 'execa';
import {onAbortedSignal} from '../helpers/graceful.js';

const cancelSignal = await getCancelSignal();
await onAbortedSignal(cancelSignal);
await Promise.all([
	once(process, 'disconnect'),
	sendMessage(cancelSignal.reason),
]);
