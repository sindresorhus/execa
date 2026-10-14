#!/usr/bin/env node
import process from 'node:process';
import {$} from '../../index.js';
import {FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';

const execaMethod = process.argv[2] === 'sync' ? $.sync : $;
await execaMethod({stdin: undefined, stdout: 'inherit', timeout: 5000})`node ${`${FIXTURES_DIRECTORY}/stdin.js`}`;
