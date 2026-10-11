import process, {type env} from 'node:process';
import {expectTypeOf} from 'nz';
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
expectTypeOf(process.env.NODE_ENV).toBe<NodeEnv>();
expectTypeOf('' as (typeof env)['NODE_ENV']).toBe<NodeEnv>();
expectTypeOf('' as NodeJS.ProcessEnv['NODE_ENV']).toBe<NodeEnv>();
expectTypeOf('' as globalThis.NodeJS.ProcessEnv['NODE_ENV']).toBe<NodeEnv>();

// But Execa's types are not impacted
expectTypeOf('' as Exclude<Options['env'], undefined>['NODE_ENV']).toBe<string | undefined>();
expectTypeOf(await execa({env: {test: 'example'}})`unicorns`).toBeAssignableTo<Result>();
expectTypeOf(await execa({env: {test: 'example'} as const})`unicorns`).toBeAssignableTo<Result>();
expectTypeOf(await execa({env: {test: undefined}})`unicorns`).toBeAssignableTo<Result>();
expectTypeOf(await execa({env: {test: undefined} as const})`unicorns`).toBeAssignableTo<Result>();
