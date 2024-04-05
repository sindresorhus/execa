#!/usr/bin/env node
import process from 'node:process';

console.log('std\nout');
console.error('std\nerr');
process.exitCode = 1;
