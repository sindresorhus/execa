#!/usr/bin/env node
import process from 'node:process';

process.on('message', message => {
	if (message === 'ping') {
		process.send('pong');
	} else {
		throw new Error('Receive wrong message');
	}
});

process.send('');
