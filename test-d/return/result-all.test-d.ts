import {expectType} from 'tsd';
import {
	execa,
	execaSync,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

const allResult = await execa('unicorns', {all: true});
expectType<string>(allResult.all);

const noAllResult = await execa('unicorns');
expectType<undefined>(noAllResult.all);

const allResultSync = execaSync('unicorns', {all: true});
expectType<string>(allResultSync.all);

const noAllResultSync = execaSync('unicorns');
expectType<undefined>(noAllResultSync.all);

const allError = new Error('.') as ExecaError<{all: true}>;
expectType<string>(allError.all);

const noAllError = new Error('.') as ExecaError<{}>;
expectType<undefined>(noAllError.all);

const allErrorSync = new Error('.') as ExecaError<{all: true}>;
expectType<string>(allErrorSync.all);

const noAllErrorSync = new Error('.') as ExecaSyncError<{}>;
expectType<undefined>(noAllErrorSync.all);
