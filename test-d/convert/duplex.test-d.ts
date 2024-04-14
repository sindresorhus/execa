import type {Duplex} from 'node:stream';
import {expectType, expectError} from 'tsd';
import {execa} from '../../index.js';

const execaPromise = execa('unicorns');

expectType<Duplex>(execaPromise.duplex());

execaPromise.duplex({from: 'stdout'});
execaPromise.duplex({from: 'stderr'});
execaPromise.duplex({from: 'all'});
execaPromise.duplex({from: 'fd3'});
execaPromise.duplex({from: 'stdout', to: 'stdin'});
execaPromise.duplex({from: 'stdout', to: 'fd3'});
expectError(execaPromise.duplex({from: 'stdin'}));
expectError(execaPromise.duplex({from: 'stderr', to: 'stdout'}));
expectError(execaPromise.duplex({from: 'fd'}));
expectError(execaPromise.duplex({from: 'fdNotANumber'}));
expectError(execaPromise.duplex({to: 'fd'}));
expectError(execaPromise.duplex({to: 'fdNotANumber'}));

execaPromise.duplex({binary: false});
expectError(execaPromise.duplex({binary: 'false'}));

execaPromise.duplex({preserveNewlines: false});
expectError(execaPromise.duplex({preserveNewlines: 'false'}));

expectError(execaPromise.duplex('stdout'));
expectError(execaPromise.duplex({other: 'stdout'}));
