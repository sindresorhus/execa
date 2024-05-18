#!/usr/bin/env node
import process from 'node:process';
import {sendMessage, getOneMessage} from '../../index.js';

const message = await getOneMessage();
await sendMessage(message);
await sendMessage(message);
process.exitCode = 1;
