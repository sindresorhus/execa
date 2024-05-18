#!/usr/bin/env node
import process from 'node:process';
import {sendMessage, getOneMessage} from '../../index.js';

await sendMessage(await getOneMessage());
process.exitCode = 1;
