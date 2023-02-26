#!/usr/bin/env node
import {$} from '../../index.js';

const $$ = $({stdio: 'inherit'});
await $$`node -p "one"`;
await $$`node -p "two"`;
