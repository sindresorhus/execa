import type {CommonOptions, Options, SyncOptions} from '../arguments/options';
// eslint-disable-next-line import/extensions
import {CommonResult} from './result';

declare abstract class CommonError<
	IsSync extends boolean = boolean,
	OptionsType extends CommonOptions = CommonOptions,
> extends CommonResult<IsSync, OptionsType> {
	message: NonNullable<CommonResult['message']>;
	shortMessage: NonNullable<CommonResult['shortMessage']>;
	originalMessage: NonNullable<CommonResult['originalMessage']>;
	readonly name: NonNullable<CommonResult['name']>;
	stack: NonNullable<CommonResult['stack']>;
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
Result of a subprocess failed execution.

This error is thrown as an exception. If the `reject` option is false, it is returned instead.

This has the same shape as successful results, with a few additional properties.
*/
export class ExecaError<OptionsType extends Options = Options> extends CommonError<false, OptionsType> {
	readonly name: 'ExecaError';
}

/**
Result of a subprocess failed execution.

This error is thrown as an exception. If the `reject` option is false, it is returned instead.

This has the same shape as successful results, with a few additional properties.
*/
export class ExecaSyncError<OptionsType extends SyncOptions = SyncOptions> extends CommonError<true, OptionsType> {
	readonly name: 'ExecaSyncError';
}
