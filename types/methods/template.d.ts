import type {CommonOptions} from '../arguments/options.js';
import type {CommonResultInstance} from '../return/result.js';

// Values allowed inside `...${...}...` template syntax
type TemplateExpressionItem =
	| string
	| number
	| CommonResultInstance<boolean, CommonOptions>;

export type TemplateExpression = TemplateExpressionItem | readonly TemplateExpressionItem[];

// `...${...}...` template syntax
export type TemplateString = readonly [TemplateStringsArray, ...readonly TemplateExpression[]];

// `...${...}...` template syntax, but only allowing a single argument, for `execaCommand()`
export type SimpleTemplateString = readonly [TemplateStringsArray, string?];
