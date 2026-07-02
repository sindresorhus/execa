import {expectType, expectError} from 'tsd';
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

expectType<string[]>(parseCommandString(''));
expectType<string[]>(parseCommandString('unicorns foo bar'));

expectType<Result<{}>>(await execa`${parseCommandString('unicorns foo bar')}`);
expectType<SyncResult<{}>>(execaSync`${parseCommandString('unicorns foo bar')}`);
expectType<Result<{}>>(await $`${parseCommandString('unicorns foo bar')}`);
expectType<SyncResult<{}>>($.sync`${parseCommandString('unicorns foo bar')}`);
expectType<Result<{}>>(await execaNode`${parseCommandString('foo bar')}`);

expectType<Result<{}>>(await execa`unicorns ${parseCommandString('foo bar')}`);
expectType<Result<{}>>(await execa('unicorns', parseCommandString('foo bar')));
expectType<Result<{}>>(await execa('unicorns', ['foo', ...parseCommandString('bar')]));
