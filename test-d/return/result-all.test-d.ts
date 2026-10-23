import {expectTypeOf} from 'nz';
import {
	execa,
	execaSync,
	type ExecaError,
	type ExecaSyncError,
} from '../../index.js';

const allResult = await execa('unicorns', {all: true});
expectTypeOf(allResult.all).toBe<string>();

const unbufferedObjectOptions = {
	all: true as const,
	buffer: {stdout: false as const},
	stdout: {
		objectMode: true as const,
		* transform() {
			yield {value: 'object'};
		},
	},
};
const bufferedTextResult = await execa('unicorns', unbufferedObjectOptions);
expectTypeOf(bufferedTextResult.all).toBe<string>();
const bufferedTextResultSync = execaSync('unicorns', unbufferedObjectOptions);
expectTypeOf(bufferedTextResultSync.all).toBe<string>();

const dynamicBufferOptions = {...unbufferedObjectOptions, buffer: {stdout: false as boolean}};
const dynamicBufferResult = await execa('unicorns', dynamicBufferOptions);
expectTypeOf(dynamicBufferResult.all).toBe<string | unknown[]>();
const dynamicBufferResultSync = execaSync('unicorns', dynamicBufferOptions);
expectTypeOf(dynamicBufferResultSync.all).toBe<string | unknown[]>();
const dynamicBufferError = new Error('.') as ExecaError<typeof dynamicBufferOptions>;
expectTypeOf(dynamicBufferError.all).toBe<string | unknown[]>();
const dynamicBufferErrorSync = new Error('.') as ExecaSyncError<typeof dynamicBufferOptions>;
expectTypeOf(dynamicBufferErrorSync.all).toBe<string | unknown[]>();
expectTypeOf(dynamicBufferResult.stdout).toBe<unknown[] | undefined>();
const bufferedTextError = new Error('.') as ExecaError<typeof unbufferedObjectOptions>;
expectTypeOf(bufferedTextError.all).toBe<string>();
const bufferedTextErrorSync = new Error('.') as ExecaSyncError<typeof unbufferedObjectOptions>;
expectTypeOf(bufferedTextErrorSync.all).toBe<string>();

const unbufferedStderrObjectOptions = {
	all: true as const,
	buffer: {stderr: false as const},
	stderr: unbufferedObjectOptions.stdout,
};
const bufferedStdoutTextResult = await execa('unicorns', unbufferedStderrObjectOptions);
expectTypeOf(bufferedStdoutTextResult.all).toBe<string>();
const bufferedStdoutTextResultSync = execaSync('unicorns', unbufferedStderrObjectOptions);
expectTypeOf(bufferedStdoutTextResultSync.all).toBe<string>();
const bufferedStdoutTextError = new Error('.') as ExecaError<typeof unbufferedStderrObjectOptions>;
expectTypeOf(bufferedStdoutTextError.all).toBe<string>();
const bufferedStdoutTextErrorSync = new Error('.') as ExecaSyncError<typeof unbufferedStderrObjectOptions>;
expectTypeOf(bufferedStdoutTextErrorSync.all).toBe<string>();

const dynamicStderrBufferOptions = {...unbufferedStderrObjectOptions, buffer: {stderr: false as boolean}};
const dynamicStderrBufferResult = await execa('unicorns', dynamicStderrBufferOptions);
expectTypeOf(dynamicStderrBufferResult.all).toBe<string | unknown[]>();
const dynamicStderrBufferResultSync = execaSync('unicorns', dynamicStderrBufferOptions);
expectTypeOf(dynamicStderrBufferResultSync.all).toBe<string | unknown[]>();
expectTypeOf(dynamicStderrBufferResult.stderr).toBe<unknown[] | undefined>();

const dynamicBufferBinaryResult = await execa('unicorns', {...dynamicBufferOptions, encoding: 'buffer'});
expectTypeOf(dynamicBufferBinaryResult.all).toBe<Uint8Array | unknown[]>();
const dynamicBufferBinaryResultSync = execaSync('unicorns', {...dynamicStderrBufferOptions, encoding: 'buffer'});
expectTypeOf(dynamicBufferBinaryResultSync.all).toBe<Uint8Array | unknown[]>();

const bufferedBinaryResult = await execa('unicorns', {...unbufferedObjectOptions, encoding: 'buffer'});
expectTypeOf(bufferedBinaryResult.all).toBe<Uint8Array>();
const bufferedBinaryResultSync = execaSync('unicorns', {...unbufferedStderrObjectOptions, encoding: 'buffer'});
expectTypeOf(bufferedBinaryResultSync.all).toBe<Uint8Array>();

