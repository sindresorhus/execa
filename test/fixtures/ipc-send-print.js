#!/usr/bin/env node
import process from 'node:process';
import {sendMessage, getOneMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

const promise = getOneMessage();
await sendMessage(foobarString);

process.stdout.write('.');

await promise;
