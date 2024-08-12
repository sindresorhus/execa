import process, {type env} from 'node:process';
import {expectType, expectAssignable} from 'tsd';
import {execa, type Options, type Result} from '../../index.js';

type NodeEnv = 'production' | 'development' | 'test';

// Libraries like Next.js or Remix do the following type augmentation.
// The following type tests ensure this works with Execa.
// See https://github.com/sindresorhus/execa/pull/1141 and https://github.com/sindresorhus/execa/issues/1132
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace NodeJS {
		// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
		interface ProcessEnv {
			readonly NODE_ENV: NodeEnv;
		}
	}
}

// The global types are impacted
expectType<NodeEnv>(process.env.NODE_ENV);
expectType<NodeEnv>('' as (typeof env)['NODE_ENV']);
expectType<NodeEnv>('' as NodeJS.ProcessEnv['NODE_ENV']);
expectType<NodeEnv>('' as globalThis.NodeJS.ProcessEnv['NODE_ENV']);

// But Execa's types are not impacted
expectType<string | undefined>('' as Exclude<Options['env'], undefined>['NODE_ENV']);
expectAssignable<Result>(await execa({env: {test: 'example'}})`unicorns`);
expectAssignable<Result>(await execa({env: {test: 'example'} as const})`unicorns`);
expectAssignable<Result>(await execa({env: {test: undefined}})`unicorns`);
expectAssignable<Result>(await execa({env: {test: undefined} as const})`unicorns`);
