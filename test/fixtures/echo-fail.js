#!/usr/bin/env node
import process from 'node:process';

console.log('stdout');
console.error('stderr');
process.exit(1);
