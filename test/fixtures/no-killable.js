#!/usr/bin/env node
import process from 'node:process';
import {sendMessage} from '../../index.js';

const noop = () => {};

process.on('SIGTERM', noop);
process.on('SIGINT', noop);

await sendMessage('');
console.log('.');

setTimeout(noop, 1e8);
