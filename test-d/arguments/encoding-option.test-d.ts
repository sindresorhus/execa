import {expectError} from 'tsd';
import {execa, execaSync} from '../../index.js';

await execa('unicorns', {encoding: 'utf8'});
execaSync('unicorns', {encoding: 'utf8'});
/* eslint-disable unicorn/text-encoding-identifier-case */
expectError(await execa('unicorns', {encoding: 'utf-8'}));
expectError(execaSync('unicorns', {encoding: 'utf-8'}));
expectError(await execa('unicorns', {encoding: 'UTF8'}));
expectError(execaSync('unicorns', {encoding: 'UTF8'}));
/* eslint-enable unicorn/text-encoding-identifier-case */

await execa('unicorns', {encoding: 'utf16le'});
execaSync('unicorns', {encoding: 'utf16le'});
expectError(await execa('unicorns', {encoding: 'utf-16le'}));
expectError(execaSync('unicorns', {encoding: 'utf-16le'}));
expectError(await execa('unicorns', {encoding: 'ucs2'}));
expectError(execaSync('unicorns', {encoding: 'ucs2'}));
expectError(await execa('unicorns', {encoding: 'ucs-2'}));
expectError(execaSync('unicorns', {encoding: 'ucs-2'}));

await execa('unicorns', {encoding: 'buffer'});
execaSync('unicorns', {encoding: 'buffer'});
expectError(await execa('unicorns', {encoding: null}));
expectError(execaSync('unicorns', {encoding: null}));

await execa('unicorns', {encoding: 'hex'});
execaSync('unicorns', {encoding: 'hex'});

await execa('unicorns', {encoding: 'base64'});
execaSync('unicorns', {encoding: 'base64'});

await execa('unicorns', {encoding: 'base64url'});
execaSync('unicorns', {encoding: 'base64url'});

await execa('unicorns', {encoding: 'latin1'});
execaSync('unicorns', {encoding: 'latin1'});
expectError(await execa('unicorns', {encoding: 'binary'}));
expectError(execaSync('unicorns', {encoding: 'binary'}));

await execa('unicorns', {encoding: 'ascii'});
execaSync('unicorns', {encoding: 'ascii'});

expectError(await execa('unicorns', {encoding: 'utf8' as string}));
expectError(execaSync('unicorns', {encoding: 'utf8' as string}));

expectError(await execa('unicorns', {encoding: 'unknownEncoding'}));
expectError(execaSync('unicorns', {encoding: 'unknownEncoding'}));
