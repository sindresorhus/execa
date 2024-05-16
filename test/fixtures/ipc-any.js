#!/usr/bin/env node
import process from 'node:process';
import * as execaExports from '../../index.js';

const methodName = process.argv[2];
await execaExports[methodName]();
