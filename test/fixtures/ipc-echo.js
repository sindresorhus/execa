#!/usr/bin/env node
import process from 'node:process';

process.once('message', message => {
	process.send(message);
});
