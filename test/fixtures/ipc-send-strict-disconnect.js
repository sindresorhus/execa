#!/usr/bin/env node
import process from 'node:process';
import {sendMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

// The acknowledgment cannot be received anymore
const sendPromise = sendMessage(foobarString, {strict: true});
process.disconnect();
try {
	await sendPromise;
} catch {}
