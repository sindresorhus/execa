import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

const allResult = await execa('unicorns', {all: true});
expectTypeOf(allResult.all).toBe<string>();

const noAllResult = await execa('unicorns');
expectTypeOf(noAllResult.all).toBe<undefined>();

const allResultSync = execaSync('unicorns', {all: true});
expectTypeOf(allResultSync.all).toBe<string>();

const noAllResultSync = execaSync('unicorns');
expectTypeOf(noAllResultSync.all).toBe<undefined>();

const allError = new Error('.') as ExecaError<{all: true}>;
expectTypeOf(allError.all).toBe<string>();

const noAllError = new Error('.') as ExecaError<{}>;
expectTypeOf(noAllError.all).toBe<undefined>();

const allErrorSync = new Error('.') as ExecaError<{all: true}>;
expectTypeOf(allErrorSync.all).toBe<string>();

const noAllErrorSync = new Error('.') as ExecaSyncError<{}>;
expectTypeOf(noAllErrorSync.all).toBe<undefined>();
