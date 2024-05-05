import {execa, execaSync} from '../../index.js';

export const earlyErrorOptions = {cancelSignal: false};
export const getEarlyErrorSubprocess = options => execa('empty.js', {...earlyErrorOptions, ...options});
export const earlyErrorOptionsSync = {maxBuffer: false};
export const getEarlyErrorSubprocessSync = options => execaSync('empty.js', {...earlyErrorOptionsSync, ...options});

export const expectedEarlyError = {code: 'ERR_INVALID_ARG_TYPE'};
export const expectedEarlyErrorSync = {code: 'ERR_OUT_OF_RANGE'};
