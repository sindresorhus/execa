#!/usr/bin/env node
import process from 'node:process';

process.on('SIGTERM', () => {
	console.log('Received SIGTERM, but we ignore it');
});

process.send('');

setInterval(() => {
	// Run forever
}, 20_000);
