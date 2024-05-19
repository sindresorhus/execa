#!/usr/bin/env node
import process from 'node:process';

process.send('.');

process.once('disconnect', () => {
	console.log('.');
});
