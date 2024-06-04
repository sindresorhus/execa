import type {Readable} from 'node:stream';
import {expectType, expectError} from 'tsd';
import {execa} from '../../index.js';

const subprocess = execa('unicorns');

expectType<Readable>(subprocess.readable());

subprocess.readable({from: 'stdout'});
subprocess.readable({from: 'stderr'});
subprocess.readable({from: 'all'});
subprocess.readable({from: 'fd3'});
expectError(subprocess.readable({from: 'fd3' as string}));
expectError(subprocess.readable({from: 'stdin'}));
expectError(subprocess.readable({from: 'fd'}));
expectError(subprocess.readable({from: 'fdNotANumber'}));
expectError(subprocess.readable({to: 'stdin'}));

subprocess.readable({binary: false});
expectError(subprocess.readable({binary: 'false'}));

subprocess.readable({preserveNewlines: false});
expectError(subprocess.readable({preserveNewlines: 'false'}));

expectError(subprocess.readable('stdout'));
expectError(subprocess.readable({other: 'stdout'}));
