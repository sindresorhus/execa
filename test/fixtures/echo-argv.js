#!/usr/bin/env node
import process from 'node:process';

console.log(JSON.stringify(process.argv.slice(2)));
