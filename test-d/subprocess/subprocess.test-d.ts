import {expectType, expectError, expectAssignable} from 'tsd';
import {execa, type Subprocess} from '../../index.js';

const subprocess = execa('unicorns');
expectAssignable<Subprocess>(subprocess);

expectType<number | undefined>(subprocess.pid);

expectType<boolean>(subprocess.kill());
subprocess.kill('SIGKILL');
subprocess.kill(undefined);
subprocess.kill(new Error('test'));
subprocess.kill('SIGKILL', new Error('test'));
subprocess.kill(undefined, new Error('test'));
expectError(subprocess.kill(null));
expectError(subprocess.kill(0n));
expectError(subprocess.kill('Sigkill'));
expectError(subprocess.kill('sigkill'));
expectError(subprocess.kill('SIGOTHER'));
expectError(subprocess.kill('SIGEMT'));
expectError(subprocess.kill('SIGCLD'));
expectError(subprocess.kill('SIGRT1'));
expectError(subprocess.kill([new Error('test')]));
expectError(subprocess.kill({message: 'test'}));
expectError(subprocess.kill(undefined, {}));
expectError(subprocess.kill('SIGKILL', {}));
expectError(subprocess.kill(null, new Error('test')));

const ipcSubprocess = execa('unicorns', {ipc: true});
expectAssignable<Subprocess>(subprocess);

expectType<boolean>(ipcSubprocess.send({}));
execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'ipc']}).send({});
execa('unicorns', {stdio: ['pipe', 'pipe', 'ipc', 'pipe']}).send({});
ipcSubprocess.send('message');
ipcSubprocess.send({}, undefined, {keepOpen: true});
expectError(ipcSubprocess.send({}, true));
expectType<undefined>(execa('unicorns', {}).send);
expectType<undefined>(execa('unicorns', {ipc: false}).send);
expectType<undefined>(execa('unicorns', {stdio: ['pipe', 'pipe', 'pipe', 'pipe']}).send);
