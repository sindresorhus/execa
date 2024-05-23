#!/usr/bin/env node
import process from 'node:process';
import {getOneMessage} from '../../index.js';

await getOneMessage();

process.once('disconnect', () => {
	console.log('.');
});

process.send('.');
