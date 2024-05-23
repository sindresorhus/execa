#!/usr/bin/env node
import process from 'node:process';
import {foobarString} from '../helpers/input.js';

process.send(foobarString, () => {
	console.log('.');
});
