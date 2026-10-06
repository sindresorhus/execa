#!/usr/bin/env node
import {argv} from 'node:process';
import {sendMessage} from '../../index.js';

// Sends any JSON message, so tests can send messages which look like Execa's internal IPC messages
await sendMessage(JSON.parse(argv[2]));
