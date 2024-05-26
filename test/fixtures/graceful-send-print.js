#!/usr/bin/env node
import {getCancelSignal, sendMessage} from 'execa';
import {onAbortedSignal} from '../helpers/graceful.js';

const cancelSignal = await getCancelSignal();
await sendMessage(cancelSignal.aborted);
await onAbortedSignal(cancelSignal);
console.log(cancelSignal.reason);
