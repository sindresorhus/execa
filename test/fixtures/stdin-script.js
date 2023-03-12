#!/usr/bin/env node
import {$} from '../../index.js';
import {FIXTURES_DIR} from '../helpers/fixtures-dir.js';

await $({stdout: 'inherit'})`node ${`${FIXTURES_DIR}/stdin.js`}`;
