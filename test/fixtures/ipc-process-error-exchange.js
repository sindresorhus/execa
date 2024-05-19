#!/usr/bin/env node
import process from 'node:process';
import {exchangeMessage, sendMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';
import {alwaysPass} from '../helpers/ipc.js';

process.on('error', () => {});
const filter = process.argv[2] === 'true' ? alwaysPass : undefined;
const promise = exchangeMessage('.', {filter});
process.emit('error', new Error(foobarString));
await sendMessage(await promise);
