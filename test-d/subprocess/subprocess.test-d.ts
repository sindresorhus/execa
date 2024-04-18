import {expectType, expectError} from 'tsd';
import {execa} from '../../index.js';

const execaPromise = execa('unicorns');

expectType<number | undefined>(execaPromise.pid);

expectType<boolean>(execa('unicorns').kill());
execa('unicorns').kill('SIGKILL');
execa('unicorns').kill(undefined);
execa('unicorns').kill(new Error('test'));
execa('unicorns').kill('SIGKILL', new Error('test'));
execa('unicorns').kill(undefined, new Error('test'));
expectError(execa('unicorns').kill(null));
expectError(execa('unicorns').kill(0n));
expectError(execa('unicorns').kill([new Error('test')]));
expectError(execa('unicorns').kill({message: 'test'}));
expectError(execa('unicorns').kill(undefined, {}));
expectError(execa('unicorns').kill('SIGKILL', {}));
expectError(execa('unicorns').kill(null, new Error('test')));

expectType<boolean>(execa('unicorns', {ipc: true}).send({}));
execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'ipc']}).send({});
execa('unicorns', {stdio: ['pipe', 'pipe', 'ipc', 'pipe']}).send({});
execa('unicorns', {ipc: true}).send('message');
execa('unicorns', {ipc: true}).send({}, undefined, {keepOpen: true});
expectError(execa('unicorns', {ipc: true}).send({}, true));
expectType<undefined>(execa('unicorns', {}).send);
expectType<undefined>(execa('unicorns', {ipc: false}).send);
expectType<undefined>(execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe']}).send);
