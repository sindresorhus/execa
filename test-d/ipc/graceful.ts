import {expectTypeOf, expectError} from 'nz';
import {getCancelSignal, execa} from '../../index.js';

expectTypeOf(getCancelSignal()).toBe<Promise<AbortSignal>>();

expectError(await getCancelSignal(''));

expectError(execa('test').getCancelSignal);
