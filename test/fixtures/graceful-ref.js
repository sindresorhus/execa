#!/usr/bin/env node
import {once} from 'node:events';
import {getCancelSignal} from 'execa';

const cancelSignal = await getCancelSignal();
once(cancelSignal, 'abort');
