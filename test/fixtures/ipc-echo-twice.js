#!/usr/bin/env node
import {sendMessage, getOneMessage} from '../../index.js';

await sendMessage(await getOneMessage());
await sendMessage(await getOneMessage());
