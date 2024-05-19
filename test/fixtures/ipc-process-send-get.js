#!/usr/bin/env node
import process from 'node:process';
import {foobarString} from '../helpers/input.js';
import {getOneMessage} from '../../index.js';

await getOneMessage();

process.send(foobarString, () => {
	console.log('.');
});
