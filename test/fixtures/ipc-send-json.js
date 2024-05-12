#!/usr/bin/env node
import {argv} from 'node:process';
import {sendMessage} from '../../index.js';

const message = JSON.parse(argv[2]);
await sendMessage(message);
