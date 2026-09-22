#!/usr/bin/env node
import {sendMessage} from '../../index.js';

// Malformed `strict` acknowledgment response, using an `Object.prototype` property as `id`
await sendMessage({type: 'execa:ipc:response', id: 'constructor', message: true});
