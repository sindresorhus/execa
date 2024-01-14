#!/usr/bin/env node
import process from 'node:process';

const text = process.argv[2] || 'foobar';
console.log(text);
console.error(text);
