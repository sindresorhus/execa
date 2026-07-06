import type {ReadableStream} from 'node:stream/web';
import {expectType, expectError} from 'tsd';
import {execa} from '../../index.js';

const subprocess = execa('unicorns');

expectType<ReadableStream>(subprocess.readableStream());

subprocess.readableStream({from: 'stdout'});
subprocess.readableStream({from: 'stderr'});
subprocess.readableStream({from: 'all'});
subprocess.readableStream({from: 'fd3'});
expectError(subprocess.readableStream({from: 'fd3' as string}));
expectError(subprocess.readableStream({from: 'stdin'}));
expectError(subprocess.readableStream({from: 'fd'}));
expectError(subprocess.readableStream({from: 'fdNotANumber'}));
expectError(subprocess.readableStream({to: 'stdin'}));

subprocess.readableStream({binary: false});
expectError(subprocess.readableStream({binary: 'false'}));

subprocess.readableStream({preserveNewlines: false});
expectError(subprocess.readableStream({preserveNewlines: 'false'}));

expectError(subprocess.readableStream('stdout'));
expectError(subprocess.readableStream({other: 'stdout'}));
