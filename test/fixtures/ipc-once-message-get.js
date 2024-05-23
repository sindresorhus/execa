#!/usr/bin/env node
import process from 'node:process';
import {getOneMessage} from '../../index.js';

await getOneMessage();

process.once('message', message => {
	console.log(message);
});

process.send('.');