const ignoredStdoutLinesOptions = {
	all: true as const,
	buffer: {stdout: false as const},
	lines: {stdout: true as const},
};
const ignoredStdoutLinesResult = await execa('unicorns', ignoredStdoutLinesOptions);
expectTypeOf(ignoredStdoutLinesResult.all).toBe<string>();
const ignoredStdoutLinesResultSync = execaSync('unicorns', ignoredStdoutLinesOptions);
expectTypeOf(ignoredStdoutLinesResultSync.all).toBe<string>();
const ignoredStdoutLinesError = new Error('.') as ExecaError<typeof ignoredStdoutLinesOptions>;
expectTypeOf(ignoredStdoutLinesError.all).toBe<string>();
const ignoredStdoutLinesErrorSync = new Error('.') as ExecaSyncError<typeof ignoredStdoutLinesOptions>;
expectTypeOf(ignoredStdoutLinesErrorSync.all).toBe<string>();

const ignoredStderrLinesOptions = {
	all: true as const,
	buffer: {stderr: false as const},
	lines: {stderr: true as const},
};
const ignoredStderrLinesResult = await execa('unicorns', ignoredStderrLinesOptions);
expectTypeOf(ignoredStderrLinesResult.all).toBe<string>();
const ignoredStderrLinesResultSync = execaSync('unicorns', ignoredStderrLinesOptions);
expectTypeOf(ignoredStderrLinesResultSync.all).toBe<string>();
const ignoredStderrLinesError = new Error('.') as ExecaError<typeof ignoredStderrLinesOptions>;
expectTypeOf(ignoredStderrLinesError.all).toBe<string>();
const ignoredStderrLinesErrorSync = new Error('.') as ExecaSyncError<typeof ignoredStderrLinesOptions>;
expectTypeOf(ignoredStderrLinesErrorSync.all).toBe<string>();

const dynamicStdoutLinesOptions = {...ignoredStdoutLinesOptions, buffer: {stdout: false as boolean}};
const dynamicStdoutLinesResult = await execa('unicorns', dynamicStdoutLinesOptions);
expectTypeOf(dynamicStdoutLinesResult.all).toBe<string | string[]>();
const dynamicStdoutLinesResultSync = execaSync('unicorns', dynamicStdoutLinesOptions);
expectTypeOf(dynamicStdoutLinesResultSync.all).toBe<string | string[]>();
const dynamicStdoutLinesError = new Error('.') as ExecaError<typeof dynamicStdoutLinesOptions>;
expectTypeOf(dynamicStdoutLinesError.all).toBe<string | string[]>();
const dynamicStdoutLinesErrorSync = new Error('.') as ExecaSyncError<typeof dynamicStdoutLinesOptions>;
expectTypeOf(dynamicStdoutLinesErrorSync.all).toBe<string | string[]>();

const dynamicStderrLinesOptions = {...ignoredStderrLinesOptions, buffer: {stderr: false as boolean}};
const dynamicStderrLinesResult = await execa('unicorns', dynamicStderrLinesOptions);
expectTypeOf(dynamicStderrLinesResult.all).toBe<string | string[]>();
const dynamicStderrLinesResultSync = execaSync('unicorns', dynamicStderrLinesOptions);
expectTypeOf(dynamicStderrLinesResultSync.all).toBe<string | string[]>();

const dynamicBothBufferOptions = {all: true as const, buffer: {stdout: false as boolean, stderr: false as boolean}};
const dynamicBothBufferResult = await execa('unicorns', dynamicBothBufferOptions);
expectTypeOf(dynamicBothBufferResult.all).toBe<string | undefined>();
const dynamicBothBufferResultSync = execaSync('unicorns', dynamicBothBufferOptions);
expectTypeOf(dynamicBothBufferResultSync.all).toBe<string | undefined>();
const dynamicBothBufferError = new Error('.') as ExecaError<typeof dynamicBothBufferOptions>;
expectTypeOf(dynamicBothBufferError.all).toBe<string | undefined>();
const dynamicBothBufferErrorSync = new Error('.') as ExecaSyncError<typeof dynamicBothBufferOptions>;
expectTypeOf(dynamicBothBufferErrorSync.all).toBe<string | undefined>();

const dynamicGlobalBufferResult = await execa('unicorns', {all: true, buffer: false as boolean});
expectTypeOf(dynamicGlobalBufferResult.all).toBe<string | undefined>();
expectTypeOf(dynamicGlobalBufferResult.stdout).toBe<string | undefined>();
const dynamicGlobalBufferResultSync = execaSync('unicorns', {all: true, buffer: false as boolean});
expectTypeOf(dynamicGlobalBufferResultSync.all).toBe<string | undefined>();

