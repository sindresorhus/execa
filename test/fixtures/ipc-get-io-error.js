#!/usr/bin/env node
import process from 'node:process';
import {getOneMessage} from '../../index.js';
import {mockSendIoError} from '../helpers/ipc.js';

mockSendIoError(process);
console.log(await getOneMessage());
