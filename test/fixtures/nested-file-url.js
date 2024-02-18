#!/usr/bin/env node
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import {execa} from '../../index.js';

const [options, file, arg] = process.argv.slice(2);
const parsedOptions = JSON.parse(options);
await execa(file, [arg], {...parsedOptions, stdout: pathToFileURL(parsedOptions.stdout)});
