#!/usr/bin/env node
import process from 'node:process';
import {execa, sendMessage} from '../../index.js';

const cleanup = process.argv[2] === 'true';
const detached = process.argv[3] === 'true';
const subprocess = execa('forever.js', {cleanup, detached});
await sendMessage(subprocess.pid);
await subprocess;
