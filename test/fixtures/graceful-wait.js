#!/usr/bin/env node
import {getCancelSignal} from 'execa';
import {onAbortedSignal} from '../helpers/graceful.js';

const cancelSignal = await getCancelSignal();
await onAbortedSignal(cancelSignal);
