import {expectType, expectError} from 'tsd';
import {getCancelSignal, execa} from '../../index.js';

expectType<Promise<AbortSignal>>(getCancelSignal());

expectError(await getCancelSignal(''));

expectError(execa('test').getCancelSignal);
