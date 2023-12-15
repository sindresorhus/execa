#!/usr/bin/env node
import {$} from '../../index.js';

const $$ = $({stdio: 'inherit'});
await $$`node -e console.error("one")`;
await $$`node -e console.error("two")`;
