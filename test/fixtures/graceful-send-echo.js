#!/usr/bin/env node
import {getCancelSignal, getOneMessage, sendMessage} from 'execa';
import {onAbortedSignal} from '../helpers/graceful.js';

const message = await getOneMessage();
const cancelSignal = await getCancelSignal();
await sendMessage(message);
await onAbortedSignal(cancelSignal);
await sendMessage(cancelSignal.reason);
