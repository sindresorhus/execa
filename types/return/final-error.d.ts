import type {CommonOptions, Options, SyncOptions} from '../arguments/options';
// eslint-disable-next-line import/extensions
import {CommonResult} from './result';

declare abstract class CommonError<
	IsSync extends boolean = boolean,
	OptionsType extends CommonOptions = CommonOptions,
> extends CommonResult<IsSync, OptionsType> {
	readonly name: NonNullable<CommonResult['name']>;
	message: NonNullable<CommonResult['message']>;
	stack: NonNullable<CommonResult['stack']>;
	shortMessage: NonNullable<CommonResult['shortMessage']>;
	originalMessage: NonNullable<CommonResult['originalMessage']>;
}

// `result.*` defined only on failure, i.e. on `error.*`
export type ErrorProperties =
  | 'name'
  | 'message'
  | 'stack'
  | 'cause'
  | 'shortMessage'
  | 'originalMessage'
  | 'code';

/**
Exception thrown when the subprocess fails, either:
- its exit code is not `0`
- it was terminated with a signal, including `subprocess.kill()`
- timing out
- being canceled
- there's not enough memory or there are already too many subprocesses

This has the same shape as successful results, with a few additional properties.
*/
export class ExecaError<OptionsType extends Options = Options> extends CommonError<false, OptionsType> {
	readonly name: 'ExecaError';
}

/**
Exception thrown when the subprocess fails, either:
- its exit code is not `0`
- it was terminated with a signal, including `.kill()`
- timing out
- being canceled
- there's not enough memory or there are already too many subprocesses

This has the same shape as successful results, with a few additional properties.
*/
export class ExecaSyncError<OptionsType extends SyncOptions = SyncOptions> extends CommonError<true, OptionsType> {
	readonly name: 'ExecaSyncError';
}
