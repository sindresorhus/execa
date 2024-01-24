#!/usr/bin/env node
import process from 'node:process';

const noop = () => {};

process.on('SIGTERM', noop);
process.on('SIGINT', noop);

process.send('');
console.log('.');

setTimeout(noop, 1e8);
