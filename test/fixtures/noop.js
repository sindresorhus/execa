#!/usr/bin/env node
import process from 'node:process';
import {foobarString} from '../helpers/input.js';

const bytes = process.argv[2] || foobarString;
console.log(bytes);
