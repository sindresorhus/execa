import {expectTypeOf, expectError} from 'nz';
import {
	execa,
	execaSync,
	$,
	execaNode,
	parseCommandString,
	type Result,
	type SyncResult,
} from '../../index.js';

expectError(parseCommandString());
expectError(parseCommandString(true));
expectError(parseCommandString(['unicorns', 'arg']));

expectTypeOf(parseCommandString('')).toBe<string[]>();
expectTypeOf(parseCommandString('unicorns foo bar')).toBe<string[]>();

expectTypeOf(await execa`${parseCommandString('unicorns foo bar')}`).toBe<Result<{}>>();
expectTypeOf(execaSync`${parseCommandString('unicorns foo bar')}`).toBe<SyncResult<{}>>();
expectTypeOf(await $`${parseCommandString('unicorns foo bar')}`).toBe<Result<{}>>();
expectTypeOf($.sync`${parseCommandString('unicorns foo bar')}`).toBe<SyncResult<{}>>();
expectTypeOf(await execaNode`${parseCommandString('foo bar')}`).toBe<Result<{readonly node: true}>>();

expectTypeOf(await execa`unicorns ${parseCommandString('foo bar')}`).toBe<Result<{}>>();
expectTypeOf(await execa('unicorns', parseCommandString('foo bar'))).toBe<Result<{}>>();
expectTypeOf(await execa('unicorns', ['foo', ...parseCommandString('bar')])).toBe<Result<{}>>();
