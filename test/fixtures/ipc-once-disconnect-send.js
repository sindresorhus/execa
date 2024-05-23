#!/usr/bin/env node
import process from 'node:process';
import {sendMessage} from '../../index.js';

await sendMessage('.');

process.once('disconnect', () => {
	console.log('.');
});

process.send('.');
