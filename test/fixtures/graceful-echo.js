#!/usr/bin/env node
import {getCancelSignal, sendMessage, getOneMessage} from 'execa';

await getCancelSignal();
await sendMessage(await getOneMessage());
