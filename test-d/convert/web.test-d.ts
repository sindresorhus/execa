import {expectType, expectError} from 'tsd';
import {execa} from '../../index.js';

const subprocess = execa('unicorns');

expectType<ReadableStream>(subprocess.readableStream());
expectType<WritableStream>(subprocess.writableStream());
expectType<{readable: ReadableStream; writable: WritableStream}>(subprocess.transformStream());

subprocess.readableStream({from: 'stdout'});
subprocess.readableStream({from: 'stderr'});
subprocess.readableStream({from: 'all'});
subprocess.readableStream({from: 'fd3'});
expectError(subprocess.readableStream({from: 'stdin'}));
expectError(subprocess.readableStream({to: 'stdin'}));
subprocess.readableStream({binary: false});
expectError(subprocess.readableStream({binary: 'false'}));
subprocess.readableStream({preserveNewlines: false});
expectError(subprocess.readableStream({preserveNewlines: 'false'}));

subprocess.writableStream({to: 'stdin'});
subprocess.writableStream({to: 'fd3'});
expectError(subprocess.writableStream({to: 'stdout'}));
expectError(subprocess.writableStream({from: 'stdout'}));

subprocess.transformStream({from: 'stdout', to: 'stdin'});
subprocess.transformStream({from: 'stderr', to: 'fd3'});
expectError(subprocess.transformStream({from: 'stdin'}));
expectError(subprocess.transformStream({to: 'stdout'}));
expectError(subprocess.transformStream('stdout'));
