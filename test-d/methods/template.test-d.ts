import {expectAssignable, expectNotAssignable} from 'tsd';
import {execa, type TemplateExpression} from '../../index.js';

const stringArray = ['foo', 'bar'] as const;
const numberArray = [1, 2] as const;

expectAssignable<TemplateExpression>('unicorns');
expectAssignable<TemplateExpression>(1);
expectAssignable<TemplateExpression>(stringArray);
expectAssignable<TemplateExpression>(numberArray);
expectAssignable<TemplateExpression>(false.toString());
expectNotAssignable<TemplateExpression>(false);

expectAssignable<TemplateExpression>(await execa`echo foo`);
expectAssignable<TemplateExpression>(await execa({reject: false})`echo foo`);
expectNotAssignable<TemplateExpression>(execa`echo foo`);
expectAssignable<TemplateExpression>([await execa`echo foo`, 'bar']);
expectNotAssignable<TemplateExpression>([execa`echo foo`, 'bar']);
