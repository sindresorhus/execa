import type {FromOption} from './fd-options.js';

// Options which can be fd-specific like `{verbose: {stdout: 'none', stderr: 'full'}}`
export type FdGenericOption<OptionType> = OptionType | GenericOptionObject<OptionType>;

type GenericOptionObject<OptionType> = Readonly<Partial<Record<GenericFromOption, OptionType>>>;

type GenericFromOption = FromOption | 'ipc';

// Retrieve fd-specific option's value
export type FdSpecificOption<
	GenericOption extends FdGenericOption<unknown>,
	FdNumber extends string,
> = GenericOption extends GenericOptionObject<unknown>
	? FdSpecificObjectOption<GenericOption, FdNumber>
	: GenericOption;

type FdSpecificObjectOption<
	GenericOption extends GenericOptionObject<unknown>,
	FdNumber extends string,
> = keyof GenericOption extends GenericFromOption
	? FdNumber extends '1'
		? FdOptionValue<GenericOption, 'stdout', FdOptionValue<GenericOption, 'fd1', FdOptionValue<GenericOption, 'all'>>>
		: FdNumber extends '2'
			? FdOptionValue<GenericOption, 'stderr', FdOptionValue<GenericOption, 'fd2', FdOptionValue<GenericOption, 'all'>>>
			: FdOptionValue<GenericOption, FdNumber extends 'ipc' ? 'ipc' : `fd${FdNumber}`>
	: GenericOption;

// Optional descriptor keys can be absent, so lower-priority keys can still apply.
type FdOptionValue<
	GenericOption extends GenericOptionObject<unknown>,
	Key extends string,
	Fallback = undefined,
> = Key extends keyof GenericOption
	? GenericOption[Key] | ({} extends Pick<GenericOption, Key> ? Fallback : never)
	: Fallback;

export {};
