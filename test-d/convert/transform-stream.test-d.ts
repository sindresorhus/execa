import type {ReadableWritablePair} from 'node:stream/web';
import {expectType, expectError} from 'tsd';
import {execa} from '../../index.js';

const subprocess = execa('unicorns');

expectType<ReadableWritablePair>(subprocess.transformStream());

subprocess.transformStream({from: 'stdout'});
subprocess.transformStream({from: 'stderr'});
subprocess.transformStream({from: 'all'});
subprocess.transformStream({from: 'fd3'});
subprocess.transformStream({to: 'fd3'});
subprocess.transformStream({from: 'stdout', to: 'stdin'});
subprocess.transformStream({from: 'stdout', to: 'fd3'});
expectError(subprocess.transformStream({from: 'stdout' as string}));
expectError(subprocess.transformStream({to: 'fd3' as string}));
expectError(subprocess.transformStream({from: 'stdin'}));
expectError(subprocess.transformStream({from: 'stderr', to: 'stdout'}));
expectError(subprocess.transformStream({from: 'fd'}));
expectError(subprocess.transformStream({from: 'fdNotANumber'}));
expectError(subprocess.transformStream({to: 'fd'}));
expectError(subprocess.transformStream({to: 'fdNotANumber'}));

subprocess.transformStream({binary: false});
expectError(subprocess.transformStream({binary: 'false'}));

subprocess.transformStream({preserveNewlines: false});
expectError(subprocess.transformStream({preserveNewlines: 'false'}));

expectError(subprocess.transformStream('stdout'));
expectError(subprocess.transformStream({other: 'stdout'}));
