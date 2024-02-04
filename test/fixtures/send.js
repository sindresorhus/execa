#!/usr/bin/env node
import process from 'node:process';

process.once('message', message => {
	console.log(message);
});

process.send('');
