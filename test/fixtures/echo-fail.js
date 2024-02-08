#!/usr/bin/env node
import process from 'node:process';
import {writeSync} from 'node:fs';

console.log('stdout');
console.error('stderr');
writeSync(3, 'fd3');
process.exitCode = 1;
