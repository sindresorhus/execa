#!/usr/bin/env node
import {$} from '../../index.js';
import {FIXTURES_DIRECTORY} from '../helpers/fixtures-directory.js';

await $({stdout: 'inherit'})`node ${`${FIXTURES_DIRECTORY}/stdin.js`}`;
