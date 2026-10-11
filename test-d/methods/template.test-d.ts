import {expectTypeOf} from 'nz';
import {execa, type TemplateExpression} from '../../index.js';

const stringArray = ['foo', 'bar'] as const;
const numberArray = [1, 2] as const;

expectTypeOf<'unicorns'>().toBeAssignableTo<TemplateExpression>();
expectTypeOf<1>().toBeAssignableTo<TemplateExpression>();
expectTypeOf(stringArray).toBeAssignableTo<TemplateExpression>();
expectTypeOf(numberArray).toBeAssignableTo<TemplateExpression>();
expectTypeOf(false.toString()).toBeAssignableTo<TemplateExpression>();
expectTypeOf<false>().not.toBeAssignableTo<TemplateExpression>();

expectTypeOf(await execa`echo foo`).toBeAssignableTo<TemplateExpression>();
expectTypeOf(await execa({reject: false})`echo foo`).toBeAssignableTo<TemplateExpression>();
expectTypeOf(execa`echo foo`).not.toBeAssignableTo<TemplateExpression>();
[await execa`echo foo`, 'bar'] satisfies TemplateExpression;
expectTypeOf([execa`echo foo`, 'bar']).not.toBeAssignableTo<TemplateExpression>();
