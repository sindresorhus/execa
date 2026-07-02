#!/usr/bin/env node
import {foobarString} from '../helpers/input.js';
import {getCancelSignal, sendMessage} from 'execa';

await getCancelSignal();
await sendMessage(foobarString);
