#!/usr/bin/env node
import process from 'node:process';
import {once} from 'node:events';
import {onAbortedSignal} from '../helpers/graceful.js';
import {getCancelSignal} from 'execa';

// Unlike `graceful-print.js`, Execa is imported before the parent process disconnects
process.send('.');
await once(process, 'disconnect');
const cancelSignal = await getCancelSignal();
await onAbortedSignal(cancelSignal);
console.log(cancelSignal.reason);
