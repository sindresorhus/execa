#!/usr/bin/env node
import {sendMessage} from '../../index.js';
import {foobarArray} from '../helpers/input.js';

await sendMessage(foobarArray[0]);
await sendMessage(foobarArray[1]);
