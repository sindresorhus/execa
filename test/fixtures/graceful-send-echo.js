#!/usr/bin/env node
import {onAbortedSignal} from '../helpers/graceful.js';
import {getCancelSignal, getOneMessage, sendMessage} from 'execa';

const message = await getOneMessage();
const cancelSignal = await getCancelSignal();
await sendMessage(message);
await onAbortedSignal(cancelSignal);
await sendMessage(cancelSignal.reason);
