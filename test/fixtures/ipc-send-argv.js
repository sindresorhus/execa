#!/usr/bin/env node
import {argv} from 'node:process';
import {sendMessage} from '../../index.js';

const message = argv[2];
await sendMessage(message);
