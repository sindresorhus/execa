import type {FromOption} from './fd-options';

// Options which can be fd-specific like `{verbose: {stdout: 'none', stderr: 'full'}}`
export type FdGenericOption<OptionType = unknown> = OptionType | GenericOptionObject<OptionType>;

type GenericOptionObject<OptionType = unknown> = {
	readonly [FdName in FromOption]?: OptionType
};

// Retrieve fd-specific option's value
export type FdSpecificOption<
	GenericOption extends FdGenericOption,
	FdNumber extends string,
> = GenericOption extends GenericOptionObject
	? FdSpecificObjectOption<GenericOption, FdNumber>
	: GenericOption;

type FdSpecificObjectOption<
	GenericOption extends GenericOptionObject,
	FdNumber extends string,
> = keyof GenericOption extends FromOption
	? FdNumberToFromOption<FdNumber, keyof GenericOption> extends never
		? undefined
		: GenericOption[FdNumberToFromOption<FdNumber, keyof GenericOption>]
	: GenericOption;

type FdNumberToFromOption<
	FdNumber extends string,
	FromOptions extends FromOption,
> = FdNumber extends '1'
	? 'stdout' extends FromOptions
		? 'stdout'
		: 'fd1' extends FromOptions
			? 'fd1'
			: 'all' extends FromOptions
				? 'all'
				: never
	: FdNumber extends '2'
		? 'stderr' extends FromOptions
			? 'stderr'
			: 'fd2' extends FromOptions
				? 'fd2'
				: 'all' extends FromOptions
					? 'all'
					: never
		: `fd${FdNumber}` extends FromOptions
			? `fd${FdNumber}`
			: never;
