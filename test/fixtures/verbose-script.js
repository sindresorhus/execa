#!/usr/bin/env node
import {$} from '../../index.js';

const $$ = $({stdio: 'inherit'});
await $$`node -e console.error(1)`;
await $$`node -e console.error(2)`;
