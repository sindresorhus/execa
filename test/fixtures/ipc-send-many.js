#!/usr/bin/env node
import {argv} from 'node:process';
import {sendMessage} from '../../index.js';

const count = Number(argv[2]);
await Promise.all(Array.from({length: count}, (_, index) => sendMessage(index)));
