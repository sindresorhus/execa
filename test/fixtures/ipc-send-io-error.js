#!/usr/bin/env node
import process from 'node:process';
import {sendMessage} from '../../index.js';
import {mockSendIoError} from '../helpers/ipc.js';

mockSendIoError(process);
await sendMessage('.');
