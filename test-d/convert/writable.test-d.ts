import type {Writable} from 'node:stream';
import {expectType, expectError} from 'tsd';
import {execa} from '../../index.js';

const subprocess = execa('unicorns');

expectType<Writable>(subprocess.writable());

subprocess.writable({to: 'stdin'});
subprocess.writable({to: 'fd3'});
expectError(subprocess.writable({to: 'stdout'}));
expectError(subprocess.writable({to: 'fd'}));
expectError(subprocess.writable({to: 'fdNotANumber'}));
expectError(subprocess.writable({from: 'stdout'}));

expectError(subprocess.writable({binary: false}));

expectError(subprocess.writable({preserveNewlines: false}));

expectError(subprocess.writable('stdin'));
expectError(subprocess.writable({other: 'stdin'}));
