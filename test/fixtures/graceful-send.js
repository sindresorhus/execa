#!/usr/bin/env node
import {getCancelSignal, sendMessage} from 'execa';
import {onAbortedSignal} from '../helpers/graceful.js';

const cancelSignal = await getCancelSignal();
await onAbortedSignal(cancelSignal);
await sendMessage(cancelSignal.reason);