const dynamicGlobalObjectBufferResult = await execa('unicorns', {...unbufferedObjectOptions, buffer: false as boolean});
expectTypeOf(dynamicGlobalObjectBufferResult.all).toBe<unknown[] | undefined>();
const dynamicGlobalObjectBufferResultSync = execaSync('unicorns', {...unbufferedStderrObjectOptions, buffer: false as boolean});
expectTypeOf(dynamicGlobalObjectBufferResultSync.all).toBe<unknown[] | undefined>();

declare const optionalBufferError: ExecaError<{all: true; buffer?: false; stdout: typeof unbufferedObjectOptions.stdout}>;
expectTypeOf(optionalBufferError.all).toBe<unknown[] | undefined>();
const undefinedStdoutBufferResult = await execa('unicorns', {...unbufferedObjectOptions, buffer: {stdout: undefined, stderr: false}});
expectTypeOf(undefinedStdoutBufferResult.all).toBe<unknown[]>();

const dynamicOnlyStdoutBufferResult = await execa('unicorns', {...dynamicBufferOptions, buffer: {stdout: false as boolean, stderr: false}});
expectTypeOf(dynamicOnlyStdoutBufferResult.all).toBe<unknown[] | undefined>();
const dynamicOnlyStderrBufferResultSync = execaSync('unicorns', {...dynamicStderrBufferOptions, buffer: {stdout: false, stderr: false as boolean}});
expectTypeOf(dynamicOnlyStderrBufferResultSync.all).toBe<unknown[] | undefined>();

const ignoredStdoutStreamLinesResult = await execa('unicorns', {all: true, stdout: 'ignore', lines: {stdout: true}});
expectTypeOf(ignoredStdoutStreamLinesResult.all).toBe<string[]>();
const ignoredStderrStreamLinesResultSync = execaSync('unicorns', {all: true, stderr: 'ignore', lines: {stderr: true}});
expectTypeOf(ignoredStderrStreamLinesResultSync.all).toBe<string[]>();

const bufferedLinesResult = await execa('unicorns', {...unbufferedObjectOptions, lines: {stderr: true}});
expectTypeOf(bufferedLinesResult.all).toBe<string[]>();
const bufferedLinesResultSync = execaSync('unicorns', {...unbufferedStderrObjectOptions, lines: {stdout: true}});
expectTypeOf(bufferedLinesResultSync.all).toBe<string[]>();

const bufferedStdoutObjectResult = await execa('unicorns', {...unbufferedObjectOptions, buffer: {stderr: false}});
expectTypeOf(bufferedStdoutObjectResult.all).toBe<unknown[]>();
const bufferedStderrObjectResultSync = execaSync('unicorns', {...unbufferedStderrObjectOptions, buffer: {stdout: false}});
expectTypeOf(bufferedStderrObjectResultSync.all).toBe<unknown[]>();

const bothBufferedObjectResult = await execa('unicorns', {...unbufferedObjectOptions, buffer: true});
expectTypeOf(bothBufferedObjectResult.all).toBe<unknown[]>();
const bothBufferedObjectResultSync = execaSync('unicorns', {...unbufferedStderrObjectOptions, buffer: true});
expectTypeOf(bothBufferedObjectResultSync.all).toBe<unknown[]>();

const neitherBufferedResult = await execa('unicorns', {...unbufferedObjectOptions, buffer: false});
expectTypeOf(neitherBufferedResult.all).toBe<undefined>();
const neitherBufferedResultSync = execaSync('unicorns', {...unbufferedStderrObjectOptions, buffer: false});
expectTypeOf(neitherBufferedResultSync.all).toBe<undefined>();

const ignoredObjectFd1Result = await execa('unicorns', {...unbufferedObjectOptions, buffer: {fd1: false}});
expectTypeOf(ignoredObjectFd1Result.all).toBe<string>();
const ignoredObjectFd2ResultSync = execaSync('unicorns', {...unbufferedStderrObjectOptions, buffer: {fd2: false}});
expectTypeOf(ignoredObjectFd2ResultSync.all).toBe<string>();
const ignoredLinesFd1Result = await execa('unicorns', {...ignoredStdoutLinesOptions, buffer: {fd1: false}});
expectTypeOf(ignoredLinesFd1Result.all).toBe<string>();
const ignoredLinesFd2ResultSync = execaSync('unicorns', {...ignoredStderrLinesOptions, buffer: {fd2: false}});
expectTypeOf(ignoredLinesFd2ResultSync.all).toBe<string>();

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
