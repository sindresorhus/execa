#!/usr/bin/env node
import {sendMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

await sendMessage(foobarString);

setTimeout(() => {}, 1e8);
