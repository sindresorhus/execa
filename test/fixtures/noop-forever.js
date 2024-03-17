#!/usr/bin/env node
import process from 'node:process';

const bytes = process.argv[2];
console.log(bytes);
setTimeout(() => {}, 1e8);
