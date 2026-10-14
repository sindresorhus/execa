import type {CommonOptions, StricterOptions} from '../arguments/options.js';

// Like runtime option binding, later values override earlier ones. Only fd-specific options and `env` merge plain objects.
// The `infer ... extends` constraint lets TypeScript check generic uses against `StrictOptions` directly, instead of resolving every branch, which is very slow when declaration files are type-checked.
export type MergeOptions<BoundOptions, NewOptions, StrictOptions extends CommonOptions = CommonOptions> = MergeAnyOptions<BoundOptions, NewOptions, StrictOptions> extends infer Merged extends StrictOptions ? Merged : never;

type MergeAnyOptions<BoundOptions, NewOptions, StrictOptions extends CommonOptions> = [BoundOptions] extends [Record<PropertyKey, never>]
	? NewOptions
	: [NewOptions] extends [Record<PropertyKey, never>]
		? BoundOptions
		: keyof StrictOptions extends keyof BoundOptions | keyof NewOptions
			? StrictOptions
			: MergeNonemptyOptions<BoundOptions, NewOptions, StrictOptions>;

type MergeNonemptyOptions<BoundOptions, NewOptions, StrictOptions extends CommonOptions> = BoundOptions extends unknown
	? NewOptions extends unknown
		? StricterOptions<MergeObject<BoundOptions, NewOptions>, StrictOptions>
		: never
	: never;

type MergeObject<BoundOptions, NewOptions> = Omit<BoundOptions, keyof NewOptions> & {
	[OptionName in keyof NewOptions]: OptionName extends keyof BoundOptions
		? MergeOption<BoundOptions[OptionName], NewOptions[OptionName], OptionName> | ({} extends Pick<NewOptions, OptionName> ? BoundOptions[OptionName] : never)
		: NewOptions[OptionName]
};

type MergeOption<BoundValue, NewValue, OptionName> = OptionName extends 'env' | 'lines' | 'buffer' | 'maxBuffer' | 'verbose' | 'stripFinalNewline'
	? BoundValue extends (...arguments_: never[]) => unknown
		? NewValue
		: NewValue extends (...arguments_: never[]) => unknown
			? NewValue
			: BoundValue extends object
				? NewValue extends object
					? MergeShallowObject<BoundValue, NewValue>
					: NewValue
				: NewValue
	: NewValue;

type MergeShallowObject<BoundValue, NewValue> = Omit<BoundValue, keyof NewValue> & {
	[Key in keyof NewValue]: NewValue[Key] | ({} extends Pick<NewValue, Key> ? (Key extends keyof BoundValue ? BoundValue[Key] : never) : never)
};

export {};
