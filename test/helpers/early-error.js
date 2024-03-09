import {execa, execaSync} from '../../index.js';

export const earlyErrorOptions = {killSignal: false};
export const getEarlyErrorSubprocess = options => execa('empty.js', {...earlyErrorOptions, ...options});
export const getEarlyErrorSubprocessSync = options => execaSync('empty.js', {...earlyErrorOptions, ...options});

export const expectedEarlyError = {code: 'ERR_INVALID_ARG_TYPE'};
