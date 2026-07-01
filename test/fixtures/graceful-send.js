#!/usr/bin/env node
import {onAbortedSignal} from '../helpers/graceful.js';
import {getCancelSignal, sendMessage} from 'execa';

const cancelSignal = await getCancelSignal();
await onAbortedSignal(cancelSignal);
await sendMessage(cancelSignal.reason);
