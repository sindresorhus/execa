#!/usr/bin/env node
import {sendMessage} from '../../index.js';
import {foobarString} from '../helpers/input.js';

// This has the same shape as the message Execa sends internally to apply `gracefulCancel`.
// Since it is sent by the subprocess, it is a user message, not an Execa one.
await sendMessage({type: 'execa:ipc:cancel', message: foobarString});
