import {Readable, Writable} from 'node:stream';
import {expectError, expectAssignable, expectNotAssignable} from 'tsd';
import {execa, execaSync, type StdioOption, type StdioOptionSync} from '../../index.js';

await execa('unicorns', {stdio: [new Readable(), 'pipe', 'pipe']});
execaSync('unicorns', {stdio: [new Readable(), 'pipe', 'pipe']});
await execa('unicorns', {stdio: [[new Readable()], ['pipe'], ['pipe']]});
expectError(execaSync('unicorns', {stdio: [[new Readable()], ['pipe'], ['pipe']]}));
await execa('unicorns', {stdio: ['pipe', new Writable(), 'pipe']});
execaSync('unicorns', {stdio: ['pipe', new Writable(), 'pipe']});
await execa('unicorns', {stdio: [['pipe'], [new Writable()], ['pipe']]});
expectError(execaSync('unicorns', {stdio: [['pipe'], [new Writable()], ['pipe']]}));
await execa('unicorns', {stdio: ['pipe', 'pipe', new Writable()]});
execaSync('unicorns', {stdio: ['pipe', 'pipe', new Writable()]});
await execa('unicorns', {stdio: [['pipe'], ['pipe'], [new Writable()]]});
expectError(execaSync('unicorns', {stdio: [['pipe'], ['pipe'], [new Writable()]]}));

expectError(await execa('unicorns', {stdio: [new Writable(), 'pipe', 'pipe']}));
expectError(execaSync('unicorns', {stdio: [new Writable(), 'pipe', 'pipe']}));
expectError(await execa('unicorns', {stdio: [[new Writable()], ['pipe'], ['pipe']]}));
expectError(execaSync('unicorns', {stdio: [[new Writable()], ['pipe'], ['pipe']]}));
expectError(await execa('unicorns', {stdio: ['pipe', new Readable(), 'pipe']}));
expectError(execaSync('unicorns', {stdio: ['pipe', new Readable(), 'pipe']}));
expectError(await execa('unicorns', {stdio: [['pipe'], [new Readable()], ['pipe']]}));
expectError(execaSync('unicorns', {stdio: [['pipe'], [new Readable()], ['pipe']]}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', new Readable()]}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', new Readable()]}));
expectError(await execa('unicorns', {stdio: [['pipe'], ['pipe'], [new Readable()]]}));
expectError(execaSync('unicorns', {stdio: [['pipe'], ['pipe'], [new Readable()]]}));

expectAssignable<StdioOption>([new Uint8Array(), new Uint8Array()]);
expectAssignable<StdioOptionSync>([new Uint8Array(), new Uint8Array()]);
expectNotAssignable<StdioOption>([new Writable(), new Uint8Array()]);
expectNotAssignable<StdioOptionSync>([new Writable(), new Uint8Array()]);
