import type {Duplex} from 'node:stream';
import {expectType, expectError} from 'tsd';
import {execa} from '../../index.js';

const subprocess = execa('unicorns');

expectType<Duplex>(subprocess.duplex());

subprocess.duplex({from: 'stdout'});
subprocess.duplex({from: 'stderr'});
subprocess.duplex({from: 'all'});
subprocess.duplex({from: 'fd3'});
subprocess.duplex({to: 'fd3'});
subprocess.duplex({from: 'stdout', to: 'stdin'});
subprocess.duplex({from: 'stdout', to: 'fd3'});
expectError(subprocess.duplex({from: 'stdout' as string}));
expectError(subprocess.duplex({to: 'fd3' as string}));
expectError(subprocess.duplex({from: 'stdin'}));
expectError(subprocess.duplex({from: 'stderr', to: 'stdout'}));
expectError(subprocess.duplex({from: 'fd'}));
expectError(subprocess.duplex({from: 'fdNotANumber'}));
expectError(subprocess.duplex({to: 'fd'}));
expectError(subprocess.duplex({to: 'fdNotANumber'}));

subprocess.duplex({binary: false});
expectError(subprocess.duplex({binary: 'false'}));

subprocess.duplex({preserveNewlines: false});
expectError(subprocess.duplex({preserveNewlines: 'false'}));

expectError(subprocess.duplex('stdout'));
expectError(subprocess.duplex({other: 'stdout'}));
