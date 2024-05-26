#!/usr/bin/env node
import {getCancelSignal, sendMessage} from 'execa';

const cancelSignal = await getCancelSignal();
await sendMessage(cancelSignal.aborted);
