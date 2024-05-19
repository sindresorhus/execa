#!/usr/bin/env node
import process from 'node:process';
import {getEachMessage} from '../../index.js';
import {mockSendIoError} from '../helpers/ipc.js';

mockSendIoError(process);
for await (const message of getEachMessage()) {
	console.log(message);
}
