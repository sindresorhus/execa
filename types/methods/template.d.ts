import type {Result, SyncResult} from '../return/result.js';

type TemplateExpressionItem =
	| string
	| number
	| Result
	| SyncResult;

/**
Value allowed inside `${...}` when using the template string syntax.
*/
export type TemplateExpression = TemplateExpressionItem | readonly TemplateExpressionItem[];

// `...${...}...` template syntax
export type TemplateString = readonly [TemplateStringsArray, ...readonly TemplateExpression[]];

export {};
