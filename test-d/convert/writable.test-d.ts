import type {Writable} from 'node:stream';
import {expectTypeOf, expectError} from 'nz';
import {execa} from '../../index.js';

const subprocess = execa('unicorns');

expectTypeOf(subprocess.writable()).toBe<Writable>();

subprocess.writable({to: 'stdin'});
subprocess.writable({to: 'fd3'});
expectError(subprocess.writable({to: 'fd3' as string}));
expectError(subprocess.writable({to: 'stdout'}));
expectError(subprocess.writable({to: 'fd'}));
expectError(subprocess.writable({to: 'fdNotANumber'}));
expectError(subprocess.writable({from: 'stdout'}));

expectError(subprocess.writable({binary: false}));

expectError(subprocess.writable({preserveNewlines: false}));

expectError(subprocess.writable('stdin'));
expectError(subprocess.writable({other: 'stdin'}));

const inputPipeSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe', input: true}]});
inputPipeSubprocess.writable({to: 'fd3'});
