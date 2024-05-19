#!/usr/bin/env node
import {setTimeout} from 'node:timers/promises';
import {sendMessage, getOneMessage} from '../../index.js';

await sendMessage('.', {strict: true});
await setTimeout(10);
await sendMessage(await getOneMessage());
