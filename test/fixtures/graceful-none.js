#!/usr/bin/env node
import {getCancelSignal} from 'execa';

await getCancelSignal();
