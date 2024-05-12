#!/usr/bin/env node
import {sendMessage, exchangeMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

await sendMessage(foobarString);
await exchangeMessage(foobarString);
