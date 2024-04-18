import type {Readable} from 'node:stream';
import {expectType, expectError} from 'tsd';
import {execa} from '../../index.js';

const execaPromise = execa('unicorns');

expectType<Readable>(execaPromise.readable());

execaPromise.readable({from: 'stdout'});
execaPromise.readable({from: 'stderr'});
execaPromise.readable({from: 'all'});
execaPromise.readable({from: 'fd3'});
expectError(execaPromise.readable({from: 'stdin'}));
expectError(execaPromise.readable({from: 'fd'}));
expectError(execaPromise.readable({from: 'fdNotANumber'}));
expectError(execaPromise.readable({to: 'stdin'}));

execaPromise.readable({binary: false});
expectError(execaPromise.readable({binary: 'false'}));

execaPromise.readable({preserveNewlines: false});
expectError(execaPromise.readable({preserveNewlines: 'false'}));

expectError(execaPromise.readable('stdout'));
expectError(execaPromise.readable({other: 'stdout'}));
