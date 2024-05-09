import type {CommonResultInstance} from '../return/result.js';

// Values allowed inside `...${...}...` template syntax
export type TemplateExpression =
	| string
	| number
	| CommonResultInstance
	| ReadonlyArray<string | number | CommonResultInstance>;

// `...${...}...` template syntax
export type TemplateString = readonly [TemplateStringsArray, ...readonly TemplateExpression[]];

// `...${...}...` template syntax, but only allowing a single argument, for `execaCommand()`
export type SimpleTemplateString = readonly [TemplateStringsArray, string?];
