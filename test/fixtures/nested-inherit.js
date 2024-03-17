#!/usr/bin/env node
import {execa} from '../../index.js';
import {uppercaseGenerator} from '../helpers/generator.js';

await execa('noop-fd.js', ['1'], {stdout: ['inherit', uppercaseGenerator()]});
