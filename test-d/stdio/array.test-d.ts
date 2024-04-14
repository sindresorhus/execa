import {expectError} from 'tsd';
import {execa, execaSync} from '../../index.js';

expectError(await execa('unicorns', {stdio: []}));
expectError(execaSync('unicorns', {stdio: []}));
expectError(await execa('unicorns', {stdio: ['pipe']}));
expectError(execaSync('unicorns', {stdio: ['pipe']}));
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe']}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe']}));

await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe', 'pipe']});
execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe', 'pipe']});
expectError(await execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe', 'unknown']}));
expectError(execaSync('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe', 'unknown']}));
