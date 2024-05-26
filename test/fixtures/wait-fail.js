#!/usr/bin/env node
import process from 'node:process';
import {setTimeout} from 'node:timers/promises';

await setTimeout(1e3);
process.exitCode = 2;
