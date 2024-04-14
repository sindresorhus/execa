import type {Writable} from 'node:stream';
import {expectType, expectError} from 'tsd';
import {execa} from '../../index.js';

const execaPromise = execa('unicorns');

expectType<Writable>(execaPromise.writable());

execaPromise.writable({to: 'stdin'});
execaPromise.writable({to: 'fd3'});
expectError(execaPromise.writable({to: 'stdout'}));
expectError(execaPromise.writable({to: 'fd'}));
expectError(execaPromise.writable({to: 'fdNotANumber'}));
expectError(execaPromise.writable({from: 'stdout'}));

expectError(execaPromise.writable({binary: false}));

expectError(execaPromise.writable({preserveNewlines: false}));

expectError(execaPromise.writable('stdin'));
expectError(execaPromise.writable({other: 'stdin'}));
