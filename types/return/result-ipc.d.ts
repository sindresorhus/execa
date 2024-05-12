import type {FdSpecificOption} from '../arguments/specific.js';
import type {CommonOptions} from '../arguments/options.js';

// `result.ipc`
// This is empty unless the `ipc` option is `true`.
// Also, this is empty if the `buffer` option is `false`.
export type ResultIpc<
	IsSync extends boolean,
	OptionsType extends CommonOptions,
> = IsSync extends true
	? []
	: ResultIpcAsync<FdSpecificOption<OptionsType['buffer'], 'ipc'>, OptionsType['ipc']>;

type ResultIpcAsync<
	BufferOption extends boolean | undefined,
	IpcOption extends boolean | undefined,
> = BufferOption extends false
	? []
	: IpcOption extends true
		? unknown[]
		: [];
