#!/usr/bin/env node
import {setTimeout} from 'node:timers/promises';
import {sendMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

await sendMessage(foobarString);
await setTimeout(100);
console.log('.');
