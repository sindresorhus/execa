import type {IsObjectFd} from '../transform/object-mode';
import type {CommonOptions} from '../arguments/options';
import type {FdSpecificOption} from '../arguments/specific';
import type {IgnoresResultOutput} from './ignore';
import type {ResultStdio} from './result-stdout';

// `result.all`
export type ResultAll<OptionsType extends CommonOptions = CommonOptions> =
	ResultAllProperty<OptionsType['all'], OptionsType>;

type ResultAllProperty<
	AllOption extends CommonOptions['all'] = CommonOptions['all'],
	OptionsType extends CommonOptions = CommonOptions,
> = AllOption extends true
	? ResultStdio<
	AllMainFd<OptionsType>,
	AllObjectFd<OptionsType>,
	AllLinesFd<OptionsType>,
	OptionsType
	>
	: undefined;

type AllMainFd<OptionsType extends CommonOptions = CommonOptions> =
	IgnoresResultOutput<'1', OptionsType> extends true ? '2' : '1';

type AllObjectFd<OptionsType extends CommonOptions = CommonOptions> =
	IsObjectFd<'1', OptionsType> extends true ? '1' : '2';

type AllLinesFd<OptionsType extends CommonOptions = CommonOptions> =
	FdSpecificOption<OptionsType['lines'], '1'> extends true ? '1' : '2';
