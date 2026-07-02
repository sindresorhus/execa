#!/usr/bin/env node
import {onAbortedSignal} from '../helpers/graceful.js';
import {getCancelSignal, sendMessage} from 'execa';

const cancelSignal = await getCancelSignal();
await sendMessage(cancelSignal.aborted);
await onAbortedSignal(cancelSignal);
console.log(cancelSignal.reason);
