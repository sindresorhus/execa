#!/usr/bin/env node
import {getCancelSignal, sendMessage} from 'execa';
import {foobarString} from '../helpers/input.js';

await getCancelSignal();
await sendMessage(foobarString);
