#!/usr/bin/env node
import {getCancelSignal} from 'execa';

const cancelSignal = await getCancelSignal();
cancelSignal.addEventListener('abort', () => {});
