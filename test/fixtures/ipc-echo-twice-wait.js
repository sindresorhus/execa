#!/usr/bin/env node
import {setTimeout} from 'node:timers/promises';
import {sendMessage, getOneMessage} from '../../index.js';

const message = await getOneMessage();
await sendMessage(message);
const secondMessage = await getOneMessage();
await sendMessage(secondMessage);
await setTimeout(1e3);
await sendMessage('.');
