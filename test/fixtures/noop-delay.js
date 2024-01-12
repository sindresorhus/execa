#!/usr/bin/env node
import process from 'node:process';
import {writeSync} from 'node:fs';
import {setTimeout} from 'node:timers/promises';

writeSync(Number(process.argv[2]), 'foobar');
await setTimeout(100);
