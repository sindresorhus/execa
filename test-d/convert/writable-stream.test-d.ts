import type {WritableStream} from 'node:stream/web';
import {expectTypeOf, expectError} from 'nz';
import {execa} from '../../index.js';

const subprocess = execa('unicorns');

expectTypeOf(subprocess.writableStream()).toBe<WritableStream>();

subprocess.writableStream({to: 'stdin'});
subprocess.writableStream({to: 'fd3'});
expectError(subprocess.writableStream({to: 'fd3' as string}));
expectError(subprocess.writableStream({to: 'stdout'}));
expectError(subprocess.writableStream({to: 'fd'}));
expectError(subprocess.writableStream({to: 'fdNotANumber'}));
expectError(subprocess.writableStream({from: 'stdout'}));

expectError(subprocess.writableStream({binary: false}));

expectError(subprocess.writableStream({preserveNewlines: false}));

expectError(subprocess.writableStream('stdin'));
expectError(subprocess.writableStream({other: 'stdin'}));

const inputPipeSubprocess = execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', {value: 'pipe', input: true}]});
inputPipeSubprocess.writableStream({to: 'fd3'});
