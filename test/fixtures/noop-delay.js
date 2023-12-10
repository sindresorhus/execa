#!/usr/bin/env node
import process from 'node:process';
import {setTimeout} from 'node:timers/promises';

console.log(process.argv[2]);
await setTimeout((Number(process.argv[3]) || 1) * 1e3);
