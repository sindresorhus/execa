#!/usr/bin/env node
import {onAbortedSignal} from '../helpers/graceful.js';
import {getCancelSignal} from 'execa';

const cancelSignal = await getCancelSignal();
await onAbortedSignal(cancelSignal);
console.log(cancelSignal.reason);
