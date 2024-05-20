#!/usr/bin/env node
import {exchangeMessage, getOneMessage} from '../../index.js';

const [message] = await getOneMessage();
await exchangeMessage(message);
