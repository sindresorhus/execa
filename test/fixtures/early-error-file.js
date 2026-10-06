#!/usr/bin/env node
import process from 'node:process';
import {execa} from '../../index.js';
import {earlyErrorOptions} from '../helpers/early-error.js';

// The file cannot be opened, since its directory does not exist
const {code} = await execa('empty.js', {...earlyErrorOptions, [process.argv[2]]: {file: '/nonexistent-directory-for-execa/file'}, reject: false});
console.log(code);
